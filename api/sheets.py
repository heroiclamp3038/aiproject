import json
import os
import random
import smtplib
import time
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
import gspread
from gspread.exceptions import APIError, WorksheetNotFound
from oauth2client.service_account import ServiceAccountCredentials
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

SHEET_NAME = "AI Project"

ph = PasswordHasher(time_cost=1, memory_cost=65536, parallelism=2)

scope = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

_creds_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")
if _creds_json:
    _creds_dict = json.loads(_creds_json)
    creds = ServiceAccountCredentials.from_json_keyfile_dict(_creds_dict, scope)
else:
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        "service_account.json", scope
    )

client = gspread.authorize(creds)

_cached_sheet = None
_last_fetch = 0
CACHE_TTL = 60  # seconds


def _ensure_book_columns(sheet):
    headers = sheet.row_values(1)
    if "holder_email" not in headers:
        sheet.update_cell(1, len(headers) + 1, "holder_email")


def get_sheet():
    global _cached_sheet, _last_fetch

    if _cached_sheet and (time.time() - _last_fetch < CACHE_TTL):
        return _cached_sheet

    for attempt in range(3):
        try:
            sheet = client.open(SHEET_NAME).sheet1
            _ensure_book_columns(sheet)
            _cached_sheet = sheet
            _last_fetch = time.time()
            return sheet
        except APIError as e:
            if "503" in str(e) or "429" in str(e):
                time.sleep(1)
                continue
            raise

    raise Exception("Google Sheets unavailable after retries.")


def normalize(row):
    return {
        "book_id": row.get("book_id"),
        "title": row.get("Title"),
        "author": row.get("Author"),
        "language": row.get("Language"),
        "category": row.get("Category"),
        "shelf_location": row.get("Shelf Location"),
        "status": row.get("status"),
        "holder_user_id": row.get("holder_user_id"),
        "holder_email": row.get("holder_email", ""),
        "hold_until": row.get("hold_until"),
    }


def get_all_books():
    sheet = get_sheet()
    rows = sheet.get_all_records()
    return [normalize(r) for r in rows]


def get_book(book_id: int):
    sheet = get_sheet()
    rows = sheet.get_all_records()
    for row in rows:
        if row.get("book_id") == book_id:
            return normalize(row)
    return None


def update_book(book_id: int, updates: dict):
    sheet = get_sheet()
    data = sheet.get_all_records()
    headers = sheet.row_values(1)

    for idx, row in enumerate(data, start=2):
        if row.get("book_id") == book_id:
            for key, value in updates.items():
                if key in headers:
                    col = headers.index(key) + 1
                    sheet.update_cell(idx, col, value)
            return True

    return False


# ── Email ─────────────────────────────────────────────────────────────────────

def send_email(to: str, subject: str, body: str):
    addr = os.environ.get("GMAIL_ADDRESS", "")
    password = os.environ.get("GMAIL_APP_PASSWORD", "")
    if not addr or not password:
        raise Exception("Email not configured (GMAIL_ADDRESS / GMAIL_APP_PASSWORD missing)")
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = f"FKS Library <{addr}>"
    msg["To"] = to
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(addr, password)
        server.sendmail(addr, to, msg.as_string())


# ── Users sheet ───────────────────────────────────────────────────────────────

USERS_HEADERS = ["user_id_hash", "name", "email", "created_at", "otp_hash", "otp_expires"]


def get_users_sheet():
    spreadsheet = client.open(SHEET_NAME)
    try:
        sheet = spreadsheet.worksheet("Users")
    except WorksheetNotFound:
        sheet = spreadsheet.add_worksheet(title="Users", rows=1000, cols=7)
        sheet.append_row(USERS_HEADERS)
        return sheet

    # Ensure all required columns exist (handles migration from old schema)
    headers = sheet.row_values(1)
    for col_name in USERS_HEADERS:
        if col_name not in headers:
            sheet.update_cell(1, len(headers) + 1, col_name)
            headers.append(col_name)

    return sheet


def create_user(name: str, email: str) -> dict:
    sheet = get_users_sheet()
    user_id = random.randint(100000, 999999)
    user_id_hash = ph.hash(str(user_id))
    sheet.append_row([user_id_hash, name, email.lower(), datetime.utcnow().isoformat(), "", ""])
    return {"user_id": user_id, "name": name, "email": email.lower()}


def verify_user(user_id: int, name: str) -> dict | None:
    sheet = get_users_sheet()
    for user in sheet.get_all_records():
        if user.get("name", "").strip().lower() != name.strip().lower():
            continue
        stored_hash = str(user.get("user_id_hash", "")).strip()
        if not stored_hash:
            continue
        try:
            ph.verify(stored_hash, str(user_id))
            return {
                "user_id": user_id,
                "name": user.get("name"),
                "email": user.get("email", "")
            }
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            pass
    return None


def _find_user_row(sheet, name: str, email: str):
    """Returns (row_index, row_dict) for user matching name+email, or (None, None)."""
    for idx, user in enumerate(sheet.get_all_records(), start=2):
        if (user.get("name", "").strip().lower() == name.strip().lower() and
                user.get("email", "").strip().lower() == email.strip().lower()):
            return idx, user
    return None, None


def request_otp(name: str, email: str) -> bool:
    """Generate and email a recovery OTP. Returns True if user was found."""
    sheet = get_users_sheet()
    headers = sheet.row_values(1)
    idx, user = _find_user_row(sheet, name, email)
    if idx is None:
        return False

    otp = str(random.randint(100000, 999999))
    otp_hash = ph.hash(otp)
    otp_expires = (datetime.utcnow() + timedelta(minutes=15)).isoformat()

    otp_hash_col = headers.index("otp_hash") + 1
    otp_expires_col = headers.index("otp_expires") + 1
    sheet.update_cell(idx, otp_hash_col, otp_hash)
    sheet.update_cell(idx, otp_expires_col, otp_expires)

    send_email(
        to=email,
        subject="Your FKS Library Recovery Code",
        body=(
            f"Hi {name},\n\n"
            f"Your one-time recovery code is:\n\n"
            f"    {otp}\n\n"
            f"This code expires in 15 minutes. "
            f"Do not share it with anyone.\n\n"
            f"If you did not request this, you can safely ignore this email.\n\n"
            f"— Fremont Khalsa School Library"
        )
    )
    return True


def verify_otp(name: str, email: str, otp: str) -> dict | None:
    """Verify OTP, generate a new user_id. Returns user dict or None on failure."""
    sheet = get_users_sheet()
    headers = sheet.row_values(1)
    idx, user = _find_user_row(sheet, name, email)
    if idx is None:
        return None

    stored_otp_hash = str(user.get("otp_hash", "")).strip()
    otp_expires_str = str(user.get("otp_expires", "")).strip()

    if not stored_otp_hash or not otp_expires_str:
        return None

    try:
        expires = datetime.fromisoformat(otp_expires_str)
        if datetime.utcnow() > expires:
            return None
    except ValueError:
        return None

    try:
        ph.verify(stored_otp_hash, otp)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return None

    # Issue a new user_id and update the hash; clear the OTP
    new_user_id = random.randint(100000, 999999)
    new_hash = ph.hash(str(new_user_id))

    sheet.update_cell(idx, headers.index("user_id_hash") + 1, new_hash)
    sheet.update_cell(idx, headers.index("otp_hash") + 1, "")
    sheet.update_cell(idx, headers.index("otp_expires") + 1, "")

    return {"user_id": new_user_id, "name": user.get("name"), "email": email}
