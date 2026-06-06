import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRupeeSign,
  FaUserFriends,
  FaUserPlus,
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaUserCheck,
  FaBox,
  FaChartBar,
  FaPrint,
  FaEllipsisH,
  FaHome,
  FaCoins,
  FaSyncAlt,
  FaArrowUp,
  FaArrowDown,
  FaGem,
} from "react-icons/fa";

// Keep static config lists outside the component definition
const metalRates = [
  {
    title: "GOLD 24K (999)",
    value: "₹ 9,875",
    unit: "/gram",
    change: "+45 (0.46%) Today",
    isUp: true,
    cardBg: "bg-[#fffbeb] border-[#fde68a]", // Amber tint
    iconBg: "bg-[#fef3c7] text-[#b45309]",
    icon: <FaCoins />,
  },
  {
    title: "GOLD 22K (916)",
    value: "₹ 9,050",
    unit: "/gram",
    change: "+40 (0.44%) Today",
    isUp: true,
    cardBg: "bg-[#fffdf5] border-[#fef08a]", // Light gold tint
    iconBg: "bg-[#fef9c3] text-[#a16207]",
    icon: <FaGem />,
  },
  {
    title: "SILVER",
    value: "₹ 112",
    unit: "/gram",
    change: "-1 (0.88%) Today",
    isUp: false,
    cardBg: "bg-[#f8fafc] border-[#e2e8f0]", // Slate grey tint
    iconBg: "bg-[#f1f5f9] text-[#475569]",
    icon: <FaCoins />,
  },
];

