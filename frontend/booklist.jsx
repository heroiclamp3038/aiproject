export default function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/book/${id}`)
      .then((res) => res.json())
      .then(setBook);
  }, [id]);

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center">
        <p className="text-gray-400">Loading book...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/" className="text-xl font-semibold text-gray-100">Library</a>
          <nav className="flex gap-6 text-gray-400">
            <a href="/" className="hover:text-gray-100">Catalog</a>
            <a href="/chat" className="hover:text-gray-100">Chatbot</a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">{book.title}</h1>

          <div className="space-y-3 text-gray-300">
            <p><span className="text-gray-400">Author:</span> {book.author}</p>
            <p><span className="text-gray-400">Category:</span> {book.category}</p>
            <p><span className="text-gray-400">Language:</span> {book.language}</p>
            <p><span className="text-gray-400">Status:</span> {book.status}</p>
            <p><span className="text-gray-400">Shelf:</span> {book.shelf_location}</p>
          </div>

          <div className="mt-8">
            <a
              href="/"
              className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition text-white"
            >
              Back to Catalog
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}