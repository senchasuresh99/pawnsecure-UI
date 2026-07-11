import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
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

      // Save login details
      localStorage.setItem("ps_token", data.token);
      localStorage.setItem("ps_role", role);
      localStorage.setItem("ps_dealer_id", String(data.id || ""));
      localStorage.setItem("ps_dealer_name", data.name || "Dealer");
      localStorage.setItem("ps_dashboard_control", dashboardControl);

      // ADMIN LOGIN
      if (role === "ADMIN" || role === "ROLE_ADMIN") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      // DEALER LOGIN BASED ON DASHBOARD CONTROL ENUM
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
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          
          {/* ✅ LEFT SIDE: BRANDING PANEL (Hidden on Mobile) */}
          <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-[#4820C5] via-purple-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full border-[20px] border-white"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full border-[30px] border-white"></div>
            </div>

            <div className="relative z-10">
              <img
                src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
                alt="PawnSecure Logo"
                className="w-16 h-16 bg-white p-2 rounded-2xl mb-6 shadow-lg"
              />
              <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
                Connecting Trust.<br />Securing Value.
              </h2>
              <p className="text-indigo-100 text-sm leading-relaxed max-w-sm">
                The premier digital platform for Pawn Brokers to manage pledge records, customer networks, and invoicing securely from anywhere.
              </p>
            </div>

            <div className="relative z-10 text-white/60 text-xs font-semibold tracking-wider">
              © {new Date().getFullYear()} PawnSecure Systems
            </div>
          </div>

          {/* ✅ RIGHT SIDE: LOGIN FORM */}
          <div className="w-full lg:w-7/12 p-8 sm:p-12 lg:p-16">
            
            {/* Mobile Logo (Visible only on small screens) */}
            <div className="lg:hidden text-center mb-8">
              <img
                src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo3.png?raw=true"
                alt="PawnSecure"
                className="mx-auto h-20 object-contain"
              />
            </div>

            <div className="mb-10">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
              <p className="text-gray-500 text-sm mt-2 font-medium">Please enter your details to access your portal.</p>
            </div>

            <div className="space-y-6">
              {/* INTERACTIVE EMAIL FIELD */}
              <div className="group relative">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-[#4820C5]">
                  Email Address
                </label>
                <div className="relative flex items-center border-2 border-gray-100 rounded-xl bg-gray-50/50 focus-within:bg-white focus-within:border-[#4820C5] focus-within:ring-4 focus-within:ring-purple-50 transition-all duration-300">
                  <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-[#4820C5] transition-colors">
                    <FaEnvelope />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    className="w-full bg-transparent border-none py-3.5 pr-4 text-sm text-gray-900 outline-none placeholder-gray-400 font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* INTERACTIVE PASSWORD FIELD */}
              <div className="group relative">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-[#4820C5]">
                  Password
                </label>
                <div className="relative flex items-center border-2 border-gray-100 rounded-xl bg-gray-50/50 focus-within:bg-white focus-within:border-[#4820C5] focus-within:ring-4 focus-within:ring-purple-50 transition-all duration-300">
                  <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-[#4820C5] transition-colors">
                    <FaLock />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full bg-transparent border-none py-3.5 pr-4 text-sm text-gray-900 outline-none placeholder-gray-400 font-medium tracking-widest"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* UTILITIES ROW */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#4820C5] focus:ring-[#4820C5] cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-sm font-bold text-[#4820C5] hover:text-[#3917a3] hover:underline transition-all"
                >
                  Forgot Password?
                </button>
              </div>

              {/* LOGIN BUTTON */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="relative w-full overflow-hidden bg-[#4820C5] hover:bg-[#3917a3] text-white py-4 rounded-xl font-extrabold text-sm transition-all shadow-lg shadow-purple-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 group"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Authenticating...
                  </div>
                ) : (
                  "Sign In to Dashboard"
                )}
                {/* Subtle shine effect on hover */}
                <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-white/20 skew-x-12 group-hover:left-[200%] transition-all duration-700 ease-in-out"></div>
              </button>
            </div>

            {/* REGISTER LINK */}
            <p className="text-center text-sm font-semibold text-gray-500 mt-10">
              New to PawnSecure?{" "}
              <Link
                to="/register"
                className="text-[#4820C5] font-extrabold hover:underline"
              >
                Register as Dealer
              </Link>
            </p>

          </div>
        </div>
      </main>

      <Footer />

      {/* MODALS */}
      {popupError && (
        <ErrorModal message={popupError} onClose={() => setPopupError("")} />
      )}
      {showForgot && (
        <ForgotPasswordModal
          onClose={() => setShowForgot(false)}
          onSuccess={() => setResetSuccess(true)}
        />
      )}
      {resetSuccess && (
        <SuccessModal
          message="Password reset link sent to your registered email address."
          onClose={() => setResetSuccess(false)}
        />
      )}
    </div>
  );
}

/* ---------- ENHANCED MODALS ---------- */

function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200 border border-red-100">
        <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-5">
          <FaExclamationCircle />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Login Failed</h2>
        <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200 border border-green-100">
        <div className="mx-auto w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl mb-5">
          <FaCheckCircle />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Success</h2>
        <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-[#4820C5] hover:bg-[#3917a3] text-white py-3.5 rounded-xl font-bold transition-colors shadow-md shadow-purple-100"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ForgotPasswordModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendReset() {
    if (!email) {
      setError("Please enter your registered email address.");
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
        setError("We could not find an account associated with this email.");
        return;
      }
      onClose();
      onSuccess();
    } catch {
      setError("Server unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">Reset Password</h2>
            <p className="text-sm font-medium text-gray-500 mt-2">
            Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
        </div>

        <div className="group relative mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-[#4820C5]">
                Email Address
            </label>
            <div className={`relative flex items-center border-2 rounded-xl bg-gray-50/50 transition-all duration-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-purple-50 ${error ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-50' : 'border-gray-100 focus-within:border-[#4820C5]'}`}>
                <div className={`pl-4 pr-3 transition-colors ${error ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#4820C5]'}`}>
                <FaEnvelope />
                </div>
                <input
                type="email"
                placeholder="dealer@example.com"
                className="w-full bg-transparent border-none py-3.5 pr-4 text-sm text-gray-900 outline-none placeholder-gray-400 font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            {error && <p className="text-xs font-bold text-red-500 mt-2">{error}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={sendReset}
            disabled={loading}
            className="px-6 py-3.5 rounded-xl font-bold text-white bg-[#4820C5] hover:bg-[#3917a3] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md shadow-purple-100 flex items-center justify-center min-w-[140px]"
          >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : "Send Link"}
          </button>
        </div>
      </div>
    </div>
  );
}