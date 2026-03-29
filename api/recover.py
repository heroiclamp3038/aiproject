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
            email = body.get("email", "").strip().lower()
            name = body.get("name", "").strip()
            if not email:
                self._json(400, {"error": "Email is required"})
                return
            found = request_otp(email, name)
            if not found:
                # Email unknown and no name provided — tell frontend to ask for name
                self._json(404, {"error": "new_user"})
                return
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
