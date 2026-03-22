import json
import os
import random
import time
from datetime import datetime
import gspread
from gspread.exceptions import APIError, WorksheetNotFound
from oauth2client.service_account import ServiceAccountCredentials

SHEET_NAME = "AI Project"

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


def get_sheet():
    """Returns the sheet with retry logic + caching."""
    global _cached_sheet, _last_fetch

    if _cached_sheet and (time.time() - _last_fetch < CACHE_TTL):
        return _cached_sheet

    for attempt in range(3):
        try:
            sheet = client.open(SHEET_NAME).sheet1
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

    for idx, row in enumerate(data, start=2):  # row 2 = first data row
        if row.get("book_id") == book_id:
            for key, value in updates.items():
                if key not in normalize(row):
                    raise Exception(f"Field '{key}' not found.")
                col = list(row.keys()).index(key) + 1
                sheet.update_cell(idx, col, value)
            return True

    return False


# ── Users sheet ──────────────────────────────────────────────────────────────

def get_users_sheet():
    spreadsheet = client.open(SHEET_NAME)
    try:
        return spreadsheet.worksheet("Users")
    except WorksheetNotFound:
        sheet = spreadsheet.add_worksheet(title="Users", rows=1000, cols=4)
        sheet.append_row(["user_id", "name", "created_at"])
        return sheet


def create_user(name: str) -> dict:
    sheet = get_users_sheet()
    existing = sheet.get_all_records()
    existing_ids = set()
    for u in existing:
        try:
            existing_ids.add(int(u.get("user_id", 0)))
        except (ValueError, TypeError):
            pass

    user_id = random.randint(100000, 999999)
    while user_id in existing_ids:
        user_id = random.randint(100000, 999999)

    sheet.append_row([user_id, name, datetime.utcnow().isoformat()])
    return {"user_id": user_id, "name": name}


def verify_user(user_id: int, name: str) -> dict | None:
    sheet = get_users_sheet()
    for user in sheet.get_all_records():
        try:
            row_id = int(user.get("user_id", -1))
        except (ValueError, TypeError):
            continue
        if row_id == user_id and \
                user.get("name", "").strip().lower() == name.strip().lower():
            return {"user_id": user_id, "name": user.get("name")}
    return None
