import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"new" | "existing">("new");
  const [name, setName] = useState("");
  const [existingId, setExistingId] = useState("");
  const [newUser, setNewUser] = useState<{ name: string; userId: number } | null>(null);
  const [error, setError] = useState("");

  function handleSignUp() {
    if (!name.trim()) { setError("Please enter your name."); return; }
    const userId = Math.floor(100000 + Math.random() * 900000);
    const user = { name: name.trim(), userId };
    localStorage.setItem("library_user", JSON.stringify(user));
    setNewUser(user);
    setError("");
  }

  function handleSignIn() {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!existingId.trim()) { setError("Please enter your user ID."); return; }
    const userId = parseInt(existingId);
    if (isNaN(userId)) { setError("User ID must be a number."); return; }
    const user = { name: name.trim(), userId };
    localStorage.setItem("library_user", JSON.stringify(user));
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-white">
        <h1 className="text-3xl font-bold mb-2 text-center">Fremont Khalsa School</h1>
        <p className="text-gray-400 text-center mb-8">Library Catalog</p>

        <div className="flex rounded-lg overflow-hidden border border-gray-700 mb-6">
          <button
            onClick={() => { setTab("new"); setError(""); setNewUser(null); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "new" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            New User
          </button>
          <button
            onClick={() => { setTab("existing"); setError(""); setNewUser(null); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "existing" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Sign In
          </button>
        </div>

        {tab === "new" && !newUser && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSignUp()}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSignUp}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Create Account
            </button>
          </div>
        )}

        {tab === "new" && newUser && (
          <div className="space-y-4 text-center">
            <p className="text-green-400 font-medium">Account created!</p>
            <p className="text-gray-300">Welcome, <span className="text-white font-semibold">{newUser.name}</span>!</p>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Your User ID</p>
              <p className="text-4xl font-bold text-blue-400 tracking-widest">{newUser.userId}</p>
              <p className="text-xs text-gray-500 mt-2">Save this — you'll need it to sign in on other devices.</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Go to Library
            </button>
          </div>
        )}

        {tab === "existing" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Your user ID"
              value={existingId}
              onChange={e => setExistingId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSignIn()}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSignIn}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Sign In
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

export default Login;
