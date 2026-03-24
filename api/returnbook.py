from http.server import BaseHTTPRequestHandler
import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import get_book, update_book


def _is_authorized(book: dict, user_id: int, email: str) -> bool:
    holder_email = str(book.get("holder_email", "")).strip()
    holder_uid = str(book.get("holder_user_id", "")).strip()
    if email and holder_email and holder_email == email:
        return True
    if holder_uid and str(user_id) == holder_uid:
        return True
    return False


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            book_id = int(body.get("book_id", 0))
            user_id = int(body.get("user_id", 0))
            email = body.get("email", "").strip()

            book = get_book(book_id)
            if not book:
                self._json(404, {"error": "Book not found"})
                return

            if (book.get("status") or "").lower() != "checked_out":
                self._json(400, {"error": "Book is not currently checked out"})
                return

            if not _is_authorized(book, user_id, email):
                self._json(403, {"error": "You did not check out this book"})
                return

            update_book(book_id, {
                "status": "Available",
                "holder_user_id": "",
                "holder_email": "",
                "hold_until": ""
            })
            self._json(200, {"success": True})

        except Exception as e:
            self._json(500, {"error": str(e)})

    def _json(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
