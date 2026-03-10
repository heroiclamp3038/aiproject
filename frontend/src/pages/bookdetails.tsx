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

  if (!book) return <p className="text-white">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-md text-white">
        <h1 className="text-3xl font-bold mb-4">{book.title}</h1>
        <p className="mb-2">Author: {book.author || "Unknown"}</p>
        <p className="mb-4">Status: <span className={
              "inline-block px-2 py-1 rounded-full text-sm font-medium " +
              ((book.status === "available" || !book.status)
                ? "bg-green-900 text-green-300"
                : book.status === "on_hold"
                ? "bg-yellow-900 text-yellow-300"
                : "bg-red-900 text-red-300")
            }>{book.status || "available"}</span></p>

        <div className="mb-4">
          <input
            type="number"
            placeholder="Enter your user ID"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {(book.status === "available" || !book.status) && (
          <button
            onClick={hold}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
          >
            Place Hold
          </button>
        )}
      </div>
    </div>
  );
}

export default BookDetails;