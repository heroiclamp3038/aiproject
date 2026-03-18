import os
from google import genai
from backend.vector_store import collection

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


def embed_text(text: str):
    result = client.models.embed_content(
        model="text-embedding-004",
        contents=text
    )
    return result.embeddings[0].values


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
