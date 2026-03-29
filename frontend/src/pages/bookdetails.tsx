import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchBooks, holdBook, returnBook, cancelHold } from "../api";
import { getUser } from "../App";

function BookDetails() {
  const { id } = useParams();
  const user = getUser();
  const [book, setBook] = useState<any>(null);
  const [userId] = useState(user?.userId?.toString() ?? "");
  const userEmail = user?.email ?? "";
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(true);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks()
      .then((all: any[]) => setBook(all.find((b: any) => b.book_id == id)));
  }, [id]);

  useEffect(() => {
    if (!book) return;
    if (book.cover_url) { setCoverUrl(book.cover_url); return; }
    if (!book.title) return;
    const q = encodeURIComponent(`${book.title} ${book.author || ""}`);
    fetch(`https://openlibrary.org/search.json?q=${q}&limit=1&fields=cover_i`)
      .then(r => r.json())
      .then(data => {
        const id = data.docs?.[0]?.cover_i;
        if (id) setCoverUrl(`https://covers.openlibrary.org/b/id/${id}-L.jpg`);
      })
      .catch(() => {});
  }, [book]);

  function showMsg(text: string, ok: boolean) {
    setMessage(text);
    setMessageOk(ok);
  }

  function updateBookStatus(status: string) {
    setBook((prev: any) => ({ ...prev, status, holder_user_id: userId }));
  }

  async function handleHold() {
    if (!userId.trim()) { showMsg("Please enter your user ID.", false); return; }
    const data = await holdBook(Number(id), Number(userId), userEmail);
    if (data.success) {
      showMsg(`Hold placed! Expires: ${new Date(data.hold_until).toLocaleDateString()}`, true);
      updateBookStatus("on_hold");
    } else {
      showMsg(data.error || "Could not place hold.", false);
    }
  }

  async function handleReturn() {
    if (!userId.trim()) { showMsg("Please enter your user ID.", false); return; }
    const data = await returnBook(Number(id), Number(userId), userEmail);
    if (data.success) {
      showMsg("Book returned successfully!", true);
      updateBookStatus("Available");
    } else {
      showMsg(data.error || "Could not return book.", false);
    }
  }

  async function handleCancelHold() {
    if (!userId.trim()) { showMsg("Please enter your user ID.", false); return; }
    const data = await cancelHold(Number(id), Number(userId), userEmail);
    if (data.success) {
      showMsg("Hold cancelled successfully!", true);
      updateBookStatus("Available");
    } else {
      showMsg(data.error || "Could not cancel hold.", false);
    }
  }

  if (!book) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white text-lg">Loading...</p>
    </div>
  );

  const status = (book.status || "available").toLowerCase();
  const isAvailable = status === "available";
  const isOnHold = status === "on_hold";
  const isCheckedOut = status === "checked_out";

  const statusLabel =
    isAvailable ? "Available" :
    isOnHold ? "On Hold" :
    isCheckedOut ? "Checked Out" :
    book.status;

  const statusColor =
    isAvailable ? "bg-green-900 text-green-300" :
    isOnHold ? "bg-yellow-900 text-yellow-300" :
    "bg-red-900 text-red-300";

  const showActions = isAvailable || isOnHold || isCheckedOut;

  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-md text-white">
        <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
          ← Back to Catalog
        </a>

        <div className="flex gap-6 mb-6">
          {coverUrl && (
            <img
              src={coverUrl}
              alt={book.title}
              className="w-36 h-52 object-cover rounded-lg shadow-lg flex-shrink-0"
              onError={() => setCoverUrl(null)}
            />
          )}
          <div>
            <h1 className="text-3xl font-bold mb-4">{book.title}</h1>
            <p className="mb-2 text-gray-300">Author: {book.author || "Unknown"}</p>
            {book.category && <p className="mb-2 text-gray-300">Category: {book.category}</p>}
            {book.language && <p className="mb-2 text-gray-300">Language: {book.language}</p>}
            {book.shelf_location && <p className="mb-4 text-gray-300">Shelf: {book.shelf_location}</p>}
            <p className="mb-2">
              Status:{" "}
              <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {statusLabel}
              </span>
            </p>
          </div>
        </div>

        {showActions && (
          <div className="space-y-3">
            {isAvailable && (
              <button onClick={handleHold} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors">
                Place Hold (7 days)
              </button>
            )}
            {isOnHold && (
              <button onClick={handleCancelHold} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors">
                Cancel Hold
              </button>
            )}
            {isCheckedOut && (
              <button onClick={handleReturn} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors">
                Return Book
              </button>
            )}
          </div>
        )}

        {message && (
          <p className={`mt-4 text-sm px-4 py-2 rounded-lg ${messageOk ? "text-green-300 bg-green-900/40" : "text-red-300 bg-red-900/40"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default BookDetails;
