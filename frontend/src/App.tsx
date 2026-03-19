import { Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import BookList from "./booklist";
import BookDetails from "./pages/bookdetails";
import Chatbot from "./pages/chatbot";

function Navbar() {
  return (
    <nav className="bg-gray-900 px-16 py-4 flex justify-between items-center shadow-md border-b border-gray-800">
      <a href="/" className="text-xl font-bold text-white">Fremont Khalsa School Library</a>

      <div className="flex gap-6">
        <a href="/" className="text-gray-300 hover:text-white">Catalog</a>
        <a href="/chat" className="text-gray-300 hover:text-white">Chatbot</a>
      </div>
    </nav>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<BookList />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/chat" element={<Chatbot />} />
      </Routes>
      <SpeedInsights />
    </>
  );
}

export default App;