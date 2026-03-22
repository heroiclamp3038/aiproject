from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import urllib.request
import urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheets import get_all_books


MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
]


def call_openrouter(api_key: str, prompt: str) -> str:
    last_err = None
    for model in MODELS:
        payload = json.dumps({
            "model": model,
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
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                result = json.loads(resp.read())
            return result["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if e.code == 429 or e.code == 404:
                last_err = f"{e.code}: {body}"
                continue
            raise
    raise Exception(f"All models failed. Last error: {last_err}")


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
            body = e.read().decode()
            print(f"OpenRouter HTTP {e.code}: {body}")
            self._json(500, {"response": f"OpenRouter error {e.code}: {body}"})
        except Exception as e:
            print(f"Chat error: {type(e).__name__}: {e}")
            self._json(500, {"response": f"Error ({type(e).__name__}): {e}"})

    def _json(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
