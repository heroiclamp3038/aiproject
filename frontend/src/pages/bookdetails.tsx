import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState<any>(null);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/books")
      .then(res => res.json())
      .then(all => setBook(all.find((b: any) => b.book_id == id)));
  }, [id]);

  async function hold() {
    const res = await fetch(`http://localhost:8000/hold/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: Number(userId) })
    });
    alert(JSON.stringify(await res.json()));
  }

  if (!book) return <p>Loading...</p>;

  return (
    <div>
      <h1>{book.title}</h1>
      <p>Author: {book.author}</p>
      <p>Status: {book.status}</p>

      <input
        placeholder="Enter your user ID"
        value={userId}
        onChange={e => setUserId(e.target.value)}
      />

      {book.status === "available" && (
        <button onClick={hold}>Place Hold</button>
      )}
    </div>
  );
}

export default BookDetails;