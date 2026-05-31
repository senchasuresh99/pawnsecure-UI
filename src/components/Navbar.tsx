import { useNavigate } from "react-router-dom";

type NavbarProps = {
  active?: "dealers" | "reviews";
};

export default function Navbar({ active }: NavbarProps) {
  const navigate = useNavigate();

  const isLoggedIn = Boolean(localStorage.getItem("ps_token"));
  const role = localStorage.getItem("ps_role");

  function handleLogout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <nav className="bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* ✅ LEFT */}
        <div className="flex items-center gap-3">
          <img
            src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
            alt="PawnSecure"
            className="w-10 h-10 bg-white rounded-lg p-1"
          />

          <div>
            <h1 className="text-lg font-bold">PawnSecure</h1>
            <p className="text-[11px] text-indigo-100">
              Trusted Records • Secure Connections
            </p>
          </div>
        </div>

        {/* ✅ CENTER NAV */}
        {active && (
          <div className="flex items-center gap-8 text-sm font-semibold">

            {/* ✅ ADMIN ONLY */}
            {(role === "ADMIN" || role === "ROLE_ADMIN") && (
              <button
                onClick={() => navigate("/admin/dashboard")}
                className={`pb-1 ${
                  active === "dealers"
                    ? "border-b-2 border-white"
                    : "text-indigo-100 hover:text-white"
                }`}
              >
                Manage Dealers
              </button>
            )}

            {/* ✅ BOTH ADMIN + DEALER */}
            {(role === "ADMIN" ||
              role === "ROLE_ADMIN" ||
              role === "DEALER" ||
              role === "ROLE_DEALER") && (
              <button
                onClick={() => navigate("/dealer/dashboard")}
                className={`pb-1 ${
                  active === "reviews"
                    ? "border-b-2 border-white"
                    : "text-indigo-100 hover:text-white"
                }`}
              >
                Customer Reviews
              </button>
            )}

          </div>
        )}

        {/* ✅ RIGHT
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold"
          >
            Logout
          </button>
        )} */}

      </div>
    </nav>
  );
}