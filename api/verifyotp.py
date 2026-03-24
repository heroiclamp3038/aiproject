from http.server import BaseHTTPRequestHandler
import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import verify_otp


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            name = body.get("name", "").strip()
            email = body.get("email", "").strip().lower()
            otp = str(body.get("otp", "")).strip()
            if not name or not email or not otp:
                self._json(400, {"error": "Name, email, and code are required"})
                return
            user = verify_otp(name, email, otp)
            if not user:
                self._json(401, {"error": "Invalid or expired recovery code."})
                return
            self._json(200, user)
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
