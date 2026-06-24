import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import DealerSidebar from "../dealer/DealerSidebar";
import MobileDealerSidebar from "../dealer/MobileDealerSidebar";
import DealerMobileBottomNav from "../dealer/DealerMobileBottomNav";
import {
  FaUserPlus,
  FaSignOutAlt,
  FaUserCheck,
  FaLock,
  FaUserFriends,
} from "react-icons/fa";

type ActionItem = {
  icon: ReactNode;
  label: string;
  color: string;
  bg: string;
  path: string;
  state?: any;
};

const partialActions: ActionItem[] = [
  {
    icon: <FaUserPlus />,
    label: "Register Customer",
    color: "text-blue-600",
    bg: "bg-blue-100",
    path: "/dealer/customer-register",
    state: { mode: "CUSTOMER_REVIEW" },
  },
  {
    icon: <FaUserCheck />,
    label: "Check Customer Review",
    color: "text-orange-600",
    bg: "bg-orange-100",
    path: "/dealer/customer-search",
    state: { mode: "RENEWAL_EXTEND" },
  },
  {
    icon: <FaUserFriends />,
    label: "View Registered Customers",
    color: "text-purple-600",
    bg: "bg-purple-100",
    path: "/dealer/customers",
  },
];

export default function DealerPartialDashboard() {
  const navigate = useNavigate();

  const query = new URLSearchParams(window.location.search);
  const isAdminView = query.get("adminView") === "true";

  const dealerName =
    query.get("dealerName") ||
    localStorage.getItem("ps_dealer_name") ||
    "Dealer";

  const dealerId =
    query.get("dealerId") || localStorage.getItem("ps_dealer_id") || "-";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  /*
   * Important:
   * Force dashboard control as PARTIALITY when this page opens.
   * This ensures DealerSidebar, MobileDealerSidebar and BottomNav show only partiality menus.
   */
  useEffect(() => {
    const previousDashboardControl = localStorage.getItem("ps_dashboard_control");

    localStorage.setItem("ps_dashboard_control", "PARTIALITY");

    return () => {
      /*
       * Restore previous value only for admin preview.
       * For dealer login, keep PARTIALITY because this is their assigned dashboard.
       */
      if (isAdminView) {
        if (previousDashboardControl) {
          localStorage.setItem("ps_dashboard_control", previousDashboardControl);
        } else {
          localStorage.removeItem("ps_dashboard_control");
        }
      }
    };
  }, [isAdminView]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const todayDate = currentDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const todayDay = currentDate.toLocaleDateString("en-IN", {
    weekday: "long",
  });

  function getGreeting() {
    const hour = currentDate.getHours();

    if (hour >= 0 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    if (hour >= 18 && hour < 21) return "Good Evening";
    return "Good Night";
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word: string) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getDealerIdDisplay(id: string | null) {
    if (!id || id === "-") return "-";
    return id.startsWith("DP") ? id : `DP${id}`;
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
    localStorage.removeItem("ps_dashboard_control");

    navigate("/", { replace: true });
  }

  function handleActionNavigation(path: string, state?: any) {
    if (isAdminView) return;

    if (state) {
      navigate(path, { state });
      return;
    }

    navigate(path);
  }

  const dealerIdDisplay = getDealerIdDisplay(dealerId);

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* ================= DESKTOP / LAPTOP VIEW ================= */}
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={isAdminView} />

        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isAdminView
                  ? "Dealer Partial Dashboard Preview"
                  : "Dashboard"}
              </h2>
              <p className="text-xs text-gray-500">
                {isAdminView
                  ? "Admin is viewing this dealer partial dashboard"
                  : "Limited access dashboard"}
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-gray-800">
                  {todayDate}
                </p>
                <span className="text-xs text-gray-400">{todayDay}</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold"
                >
                  {getInitials(dealerName)}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-bold text-gray-800">
                        {dealerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Dealer ID: {dealerIdDisplay}
                      </p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition"
                    >
                      <FaSignOutAlt className="text-base" />
                      <span>{isAdminView ? "Back to Admin" : "Logout"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="p-5 xl:p-6 max-w-[1400px] w-full mx-auto flex-1">
            {/* Banner Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
              <div className="lg:col-span-12 bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-8 py-5">
                <div className="grid grid-cols-12 items-center gap-6 w-full">
                  <div className="col-span-5 min-w-0">
                    <p className="text-sm opacity-90">{getGreeting()} 👋</p>
                    <h1 className="text-2xl font-bold mt-1 truncate">
                      {dealerName}
                    </h1>
                    <p className="text-sm opacity-80 mt-2">
                      Partiality dashboard access enabled.
                    </p>
                  </div>

                  <div className="col-span-2 flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                    <span className="opacity-70">DEALER ID</span>
                    <span className="bg-white/20 px-2.5 py-1 rounded-md font-semibold">
                      {dealerIdDisplay}
                    </span>
                  </div>

                  <div className="col-span-3 flex items-center justify-center gap-1 text-sm whitespace-nowrap">
                    <span className="font-semibold">{todayDate}</span>
                    <span className="opacity-70">({todayDay})</span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2 text-sm whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                    <span className="font-semibold">Partiality</span>
                    <span className="opacity-70">(Limited)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Partial Access Info */}
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-5 py-4 rounded-2xl text-sm mb-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center shrink-0">
                <FaLock />
              </div>

              <div>
                <p className="font-bold">Limited Dashboard Access</p>
                <p className="text-xs mt-1 text-yellow-800">
                  This account can access customer registration, customer review,
                  and registered customer list modules.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Available Actions
                </h2>
              </div>

              {isAdminView && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
                  Quick actions are disabled in Admin View.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {partialActions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleActionNavigation(item.path, item.state)
                    }
                    disabled={isAdminView}
                    className={`border border-gray-100 rounded-2xl p-6 transition text-center min-h-[140px] flex flex-col items-center justify-center ${
                      isAdminView
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-purple-400 hover:bg-purple-50"
                    }`}
                  >
                    <div
                      className={`${item.bg} ${item.color} w-14 h-14 rounded-full mx-auto flex items-center justify-center text-xl mb-3 shrink-0`}
                    >
                      {item.icon}
                    </div>

                    <p className="text-sm font-bold text-gray-800 leading-tight">
                      {item.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Hidden Modules Notice */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Dashboard Modules
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Full dashboard metrics, girvi management, due collections,
                overdue accounts, live metal rates and activity logs are not
                available in Partiality view.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="lg:hidden min-h-screen bg-[#f4f5f7]">
        <MobileDealerSidebar
          open={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
          isAdminView={isAdminView}
          dealerName={dealerName}
          dealerId={dealerId}
        />

        <div className="max-w-md mx-auto px-0 pb-32">
          <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[28px] px-5 py-5 relative overflow-visible shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAdminView) {
                        navigate("/admin/dashboard");
                        return;
                      }

                      setShowMobileSidebar(true);
                    }}
                    className="text-2xl hover:bg-white/10 p-1 rounded-lg transition"
                  >
                    {isAdminView ? "←" : "☰"}
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-purple-700 font-bold shrink-0">
                    <img
                      src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
                      alt="PawnSecure"
                      className="w-7 h-7 bg-white rounded-lg p-0.5"
                    />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold leading-tight">
                      PawnSecure
                    </h2>
                    <p className="text-[10px] opacity-80 mt-0.5">
                      {isAdminView ? "Admin Preview" : "Partiality Dashboard"}
                    </p>
                  </div>
                </div>

                <p className="text-sm opacity-90">{getGreeting()} 👋</p>
                <h1 className="text-xl font-bold mt-1 truncate pr-2">
                  {dealerName}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="inline-block bg-white/20 px-3 py-1 rounded-md text-xs">
                    ID: {dealerIdDisplay}
                  </p>

                  <span className="inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-md text-xs font-bold">
                    Partiality
                  </span>

                  {isAdminView && (
                    <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-md text-xs font-bold">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex justify-end gap-4 mb-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold"
                    >
                      {getInitials(dealerName)}
                    </button>

                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden text-left">
                        <div className="px-4 py-3 border-b">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {dealerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {dealerIdDisplay}
                          </p>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition"
                        >
                          <FaSignOutAlt className="text-base" />
                          <span>
                            {isAdminView ? "Back to Admin" : "Logout"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm font-bold">
                  {todayDate.split(" ")[0]} {todayDate.split(" ")[1]}
                </p>
                <p className="text-xs opacity-80">{todayDay}</p>
              </div>
            </div>
          </div>

          <div className="mx-4 mt-5 bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-2xl text-xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center shrink-0">
              <FaLock />
            </div>

            <div>
              <p className="font-bold">Limited Access</p>
              <p className="mt-1">
                Customer registration, customer review, and registered customer
                list are available.
              </p>
            </div>
          </div>

          <div className="mt-5 px-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Available Actions
              </h2>
            </div>

            {isAdminView && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-xs">
                Disabled in Admin View.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {partialActions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleActionNavigation(item.path, item.state)}
                  disabled={isAdminView}
                  className={`bg-white rounded-2xl min-h-[96px] p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center transition ${
                    isAdminView
                      ? "opacity-50 cursor-not-allowed"
                      : "active:bg-gray-50 hover:border-purple-200"
                  }`}
                >
                  <div
                    className={`${item.bg} ${item.color} w-12 h-12 rounded-full flex items-center justify-center text-lg mb-2 shrink-0`}
                  >
                    {item.icon}
                  </div>

                  <p className="text-[12px] font-bold text-gray-800 leading-tight">
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mx-4 mt-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-900">
              Hidden Modules
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Girvi management, collections, overdue accounts, live rates,
              dashboard metrics and activity logs are hidden in Partiality view.
            </p>
          </div>
        </div>

        <DealerMobileBottomNav active="home" isAdminView={isAdminView} />
      </div>
    </div>
  );
}