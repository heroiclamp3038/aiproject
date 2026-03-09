from fastapi import FastAPI
from sheets import get_all_books, get_book, update_book
from rag import search_books, index_book
import ollama
from datetime import datetime, timedelta

app = FastAPI()


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
    You are a library assistant. Use the context to answer the question.

    Context:
    {context}

    Question: {query}
    """

    response = ollama.chat(
        model="llama3.1:8b",  # Or your preferred chat model
        messages=[{"role": "user", "content": prompt}]
    )

    return {"response": response["message"]["content"]}

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    return {"answer": response["message"]["content"]}