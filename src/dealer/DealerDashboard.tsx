import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRupeeSign,
  FaUserFriends,
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaSearch,
  FaSync,
  FaBox,
  FaChartBar,
  FaPrint,
  FaEllipsisH,
  FaBell,
  FaHome,
  FaCoins,
} from "react-icons/fa";

const stats = [
  {
    title: "Today's Pledges",
    value: "₹1,25,000",
    subtitle: "4 Transactions",
    icon: <FaRupeeSign />,
    iconBg: "bg-purple-600",
    cardBg: "bg-white",
  },
  {
    title: "Active Accounts",
    value: "128",
    subtitle: "View all",
    icon: <FaUserFriends />,
    iconBg: "bg-blue-500",
    cardBg: "bg-white",
  },
  {
    title: "Due Today",
    value: "17",
    subtitle: "₹45,600",
    icon: <FaCalendarAlt />,
    iconBg: "bg-orange-500",
    cardBg: "bg-orange-50",
  },
  {
    title: "Overdue Accounts",
    value: "9",
    subtitle: "₹32,750",
    icon: <FaClock />,
    iconBg: "bg-red-500",
    cardBg: "bg-red-50",
  },
];

const actions = [
  {
    icon: <FaPlus />,
    label: "New Girvi",
    color: "text-purple-600",
    bg: "bg-purple-100",
    path: "/dealer/new-girvi",
  },
  {
    icon: <FaSearch />,
    label: "Customer Search",
    color: "text-blue-600",
    bg: "bg-blue-100",
    path: "/dealer/customer-search",
  },
  {
    icon: <FaRupeeSign />,
    label: "Due Collections",
    color: "text-green-600",
    bg: "bg-green-100",
    path: "/dealer/collections",
  },
  {
    icon: <FaSync />,
    label: "Renewal / Extend",
    color: "text-orange-600",
    bg: "bg-orange-100",
    path: "/dealer/renewal",
  },
  {
    icon: <FaBox />,
    label: "Partial Release",
    color: "text-red-600",
    bg: "bg-red-100",
    path: "/dealer/partial-release",
  },
  {
    icon: <FaChartBar />,
    label: "Reports",
    color: "text-teal-600",
    bg: "bg-teal-100",
    path: "/dealer/reports",
  },
  {
    icon: <FaPrint />,
    label: "Print Receipt",
    color: "text-indigo-600",
    bg: "bg-indigo-100",
    path: "/dealer/print-receipt",
  },
  {
    icon: <FaEllipsisH />,
    label: "More Options",
    color: "text-gray-600",
    bg: "bg-gray-100",
    path: "/dealer/more",
  },
];

const activities = [
  {
    title: "New Girvi Created",
    name: "Ramesh Kumar",
    amount: "₹65,000",
    time: "10:30 AM",
    icon: <FaCalendarAlt />,
    bg: "bg-green-100",
    color: "text-green-600",
  },
  {
    title: "Payment Received",
    name: "Suresh Babu (A-00124)",
    amount: "₹8,500",
    time: "11:15 AM",
    icon: <FaRupeeSign />,
    bg: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    title: "Account Renewed",
    name: "Lakshmi Devi (A-00118)",
    amount: "₹12,300",
    time: "12:05 PM",
    icon: <FaCalendarAlt />,
    bg: "bg-orange-100",
    color: "text-orange-600",
  },
];