const actions = [
  {
    icon: <FaPlus />,
    label: "New Girvi",
    color: "text-purple-600",
    bg: "bg-purple-100",
    path: "/dealer/customer",
  },
  {
    icon: <FaUserPlus />,
    label: "Register Customer",
    color: "text-blue-600",
    bg: "bg-blue-100",
    path: "/dealer/customer-register",
    state: { mode: "CUSTOMER_REVIEW" },
  },
  {
    icon: <FaRupeeSign />,
    label: "Due Collections",
    color: "text-green-600",
    bg: "bg-green-100",
    path: "/dealer/collections",
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

  // 1. STATE FOR DYNAMIC SUMMARY DASHBOARD METRICS
  const [metrics, setMetrics] = useState({
    activeCustomers: 0,
    todayPledges: "₹0",
    dueToday: 0,
    overdueAccounts: 0,
    totalLoanValue: "₹0"
  });

  // 2. FETCH DASHBOARD SUMMARY DATA FROM BACKEND
  useEffect(() => {
    async function fetchDashboardSummary() {
      if (!dealerId || dealerId === "-") return;
      try {
        const token = localStorage.getItem("ps_token");
        const res = await fetch(`https://pawnsecure-1.onrender.com/api/dealer/dashboard-summary`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "X-DEALER-ID": dealerId
          }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics({
            activeCustomers: data.activeCustomers || 0,
            todayPledges: data.todayPledges || "₹0",
            dueToday: data.dueToday || 0,
            overdueAccounts: data.overdueAccounts || 0,
            totalLoanValue: data.totalLoanValue || "₹0"
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics data", err);
      }
    }

    fetchDashboardSummary();

    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [dealerId]);

  // 3. GENERATE DYNAMIC STATS ARRAY FROM STATE
  const stats = [
    {
      title: "Today's Pledges",
      value: metrics.todayPledges,
      subtitle: "Dynamic Transactions",
      icon: <FaRupeeSign />,
      iconBg: "bg-purple-600",
      cardBg: "bg-white",
    },
    {
      title: "Active Customers",
      value: metrics.activeCustomers.toString(),
      subtitle: "View all",
      icon: <FaUserFriends />,
      iconBg: "bg-blue-500",
      cardBg: "bg-white",
      path: "/dealer/customers",
    },
    {
      title: "Due Today",
      value: metrics.dueToday.toString(),
      subtitle: "Pending actions",
      icon: <FaCalendarAlt />,
      iconBg: "bg-orange-500",
      cardBg: "bg-orange-50",
    },
    {
      title: "Overdue Accounts",
      value: metrics.overdueAccounts.toString(),
      subtitle: "Immediate collection",
      icon: <FaClock />,
      iconBg: "bg-red-500",
      cardBg: "bg-red-50",
    },
  ];

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
    navigate("/", { replace: true });
  }

  function handleActionNavigation(path: string, state?: any) {
    if (isAdminView) return;
    navigate(path, state ? { state } : undefined);
  }

  const dealerIdDisplay = getDealerIdDisplay(dealerId);

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* ================= DESKTOP / LAPTOP VIEW ================= */}
      <div className="hidden lg:flex min-h-screen">
        <aside className="w-64 bg-white border-r border-gray-200 px-5 py-6 fixed left-0 top-0 bottom-0 z-40">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <img
                src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
                alt="PawnSecure"
                className="w-10 h-10 bg-white rounded-lg p-1"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-purple-700">PawnSecure</h1>
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
              onClick={() => isAdminView ? navigate("/admin/dashboard") : navigate("/dealer/dashboard")}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl flex items-center gap-3 font-semibold"
            >
              <FaHome /> {isAdminView ? "Back to Admin" : "Dashboard"}
            </button>
            <button
              onClick={() => handleActionNavigation("/dealer/customer-search", { mode: "CUSTOMER_REVIEW" })}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold ${isAdminView ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 cursor-pointer"}`}
            >
              <FaUserFriends /> Customers
            </button>
            <button
              onClick={() => handleActionNavigation("/dealer/customer")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold ${isAdminView ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 cursor-pointer"}`}
            >
              <FaRupeeSign /> Girvi
            </button>
            <button
              onClick={() => handleActionNavigation("/dealer/collections")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold ${isAdminView ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 cursor-pointer"}`}
            >
              <FaCoins /> Collections
            </button>
            <button
              onClick={() => handleActionNavigation("/dealer/reports")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold ${isAdminView ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 cursor-pointer"}`}
            >
              <FaChartBar /> Reports
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-red-50 cursor-pointer font-semibold mt-8"
            >
              {isAdminView ? "Back to Admin" : "Logout"}
            </button>
          </nav>
        </aside>

        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isAdminView ? "Dealer Dashboard Preview" : "Dashboard"}
              </h2>
              <p className="text-xs text-gray-500">
                {isAdminView ? "Admin is viewing this dealer dashboard" : "Welcome back to your dealer dashboard"}
              </p>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{todayDate}</p>
              </div>
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
                      <p className="text-sm font-bold text-gray-800">{dealerName}</p>
                      <p className="text-xs text-gray-500">Dealer ID: {dealerIdDisplay}</p>
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
          </header>

          <div className="p-6 xl:p-8 max-w-[1400px] w-full mx-auto flex-1">
            {/* Banner Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              <div className="lg:col-span-8 bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl p-8">
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
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div>
                    <h3 className="text-xl font-bold">{todayDate}</h3>
                    <p className="text-sm opacity-80">{todayDay}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Shop Status</p>
                    <h3 className="text-xl font-bold">Active</h3>
                    <p className="text-sm opacity-80">Open for business</p>
                  </div>
                </div>
              </div>

              {/* DYNAMIC TOTAL LOAN CARD (DESKTOP) */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-center">
                <p className="text-sm text-gray-500">Total Active Loan Value</p>
                <h2 className="text-4xl font-bold text-gray-900 mt-3">{metrics.totalLoanValue}</h2>
                <p className="text-sm text-gray-500 mt-2">Across {metrics.activeCustomers} active Customers</p>
                <div className="mt-6 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold inline-block">
                  +12.5% from last month
                </div>
              </div>
            </div>

            {/* LIVE METAL RATES Segment */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Live Metal Rates
                  </h3>
                  <span className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse bg-green-600"></span>{" "}
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-purple-600 transition">
                  <FaSyncAlt className="text-[10px] animate-spin-slow" />
                  <span>Updated: 10:35 AM</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metalRates.map((rate, i) => (
                  <div
                    key={i}
                    className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs transition hover:shadow-md ${rate.cardBg}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${rate.iconBg}`}>
                        {rate.icon}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 tracking-wide uppercase">
                          {rate.title}
                        </p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black text-gray-900">{rate.value}</span>
                          <span className="text-xs text-gray-500 font-medium">{rate.unit}</span>
                        </div>
                        <p className={`text-xs font-semibold flex items-center gap-1 mt-1 ${rate.isUp ? "text-green-600" : "text-red-500"}`}>
                          {rate.isUp ? <FaArrowUp className="text-[10px]" /> : <FaArrowDown className="text-[10px]" />}
                          {rate.change}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General System Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((item, index) => {
                const isClickable = !!item.path && !isAdminView;

                return (
                  <div
                    key={index}
                    onClick={() => isClickable ? navigate(item.path!) : undefined}
                    className={`${item.cardBg} rounded-2xl p-5 shadow-sm border border-gray-100 transition ${
                      isClickable ? "cursor-pointer hover:shadow-md hover:border-purple-400" : "cursor-default"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`${item.iconBg} text-white w-12 h-12 rounded-full flex items-center justify-center text-lg`}>
                        {item.icon}
                      </div>
                      {isClickable && (
                        <span className="text-xs text-purple-600 font-semibold">
                          View
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-600 mt-5">
                      {item.title}
                    </p>
                    <h2 className="text-2xl font-bold mt-2">
                      {item.value}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.subtitle}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions Grid */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                <button className="text-purple-700 text-sm border border-purple-200 px-3 py-1 rounded-full hover:bg-purple-50 transition">
                  Customize
                </button>
              </div>
              {isAdminView && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
                  Quick actions are disabled in Admin View.
                </div>
              )}
              <div className="grid grid-cols-4 xl:grid-cols-8 gap-4">
                {actions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionNavigation(item.path, item.state)}
                    disabled={isAdminView}
                    className={`border border-gray-100 rounded-2xl p-4 transition text-center min-h-[110px] flex flex-col items-center justify-center ${
                      isAdminView ? "opacity-50 cursor-not-allowed" : "hover:border-purple-400 hover:bg-purple-50"
                    }`}
                  >
                    <div className={`${item.bg} ${item.color} w-11 h-11 rounded-full mx-auto flex items-center justify-center text-lg mb-2 shrink-0`}>
                      {item.icon}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Activities Table */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Today's Activity</h2>
                <button className="text-purple-700 font-semibold text-sm hover:underline">View All</button>
              </div>
              <div className="space-y-5">
                {activities.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b last:border-0 pb-5 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className={`${item.bg} ${item.color} w-12 h-12 rounded-full flex items-center justify-center shrink-0`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-bold text-lg">{item.amount}</p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="lg:hidden">
        <div className="max-w-md mx-auto px-0 pb-24">
          <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] px-5 py-8 relative overflow-hidden shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => isAdminView ? navigate("/admin/dashboard") : navigate("/dealer/dashboard")}
                    className="text-2xl hover:bg-white/10 p-1 rounded-lg transition"
                  >
                    {isAdminView ? "←" : "☰"}
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-purple-700 font-bold shrink-0">
                    <img
                      src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
                      alt="PawnSecure"
                      className="w-8 h-8 bg-white rounded-lg p-0.5"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight">PawnSecure</h2>
                    <p className="text-[10px] opacity-80 mt-0.5">
                      {isAdminView ? "Admin Preview" : "Trusted Records"}
                    </p>
                  </div>
                </div>
                <p className="text-sm opacity-90">{getGreeting()} 👋</p>
                <h1 className="text-2xl font-bold mt-1 truncate pr-2">{dealerName}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="inline-block bg-white/20 px-3 py-1 rounded-md text-xs">
                    ID: {dealerIdDisplay}
                  </p>
                  {isAdminView && (
                    <span className="inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-md text-xs font-bold">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex justify-end gap-4 mb-5">
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold"
                    >
                      {getInitials(dealerName)}
                    </button>
                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden text-left">
                        <div className="px-4 py-3 border-b">
                          <p className="text-sm font-bold text-gray-800 truncate">{dealerName}</p>
                          <p className="text-xs text-gray-500">ID: {dealerIdDisplay}</p>
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
                <p className="text-base font-bold">{todayDate.split(' ')[0]} {todayDate.split(' ')[1]}</p>
                <p className="text-xs opacity-80">{todayDay}</p>
              </div>
            </div>
          </div>

          {/* DYNAMIC AND CLICKABLE CARDS FOR MOBILE */}
          <div className="grid grid-cols-2 gap-3 -mt-6 relative z-10 px-4">
            {stats.map((item, index) => {
              const isClickable = !!item.path && !isAdminView;
              return (
                <div 
                  key={index} 
                  onClick={() => isClickable ? navigate(item.path!) : undefined}
                  className={`${item.cardBg} rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[120px] transition ${
                    isClickable ? "active:bg-gray-50 cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className={`${item.iconBg} text-white w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0`}>
                        {item.icon}
                      </div>
                      <p className="text-[11px] font-semibold text-gray-700 leading-tight">{item.title}</p>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold mt-3">{item.value}</h2>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-[10px] text-gray-500">{item.subtitle}</p>
                      {isClickable && (
                        <span className="text-[9px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                          View
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* LIVE METAL RATES Segment for Mobile Layout */}
          <div className="mt-6 px-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-gray-900">Live Rates</h2>
                <span className="flex items-center gap-0.5 bg-green-50 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-green-200">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span> Live
                </span>
              </div>
              <span className="text-[10px] text-gray-400">10:35 AM</span>
            </div>

            <div className="flex flex-col gap-3 pb-2">
              {metalRates.map((rate, i) => (
                <div
                  key={i}
                  className={`w-full border rounded-xl p-3 flex items-center justify-between shadow-xs ${rate.cardBg}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0 ${rate.iconBg}`}>
                      {rate.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 tracking-wide uppercase">
                        {rate.title}
                      </p>
                      <div className="flex items-baseline gap-0.5 mt-0.5">
                        <span className="text-lg font-black text-gray-900">{rate.value}</span>
                        <span className="text-[10px] text-gray-500">{rate.unit}</span>
                      </div>
                      <p className={`text-[10px] font-semibold flex items-center gap-0.5 ${rate.isUp ? "text-green-600" : "text-red-500"}`}>
                        {rate.isUp ? "▲" : "▼"} {rate.change.split(" ")[0]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Segment */}
          <div className="mt-4 px-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
              <button className="text-purple-700 text-xs border border-purple-200 px-3 py-1 rounded-full font-medium">
                Customize
              </button>
            </div>
            {isAdminView && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-xs">
                Disabled in Admin View.
              </div>
            )}
            
            <div className="grid grid-cols-4 gap-2">
              {actions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleActionNavigation(item.path, item.state)}
                  disabled={isAdminView}
                  className={`bg-white rounded-xl min-h-[85px] p-2 border border-gray-100 shadow-sm flex flex-col items-center justify-start text-center pt-3 ${
                    isAdminView ? "opacity-50 cursor-not-allowed" : "active:bg-gray-50"
                  }`}
                >
                  <div className={`${item.bg} ${item.color} w-10 h-10 rounded-full flex items-center justify-center text-base mb-2 shrink-0`}>
                    {item.icon}
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-800 leading-tight">
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Activities Segment */}
          <div className="mx-4 mt-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Today's Activity</h2>
              <button className="text-purple-700 font-medium text-xs">View All</button>
            </div>
            <div className="space-y-4">
              {activities.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`${item.bg} ${item.color} w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                      <p className="text-[11px] text-gray-500">{item.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-bold text-sm">{item.amount}</p>
                    <p className="text-[11px] text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Floating Controls */}
        {!isAdminView && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around py-2 px-1 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <button onClick={() => navigate("/dealer/dashboard")} className="text-purple-700 flex flex-col items-center text-[10px] font-semibold w-16">
              <FaHome className="text-xl mb-1" />
              Home
            </button>
            <button onClick={() => navigate("/dealer/customer-search", { state: { mode: "CUSTOMER_REVIEW" } })} className="text-gray-500 hover:text-gray-900 flex flex-col items-center text-[10px] font-medium w-16 text-center">
              <FaUserFriends className="text-xl mb-1" />
              Customers
            </button>
            <button onClick={() => navigate("/dealer/new-girvi")} className="text-gray-500 hover:text-gray-900 flex flex-col items-center text-[10px] font-medium w-16">
              <FaRupeeSign className="text-xl mb-1" />
              Girvi
            </button>
            <button onClick={() => navigate("/dealer/collections")} className="text-gray-500 hover:text-gray-900 flex flex-col items-center text-[10px] font-medium w-16">
              <FaCoins className="text-xl mb-1" />
              Collect
            </button>
            <button onClick={() => navigate("/dealer/more")} className="text-gray-500 hover:text-gray-900 flex flex-col items-center text-[10px] font-medium w-16">
              <FaEllipsisH className="text-xl mb-1" />
              More
            </button>
          </div>
        )}

        {isAdminView && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t p-3 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <button
              onClick={() => navigate("/admin/dashboard", { replace: true })}
              className="w-full bg-purple-600 active:bg-purple-700 text-white py-3 rounded-xl font-bold transition"
            >
              Back to Admin Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
