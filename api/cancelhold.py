from http.server import BaseHTTPRequestHandler
import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import get_book, update_book


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            book_id = int(body.get("book_id", 0))
            user_id = int(body.get("user_id", 0))

            book = get_book(book_id)
            if not book:
                self._json(404, {"error": "Book not found"})
                return

            if (book.get("status") or "").lower() != "on_hold":
                self._json(400, {"error": "Book is not currently on hold"})
                return

            if str(book.get("holder_user_id", "")).strip() != str(user_id):
                self._json(403, {"error": "You did not place this hold"})
                return

            update_book(book_id, {
                "status": "Available",
                "holder_user_id": "",
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
