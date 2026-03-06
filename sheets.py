import gspread
from oauth2client.service_account import ServiceAccountCredentials

SHEET_NAME = "AI Project"

scope = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

creds = ServiceAccountCredentials.from_json_keyfile_name(
    "service_account.json", scope
)
client = gspread.authorize(creds)

sheet = client.open(SHEET_NAME).sheet1


def get_all_books():
    rows = sheet.get_all_records()
    return rows


def get_book(book_id: int):
    rows = sheet.get_all_records()
    for row in rows:
        if row["book_id"] == book_id:
            return row
    return None


def update_book(book_id: int, updates: dict):
    data = sheet.get_all_records()
    for idx, row in enumerate(data, start=2):  # row 2 = first data row
        if row["book_id"] == book_id:
            for key, value in updates.items():
                col = list(row.keys()).index(key) + 1
                sheet.update_cell(idx, col, value)
            return True
    return False