export default function DealerDashboard() {
  const navigate = useNavigate();

  // ✅ Admin preview support using query params
  const query = new URLSearchParams(window.location.search);
  const isAdminView = query.get("adminView") === "true";

  const dealerName =
    query.get("dealerName") ||
    localStorage.getItem("ps_dealer_name") ||
    "Dealer";

  const dealerId =
    query.get("dealerId") ||
    localStorage.getItem("ps_dealer_id") ||
    "-";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentDate.getHours();

    if (hour >= 0 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    if (hour >= 18 && hour < 21) return "Good Evening";

    return "Good Night";
  };

  const todayDate = currentDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const todayDay = currentDate.toLocaleDateString("en-IN", {
    weekday: "long",
  });

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getDealerIdDisplay(id: string) {
    if (!id || id === "-") return "-";
    return id.startsWith("DP") ? id : `DP${id}`;
  }

  function handleLogout() {
    // ✅ If admin is previewing dealer dashboard, go back to admin dashboard
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

  function handleActionNavigation(path: string) {
    // ✅ In admin preview, avoid moving admin into dealer flow
    if (isAdminView) {
      return;
    }

    navigate(path);
  }

  const dealerIdDisplay = getDealerIdDisplay(dealerId);

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* ================= DESKTOP / LAPTOP VIEW ================= */}
      <div className="hidden lg:flex min-h-screen">
        {/* LEFT SIDEBAR */}
        <aside className="w-64 bg-white border-r border-gray-200 px-5 py-6 fixed left-0 top-0 bottom-0">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <img
                src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
                alt="PawnSecure"
                className="w-10 h-10 bg-white rounded-lg p-1"
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

          {isAdminView && (
            <div className="mb-5 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm font-semibold">
              Viewing dealer dashboard as Admin
            </div>
          )}

          <nav className="space-y-2">
            <button
              onClick={() =>
                isAdminView
                  ? navigate("/admin/dashboard")
                  : navigate("/dealer/dashboard")
              }
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl flex items-center gap-3 font-semibold"
            >
              <FaHome />
              {isAdminView ? "Back to Admin" : "Dashboard"}
            </button>

            <button
              onClick={() => handleActionNavigation("/dealer/customer-search")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold ${
                isAdminView
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 cursor-pointer"
              }`}
            >
              <FaUserFriends />
              Customers
            </button>

            <button
              onClick={() => handleActionNavigation("/dealer/new-girvi")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold ${
                isAdminView
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 cursor-pointer"
              }`}
            >
              <FaRupeeSign />
              Girvi
            </button>

            <button
              onClick={() => handleActionNavigation("/dealer/collections")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold ${
                isAdminView
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 cursor-pointer"
              }`}
            >
              <FaCoins />
              Collections
            </button>

            <button
              onClick={() => handleActionNavigation("/dealer/reports")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold ${
                isAdminView
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 cursor-pointer"
              }`}
            >
              <FaChartBar />
              Reports
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-red-50 cursor-pointer font-semibold mt-8"
            >
              {isAdminView ? "Back to Admin" : "Logout"}
            </button>
          </nav>
        </aside>

        {/* DESKTOP MAIN */}
        <main className="ml-64 flex-1">
          {/* TOP BAR */}
          <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isAdminView ? "Dealer Dashboard Preview" : "Dashboard"}
              </h2>
              <p className="text-xs text-gray-500">
                {isAdminView
                  ? "Admin is viewing this dealer dashboard"
                  : "Welcome back to your dealer dashboard"}
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-xs text-gray-500">Today</p>
                <p className="text-sm font-semibold text-gray-800">
                  {todayDate}
                </p>
              </div>

              <div className="relative">
                <FaBell className="text-purple-700 text-xl" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full px-1">
                  5
                </span>
              </div>

              {/* ✅ Dynamic profile avatar */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold"
                >
                  {getInitials(dealerName)}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
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
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold"
                    >
                      {isAdminView ? "Back to Admin" : "Logout"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* DESKTOP HERO */}
            <div className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-8 bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl p-8">
                <p className="text-sm opacity-90">{getGreeting()} 👋</p>

                <h1 className="text-3xl font-bold mt-2">{dealerName}</h1>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="inline-block bg-white/20 px-3 py-1 rounded-md text-sm">
                    Dealer ID: {dealerIdDisplay}
                  </p>

                  {isAdminView && (
                    <span className="inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-md text-xs font-bold">
                      Admin View
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div>
                    <p className="text-sm opacity-80">Today</p>
                    <h3 className="text-xl font-bold">{todayDate}</h3>
                    <p className="text-sm opacity-80">{todayDay}</p>
                  </div>

                  <div>
                    <p className="text-sm opacity-80">Shop Status</p>
                    <h3 className="text-xl font-bold">Active</h3>
                    <p className="text-sm opacity-80">Open for business</p>
                  </div>

                  {/* <div>
                    <p className="text-sm opacity-80">Notifications</p>
                    <h3 className="text-xl font-bold">5 New</h3>
                    <p className="text-sm opacity-80">Need attention</p>
                  </div> */}
                </div>
              </div>

              <div className="col-span-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Active Loan Value
                </p>

                <h2 className="text-4xl font-bold text-gray-900 mt-3">
                  ₹42.8L
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Across 128 active accounts
                </p>

                <div className="mt-6 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold">
                  +12.5% from last month
                </div>
              </div>
            </div>

            {/* DESKTOP STATS */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              {stats.map((item, index) => (
                <div
                  key={index}
                  className={`${item.cardBg} rounded-2xl p-5 shadow-sm border border-gray-100`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`${item.iconBg} text-white w-12 h-12 rounded-full flex items-center justify-center text-lg`}
                    >
                      {item.icon}
                    </div>

                    <span className="text-xs text-gray-400">View</span>
                  </div>

                  <p className="text-sm font-semibold text-gray-600 mt-5">
                    {item.title}
                  </p>

                  <h2 className="text-2xl font-bold mt-2">{item.value}</h2>

                  <p className="text-xs text-gray-500 mt-1">
                    {item.subtitle}
                  </p>
                </div>
              ))}
            </div>

            {/* DESKTOP CONTENT */}
            <div className="grid grid-cols-12 gap-6">
              {/* ACTIVITY */}
              <div className="col-span-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Today's Activity
                  </h2>

                  <button className="text-purple-700 font-semibold text-sm">
                    View All
                  </button>
                </div>

                <div className="space-y-5">
                  {activities.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b last:border-0 pb-5 last:pb-0"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`${item.bg} ${item.color} w-12 h-12 rounded-full flex items-center justify-center`}
                        >
                          {item.icon}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.title}
                          </p>
                          <p className="text-sm text-gray-500">{item.name}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-green-600 font-bold text-lg">
                          {item.amount}
                        </p>
                        <p className="text-sm text-gray-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Quick Actions
                  </h2>

                  <button className="text-purple-700 text-sm border border-purple-200 px-3 py-1 rounded-full">
                    Customize
                  </button>
                </div>

                {isAdminView && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
                    Quick actions are disabled in Admin View.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {actions.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleActionNavigation(item.path)}
                      disabled={isAdminView}
                      className={`border border-gray-100 rounded-2xl p-4 transition text-center ${
                        isAdminView
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:border-purple-400 hover:bg-purple-50"
                      }`}
                    >
                      <div
                        className={`${item.bg} ${item.color} w-11 h-11 rounded-full mx-auto flex items-center justify-center text-lg mb-2`}
                      >
                        {item.icon}
                      </div>

                      <p className="text-sm font-semibold text-gray-800">
                        {item.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="lg:hidden">
        <div className="max-w-7xl mx-auto px-0 sm:px-4 pb-24">
          {/* MOBILE HEADER */}
          <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] px-5 py-8 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() =>
                      isAdminView
                        ? navigate("/admin/dashboard")
                        : navigate("/dealer/dashboard")
                    }
                    className="text-2xl"
                  >
                    {isAdminView ? "←" : "☰"}
                  </button>

                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-purple-700 font-bold">
                    <img
                      src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
                      alt="PawnSecure"
                      className="w-10 h-10 bg-white rounded-lg p-1"
                    />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">PawnSecure</h2>
                    <p className="text-xs opacity-80">
                      {isAdminView
                        ? "Admin Preview"
                        : "Trusted Records • Secure Connections"}
                    </p>
                  </div>
                </div>

                <p className="text-sm opacity-90">{getGreeting()} 👋</p>

                <h1 className="text-2xl font-bold mt-1">{dealerName}</h1>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="inline-block bg-white/20 px-3 py-1 rounded-md text-sm">
                    Dealer ID: {dealerIdDisplay}
                  </p>

                  {isAdminView && (
                    <span className="inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-md text-xs font-bold">
                      Admin View
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="flex justify-end gap-4 mb-5">
                  <div className="relative">
                    <FaBell className="text-2xl" />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                      5
                    </span>
                  </div>

                  {/* ✅ Mobile profile avatar */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold"
                    >
                      {getInitials(dealerName)}
                    </button>

                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden text-left">
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
                          className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold"
                        >
                          {isAdminView ? "Back to Admin" : "Logout"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm">Today</p>
                <p className="text-lg font-bold">{todayDate}</p>
                <p className="text-sm opacity-80">{todayDay}</p>
              </div>
            </div>
          </div>

          {/* MOBILE STATS */}
          <div className="grid grid-cols-2 gap-4 -mt-6 relative z-10 px-2">
            {stats.map((item, index) => (
              <div
                key={index}
                className={`${item.cardBg} rounded-2xl p-4 shadow-sm border border-gray-100 min-h-[130px]`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`${item.iconBg} text-white w-11 h-11 rounded-full flex items-center justify-center text-lg`}
                  >
                    {item.icon}
                  </div>

                  <p className="text-sm font-semibold text-gray-700">
                    {item.title}
                  </p>
                </div>

                <h2 className="text-xl font-bold mt-4">{item.value}</h2>

                <p className="text-xs text-gray-500 mt-1">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>

          {/* MOBILE QUICK ACTIONS */}
          <div className="mt-7 px-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Quick Actions</h2>

              <button className="text-purple-700 text-sm border border-purple-300 px-3 py-1 rounded-lg">
                Customize
              </button>
            </div>

            {isAdminView && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
                Quick actions are disabled in Admin View.
              </div>
            )}

            <div className="grid grid-cols-4 gap-3">
              {actions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleActionNavigation(item.path)}
                  disabled={isAdminView}
                  className={`bg-white rounded-xl min-h-[95px] p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center ${
                    isAdminView ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div
                    className={`${item.bg} ${item.color} w-11 h-11 rounded-full flex items-center justify-center text-lg mb-2`}
                  >
                    {item.icon}
                  </div>

                  <p className="text-xs font-semibold text-gray-800">
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* MOBILE ACTIVITY */}
          <div className="mx-2 mt-7 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Today's Activity</h2>

              <button className="text-purple-700 font-semibold text-sm">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {activities.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`${item.bg} ${item.color} w-11 h-11 rounded-full flex items-center justify-center`}
                    >
                      {item.icon}
                    </div>

                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-green-600 font-bold text-sm">
                      {item.amount}
                    </p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MOBILE BOTTOM NAV */}
        {!isAdminView && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-3 z-50">
            <button
              onClick={() => navigate("/dealer/dashboard")}
              className="text-purple-700 flex flex-col items-center text-xs font-semibold"
            >
              <FaHome className="text-xl mb-1" />
              Dashboard
            </button>

            <button
              onClick={() => navigate("/dealer/customer-search")}
              className="text-gray-500 flex flex-col items-center text-xs"
            >
              <FaUserFriends className="text-xl mb-1" />
              Customers
            </button>

            <button
              onClick={() => navigate("/dealer/new-girvi")}
              className="text-gray-500 flex flex-col items-center text-xs"
            >
              <FaRupeeSign className="text-xl mb-1" />
              Girvi
            </button>

            <button
              onClick={() => navigate("/dealer/collections")}
              className="text-gray-500 flex flex-col items-center text-xs"
            >
              <FaCoins className="text-xl mb-1" />
              Collections
            </button>

            <button
              onClick={() => navigate("/dealer/more")}
              className="text-gray-500 flex flex-col items-center text-xs"
            >
              <FaEllipsisH className="text-xl mb-1" />
              More
            </button>
          </div>
        )}

        {isAdminView && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t p-3 z-50">
            <button
              onClick={() => navigate("/admin/dashboard", { replace: true })}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold"
            >
              Back to Admin Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}