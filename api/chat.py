from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import urllib.request
import urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import get_all_books


def call_openrouter(api_key: str, prompt: str) -> str:
    payload = json.dumps({
        "model": "google/gemini-2.0-flash-exp:free",
        "messages": [{"role": "user", "content": prompt}]
    }).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read())
    return result["choices"][0]["message"]["content"]


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            query = body.get("query", "").strip()

            if not query:
                self._json(200, {"response": "Please ask me something about the library!"})
                return

            api_key = os.environ.get("OPENROUTER_API_KEY", "")
            if not api_key:
                self._json(500, {"response": "DEBUG: OPENROUTER_API_KEY is empty/not set"})
                return
            self._json(200, {"response": f"DEBUG: key length={len(api_key)}, starts with '{api_key[:6]}'"})
            return
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

            text = call_openrouter(api_key, prompt)
            self._json(200, {"response": text})

        except urllib.error.HTTPError as e:
            self._json(500, {"response": f"DEBUG HTTPError {e.code}: {e.read().decode()}"})
        except Exception as e:
            self._json(500, {"response": f"DEBUG {type(e).__name__}: {e}"})

    def _json(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
