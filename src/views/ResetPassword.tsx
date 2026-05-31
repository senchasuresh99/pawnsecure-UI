import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_BASE = "https://pawn-qa.netlify.app/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!password || !confirm) {
      setError("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid or expired reset link");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      if (!res.ok) {
        setError("Reset link is invalid or expired");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Server unavailable. Please try later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-6">
            <p className="text-xs text-purple-600 mb-2">
              Connecting Trust. Securing Value.
            </p>

            https://github.com/senchasuresh99/LearningScalare/blob/main/logo3.png?raw=true

            <p className="text-xs text-gray-500 mt-2">
              People. Trust. Security. Together.
            </p>
          </div>

          <label className="text-sm font-semibold text-gray-600">
            New Password
          </label>
          <div className="mt-1 mb-4 flex items-center gap-3 border bg-gray-50 rounded-lg px-3 py-3">
            <span className="text-indigo-500">🔒</span>
            <input
              type="password"
              placeholder="Enter new password"
              className="bg-transparent outline-none w-full text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <label className="text-sm font-semibold text-gray-600">
            Confirm Password
          </label>
          <div className="mt-1 mb-5 flex items-center gap-3 border bg-gray-50 rounded-lg px-3 py-3">
            <span className="text-indigo-500">🔒</span>
            <input
              type="password"
              placeholder="Confirm new password"
              className="bg-transparent outline-none w-full text-sm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 mb-3 text-center">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold transition
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </div>

      {/* ✅ SUCCESS POPUP */}
      {success && (
        <SuccessModal
          message="Password reset successfully"
          onClose={() => navigate("/")}
        />
      )}
    </>
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
          Go to Login
        </button>
      </div>
    </div>
  );
}