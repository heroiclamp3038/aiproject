const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchBooks() {
  const res = await fetch(`${API_URL}/books`);
  return res.json();
}

export async function holdBook(bookId: number, userId: number) {
  const res = await fetch(`${API_URL}/hold/${bookId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId })
  });
  return res.json();
}

export async function chatWithBot(query: string) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  return res.json();
}
