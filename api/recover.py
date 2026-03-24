from http.server import BaseHTTPRequestHandler
import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import request_otp


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            name = body.get("name", "").strip()
            email = body.get("email", "").strip().lower()
            if not name or not email:
                self._json(400, {"error": "Name and email are required"})
                return
            # Always return success to avoid revealing whether the account exists
            try:
                request_otp(name, email)
            except Exception:
                pass
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
