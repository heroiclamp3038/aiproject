export async function fetchBooks() {
  const res = await fetch("/api/books");
  return res.json();
}

export async function holdBook(bookId: number, userId: number) {
  const res = await fetch("/api/hold", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, user_id: userId })
  });
  return res.json();
}

export async function checkoutBook(bookId: number, userId: number) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, user_id: userId })
  });
  return res.json();
}

export async function returnBook(bookId: number, userId: number) {
  const res = await fetch("/api/returnbook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, user_id: userId })
  });
  return res.json();
}

export async function cancelHold(bookId: number, userId: number) {
  const res = await fetch("/api/cancelhold", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, user_id: userId })
  });
  return res.json();
}

export async function chatWithBot(query: string) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  return res.json();
}
