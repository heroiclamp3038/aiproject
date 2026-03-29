import { useEffect, useState } from "react";
import { fetchBooks, cancelHold } from "./api";
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

interface HeldBook {
  book_id: number;
  title: string;
  author: string;
  hold_until: string;
}

function BookList() {
  const [books, setBooks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("library_bookmarks") ?? "[]"); }
    catch { return []; }
  });
  const [activeTab, setActiveTab] = useState<"all" | "bookmarks">("all");
  const user = getUser();

  useEffect(() => {
    fetchBooks()
      .then((data: any[]) => setBooks(data.filter((b: any) => b.title?.trim())))
      .catch((err: any) => console.error("FETCH ERROR:", err));
  }, []);

  function toggleBookmark(bookId: number) {
    setBookmarks((prev) => {
      const next = prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId];
      localStorage.setItem("library_bookmarks", JSON.stringify(next));
      return next;
    });
  }

  async function handleCancelHold(bookId: number) {
    if (!user) return;
    await cancelHold(bookId, user.userId, user.email);
    setBooks((prev) =>
      prev.map((b) =>
        b.book_id === bookId ? { ...b, status: "available", holder_user_id: "", holder_email: "", hold_until: "" } : b
      )
    );
  }

  // My Holds
  const myHolds: HeldBook[] = books
    .filter((b) => {
      const s = (b.status || "").toLowerCase();
      return (
        s === "on_hold" &&
        (String(b.holder_user_id) === String(user?.userId) ||
          (user?.email && b.holder_email === user.email))
      );
    })
    .map((b) => ({ book_id: b.book_id, title: b.title, author: b.author, hold_until: b.hold_until }));

  // Filtered books
  const filtered = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.category && book.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Group by title
  const groupMap: Record<string, any[]> = {};
  for (const book of filtered) {
    const key = book.title.trim().toLowerCase();
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(book);
  }

  const titleGroups: BookGroup[] = Object.values(groupMap).map((copies) => {
    const total = copies.length;
    const available = copies.filter((b) => {
      const s = (b.status || "").toLowerCase();
      return s === "available" || !s;
    }).length;
    const held = copies.filter((b) => (b.status || "").toLowerCase() === "on_hold").length;
    const checkedOut = copies.filter((b) => (b.status || "").toLowerCase() === "checked_out").length;
    const userCopy = user
      ? copies.find(
          (b) =>
            (user.email && b.holder_email === user.email) ||
            String(b.holder_user_id) === String(user.userId)
        )
      : undefined;
    const firstAvailable = copies.find((b) => {
      const s = (b.status || "").toLowerCase();
      return s === "available" || !s;
    });
    const linkTo = userCopy ?? firstAvailable ?? copies[0];
    const groupBookmarkIds = copies.map((b: any) => b.book_id);
    const isBookmarked = groupBookmarkIds.some((id: number) => bookmarks.includes(id));
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
      isBookmarked,
      groupBookmarkIds,
    } as BookGroup & { isBookmarked: boolean; groupBookmarkIds: number[] };
  });

  const displayGroups =
    activeTab === "bookmarks"
      ? (titleGroups as any[]).filter((g) => g.isBookmarked)
      : (titleGroups as any[]);

  return (
    <div className="min-h-screen bg-gray-900 py-10">
      <div className="max-w-6xl mx-auto px-6">

        {/* My Holds */}
        {myHolds.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-3">My Holds</h2>
            <div className="space-y-2">
              {myHolds.map((h) => (
                <div
                  key={h.book_id}
                  className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-5 py-3"
                >
                  <div>
                    <p className="text-white font-medium">{h.title}</p>
                    <p className="text-gray-400 text-sm">
                      Due{" "}
                      {h.hold_until
                        ? new Date(h.hold_until).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/book/${h.book_id}`}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleCancelHold(h.book_id)}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Catalog header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">Library Catalog</h1>
          <span className="text-gray-400 text-sm">
            {displayGroups.length} title{displayGroups.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Search + tabs */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by title, author, or genre…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setActiveTab(activeTab === "bookmarks" ? "all" : "bookmarks")}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              activeTab === "bookmarks"
                ? "bg-yellow-600 border-yellow-600 text-white"
                : "border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            Bookmarks {bookmarks.length > 0 && `(${bookmarks.length})`}
          </button>
        </div>

        {/* Book grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(displayGroups as any[]).map((g) => (
            <div key={g.book_id} className="relative group">
              <a
                href={`/book/${g.linkId}`}
                className="block bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-xl hover:bg-gray-700 transition-all duration-200 border border-gray-700 pr-12"
              >
                <h2 className="text-lg font-semibold text-white mb-1 leading-snug">{g.title}</h2>
                <p className="text-gray-300 text-sm mb-1">{g.author}</p>
                {g.category && (
                  <p className="text-xs text-gray-500 mb-3">{g.category}</p>
                )}
                <div className="flex flex-wrap gap-1.5 text-xs font-medium mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    {g.total} {g.total === 1 ? "copy" : "copies"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-green-900 text-green-300">
                    {g.available} available
                  </span>
                  {g.held > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-300">
                      {g.held} on hold
                    </span>
                  )}
                  {g.checkedOut > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-900 text-red-300">
                      {g.checkedOut} checked out
                    </span>
                  )}
                </div>
              </a>
              {/* Bookmark button */}
              <button
                onClick={() => toggleBookmark(g.book_id)}
                className="absolute top-4 right-4 text-xl transition-transform hover:scale-110"
                title={g.isBookmarked ? "Remove bookmark" : "Bookmark"}
              >
                {g.isBookmarked ? "★" : "☆"}
              </button>
            </div>
          ))}
        </div>

        {displayGroups.length === 0 && (
          <p className="text-gray-500 text-center py-16">
            {activeTab === "bookmarks" ? "No bookmarks yet." : "No books found."}
          </p>
        )}
      </div>
    </div>
  );
}

export default BookList;
