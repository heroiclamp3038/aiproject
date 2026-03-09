import { useState } from "react";
import { chatWithBot } from "../api";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  async function sendMessage() {
    const userMsg = { role: "user", content: input };
    setMessages([...messages, userMsg]);

    const res = await chatWithBot(input);
    const botMsg = { role: "assistant", content: res.answer };

    setMessages(prev => [...prev, botMsg]);
    setInput("");
  }

  return (
    <div>
      <h2>Library Assistant</h2>

      <div className="chat-window">
        {messages.map((m, i) => (
          <p key={i}><b>{m.role}:</b> {m.content}</p>
        ))}
      </div>

      <input 
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Ask something..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}