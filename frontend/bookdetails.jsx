import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchBooks, holdBook } from "../api";

export default function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    fetchBooks().then(all => {
      setBook(all.find(b => b.book_id == id));
    });
  }, [id]);

  async function handleHold() {
    const res = await holdBook(book.book_id, Number(userId));
    alert(JSON.stringify(res));
  }

  if (!book) return <p>Loading...</p>;

  return (
    <div>
      <h2>{book.title}</h2>
      <p><b>Author:</b> {book.author}</p>
      <p><b>Status:</b> {book.status}</p>

      <input 
        placeholder="Enter your user ID"
        value={userId}
        onChange={e => setUserId(e.target.value)}
      />

      {book.status === "available" && (
        <button onClick={handleHold}>Place Hold</button>
      )}
    </div>
  );
}