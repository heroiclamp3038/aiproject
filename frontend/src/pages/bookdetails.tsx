import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchBooks, holdBook } from "../api.js";

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState<any>(null);
  const [userId, setUserId] = useState("");
  const [holdResult, setHoldResult] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks()
      .then((all: any[]) => setBook(all.find((b: any) => b.book_id == id)));
  }, [id]);

  async function hold() {
    if (!userId.trim()) {
      setHoldResult("Please enter your user ID.");
      return;
    }
    const data = await holdBook(Number(id), Number(userId));
    if (data.success) {
      setHoldResult(`Hold placed! Expires: ${new Date(data.hold_until).toLocaleDateString()}`);
      setBook((prev: any) => ({ ...prev, status: "on_hold" }));
    } else {
      setHoldResult(data.error || "Could not place hold.");
    }
  }

  if (!book) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white text-lg">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-md text-white">
        <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
          ← Back to Catalog
        </a>

        <h1 className="text-3xl font-bold mb-4">{book.title}</h1>
        <p className="mb-2 text-gray-300">Author: {book.author || "Unknown"}</p>
        {book.category && <p className="mb-2 text-gray-300">Category: {book.category}</p>}
        {book.language && <p className="mb-2 text-gray-300">Language: {book.language}</p>}
        {book.shelf_location && <p className="mb-4 text-gray-300">Shelf: {book.shelf_location}</p>}

        <p className="mb-6">
          Status:{" "}
          <span className={
            "inline-block px-2 py-1 rounded-full text-sm font-medium " +
            ((book.status === "available" || !book.status)
              ? "bg-green-900 text-green-300"
              : book.status === "on_hold"
              ? "bg-yellow-900 text-yellow-300"
              : "bg-red-900 text-red-300")
          }>
            {book.status || "available"}
          </span>
        </p>

        {(book.status === "available" || !book.status) && (
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Enter your user ID"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={hold}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
            >
              Place Hold
            </button>
          </div>
        )}

        {holdResult && (
          <p className="mt-4 text-sm text-gray-300 bg-gray-700 px-4 py-2 rounded-lg">
            {holdResult}
          </p>
        )}
      </div>
    </div>
  );
}

export default BookDetails;
