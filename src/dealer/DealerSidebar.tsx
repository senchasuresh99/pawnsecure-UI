import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUserFriends,
  FaRupeeSign,
  FaCoins,
  FaChartBar,
  FaSignOutAlt,
} from "react-icons/fa";

type DealerSidebarProps = {
  isAdminView?: boolean;
};

export default function DealerSidebar({
  isAdminView = false,
}: DealerSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      icon: <FaHome />,
      path: "/dealer/dashboard",
      disabled: false,
    },
    {
      label: "Customers",
      icon: <FaUserFriends />,
      path: "/dealer/customers",
      disabled: false,
    },
    {
      label: "Girvi",
      icon: <FaRupeeSign />,
      path: "/dealer/customer",
      disabled: false,
    },
    {
      label: "Collections",
      icon: <FaCoins />,
      path: "/dealer/collections",
      disabled: true,
    },
    {
      label: "Reports",
      icon: <FaChartBar />,
      path: "/dealer/reports",
      disabled: true,
    },
  ];

  function isActive(path: string) {
    return location.pathname === path;
  }

  function handleLogout() {
    if (isAdminView) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    localStorage.removeItem("ps_token");
    localStorage.removeItem("ps_role");
    localStorage.removeItem("ps_dealer_id");
    localStorage.removeItem("ps_dealer_name");

    navigate("/", { replace: true });
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 px-5 py-6 fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
          <img
            src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
            alt="PawnSecure"
            className="w-10 h-10 bg-white rounded-lg p-1 object-contain"
          />
        </div>

        <div>
          <h1 className="text-xl font-bold text-purple-700">
            PawnSecure
          </h1>
          <p className="text-xs text-gray-500">
            {isAdminView ? "Admin Preview" : "Dealer Portal"}
          </p>
        </div>
      </div>

      {/* Admin View Banner */}
      {isAdminView && (
        <div className="mb-5 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm font-semibold">
          Viewing dealer dashboard as Admin
        </div>
      )}

      {/* Navigation */}
      <nav className="space-y-3">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const disabled = item.disabled || (isAdminView && item.path !== "/dealer/dashboard");

          return (
            <button
              key={item.path}
              onClick={() => {
                if (disabled) return;
                navigate(item.path);
              }}
              disabled={disabled}
              className={`w-full px-4 py-3.5 rounded-xl flex items-center gap-3 font-semibold text-sm transition ${
                active && !disabled
                  ? "bg-purple-600 text-white shadow-md shadow-purple-100"
                  : disabled
                  ? "text-gray-300 bg-gray-50 cursor-not-allowed opacity-70"
                  : "text-gray-600 hover:bg-gray-100 cursor-pointer"
              }`}
              title={disabled ? "This feature is currently disabled" : item.label}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full mt-8 bg-red-50 text-red-600 px-4 py-3.5 rounded-xl flex items-center gap-3 hover:bg-red-100 cursor-pointer font-semibold text-sm transition"
        >
          <FaSignOutAlt className="text-lg" />
          <span>{isAdminView ? "Back to Admin" : "Logout"}</span>
        </button>
      </nav>
    </aside>
  );
}