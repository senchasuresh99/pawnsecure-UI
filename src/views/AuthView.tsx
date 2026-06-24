import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE } from "../config/api";

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

    const role = String(data.role || "");
    const dashboardControl = String(
      data.dashboardControl || "PARTIALITY"
    ).toUpperCase();

    // ✅ Save login details
    localStorage.setItem("ps_token", data.token);
    localStorage.setItem("ps_role", role);
    localStorage.setItem("ps_dealer_id", String(data.id || ""));
    localStorage.setItem("ps_dealer_name", data.name || "Dealer");
    localStorage.setItem("ps_dashboard_control", dashboardControl);

    // ✅ ADMIN LOGIN
    if (role === "ADMIN" || role === "ROLE_ADMIN") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    // ✅ DEALER LOGIN BASED ON DASHBOARD CONTROL ENUM
    if (role === "DEALER" || role === "ROLE_DEALER") {
      if (dashboardControl === "FULLVIEW") {
        navigate("/dealer/dashboard", { replace: true });
        return;
      }

      if (dashboardControl === "PARTIALITY") {
        navigate("/dealer/dashboard-partial", { replace: true });
        return;
      }

      setPopupError("Invalid dashboard access type assigned by admin.");
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
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* ✅ NAVBAR */}
      <Navbar />

      {/* ✅ LOGIN CONTENT */}
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl p-8">
          {/* LOGO */}
          <div className="text-center mb-6">
            <img
              src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo3.png?raw=true"
              alt="PawnSecure"
              className="mx-auto h-50 object-contain"
            />
          </div>

          {/* EMAIL */}
          <label className="text-sm font-semibold text-gray-600">
            Email Address
          </label>

          <div className="mt-1 mb-4 flex items-center gap-3 border bg-gray-50 rounded-lg px-3 py-3">
            <span className="text-indigo-500">📧</span>
            <input
              type="email"
              placeholder="Enter your email address"
              className="bg-transparent outline-none w-full text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <label className="text-sm font-semibold text-gray-600">
            Password
          </label>

          <div className="mt-1 mb-3 flex items-center gap-3 border bg-gray-50 rounded-lg px-3 py-3">
            <span className="text-indigo-500">🔒</span>
            <input
              type="password"
              placeholder="Enter your password"
              className="bg-transparent outline-none w-full text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-between text-sm mb-5">
            <label className="flex items-center gap-2">
              <input type="checkbox" />
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

          {/* SIGN IN */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
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
        <div className="text-purple-600 text-5xl mb-3">✖</div>

        <h2 className="text-xl font-bold mb-2">Error</h2>

        <p className="text-gray-600 mb-5">{message}</p>

        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
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
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
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
          className="w-full border p-3 rounded-lg mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={sendReset}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white ${
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
