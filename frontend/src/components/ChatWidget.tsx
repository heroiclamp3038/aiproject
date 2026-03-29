import { useEffect, useRef, useState } from "react";
import { chatWithBot } from "../api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const data = await chatWithBot(userMsg.content);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "Sorry, I couldn't process that." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Unable to connect to the assistant." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 w-13 h-13 bg-blue-600 hover:bg-blue-700 rounded-full shadow-xl flex items-center justify-center text-white z-50 transition-all duration-200 p-3.5"
        title="Library Assistant"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 0 0 1.28.53l3.58-3.579A19.8 19.8 0 0 0 10 14c2.236 0 4.43-.18 6.57-.524 1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.1 41.1 0 0 0 10 2Z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">Library Assistant</p>
              <p className="text-gray-400 text-xs">Ask about books in the catalog</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-gray-500 text-sm text-center mt-8">
                Ask me anything about the library catalog!
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 px-3 py-2 rounded-xl text-sm text-gray-400">
                  Typing…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-700 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask about books…"
              disabled={loading}
              className="flex-1 px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;
