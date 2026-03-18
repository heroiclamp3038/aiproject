import os
import google.generativeai as genai
from backend.vector_store import collection

genai.configure(api_key=os.environ["GEMINI_API_KEY"])


def embed_text(text: str):
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text
    )
    return result["embedding"]


def index_book(book):
    text = f"""
    Title: {book['title']}
    Author: {book['author']}
    Language: {book['language']}
    Category: {book['category']}
    Shelf: {book['shelf_location']}
    """
    emb = embed_text(text)

    collection.upsert(
        ids=[str(book["book_id"])],
        embeddings=[emb],
        metadatas=[book]
    )


def search_books(query: str):
    q_emb = embed_text(query)
    results = collection.query(
        query_embeddings=[q_emb],
        n_results=5
    )
    return results
