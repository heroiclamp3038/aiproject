from fastapi import FastAPI
from sheets import get_all_books, get_book, update_book
from rag import search_books, index_book
import ollama
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow requests from Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    books = get_all_books()
    for book in books:
        index_book(book)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Library API", "endpoints": ["/books", "/hold/{book_id}", "/chat"]}

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
def chat(query: str):
    results = search_books(query)

    context = ""
    for book in results["metadatas"][0]:
        context += f"{book['Title']} by {book['Author']} (Shelf {book['Shelf Location']})\n"

    prompt = f"""
You are a helpful library assistant. Use the provided book information to answer the user's question accurately and helpfully. If the question isn't about books, politely explain that you can only assist with library-related queries.

Book Context:
{context}

User Question: {query}

Please provide a clear, concise answer based on the available books.
"""

    response = ollama.chat(
        model="llama3.2",  # Change to an available model like llama3.2, mistral, etc.
        messages=[{"role": "user", "content": prompt}]
    )

    return {"response": response["message"]["content"]}

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    return {"answer": response["message"]["content"]}