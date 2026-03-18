import ollama
from backend.vector_store import collection

def embed_text(text: str):
    result = ollama.embeddings(
        model="nomic-embed-text:latest",
        prompt=text
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
