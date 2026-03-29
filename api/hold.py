from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import get_book, update_book


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

            if (book.get("status") or "").lower() != "available":
                self._json(400, {"error": "Book not available"})
                return

            hold_until = (datetime.now() + timedelta(days=7)).isoformat()
            update_book(book_id, {
                "status": "on_hold",
                "holder_user_id": user_id,
                "holder_email": email,
                "hold_until": hold_until
            })

            self._json(200, {"success": True, "hold_until": hold_until})

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
