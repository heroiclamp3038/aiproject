import { useEffect, useState } from "react";
import { fetchBooks } from "./api";

function BookList() {
  const [books, setBooks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBooks()
      .then((data: any[]) => {
        const validBooks = data.filter((b: any) => b.title && b.title.trim());
        setBooks(validBooks);
      })
      .catch((err: any) => console.error("FETCH ERROR:", err));
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.category && book.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-6xl mx-auto px-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Library Catalog</h1>
          <span className="text-gray-400 text-sm">
            {filteredBooks.length} books available
          </span>
        </div>

        <input
          type="text"
          placeholder="Search books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((b) => (
            <a
              key={b.book_id}
              href={`/book/${b.book_id}`}
              className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl hover:bg-gray-700 transition-all duration-200 border border-gray-700"
            >
              <h2 className="text-xl font-semibold text-white mb-1">
                {b.title}
              </h2>

              <p className="text-gray-300 mb-3">{b.author}</p>

              {b.category && (
                <p className="text-sm text-gray-400 mb-3">
                  Genre: {b.category}
                </p>
              )}

              <span
                className={
                  "inline-block px-3 py-1 rounded-full text-sm font-medium " +
                  (b.status === "available"
                    ? "bg-green-900 text-green-300"
                    : b.status === "on_hold"
                    ? "bg-yellow-900 text-yellow-300"
                    : "bg-red-900 text-red-300")
                }
              >
                {b.status}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BookList;
