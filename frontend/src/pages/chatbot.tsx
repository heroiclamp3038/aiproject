import { useState } from "react";
import { chatWithBot } from "../api";

function Chatbot() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setInput("");

    try {
      const data = await chatWithBot(input);
      const botMsg = {
        role: "assistant",
        content: data.response || "Sorry, I couldn't process that."
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Error: Unable to connect to the assistant."
      }]);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-lg flex flex-col h-[75vh]">
          <h1 className="text-2xl font-bold mb-2">Library Assistant</h1>
          <p className="text-gray-400 mb-6">Ask me about books in the catalog</p>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                <p>Hi! I'm your library assistant. Ask me about books!</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 px-4 py-2 rounded-lg">
                  <p className="text-gray-400">Typing...</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && send()}
              placeholder="Ask about books..."
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chatbot;
