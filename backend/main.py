import os
from contextlib import asynccontextmanager
from google import genai
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from backend.sheets import get_all_books, get_book, update_book
from datetime import datetime, timedelta

gemini = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.get("/")
def read_root():
    return {"message": "Welcome to the FKS AI Library!"}

@app.get("/books")
def list_books():
    return get_all_books()

@app.post("/hold/{book_id}")
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

@app.post("/chat")
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
            model="gemini-2.0-flash",
            contents=prompt
        )
        return {"response": response.text}

    except Exception as e:
        print(f"Gemini error: {type(e).__name__}: {e}")
        return {"response": "Sorry, I'm having trouble answering right now. Please try again."}
