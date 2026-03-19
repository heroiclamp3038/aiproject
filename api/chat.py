from http.server import BaseHTTPRequestHandler
import json
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import get_all_books
from google import genai


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            query = body.get("query", "").strip()

            if not query:
                self._json(200, {"response": "Please ask me something about the library!"})
                return

            client = genai.Client(
                api_key=os.environ.get("GEMINI_API_KEY", ""),
                http_options={"api_version": "v1"}
            )
            books = get_all_books()
            book_list = "\n".join([
                f"• {b['title']} by {b['author']} | Category: {b['category']} | Language: {b['language']} | Status: {b['status']}"
                for b in books if b.get("title")
            ])

            prompt = f"""You are a helpful library assistant for Fremont Khalsa School.

Library Catalog:
{book_list}

User Question: {query}

Answer based on the catalog above. Be clear and concise."""

            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt
            )
            self._json(200, {"response": response.text})

        except Exception as e:
            self._json(500, {"response": f"DEBUG – {type(e).__name__}: {e}"})

    def _json(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
