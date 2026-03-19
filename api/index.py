import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from mangum import Mangum
from google import genai
from datetime import datetime, timedelta
from sheets import get_all_books, get_book, update_book

gemini = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))

app = FastAPI()


@app.get("/api/books")
def list_books():
    return get_all_books()


@app.post("/api/hold/{book_id}")
def hold_book(book_id: int, user_id: int):
    book = get_book(book_id)
    if not book:
        return {"error": "Book not found"}

    if (book["status"] or "").lower() != "available":
        return {"error": "Book not available"}

    hold_until = (datetime.now() + timedelta(days=2)).isoformat()

    update_book(book_id, {
        "status": "on_hold",
        "holder_user_id": user_id,
        "hold_until": hold_until
    })

    return {"success": True, "hold_until": hold_until}


@app.post("/api/chat")
async def chat(request: Request):
    data = await request.json()
    query = data.get("query", "")

    if not query:
        return {"response": "Please ask me something about the library!"}

    try:
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

        response = gemini.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        return {"response": response.text}

    except Exception as e:
        print(f"Gemini error: {type(e).__name__}: {e}")
        return {"response": "Sorry, I'm having trouble answering right now. Please try again."}


handler = Mangum(app, lifespan="off")
