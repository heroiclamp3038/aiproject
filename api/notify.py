from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from datetime import datetime, timedelta, timezone
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import get_all_books, send_email


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Verify Vercel cron secret when set
        cron_secret = os.environ.get("CRON_SECRET", "")
        if cron_secret:
            auth = self.headers.get("Authorization", "")
            if auth != f"Bearer {cron_secret}":
                self._json(401, {"error": "Unauthorized"})
                return
        try:
            books = get_all_books()
            tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).date()
            sent = 0

            for book in books:
                hold_until = (book.get("hold_until") or "").strip()
                if not hold_until:
                    continue
                try:
                    dt = datetime.fromisoformat(hold_until)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    if dt.date() != tomorrow:
                        continue
                except ValueError:
                    continue

                email = (book.get("holder_email") or "").strip()
                if not email:
                    continue

                status = (book.get("status") or "").lower()
                title = book.get("title") or "Unknown"
                due_str = dt.date().strftime("%B %d, %Y")

                if status == "checked_out":
                    subject = f"Reminder: '{title}' is due tomorrow"
                    body = (
                        f"Hi!\n\n"
                        f"Your copy of \"{title}\" is due back at the "
                        f"Fremont Khalsa School Library tomorrow ({due_str}).\n\n"
                        f"Please return it on time to avoid losing borrowing privileges.\n\n"
                        f"Thank you,\nFKS Library"
                    )
                elif status == "on_hold":
                    subject = f"Reminder: Your hold on '{title}' expires tomorrow"
                    body = (
                        f"Hi!\n\n"
                        f"Your hold on \"{title}\" at the Fremont Khalsa School Library "
                        f"expires tomorrow ({due_str}).\n\n"
                        f"Please pick it up or your hold will be cancelled.\n\n"
                        f"Thank you,\nFKS Library"
                    )
                else:
                    continue

                try:
                    send_email(email, subject, body)
                    sent += 1
                except Exception as e:
                    print(f"Failed to send to {email}: {e}")

            self._json(200, {"sent": sent})

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
