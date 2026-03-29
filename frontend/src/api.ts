export async function requestOtp(email: string, name?: string): Promise<void> {
  const res = await fetch("/api/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name: name ?? "" })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send code");
}

export async function verifyOtp(email: string, otp: string): Promise<{ user_id: number; name: string; email: string }> {
  const res = await fetch("/api/verifyotp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Invalid code");
  return data;
}

export async function fetchBooks() {
  const res = await fetch("/api/books");
  return res.json();
}

export async function holdBook(bookId: number, userId: number, email: string) {
  const res = await fetch("/api/hold", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, user_id: userId, email })
  });
  return res.json();
}

export async function returnBook(bookId: number, userId: number, email: string) {
  const res = await fetch("/api/returnbook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, user_id: userId, email })
  });
  return res.json();
}

export async function cancelHold(bookId: number, userId: number, email: string) {
  const res = await fetch("/api/cancelhold", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, user_id: userId, email })
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
