import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

export default function AuthView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [popupError, setPopupError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const navigate = useNavigate();

  async function handleLogin() {
    if (!email || !password) {
      setPopupError("Please enter email and password");
      return;
    }

    setLoading(true);
    setPopupError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await res.text();
      const lower = responseText.toLowerCase();

      if (res.status === 404 || lower.includes("not found")) {
        setPopupError("Account not found. Please register first.");
        return;
      }

      if (res.status === 401 || lower.includes("invalid")) {
        setPopupError("Invalid password.");
        return;
      }

      if (res.status === 403 || lower.includes("await")) {
        setPopupError("Your account is pending admin approval.");
        return;
      }

      if (!res.ok) {
        setPopupError("Login failed. Please try again.");
        return;
      }

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        setPopupError("Invalid login response. Please check backend login API.");
        return;
      }

      if (!data.token || !data.role) {
        setPopupError("Invalid login response. Token or role missing.");
        return;
      }

      localStorage.setItem("ps_token", data.token);
      localStorage.setItem("ps_role", data.role);
      localStorage.setItem("ps_dealer_id", String(data.id || ""));
      localStorage.setItem("ps_dealer_name", data.name || "Dealer");

      if (data.role === "ADMIN" || data.role === "ROLE_ADMIN") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (data.role === "DEALER" || data.role === "ROLE_DEALER") {
        navigate("/dealer/dashboard", { replace: true });
        return;
      }

      setPopupError("Your account is pending admin approval.");
    } catch {
      setPopupError("Server unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen h-[100dvh] w-full flex flex-col bg-gray-100 overflow-hidden">
      {/* ✅ NAVBAR */}
      <Navbar />

      {/* ✅ MAIN CONTENT: Adjusting layout to dynamically fit the screen */}
      <main className="flex-1 flex items-center justify-center p-4">
        {/* ✅ CARD: Increased max-width and internal padding (p-8) to utilize the space better */}
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl p-8 my-auto">
          {/* LOGO */}
          <div className="text-center mb-6">
            {/* ✅ Increased logo height to take up natural vertical space */}
            <img
              src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo3.png?raw=true"
              alt="PawnSecure"
              className="mx-auto h-40 object-contain"
            />
          </div>

          {/* EMAIL */}
          <label className="text-sm font-semibold text-gray-600">
            Email Address
          </label>

          {/* ✅ Increased vertical padding (py-3) and margins to stretch inputs comfortably */}
          <div className="mt-1 mb-5 flex items-center gap-3 border bg-gray-50 rounded-lg px-3 py-3">
            <span className="text-base">📧</span>
            <input
              type="email"
              placeholder="Enter your email address"
              className="bg-transparent outline-none w-full text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <label className="text-sm font-semibold text-gray-600">
            Password
          </label>

          <div className="mt-1 mb-5 flex items-center gap-3 border bg-gray-50 rounded-lg px-3 py-3">
            <span className="text-base">🔒</span>
            <input
              type="password"
              placeholder="Enter your password"
              className="bg-transparent outline-none w-full text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-between text-sm mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-indigo-600 w-4 h-4" />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* SIGN IN BUTTON */}
          {/* ✅ Taller button to fill out the form footprint */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
            }`}
          >
            {loading ? "Signing In..." : "🔒 Sign In"}
          </button>

          <div className="border-t my-6"></div>

          <p className="text-center text-sm text-gray-600">
            First time?{" "}
            <Link
              to="/register"
              className="text-indigo-600 font-bold hover:underline"
            >
              Register Dealer →
            </Link>
          </p>
        </div>
      </main>

      {/* ✅ FOOTER */}
      <Footer />

      {/* ERROR POPUP */}
      {popupError && (
        <ErrorModal message={popupError} onClose={() => setPopupError("")} />
      )}

      {/* FORGOT PASSWORD */}
      {showForgot && (
        <ForgotPasswordModal
          onClose={() => setShowForgot(false)}
          onSuccess={() => setResetSuccess(true)}
        />
      )}

      {/* RESET SUCCESS */}
      {resetSuccess && (
        <SuccessModal
          message="Reset link sent to your email"
          onClose={() => setResetSuccess(false)}
        />
      )}
    </div>
  );
}

/* ---------- ERROR MODAL ---------- */

function ErrorModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="text-red-500 text-5xl mb-3">✖</div>

        <h2 className="text-xl font-bold mb-2">Error</h2>

        <p className="text-gray-600 mb-5">{message}</p>

        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold w-full transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}

/* ---------- SUCCESS MODAL ---------- */

function SuccessModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="text-green-600 text-5xl mb-3">✔</div>

        <h2 className="text-xl font-bold mb-2">Success</h2>

        <p className="text-gray-600 mb-5">{message}</p>

        <button
          onClick={onClose}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold w-full transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}

/* ---------- FORGOT PASSWORD MODAL ---------- */

function ForgotPasswordModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendReset() {
    if (!email) {
      setError("Please enter your registered email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("Email not registered");
        return;
      }

      onClose();
      onSuccess();
    } catch {
      setError("Server unavailable. Please try later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[360px] p-6">
        <h2 className="text-xl font-bold mb-2">Forgot Password</h2>

        <p className="text-sm text-gray-600 mb-4">
          Enter your registered email to receive reset instructions
        </p>

        <input
          type="email"
          placeholder="Enter email"
          className="w-full border p-3 rounded-lg mb-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={sendReset}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Sending..." : "Send Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
