import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import BookList from "./booklist";
import BookDetails from "./pages/bookdetails";
import Chatbot from "./pages/chatbot";
import Login from "./pages/login";

export function getUser(): { name: string; userId: number; email: string } | null {
  const raw = localStorage.getItem("library_user");
  return raw ? JSON.parse(raw) : null;
}

function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  function signOut() {
    localStorage.removeItem("library_user");
    navigate("/login");
  }

  if (!user) return null;

  return (
    <nav className="bg-gray-900 px-8 py-4 flex justify-between items-center shadow-md border-b border-gray-800">
      <a href="/" className="flex items-center gap-3 text-xl font-bold text-white">
          <img src="/logo.png" alt="FKS Logo" className="h-9 w-9 rounded-full object-contain bg-gray-800" onError={e => (e.currentTarget.style.display = "none")} />
          <span>Fremont Khalsa School Library</span>
        </a>
      <div className="flex items-center gap-6">
        <a href="/" className="text-gray-300 hover:text-white text-sm">Catalog</a>
        <a href="/chat" className="text-gray-300 hover:text-white text-sm">Chatbot</a>
        <div className="flex items-center gap-3 border-l border-gray-700 pl-6">
          <div className="text-right">
            <p className="text-white text-sm font-medium">{user.name}</p>
            <p className="text-gray-500 text-xs">ID: {user.userId}</p>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

function Protected({ element }: { element: React.ReactElement }) {
  return getUser() ? element : <Navigate to="/login" replace />;
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={getUser() ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<Protected element={<BookList />} />} />
        <Route path="/book/:id" element={<Protected element={<BookDetails />} />} />
        <Route path="/chat" element={<Protected element={<Chatbot />} />} />
      </Routes>
    </>
  );
}

export default App;
