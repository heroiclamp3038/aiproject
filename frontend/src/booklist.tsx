import { useEffect, useState } from "react";

function BookList() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/books")
      .then(res => res.json())
      .then(data => {
        const validBooks = data.filter((b: any) => b.Title && b.Title.trim());
        setBooks(validBooks);
        setLoading(false);
      })
      .catch(err => {
        console.error("FETCH ERROR:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading books...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">📚 Library Catalog</h1>
          <p className="text-blue-100 text-lg">{books.length} books available</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl">No books found.</p>
          </div>
        ) : (
          <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {books.map((b: any) => (
              <a
                key={b.book_id}
                href={`/book/${b.book_id}`}
                className="group h-full"
              >
                <div className="h-full bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-blue-500 flex flex-col">
                  {/* Book Cover Placeholder */}
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-48 flex items-center justify-center text-5xl">
                    📖
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {b.Title}
                    </h2>
                    
                    <p className="text-gray-300 text-sm mb-4 flex-1">
                      <span className="font-semibold">by</span> {b.Author}
                    </p>

                    {b.Category && (
                      <div className="mb-4">
                        <span className="inline-block bg-blue-900 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
                          {b.Category}
                        </span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="mt-auto pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                          b.status === "available"
                            ? "bg-green-900 text-green-200"
                            : b.status
                            ? "bg-yellow-900 text-yellow-200"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {b.status || "unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookList;