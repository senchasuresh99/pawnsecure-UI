import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import DealerSidebar from "../dealer/DealerSidebar";
import MobileDealerSidebar from "../dealer/MobileDealerSidebar";
import DealerMobileBottomNav from "../dealer/DealerMobileBottomNav";
import { API_BASE } from "../config/api";
import {
  FaRupeeSign,
  FaUserFriends,
  FaUserPlus,
  FaCalendarAlt,
  FaClock,
  FaCoins,
  FaSyncAlt,
  FaArrowUp,
  FaArrowDown,
  FaGem,
  FaSignOutAlt,
  FaEye,
  FaUserCheck,
} from "react-icons/fa";

const DUE_TODAY_COUNT_API = `${API_BASE}/girvi/due-today/count`;
const OVERDUE_COUNT_API = `${API_BASE}/girvi/overdue/count`;
const TODAY_GIRVI_SUMMARY_API = `${API_BASE}/girvi/today/summary`;
const TODAY_GIRVI_LIST_API = `${API_BASE}/girvi/today`;

type ActionItem = {
  icon: ReactNode;
  label: string;
  color: string;
  bg: string;
  path: string;
  state?: any;
};

type StatItem = {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  iconBg: string;
  cardBg: string;
  path?: string;
  state?: any;
};

type MetalRateApiResponse = {
  city: string;
  rateDate: string;
  gold24kRate: number;
  gold22kRate: number;
  silverRate: number;
};

type TodayGirviSummaryResponse = {
  count: number;
  totalAmount: number | string;
};

type TodayActivityItem = {
  title: string;
  name: string;
  amount: string;
  time: string;
  icon: ReactNode;
  bg: string;
  color: string;
};

