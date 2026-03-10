export default function Chat() {
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
          <h1 className="text-2xl font-bold text-gray-100 mb-4">Library Assistant</h1>

          <p className="text-gray-300 mb-6">
            👋 Hi! I'm your library assistant. Ask me about books!
          </p>

          {/* Chat input */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ask something..."
              className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white">
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}