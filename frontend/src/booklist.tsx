import { useEffect, useState } from "react";
import { fetchBooks } from "./api";
import { getUser } from "./App";

interface BookGroup {
  book_id: number;
  title: string;
  author: string;
  category?: string;
  linkId: number;
  total: number;
  available: number;
  held: number;
  checkedOut: number;
}

function BookList() {
  const [books, setBooks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const user = getUser();

  useEffect(() => {
    fetchBooks()
      .then((data: any[]) => {
        const validBooks = data.filter((b: any) => b.title && b.title.trim());
        setBooks(validBooks);
      })
      .catch((err: any) => console.error("FETCH ERROR:", err));
  }, []);

  const filtered = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.category && book.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group by title (case-insensitive)
  const groupMap: Record<string, any[]> = {};
  for (const book of filtered) {
    const key = book.title.trim().toLowerCase();
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(book);
  }

  const titleGroups: BookGroup[] = Object.values(groupMap).map((copies) => {
    const total = copies.length;
    const available = copies.filter(b => {
      const s = (b.status || "").toLowerCase();
      return s === "available" || !s;
    }).length;
    const held = copies.filter(b => (b.status || "").toLowerCase() === "on_hold").length;
    const checkedOut = copies.filter(b => (b.status || "").toLowerCase() === "checked_out").length;
    const userCopy = user
      ? copies.find(b => String(b.holder_user_id) === String(user.userId))
      : undefined;
    const firstAvailable = copies.find(b => {
      const s = (b.status || "").toLowerCase();
      return s === "available" || !s;
    });
    const linkTo = userCopy || firstAvailable || copies[0];
    return {
      book_id: copies[0].book_id,
      title: copies[0].title,
      author: copies[0].author,
      category: copies[0].category,
      linkId: linkTo.book_id,
      total,
      available,
      held,
      checkedOut,
    };
  });

  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-6xl mx-auto px-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Library Catalog</h1>
          <span className="text-gray-400 text-sm">
            {titleGroups.length} title{titleGroups.length !== 1 ? "s" : ""}
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
          {titleGroups.map((g) => (
            <a
              key={g.book_id}
              href={`/book/${g.linkId}`}
              className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl hover:bg-gray-700 transition-all duration-200 border border-gray-700"
            >
              <h2 className="text-xl font-semibold text-white mb-1">{g.title}</h2>
              <p className="text-gray-300 mb-3">Author: {g.author}</p>
              {g.category && (
                <p className="text-sm text-gray-400 mb-3">Genre: {g.category}</p>
              )}

              {/* Copy counts */}
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
                <span className="px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                  {g.total} {g.total === 1 ? "copy" : "copies"}
                </span>
                <span className="px-2 py-1 rounded-full bg-green-900 text-green-300">
                  {g.available} available
                </span>
                {g.held > 0 && (
                  <span className="px-2 py-1 rounded-full bg-yellow-900 text-yellow-300">
                    {g.held} on hold
                  </span>
                )}
                {g.checkedOut > 0 && (
                  <span className="px-2 py-1 rounded-full bg-red-900 text-red-300">
                    {g.checkedOut} checked out
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BookList;
