from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import urllib.request
import urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import get_all_books


def call_gemini(api_key: str, prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={api_key}"
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}]
    }).encode()
    req = urllib.request.Request(
        url, data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read())
    return result["candidates"][0]["content"]["parts"][0]["text"]


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            query = body.get("query", "").strip()

            if not query:
                self._json(200, {"response": "Please ask me something about the library!"})
                return

            api_key = os.environ.get("GEMINI_API_KEY", "")
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

            text = call_gemini(api_key, prompt)
            self._json(200, {"response": text})

        except Exception as e:
            print(f"Chat error: {type(e).__name__}: {e}")
            self._json(500, {"response": "Sorry, I'm having trouble answering right now. Please try again."})

    def _json(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