const actions: ActionItem[] = [
  {
    icon: <FaEye />,
    label: "View Girvi",
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
    icon: <FaEye />,
    label: "View Customers",
    color: "text-red-600",
    bg: "bg-red-100",
    path: "/dealer/customers",
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
    query.get("dealerId") || localStorage.getItem("ps_dealer_id") || "-";

  const dealerIdForHeader = dealerId.replace(/^DP/i, "");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [metrics, setMetrics] = useState({
    todayPledges: "₹0",
    dueToday: 0,
    overdueAccounts: 0,
    totalLoanValue: "₹0",
  });

  const [activeCustomerCount, setActiveCustomerCount] =
    useState<number | string>("...");

  const [metalRateData, setMetalRateData] =
    useState<MetalRateApiResponse | null>(null);

  const [metalRateLoading, setMetalRateLoading] = useState(false);
  const [metalRateError, setMetalRateError] = useState("");

  const [todayActivities, setTodayActivities] = useState<TodayActivityItem[]>(
    []
  );
  const [todayActivityLoading, setTodayActivityLoading] = useState(false);
  const [todayActivityError, setTodayActivityError] = useState("");

  function formatCurrency(value: any) {
    const amount = Number(value || 0);
    return `₹${amount.toLocaleString("en-IN")}`;
  }

  function formatActivityTime(value: any) {
    if (!value) return "";

    const stringValue = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) return "";

    const date = new Date(stringValue);

    if (Number.isNaN(date.getTime())) return stringValue;

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getRateUpdateLabel(rateDate?: string) {
    if (!rateDate) return "Rates not available";

    const today = getTodayDateString();
    const normalizedRateDate = String(rateDate).slice(0, 10);

    if (normalizedRateDate === today) {
      return `Updated today: ${normalizedRateDate}`;
    }

    return `Latest available rate: ${normalizedRateDate}`;
  }

  async function fetchTodayMetalRates() {
    if (!dealerId || dealerId === "-") return;

    try {
      setMetalRateLoading(true);
      setMetalRateError("");

      const token = localStorage.getItem("ps_token");

      const res = await fetch(`${API_BASE}/dashboard/metal-rates`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerIdForHeader,
        },
      });

      if (!res.ok) {
        const msg = await res.text();

        console.warn("Failed to load metal rates:", msg);

        setMetalRateData(null);

        // ✅ Do not show backend JSON error in UI
        setMetalRateError("Rates not available");
        return;
      }

      const data: MetalRateApiResponse = await res.json();

      setMetalRateData(data);
      setMetalRateError("");
    } catch (err) {
      console.error("Failed to fetch metal rates", err);

      setMetalRateData(null);
      setMetalRateError("Unable to load metal rates");
    } finally {
      setMetalRateLoading(false);
    }
  }

  async function fetchGirviDueAndOverdueCounts() {
    if (!dealerId || dealerId === "-") return;

    const token = localStorage.getItem("ps_token");
    if (!token) return;

    try {
      const [dueTodayRes, overdueRes] = await Promise.all([
        fetch(DUE_TODAY_COUNT_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-DEALER-ID": dealerIdForHeader,
          },
        }),
        fetch(OVERDUE_COUNT_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-DEALER-ID": dealerIdForHeader,
          },
        }),
      ]);

      const dueTodayCount = dueTodayRes.ok ? await dueTodayRes.json() : 0;
      const overdueCount = overdueRes.ok ? await overdueRes.json() : 0;

      setMetrics((prev) => ({
        ...prev,
        dueToday: Number(dueTodayCount) || 0,
        overdueAccounts: Number(overdueCount) || 0,
      }));
    } catch (err) {
      console.error("Failed to load due/overdue girvi counts", err);

      setMetrics((prev) => ({
        ...prev,
        dueToday: 0,
        overdueAccounts: 0,
      }));
    }
  }

  async function fetchTodayGirviSummary() {
    if (!dealerId || dealerId === "-") return;

    const token = localStorage.getItem("ps_token");
    if (!token) return;

    try {
      const res = await fetch(TODAY_GIRVI_SUMMARY_API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerIdForHeader,
        },
      });

      if (!res.ok) {
        const msg = await res.text();
        console.warn("Failed to load today's girvi summary:", msg);

        setMetrics((prev) => ({
          ...prev,
          todayPledges: "₹0",
        }));
        return;
      }

      const data: TodayGirviSummaryResponse = await res.json();
      const totalAmount = Number(data.totalAmount || 0);

      setMetrics((prev) => ({
        ...prev,
        todayPledges: `₹${totalAmount.toLocaleString("en-IN")}`,
      }));
    } catch (err) {
      console.error("Failed to load today's girvi summary", err);

      setMetrics((prev) => ({
        ...prev,
        todayPledges: "₹0",
      }));
    }
  }

  async function fetchTodayGirviActivities() {
    if (!dealerId || dealerId === "-") return;

    const token = localStorage.getItem("ps_token");
    if (!token) return;

    try {
      setTodayActivityLoading(true);
      setTodayActivityError("");

      const res = await fetch(TODAY_GIRVI_LIST_API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerIdForHeader,
        },
      });

      if (!res.ok) {
        const msg = await res.text();

        console.warn("Failed to load today's girvi activities:", msg);

        setTodayActivities([]);
        setTodayActivityError("Unable to load today's activity");
        return;
      }

      const data = await res.json();

      const mappedActivities: TodayActivityItem[] = Array.isArray(data)
        ? data.map((girvi: any) => {
            const customerName =
              girvi.customerName ||
              girvi.customer?.customerName ||
              girvi.customer?.name ||
              girvi.borrowerName ||
              girvi.fullName ||
              girvi.name ||
              "Customer";

            const accountNo =
              girvi.accountNumber ||
              girvi.accountNo ||
              girvi.girviNumber ||
              girvi.girviNo ||
              girvi.girviId ||
              girvi.id ||
              "";

            const amount =
              girvi.actualLoanAmount ||
              girvi.loanAmount ||
              girvi.principalAmount ||
              girvi.totalAmount ||
              girvi.amount ||
              girvi.sanctionedAmount ||
              0;

            const createdTime =
              girvi.createdAt ||
              girvi.createdDate ||
              girvi.createdOn ||
              girvi.createdTime ||
              girvi.girviDate ||
              girvi.date ||
              "";

            return {
              title: "New Girvi Created",
              name: accountNo ? `${customerName} (${accountNo})` : customerName,
              amount: formatCurrency(girvi.actualLoanAmount),
              time: formatActivityTime(createdTime),
              icon: <FaCalendarAlt />,
              bg: "bg-green-100",
              color: "text-green-600",
            };
          })
        : [];

      setTodayActivities(mappedActivities);
    } catch (err) {
      console.error("Failed to load today's girvi activities", err);

      setTodayActivities([]);
      setTodayActivityError("Unable to load today's activity");
    } finally {
      setTodayActivityLoading(false);
    }
  }

  useEffect(() => {
    async function fetchDashboardSummary() {
      if (!dealerId || dealerId === "-") return;

      try {
        const token = localStorage.getItem("ps_token");

        const res = await fetch(`${API_BASE}/dealer/dashboard-summary`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-DEALER-ID": dealerIdForHeader,
          },
        });

        if (res.ok) {
          const data = await res.json();

          setMetrics((prev) => ({
            ...prev,
            totalLoanValue: data.totalLoanValue || "₹0",
          }));
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics data", err);
      }
    }

    async function fetchCustomerCount() {
      if (!dealerId || dealerId === "-") return;

      try {
        const token = localStorage.getItem("ps_token");

        const res = await fetch(
          `${API_BASE}/customers/allCustomer?page=0&size=1`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "X-DEALER-ID": dealerIdForHeader,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();

          if (Array.isArray(data)) {
            setActiveCustomerCount(data.length);
          } else {
            setActiveCustomerCount(data.totalElements || 0);
          }
        } else {
          setActiveCustomerCount(0);
        }
      } catch (err) {
        console.error("Failed to load true customer count", err);
        setActiveCustomerCount(0);
      }
    }

    fetchDashboardSummary();
    fetchCustomerCount();
    fetchTodayMetalRates();
    fetchGirviDueAndOverdueCounts();
    fetchTodayGirviSummary();
    fetchTodayGirviActivities();

    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [dealerId]);

  const stats: StatItem[] = [
    {
      title: "Today's Girvi",
      value: metrics.todayPledges,
      subtitle: "Dynamic Transactions",
      icon: <FaRupeeSign />,
      iconBg: "bg-purple-600",
      cardBg: "bg-white",
      path: "/dealer/today-girvi",
    },
    {
      title: "Active Customers",
      value: activeCustomerCount.toString(),
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
      path: "/dealer/due-today",
    },
    {
      title: "Overdue Accounts",
      value: metrics.overdueAccounts.toString(),
      subtitle: "Immediate collection",
      icon: <FaClock />,
      iconBg: "bg-red-500",
      cardBg: "bg-red-50",
      path: "/dealer/overdue-accounts",
    },
  ];

  const metalRates = [
    {
      title: "GOLD 24K (999)",
      value: metalRateLoading
        ? "Loading..."
        : metalRateData
        ? `₹ ${metalRateData.gold24kRate.toLocaleString("en-IN")}`
        : "₹ 0",
      unit: "/gram",
      change: metalRateData
        ? getRateUpdateLabel(metalRateData.rateDate)
        : metalRateError || "Rates not available",
      isUp: !!metalRateData,
      cardBg: "bg-[#fffbeb] border-[#fde68a]",
      iconBg: "bg-[#fef3c7] text-[#b45309]",
      icon: <FaCoins />,
    },
    {
      title: "GOLD 22K (916)",
      value: metalRateLoading
        ? "Loading..."
        : metalRateData
        ? `₹ ${metalRateData.gold22kRate.toLocaleString("en-IN")}`
        : "₹ 0",
      unit: "/gram",
      change: metalRateData
        ? getRateUpdateLabel(metalRateData.rateDate)
        : metalRateError || "Rates not available",
      isUp: !!metalRateData,
      cardBg: "bg-[#fffdf5] border-[#fef08a]",
      iconBg: "bg-[#fef9c3] text-[#a16207]",
      icon: <FaGem />,
    },
    {
      title: "SILVER",
      value: metalRateLoading
        ? "Loading..."
        : metalRateData
        ? `₹ ${metalRateData.silverRate.toLocaleString("en-IN")}`
        : "₹ 0",
      unit: "/gram",
      change: metalRateData
        ? getRateUpdateLabel(metalRateData.rateDate)
        : metalRateError || "Rates not available",
      isUp: !!metalRateData,
      cardBg: "bg-[#f8fafc] border-[#e2e8f0]",
      iconBg: "bg-[#f1f5f9] text-[#475569]",
      icon: <FaCoins />,
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

    if (state) {
      navigate(path, { state });
      return;
    }

    navigate(path);
  }

  const dealerIdDisplay = getDealerIdDisplay(dealerId);

  const mobileActions = actions.filter(
    (item) => item.label !== "Due Collections"
  );

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* ================= DESKTOP / LAPTOP VIEW ================= */}
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={isAdminView} />

        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
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
              <div className="lg:col-span-12 bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-8 py-4">
                <div className="grid grid-cols-12 items-center gap-6 w-full">
                  <div className="col-span-5 min-w-0">
                    <p className="text-sm opacity-90">{getGreeting()} 👋</p>
                    <h1 className="text-2xl font-bold mt-1 truncate">
                      {dealerName}
                    </h1>
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
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="font-semibold">Active</span>
                    <span className="opacity-70">(Open)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
              {stats.map((item, index) => {
                const isClickable = !!item.path && !isAdminView;

                return (
                  <div
                    key={index}
                    onClick={() =>
                      isClickable
                        ? navigate(item.path!, { state: item.state })
                        : undefined
                    }
                    className={`${item.cardBg} rounded-2xl p-4 shadow-sm border border-gray-100 transition ${
                      isClickable
                        ? "cursor-pointer hover:shadow-md hover:border-purple-400"
                        : "cursor-default"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`${item.iconBg} text-white w-10 h-10 rounded-full flex items-center justify-center text-base`}
                      >
                        {item.icon}
                      </div>

                      {isClickable && (
                        <span className="text-xs text-purple-600 font-semibold">
                          View
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-600 mt-4">
                      {item.title}
                    </p>
                    <h2 className="text-xl font-bold mt-1">{item.value}</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.subtitle}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Desktop Quick Actions */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Quick Actions
                </h2>
              </div>

              {isAdminView && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
                  Quick actions are disabled in Admin View.
                </div>
              )}

              <div className="grid grid-cols-5 gap-4">
                {actions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleActionNavigation(item.path, item.state)
                    }
                    disabled={isAdminView}
                    className={`border border-gray-100 rounded-2xl p-3 transition text-center min-h-[88px] flex flex-col items-center justify-center ${
                      isAdminView
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-purple-400 hover:bg-purple-50"
                    }`}
                  >
                    <div
                      className={`${item.bg} ${item.color} w-10 h-10 rounded-full mx-auto flex items-center justify-center text-base mb-2 shrink-0`}
                    >
                      {item.icon}
                    </div>

                    <p className="text-xs font-semibold text-gray-800 leading-tight">
                      {item.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Live Metal Rates
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Live Metal Rates
                  </h3>
                  <span className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>{" "}
                    Live
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fetchTodayMetalRates}
                  className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-purple-600 transition"
                >
                  <FaSyncAlt
                    className={`text-[10px] ${
                      metalRateLoading ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {metalRateData
                      ? getRateUpdateLabel(metalRateData.rateDate)
                      : metalRateLoading
                      ? "Loading rates..."
                      : "Rates unavailable"}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metalRates.map((rate, i) => (
                  <div
                    key={i}
                    className={`border rounded-2xl p-3 flex items-center justify-between shadow-xs transition hover:shadow-md ${rate.cardBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${rate.iconBg}`}
                      >
                        {rate.icon}
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 tracking-wide uppercase">
                          {rate.title}
                        </p>

                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl font-black text-gray-900">
                            {rate.value}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {rate.unit}
                          </span>
                        </div>

                        <p
                          className={`text-xs font-semibold flex items-center gap-1 mt-1 ${
                            rate.isUp ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {rate.isUp ? (
                            <FaArrowUp className="text-[10px]" />
                          ) : (
                            <FaArrowDown className="text-[10px]" />
                          )}
                          {rate.change}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Desktop Activities */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">
                  Today's Activity
                </h2>

                <button
                  type="button"
                  onClick={() => !isAdminView && navigate("/dealer/today-girvi")}
                  disabled={isAdminView}
                  className={`font-semibold text-sm ${
                    isAdminView
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-purple-700 hover:underline"
                  }`}
                >
                  View All
                </button>
              </div>

              {todayActivityLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Loading today's activity...
                </div>
              ) : todayActivityError ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  {todayActivityError}
                </div>
              ) : todayActivities.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No Girvi created today
                </div>
              ) : (
                <div className="space-y-4">
                  {todayActivities.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`${item.bg} ${item.color} w-10 h-10 rounded-full flex items-center justify-center shrink-0`}
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
                        <p className="text-green-600 font-bold text-base">
                          {item.amount}
                        </p>
                        <p className="text-sm text-gray-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      {isAdminView ? "Admin Preview" : "Trusted Records"}
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

                  {isAdminView && (
                    <span className="inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-md text-xs font-bold">
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

          <div className="grid grid-cols-2 gap-3 -mt-4 relative z-10 px-4">
            {stats.map((item, index) => {
              const isClickable = !!item.path && !isAdminView;

              return (
                <div
                  key={index}
                  onClick={() =>
                    isClickable
                      ? navigate(item.path!, { state: item.state })
                      : undefined
                  }
                  className={`${item.cardBg} rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[100px] transition ${
                    isClickable
                      ? "active:bg-gray-50 cursor-pointer"
                      : "cursor-default"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div
                        className={`${item.iconBg} text-white w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0`}
                      >
                        {item.icon}
                      </div>
                      <p className="text-[11px] font-semibold text-gray-700 leading-tight">
                        {item.title}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-bold mt-2">{item.value}</h2>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-[10px] text-gray-500">
                        {item.subtitle}
                      </p>

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

          <div className="mt-5 px-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Quick Actions
              </h2>
            </div>

            {isAdminView && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-xs">
                Disabled in Admin View.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {mobileActions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleActionNavigation(item.path, item.state)}
                  disabled={isAdminView}
                  className={`bg-white rounded-2xl min-h-[92px] p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center transition ${
                    isAdminView
                      ? "opacity-50 cursor-not-allowed"
                      : "active:bg-gray-50 hover:border-purple-200"
                  }`}
                >
                  <div
                    className={`${item.bg} ${item.color} w-10 h-10 rounded-full flex items-center justify-center text-base mb-2 shrink-0`}
                  >
                    {item.icon}
                  </div>

                  <p className="text-[11px] font-semibold text-gray-800 leading-tight">
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* <div className="mt-4 px-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-gray-900">
                  Live Rates
                </h2>
                <span className="flex items-center gap-0.5 bg-green-50 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-green-200">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>{" "}
                  Live
                </span>
              </div>

              <button
                type="button"
                onClick={fetchTodayMetalRates}
                className="text-[10px] text-gray-400 flex items-center gap-1"
              >
                <FaSyncAlt
                  className={`text-[9px] ${
                    metalRateLoading ? "animate-spin" : ""
                  }`}
                />
                {metalRateData
                  ? getRateUpdateLabel(metalRateData.rateDate)
                  : metalRateLoading
                  ? "Loading..."
                  : "Unavailable"}
              </button>
            </div>

            <div className="flex flex-col gap-3 pb-2">
              {metalRates.map((rate, i) => (
                <div
                  key={i}
                  className={`w-full border rounded-xl p-3 flex items-center justify-between shadow-xs ${rate.cardBg}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0 ${rate.iconBg}`}
                    >
                      {rate.icon}
                    </div>

                    <div>
                      <p className="text-[9px] font-bold text-gray-400 tracking-wide uppercase">
                        {rate.title}
                      </p>

                      <div className="flex items-baseline gap-0.5 mt-0.5">
                        <span className="text-lg font-black text-gray-900">
                          {rate.value}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {rate.unit}
                        </span>
                      </div>

                      <p
                        className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                          rate.isUp ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {rate.isUp ? "▲" : "▼"} {rate.change}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Mobile Activities */}
          <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Today's Activity
              </h2>

              <button
                type="button"
                onClick={() => !isAdminView && navigate("/dealer/today-girvi")}
                disabled={isAdminView}
                className={`font-medium text-xs ${
                  isAdminView
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-purple-700"
                }`}
              >
                View All
              </button>
            </div>

            {todayActivityLoading ? (
              <div className="py-6 text-center text-xs text-gray-500">
                Loading today's activity...
              </div>
            ) : todayActivityError ? (
              <div className="py-6 text-center text-xs text-gray-500">
                {todayActivityError}
              </div>
            ) : todayActivities.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                No Girvi created today
              </div>
            ) : (
              <div className="space-y-4">
                {todayActivities.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-4 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`${item.bg} ${item.color} w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0`}
                      >
                        {item.icon}
                      </div>

                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {item.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-green-600 font-bold text-sm">
                        {item.amount}
                      </p>
                      <p className="text-[11px] text-gray-500">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DealerMobileBottomNav active="home" isAdminView={isAdminView} />
      </div>
    </div>
  );
}
