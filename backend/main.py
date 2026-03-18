import os
from contextlib import asynccontextmanager
import google.generativeai as genai
from fastapi import FastAPI, Request
from backend.sheets import get_all_books, get_book, update_book
from backend.rag import search_books, index_book
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        print("Starting book indexing...")
        books = get_all_books()
        print(f"Found {len(books)} books")
        for book in books:
            index_book(book)
        print("Book indexing complete")
    except Exception as e:
        print(f"Error during startup indexing: {e}")
    yield

app = FastAPI(lifespan=lifespan)

allowed_origins = os.environ.get("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origins] if allowed_origins != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    if book["status"] != "available":
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
        results = search_books(query)
        books = results.get("metadatas", [[]])[0]

        if books:
            context = "Here are some relevant books:\n"
            for book in books[:5]:
                context += f"• {book['title']} by {book['author']}\n"
        else:
            context = "No books found matching your search."
    except Exception as e:
        print(f"Search error: {e}")
        context = "Unable to search the book collection right now."

    try:
        prompt = f"""You are a helpful library assistant for Fremont Khalsa School.

Book Context:
{context}

User Question: {query}

Provide a clear, concise answer."""

        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)

        return {"response": response.text}

    except Exception as e:
        print(f"Gemini error: {e}")
        return {"response": context}
