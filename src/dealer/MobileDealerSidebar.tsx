import {
  FaHome,
  FaRupeeSign,
  FaUserFriends,
  FaUserPlus,
  FaCoins,
  FaEye,
  FaUserCheck,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

type MobileDealerSidebarProps = {
  open: boolean;
  onClose: () => void;
  isAdminView?: boolean;
  dealerName: string;
  dealerId: string;
};

export default function MobileDealerSidebar({
  open,
  onClose,
  isAdminView = false,
  dealerName,
  dealerId,
}: MobileDealerSidebarProps) {
  const navigate = useNavigate();

  if (!open) return null;

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getDealerIdDisplay(id: string | null) {
    if (!id || id === "-") return "-";
    return id.startsWith("DP") ? id : `DP${id}`;
  }

  function goTo(path: string, state?: any) {
    if (isAdminView) return;

    onClose();

    if (state) {
      navigate(path, { state });
    } else {
      navigate(path);
    }
  }

  function handleLogout() {
    onClose();

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

  const menuItems = [
    {
      label: "Dashboard",
      icon: <FaHome />,
      path: "/dealer/dashboard",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      label: "View Girvi",
      icon: <FaEye />,
      path: "/dealer/customer",
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
    {
      label: "Register Customer",
      icon: <FaUserPlus />,
      path: "/dealer/customer-register",
      state: { mode: "CUSTOMER_REVIEW" },
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "View Customers",
      icon: <FaUserFriends />,
      path: "/dealer/customers",
      color: "text-red-600",
      bg: "bg-red-100",
    },
    {
      label: "Due Collections",
      icon: <FaCoins />,
      path: "/dealer/collections",
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Customer Review",
      icon: <FaUserCheck />,
      path: "/dealer/customer-search",
      state: { mode: "RENEWAL_EXTEND" },
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  return (
    <div className="fixed inset-0 z-[999] lg:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white px-5 pt-6 pb-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
          >
            <FaTimes />
          </button>

          <div className="flex items-center gap-3">
            <img
            src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
            alt="PawnSecure"
            className="w-10 h-10 bg-white rounded-lg p-1 object-contain"
          />
            <div>
              <h2 className="text-lg font-extrabold leading-tight">
                PawnSecure
              </h2>
              <p className="text-xs opacity-80">Dealer Panel</p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
              {getInitials(dealerName)}
            </div>

            <div className="min-w-0">
              <p className="font-bold truncate">{dealerName}</p>
              <p className="text-xs opacity-80">
                Dealer ID: {getDealerIdDisplay(dealerId)}
              </p>
            </div>
          </div>

          {isAdminView && (
            <div className="mt-4 bg-yellow-300 text-yellow-900 px-3 py-1.5 rounded-lg text-xs font-bold inline-block">
              Admin Preview Mode
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Main Menu
          </p>

          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={isAdminView}
                onClick={() => goTo(item.path, item.state)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition text-left ${
                  isAdminView
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-purple-50 active:bg-purple-100"
                }`}
              >
                <span
                  className={`${item.bg} ${item.color} w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0`}
                >
                  {item.icon}
                </span>

                <span className="font-bold text-sm text-gray-800">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-2xl font-bold transition"
          >
            <FaSignOutAlt />
            {isAdminView ? "Back to Admin" : "Logout"}
          </button>
        </div>
      </aside>
    </div>
  );
}