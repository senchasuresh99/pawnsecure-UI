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
  FaCalculator,
  FaFilter,
} from "react-icons/fa";

// Static Configs
const initialMetalRates = [
  {
    id: "gold24",
    title: "GOLD 24K (999)",
    basePricePerGram: 9875,
    unit: "/gram",
    change: "+45 (0.46%) Today",
    isUp: true,
    cardBg: "from-amber-50 to-orange-50 border-amber-200",
    iconBg: "bg-amber-500/10 text-amber-700",
    icon: <FaCoins />,
  },
  {
    id: "gold22",
    title: "GOLD 22K (916)",
    basePricePerGram: 9050,
    unit: "/gram",
    change: "+40 (0.44%) Today",
    isUp: true,
    cardBg: "from-yellow-50 to-amber-50 border-yellow-200",
    iconBg: "bg-yellow-500/10 text-yellow-700",
    icon: <FaGem />,
  },
  {
    id: "silver",
    title: "SILVER",
    basePricePerGram: 112,
    unit: "/gram",
    change: "-1 (0.88%) Today",
    isUp: false,
    cardBg: "from-slate-50 to-blue-50 border-slate-200",
    iconBg: "bg-slate-500/10 text-slate-700",
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
    type: "pledge",
    title: "New Girvi Created",
    name: "Ramesh Kumar",
    amount: "₹65,000",
    time: "10:30 AM",
    icon: <FaCalendarAlt />,
    bg: "bg-green-100",
    color: "text-green-600",
  },
  {
    type: "collection",
    title: "Payment Received",
    name: "Suresh Babu (A-00124)",
    amount: "₹8,500",
    time: "11:15 AM",
    icon: <FaRupeeSign />,
    bg: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    type: "renewal",
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

  const dealerName = query.get("dealerName") || localStorage.getItem("ps_dealer_name") || "Dealer";
  const dealerId = query.get("dealerId") || localStorage.getItem("ps_dealer_id") || "-";

  // System States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");
  const [weightUnit, setWeightUnit] = useState<"gram" | "tola" | "kg">("gram");

  // Interactive Calculator State
  const [calcMetal, setCalcMetal] = useState("gold22");
  const [calcWeight, setCalcWeight] = useState<number>(10);
  const [calcInterestRate, setCalcInterestRate] = useState<number>(2); // 2% per month standard
  const [calcLTV, setCalcLTV] = useState<number>(75); // 75% standard LTV pawn loan margin

  // Dashboard dynamic counts
  const [metrics, setMetrics] = useState({
    activeCustomers: 0,
    todayPledges: "₹0",
    dueToday: 0,
    overdueAccounts: 0,
    totalLoanValue: "₹0",
  });

  // Fetch Summary Counts
  useEffect(() => {
    async function fetchDashboardSummary() {
      if (!dealerId || dealerId === "-") return;
      try {
        const token = localStorage.getItem("ps_token");
        const res = await fetch(`https://pawnsecure-1.onrender.com/api/dealer/dashboard-summary`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "X-DEALER-ID": dealerId,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics({
            activeCustomers: data.activeCustomers || 0,
            todayPledges: data.todayPledges || "₹0",
            dueToday: data.dueToday || 0,
            overdueAccounts: data.overdueAccounts || 0,
            totalLoanValue: data.totalLoanValue || "₹0",
          });
        }
      } catch (err) {
        console.error("Failed to load statistics updates", err);
      }
    }

    fetchDashboardSummary();
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, [dealerId]);

  // Handle Weight Multipliers Dynamic Text Conversions
  const getWeightMultiplier = () => {
    if (weightUnit === "tola") return 11.6638;
    if (weightUnit === "kg") return 1000;
    return 1;
  };

  // Live calculation metrics for standard estimates
  const currentSelectedMetalObj = initialMetalRates.find((r) => r.id === calcMetal);
  const currentBaseGramPrice = currentSelectedMetalObj ? currentSelectedMetalObj.basePricePerGram : 0;
  const marketValuation = calcWeight * currentBaseGramPrice;
  const standardMaxLoanValue = (marketValuation * calcLTV) / 100;
  const projectedMonthlyInterest = (standardMaxLoanValue * calcInterestRate) / 100;

  const stats = [
    {
      title: "Today's Pledges",
      value: metrics.todayPledges,
      subtitle: "Live ledger status",
      icon: <FaRupeeSign />,
      iconBg: "bg-purple-600 shadow-purple-200",
      cardBg: "bg-white",
    },
    {
      title: "Active Customers",
      value: metrics.activeCustomers.toString(),
      subtitle: "Click to explore profiles",
      icon: <FaUserFriends />,
      iconBg: "bg-blue-500 shadow-blue-200",
      cardBg: "bg-white",
      path: "/dealer/customer-search",
    },
    {
      title: "Due Today",
      value: metrics.dueToday.toString(),
      subtitle: "Require collections",
      icon: <FaCalendarAlt />,
      iconBg: "bg-orange-500 shadow-orange-200",
      cardBg: "bg-orange-50/60 border border-orange-100",
    },
    {
      title: "Overdue Accounts",
      value: metrics.overdueAccounts.toString(),
      subtitle: "Immediate collection required",
      icon: <FaClock />,
      iconBg: "bg-red-500 shadow-red-200",
      cardBg: "bg-red-50/60 border border-red-100",
    },
  ];

  const filteredActivities = activities.filter((act) => {
    if (activityFilter === "all") return true;
    return act.type === activityFilter;
  });

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-purple-500 selection:text-white">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden lg:flex min-h-screen">
        <aside className="w-66 bg-white border-r border-slate-200/80 px-5 py-6 fixed left-0 top-0 bottom-0 z-40">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-200 shrink-0 transform transition-transform hover:rotate-6">
              <img
                src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
                alt="PawnSecure"
                className="w-8 h-8 bg-white rounded-md p-0.5"
              />
            </div>
            <div>
              <h1 className="text-lg font-black bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">PawnSecure</h1>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {isAdminView ? "Admin Mode" : "Dealer Operations"}
              </p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => navigate(isAdminView ? "/admin/dashboard" : "/dealer/dashboard")}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl flex items-center gap-3 font-semibold shadow-md shadow-purple-200 transition-all active:scale-98"
            >
              <FaHome className="text-base" /> {isAdminView ? "Back to Admin" : "Dashboard Overview"}
            </button>
            <button
              onClick={() => !isAdminView && navigate("/dealer/customer-search")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold transition-all group ${
                isAdminView ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50 hover:text-purple-600 active:scale-98"
              }`}
            >
              <FaUserFriends className="text-slate-400 group-hover:text-purple-600 transition-colors" /> Profiles Management
            </button>
            <button
              onClick={() => !isAdminView && navigate("/dealer/customer")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold transition-all group ${
                isAdminView ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50 hover:text-purple-600 active:scale-98"
              }`}
            >
              <FaRupeeSign className="text-slate-400 group-hover:text-purple-600 transition-colors" /> Active Girvi Book
            </button>
            <button
              onClick={() => !isAdminView && navigate("/dealer/collections")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold transition-all group ${
                isAdminView ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50 hover:text-purple-600 active:scale-98"
              }`}
            >
              <FaCoins className="text-slate-400 group-hover:text-purple-600 transition-colors" /> Ledger Collections
            </button>
            <button
              onClick={() => !isAdminView && navigate("/dealer/reports")}
              disabled={isAdminView}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-semibold transition-all group ${
                isAdminView ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50 hover:text-purple-600 active:scale-98"
              }`}
            >
              <FaChartBar className="text-slate-400 group-hover:text-purple-600 transition-colors" /> Business Reports
            </button>
          </nav>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="ml-66 flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-800">Operational Summary</h2>
              <p className="text-xs text-slate-400">Real-time status configurations</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-600 bg-slate-50 border px-3 py-1.5 rounded-lg">
                {currentDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  {dealerName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 bg-slate-50/80 border-b">
                      <p className="text-xs font-bold text-slate-800 truncate">{dealerName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {dealerId.startsWith("DP") ? dealerId : `DP${dealerId}`}</p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        navigate("/", { replace: true });
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="p-8 max-w-[1500px] w-full mx-auto space-y-8">
            {/* HERO PROFILE HEADER */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg border border-slate-800">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <FaGem className="text-9xl" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">{getGreeting()} 👋</p>
                <h1 className="text-3xl font-black mt-1 tracking-tight">{dealerName}</h1>
                <p className="text-xs bg-white/10 text-indigo-100 font-mono inline-block px-2.5 py-1 rounded-md mt-2">
                  System ID Code: {dealerId.startsWith("DP") ? dealerId : `DP${dealerId}`}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-10 border-t border-white/10 pt-6">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Business Calendar</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{currentDate.toLocaleDateString("en-IN", { weekday: "long" })}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vault Gateways</p>
                    <p className="text-sm font-semibold text-green-400 mt-0.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active / Online
                    </p>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE TOTAL METRIC PREVIEW */}
              <div className="xl:col-span-4 bg-white rounded-3xl p-8 border border-slate-200/60 shadow-xs flex flex-col justify-between relative group overflow-hidden transition-all hover:border-purple-300 hover:shadow-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full translate-x-10 -translate-y-10 transition-transform group-hover:scale-110"></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consolidated Loan Valuation</p>
                  <h2 className="text-4xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-purple-700 transition-colors">
                    {metrics.totalLoanValue}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Outstanding liabilities across active customers</p>
                </div>
                <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Risk Evaluation</p>
                    <p className="text-xs font-bold text-emerald-600">Secure Assets Coverage</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg">94.2%</span>
                </div>
              </div>
            </div>

            {/* LIVE INTERACTIVE METAL RATES RATIO WIDGET */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Live Spot Market Commodities</h3>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Sync Live
                  </span>
                </div>

                {/* Interactive conversion configuration selector */}
                <div className="flex items-center bg-slate-100 border p-1 rounded-xl self-start sm:self-center">
                  {(["gram", "tola", "kg"] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setWeightUnit(unit)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all uppercase cursor-pointer ${
                        weightUnit === unit ? "bg-white text-purple-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Per {unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {initialMetalRates.map((rate) => {
                  const calculatedDisplayPrice = Math.round(rate.basePricePerGram * getWeightMultiplier());
                  return (
                    <div
                      key={rate.id}
                      className={`border rounded-2xl p-5 bg-gradient-to-b transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${rate.cardBg}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{rate.title}</p>
                          <h4 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                            ₹{calculatedDisplayPrice.toLocaleString("en-IN")}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5">Calculated unit price /{weightUnit}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${rate.iconBg}`}>
                          {rate.icon}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-200/40 pt-3">
                        <span className={`text-[11px] font-bold flex items-center gap-1 ${rate.isUp ? "text-emerald-600" : "text-rose-600"}`}>
                          {rate.isUp ? <FaArrowUp /> : <FaArrowDown />} {rate.change}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TWO COLUMN GRID: QUICK ACTIONS & INTERACTIVE TOOLS */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* INTERACTIVE LIVE LOAN EVALUATION CALCULATOR */}
              <div className="xl:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-4 pb-2 border-b">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FaCalculator />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Counter Over-The-Desk Calculator</h4>
                      <p className="text-[11px] text-slate-400">Instantly evaluate loan eligibility factors</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Asset Commodity Class</label>
                      <select
                        value={calcMetal}
                        onChange={(e) => setCalcMetal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-500"
                      >
                        <option value="gold24">Gold 24K (999 purity)</option>
                        <option value="gold22">Gold 22K (916 purity)</option>
                        <option value="silver">Fine Sterling Silver</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Net Weight (Grams)</label>
                        <input
                          type="number"
                          value={calcWeight || ""}
                          onChange={(e) => setCalcWeight(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-purple-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Loan Margin Advance (LTV %)</label>
                        <input
                          type="number"
                          value={calcLTV || ""}
                          onChange={(e) => setCalcLTV(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-purple-500"
                          max="90"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Target Interest Yield Rate ({calcInterestRate}% pm)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.25"
                        value={calcInterestRate}
                        onChange={(e) => setCalcInterestRate(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Estimated Asset Valuation:</span>
                    <span className="font-bold text-slate-800">₹{Math.round(marketValuation).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-purple-200/50 pb-2">
                    <span className="text-slate-500 font-medium">Monthly Interest Accumulation:</span>
                    <span className="font-bold text-purple-700">₹{Math.round(projectedMonthlyInterest).toLocaleString("en-IN")} /mo</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-slate-700">Max Principal Payout:</span>
                    <span className="text-xl font-black text-indigo-700">₹{Math.round(standardMaxLoanValue).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* DYNAMIC SYSTEM QUICK ACTIONS GRID */}
              <div className="xl:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Operational Workflows</h3>
                    <span className="text-xs text-slate-400 font-medium">Direct routing interfaces</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {actions.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => !isAdminView && navigate(item.path, item.state ? { state: item.state } : undefined)}
                        disabled={isAdminView}
                        className={`bg-white border border-slate-100 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 shadow-xs transition-all duration-200 transform cursor-pointer ${
                          isAdminView
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:border-purple-200 hover:bg-purple-50/50 hover:-translate-y-0.5 active:scale-95"
                        }`}
                      >
                        <div className={`${item.bg} ${item.color} w-11 h-11 rounded-xl flex items-center justify-center text-base shadow-xs`}>
                          {item.icon}
                        </div>
                        <p className="text-xs font-bold text-slate-700 tracking-tight leading-tight">{item.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 border-t pt-6">
                  {stats.map((item, index) => {
                    const isClickable = !!item.path && !isAdminView;
                    return (
                      <div
                        key={index}
                        onClick={() => isClickable && navigate(item.path!)}
                        className={`p-4 rounded-2xl transition-all duration-200 select-none ${item.cardBg} ${
                          isClickable ? "cursor-pointer border border-slate-100 hover:border-blue-200 hover:shadow-xs active:scale-98" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`${item.iconBg} w-8 h-8 rounded-lg flex items-center justify-center text-sm text-white`}>
                            {item.icon}
                          </div>
                          {isClickable && <span className="text-[10px] font-bold text-blue-600 uppercase">Open</span>}
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-4">{item.title}</p>
                        <h4 className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">{item.value}</h4>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* REAL-TIME FILTERABLE OPERATION LOGS ACTIVITIES TAB */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-4">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Daily Transaction Logging Feed</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Filter and query live transactions feed activity log updates</p>
                </div>

                {/* Live Activity Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 border rounded-xl self-start sm:self-center">
                  {[
                    { id: "all", label: "All Logs" },
                    { id: "pledge", label: "Pledges" },
                    { id: "collection", label: "Collections" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActivityFilter(tab.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activityFilter === tab.id ? "bg-white text-purple-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredActivities.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400 font-medium">No recent logs found matching parameters.</p>
                ) : (
                  filteredActivities.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 p-3.5 rounded-2xl transition-all duration-150 animate-in fade-in-40 duration-300"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`${item.bg} ${item.color} w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800 truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 truncate">{item.name}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="text-slate-900 font-extrabold text-sm">{item.amount}</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================= MOBILE USER INTERFACE ================= */}
      <div className="lg:hidden pb-24">
        <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-b-[2.5rem] px-5 py-7 shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <img src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true" alt="" className="w-6 h-6 p-0.5" />
                </div>
                <h2 className="text-base font-black tracking-tight">PawnSecure</h2>
              </div>
              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{getGreeting()} 👋</p>
              <h1 className="text-xl font-black tracking-tight truncate max-w-[180px] mt-0.5">{dealerName}</h1>
            </div>

            <div className="text-right">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold ml-auto mb-3 active:scale-90 transition-transform"
              >
                {dealerName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </button>
              {showProfileMenu && (
                <div className="absolute right-5 mt-1 w-44 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden text-left animate-in fade-in-50 slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      navigate("/", { replace: true });
                    }}
                    className="w-full px-4 py-3 text-xs text-red-600 font-bold active:bg-red-50"
                  >
                    Logout Account
                  </button>
                </div>
              )}
              <p className="text-xs font-bold text-slate-300 font-mono">ID: {dealerId.startsWith("DP") ? dealerId : `DP${dealerId}`}</p>
            </div>
          </div>
        </div>

        {/* MOBILE GRID CARDS CONTAINER */}
        <div className="grid grid-cols-2 gap-3 -mt-6 px-4 relative z-20">
          {stats.map((item, index) => {
            const isClickable = !!item.path && !isAdminView;
            return (
              <div
                key={index}
                onClick={() => isClickable && navigate(item.path!)}
                className={`${item.cardBg} rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[110px] transition-transform duration-150 active:scale-97 cursor-pointer`}
              >
                <div className={`${item.iconBg} w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 mt-2 tracking-tight">{item.value}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">{item.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* INTERACTIVE COMPONENT: MOBILE COUNTER LOAN CALCULATOR WIDGET */}
        <div className="mt-6 px-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <FaCalculator className="text-purple-600 text-sm" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Quick Counter Estimator</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Purity Spec</label>
                <select
                  value={calcMetal}
                  onChange={(e) => setCalcMetal(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-lg text-[11px] font-bold focus:outline-none"
                >
                  <option value="gold24">Gold 24K</option>
                  <option value="gold22">Gold 22K</option>
                  <option value="silver">Silver</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Net Grams</label>
                <input
                  type="number"
                  value={calcWeight || ""}
                  onChange={(e) => setCalcWeight(Number(e.target.value))}
                  className="w-full bg-slate-50 border p-2 rounded-lg text-[11px] font-bold focus:outline-none"
                  placeholder="0g"
                />
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-600">Pledging Credit:</span>
              <span className="text-base font-black text-purple-700">₹{Math.round(standardMaxLoanValue).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* RECENT FEED WORK LOGS FOR MOBILE */}
        <div className="mt-6 px-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Operation Log</h3>
            <button className="text-[11px] font-bold text-purple-600" onClick={() => setActivityFilter(activityFilter === "all" ? "pledge" : "all")}>
              Toggle view
            </button>
          </div>
          <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-xs space-y-2">
            {filteredActivities.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 border-b last:border-0 border-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`${item.bg} ${item.color} w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.name}</p>
                  </div>
                </div>
                <span className="font-extrabold text-xs text-slate-800 ml-2 shrink-0">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FLOATING ACTION BOTTOM CONTROLS FOR MOBILE INTERACTION */}
        {!isAdminView && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200/80 flex justify-around py-2 px-1 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
            <button onClick={() => navigate("/dealer/dashboard")} className="text-purple-600 flex flex-col items-center text-[10px] font-bold w-16">
              <FaHome className="text-lg mb-0.5" /> Home
            </button>
            <button onClick={() => navigate("/dealer/customer-search")} className="text-slate-400 hover:text-slate-800 flex flex-col items-center text-[10px] font-medium w-16">
              <FaUserFriends className="text-lg mb-0.5" /> Profiles
            </button>
            <button onClick={() => navigate("/dealer/customer")} className="text-slate-400 hover:text-slate-800 flex flex-col items-center text-[10px] font-medium w-16">
              <FaRupeeSign className="text-lg mb-0.5" /> Book Girvi
            </button>
            <button onClick={() => navigate("/dealer/collections")} className="text-slate-400 hover:text-slate-800 flex flex-col items-center text-[10px] font-medium w-16">
              <FaCoins className="text-lg mb-0.5" /> Collect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
