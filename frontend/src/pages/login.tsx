import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestOtp, verifyOtp } from "../api";

type Step = "email" | "name" | "code";

function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const btnClass =
    "w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold transition-colors text-white";

  async function handleSendCode() {
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (step === "name" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await requestOtp(email.trim().toLowerCase(), name.trim() || undefined);
      setStep("code");
    } catch (e: any) {
      if (e.message === "new_user") {
        setStep("name");
        setError("Looks like you're new! Enter your name to create an account.");
      } else {
        setError(e.message || "Failed to send code.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!code.trim()) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await verifyOtp(email.trim().toLowerCase(), code.trim());
      localStorage.setItem(
        "library_user",
        JSON.stringify({ name: user.name, userId: user.user_id, email: user.email })
      );
      navigate("/");
    } catch (e: any) {
      setError(e.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm text-white">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="FKS Logo"
            className="h-14 w-14 rounded-full object-contain bg-gray-700 mx-auto mb-4"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <h1 className="text-2xl font-bold">Fremont Khalsa School</h1>
          <p className="text-gray-400 text-sm mt-1">Library Catalog</p>
        </div>

        {/* Step: email (and optionally name) */}
        {step !== "code" && (
          <div className="space-y-4">
            {step === "name" && (
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            )}
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSendCode()}
              className={inputClass}
              autoFocus={step === "email"}
            />
            <button onClick={handleSendCode} disabled={loading} className={btnClass}>
              {loading ? "Sending…" : "Send Code"}
            </button>
          </div>
        )}

        {/* Step: enter code */}
        {step === "code" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 text-center">
              We sent a 6-digit code to{" "}
              <span className="text-white font-medium">{email}</span>
            </p>
            <input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleVerify()}
              maxLength={6}
              className={`${inputClass} text-center text-3xl tracking-widest font-bold`}
              autoFocus
            />
            <button onClick={handleVerify} disabled={loading} className={btnClass}>
              {loading ? "Verifying…" : "Sign In"}
            </button>
            <button
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Use a different email
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
