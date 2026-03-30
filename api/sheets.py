import base64
import hashlib
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

SHEET_NAME = "AI Project"


def _hash_secret(secret: str) -> str:
    salt = os.urandom(16)
    key = hashlib.scrypt(secret.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
    return base64.b64encode(salt).decode() + ":" + base64.b64encode(key).decode()


def _verify_secret(stored: str, secret: str) -> bool:
    try:
        salt_b64, key_b64 = stored.split(":")
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(key_b64)
        derived = hashlib.scrypt(secret.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
        return derived == expected
    except Exception:
        return False

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
    for col in ["holder_email", "cover_url"]:
        if col not in headers:
            sheet.add_cols(1)
            sheet.update_cell(1, len(headers) + 1, col)
            headers.append(col)


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
        "cover_url": row.get("cover_url", ""),
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

USERS_HEADERS = ["user_id_hash", "name", "email", "created_at", "otp_hash", "otp_expires", "user_id"]

_VALID_HEADER_INDICATORS = {"user_id_hash", "name", "email", "user_id"}


def get_users_sheet():
    spreadsheet = client.open(SHEET_NAME)
    try:
        sheet = spreadsheet.worksheet("Users")
    except WorksheetNotFound:
        sheet = spreadsheet.add_worksheet(title="Users", rows=1000, cols=8)
        sheet.append_row(USERS_HEADERS)
        return sheet

    headers = sheet.row_values(1)
    # If no valid header row, insert one (handles sheets created without headers)
    if not headers or not any(h in _VALID_HEADER_INDICATORS for h in headers):
        sheet.insert_row(USERS_HEADERS, 1)
        return sheet

    # Ensure all required columns exist (handles migration from old schema)
    for col_name in USERS_HEADERS:
        if col_name not in headers:
            sheet.add_cols(1)
            sheet.update_cell(1, len(headers) + 1, col_name)
            headers.append(col_name)

    return sheet


def create_user(name: str, email: str) -> dict:
    sheet = get_users_sheet()
    headers = sheet.row_values(1)
    user_id = random.randint(100000, 999999)
    user_id_hash = _hash_secret(str(user_id))
    values = {
        "user_id_hash": user_id_hash,
        "user_id": str(user_id),
        "name": name,
        "email": email.lower(),
        "created_at": datetime.utcnow().isoformat(),
        "otp_hash": "",
        "otp_expires": "",
    }
    row = [values.get(h, "") for h in headers]
    sheet.append_row(row)
    return {"user_id": user_id, "name": name, "email": email.lower()}


def verify_user(user_id: int, name: str) -> dict | None:
    sheet = get_users_sheet()
    for user in sheet.get_all_records():
        if user.get("name", "").strip().lower() != name.strip().lower():
            continue
        stored_hash = str(user.get("user_id_hash", "")).strip()
        if not stored_hash:
            continue
        if _verify_secret(stored_hash, str(user_id)):
            return {
                "user_id": user_id,
                "name": user.get("name"),
                "email": user.get("email", "")
            }
    return None


def _find_user_by_email(sheet, email: str):
    """Returns (row_index, row_dict) for user matching email, or (None, None).
    Lazily assigns a plaintext user_id if one is missing."""
    headers = sheet.row_values(1)
    user_id_col = (headers.index("user_id") + 1) if "user_id" in headers else None
    for idx, user in enumerate(sheet.get_all_records(), start=2):
        if user.get("email", "").strip().lower() == email.strip().lower():
            if user_id_col and not str(user.get("user_id", "")).strip():
                new_id = random.randint(100000, 999999)
                sheet.update_cell(idx, user_id_col, str(new_id))
                user["user_id"] = new_id
            return idx, user
    return None, None


def request_otp(email: str, name: str = "") -> bool:
    """Send a login OTP to email. Auto-creates account if not found and name is given.
    Returns True on success, False if email unknown and no name provided."""
    sheet = get_users_sheet()
    headers = sheet.row_values(1)
    idx, user = _find_user_by_email(sheet, email)

    if idx is None:
        if not name:
            return False
        create_user(name, email)
        idx, user = _find_user_by_email(sheet, email)
        if idx is None:
            return False

    otp = str(random.randint(100000, 999999))
    otp_hash = _hash_secret(otp)
    otp_expires = (datetime.utcnow() + timedelta(minutes=15)).isoformat()

    sheet.update_cell(idx, headers.index("otp_hash") + 1, otp_hash)
    sheet.update_cell(idx, headers.index("otp_expires") + 1, otp_expires)

    display_name = user.get("name") or name or email.split("@")[0]
    send_email(
        to=email,
        subject="Your FKS Library Sign-In Code",
        body=(
            f"Hi {display_name},\n\n"
            f"Your sign-in code is:\n\n"
            f"    {otp}\n\n"
            f"This code expires in 15 minutes. "
            f"Do not share it with anyone.\n\n"
            f"— Fremont Khalsa School Library"
        )
    )
    return True


def verify_otp(email: str, otp: str) -> dict | None:
    """Verify OTP by email. Returns stable user dict or None on failure."""
    sheet = get_users_sheet()
    headers = sheet.row_values(1)
    idx, user = _find_user_by_email(sheet, email)
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

    if not _verify_secret(stored_otp_hash, otp):
        return None

    # Clear OTP
    sheet.update_cell(idx, headers.index("otp_hash") + 1, "")
    sheet.update_cell(idx, headers.index("otp_expires") + 1, "")

    # Return stable user_id (plaintext column)
    user_id = user.get("user_id")
    if not user_id:
        user_id = random.randint(100000, 999999)
        if "user_id" in headers:
            sheet.update_cell(idx, headers.index("user_id") + 1, str(user_id))

    return {"user_id": int(str(user_id)), "name": user.get("name"), "email": email}
