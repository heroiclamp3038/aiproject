from http.server import BaseHTTPRequestHandler
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import verify_user


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            name = body.get("name", "").strip()
            user_id = body.get("user_id")
            if not name or not user_id:
                self._json(400, {"error": "Name and user ID are required"})
                return
            user = verify_user(int(user_id), name)
            if not user:
                self._json(401, {"error": "Name and user ID do not match. Please check your details."})
                return
            self._json(200, user)
        except Exception as e:
            print(f"Signin error: {e}")
            self._json(500, {"error": "Failed to sign in. Please try again."})

    def _json(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
