import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUp, signIn, requestRecovery, verifyOtp } from "../api";

type Tab = "new" | "existing" | "recover";

function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("new");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [existingId, setExistingId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [newUser, setNewUser] = useState<{ name: string; user_id: number } | null>(null);
  const [recoveredId, setRecoveredId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchTab(t: Tab) {
    setTab(t);
    setError("");
    setNewUser(null);
    setRecoveredId(null);
    setOtpSent(false);
    setOtp("");
  }

  async function handleSignUp() {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email."); return; }
    setLoading(true); setError("");
    try {
      const user = await signUp(name.trim(), email.trim().toLowerCase());
      localStorage.setItem("library_user", JSON.stringify({ name: user.name, userId: user.user_id, email: user.email }));
      setNewUser(user);
    } catch (e: any) {
      setError(e.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!existingId.trim()) { setError("Please enter your user ID."); return; }
    const userId = parseInt(existingId);
    if (isNaN(userId)) { setError("User ID must be a number."); return; }
    setLoading(true); setError("");
    try {
      const user = await signIn(name.trim(), userId);
      localStorage.setItem("library_user", JSON.stringify({ name: user.name, userId: user.user_id, email: user.email }));
      navigate("/");
    } catch (e: any) {
      setError(e.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp() {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter your email."); return; }
    setLoading(true); setError("");
    try {
      await requestRecovery(name.trim(), email.trim().toLowerCase());
      setOtpSent(true);
    } catch (e: any) {
      setError(e.message || "Failed to send recovery code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) { setError("Please enter the recovery code."); return; }
    setLoading(true); setError("");
    try {
      const user = await verifyOtp(name.trim(), email.trim().toLowerCase(), otp.trim());
      localStorage.setItem("library_user", JSON.stringify({ name: user.name, userId: user.user_id, email: user.email }));
      setRecoveredId(user.user_id);
    } catch (e: any) {
      setError(e.message || "Invalid recovery code.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const btnClass = "w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold transition-colors";

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-white">
        <h1 className="text-3xl font-bold mb-2 text-center">Fremont Khalsa School</h1>
        <p className="text-gray-400 text-center mb-8">Library Catalog</p>

        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-gray-700 mb-6">
          {(["new", "existing", "recover"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === t ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              {t === "new" ? "New User" : t === "existing" ? "Sign In" : "Forgot ID"}
            </button>
          ))}
        </div>

        {/* New User */}
        {tab === "new" && !newUser && (
          <div className="space-y-4">
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
            <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSignUp()} className={inputClass} />
            <button onClick={handleSignUp} disabled={loading} className={btnClass}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </div>
        )}

        {tab === "new" && newUser && (
          <div className="space-y-4 text-center">
            <p className="text-green-400 font-medium">Account created!</p>
            <p className="text-gray-300">Welcome, <span className="text-white font-semibold">{newUser.name}</span>!</p>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Your User ID</p>
              <p className="text-4xl font-bold text-blue-400 tracking-widest">{newUser.user_id}</p>
              <p className="text-xs text-gray-500 mt-2">Save this — you'll need it to sign in. You can also recover it via email if you forget.</p>
            </div>
            <button onClick={() => navigate("/")} className={btnClass}>Go to Library</button>
          </div>
        )}

        {/* Sign In */}
        {tab === "existing" && (
          <div className="space-y-4">
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
            <input type="number" placeholder="Your user ID" value={existingId} onChange={e => setExistingId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSignIn()} className={inputClass} />
            <button onClick={handleSignIn} disabled={loading} className={btnClass}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        )}

        {/* Forgot ID — step 1: request OTP */}
        {tab === "recover" && !otpSent && !recoveredId && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Enter your name and email to receive a recovery code.</p>
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
            <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleRequestOtp()} className={inputClass} />
            <button onClick={handleRequestOtp} disabled={loading} className={btnClass}>
              {loading ? "Sending code…" : "Send Recovery Code"}
            </button>
          </div>
        )}

        {/* Forgot ID — step 2: enter OTP */}
        {tab === "recover" && otpSent && !recoveredId && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 text-center">A 6-digit code was sent to <span className="text-white">{email}</span>. It expires in 15 minutes.</p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
              maxLength={6}
              className={`${inputClass} text-center text-2xl tracking-widest`}
            />
            <button onClick={handleVerifyOtp} disabled={loading} className={btnClass}>
              {loading ? "Verifying…" : "Verify Code"}
            </button>
            <button onClick={() => { setOtpSent(false); setError(""); }} className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors">
              ← Back
            </button>
          </div>
        )}

        {/* Forgot ID — step 3: show new ID */}
        {tab === "recover" && recoveredId && (
          <div className="space-y-4 text-center">
            <p className="text-green-400 font-medium">Identity verified!</p>
            <p className="text-gray-300">A new User ID has been issued for <span className="text-white font-semibold">{name}</span>.</p>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Your New User ID</p>
              <p className="text-4xl font-bold text-blue-400 tracking-widest">{recoveredId}</p>
              <p className="text-xs text-gray-500 mt-2">Your old ID no longer works. Save this new one.</p>
            </div>
            <button onClick={() => navigate("/")} className={btnClass}>Go to Library</button>
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
