import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "api"))
from sheets import get_all_books, get_book, update_book, create_user, request_otp, verify_otp

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/api/books")
def books():
    return get_all_books()


def _authorized(book, user_id, email):
    he = str(book.get("holder_email", "")).strip()
    hu = str(book.get("holder_user_id", "")).strip()
    return (email and he and he == email) or (hu and str(user_id) == hu)


@app.post("/api/hold")
async def hold(request: Request):
    b = await request.json()
    book_id, user_id, email = int(b.get("book_id", 0)), int(b.get("user_id", 0)), b.get("email", "").strip()
    book = get_book(book_id)
    if not book:
        return JSONResponse({"error": "Book not found"}, status_code=404)
    if (book.get("status") or "").lower() != "available":
        return JSONResponse({"error": "Book not available"}, status_code=400)
    hold_until = (datetime.now() + timedelta(days=7)).isoformat()
    update_book(book_id, {"status": "on_hold", "holder_user_id": user_id, "holder_email": email, "hold_until": hold_until})
    return {"success": True, "hold_until": hold_until}


@app.post("/api/cancelhold")
async def cancel_hold(request: Request):
    b = await request.json()
    book_id, user_id, email = int(b.get("book_id", 0)), int(b.get("user_id", 0)), b.get("email", "").strip()
    book = get_book(book_id)
    if not book:
        return JSONResponse({"error": "Book not found"}, status_code=404)
    if (book.get("status") or "").lower() != "on_hold":
        return JSONResponse({"error": "Book is not on hold"}, status_code=400)
    if not _authorized(book, user_id, email):
        return JSONResponse({"error": "You did not place this hold"}, status_code=403)
    update_book(book_id, {"status": "Available", "holder_user_id": "", "holder_email": "", "hold_until": ""})
    return {"success": True}


@app.post("/api/returnbook")
async def return_book(request: Request):
    b = await request.json()
    book_id, user_id, email = int(b.get("book_id", 0)), int(b.get("user_id", 0)), b.get("email", "").strip()
    book = get_book(book_id)
    if not book:
        return JSONResponse({"error": "Book not found"}, status_code=404)
    if not _authorized(book, user_id, email):
        return JSONResponse({"error": "Not authorized"}, status_code=403)
    update_book(book_id, {"status": "Available", "holder_user_id": "", "holder_email": "", "hold_until": ""})
    return {"success": True}


@app.post("/api/recover")
async def recover(request: Request):
    b = await request.json()
    email = b.get("email", "").strip().lower()
    name = b.get("name", "").strip()
    if not email:
        return JSONResponse({"error": "Email is required"}, status_code=400)
    found = request_otp(email, name)
    if not found:
        return JSONResponse({"error": "new_user"}, status_code=404)
    return {"success": True}


@app.post("/api/verifyotp")
async def verifyotp(request: Request):
    b = await request.json()
    email = b.get("email", "").strip().lower()
    otp = str(b.get("otp", "")).strip()
    if not email or not otp:
        return JSONResponse({"error": "Email and code are required"}, status_code=400)
    user = verify_otp(email, otp)
    if not user:
        return JSONResponse({"error": "Invalid or expired code."}, status_code=401)
    return user


@app.post("/api/signup")
async def signup(request: Request):
    b = await request.json()
    name, email = b.get("name", "").strip(), b.get("email", "").strip().lower()
    if not name or not email:
        return JSONResponse({"error": "Name and email are required"}, status_code=400)
    return create_user(name, email)


@app.post("/api/chat")
async def chat(request: Request):
    b = await request.json()
    query = b.get("query", "").strip()
    if not query:
        return {"response": "Please ask me something about the library!"}
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    bks = get_all_books()
    book_list = "\n".join([
        f"- {bk['title']} by {bk['author']} | Category: {bk['category']} | Status: {bk['status']}"
        for bk in bks if bk.get("title")
    ])
    prompt = (
        "You are a helpful library assistant for Fremont Khalsa School.\n\n"
        f"Library Catalog:\n{book_list}\n\n"
        f"User Question: {query}\n\nAnswer based on the catalog above. Be clear and concise."
    )
    payload = json.dumps({
        "model": "google/gemini-2.0-flash-lite-001",
        "messages": [{"role": "user", "content": prompt}]
    }).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions", data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            result = json.loads(resp.read())
        return {"response": result["choices"][0]["message"]["content"]}
    except Exception as e:
        return JSONResponse({"response": f"Error: {e}"}, status_code=500)
