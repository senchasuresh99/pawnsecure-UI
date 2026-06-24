import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaCoins,
  FaHome,
  FaPaperPlane,
  FaSignOutAlt,
  FaStore,
  FaUserCheck,
  FaUserClock,
  FaUsers,
  FaEye,
  FaSyncAlt,
} from "react-icons/fa";

const API_BASE = "https://pawnsecure.onrender.com/api";

type DashboardControl = "FULLVIEW" | "PARTIALITY";

type Dealer = {
  id: number;
  shopName: string;
  gstNumber: string;
  phoneNumber: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  subscriptionEnd?: string;
  dashboardControl?: DashboardControl;
};

type DealerProfile = {
  id: number;
  name?: string;
  email?: string;
  phoneNumber?: string;
  city?: string;
  gstNumber?: string;
  shopName?: string;
  shopAddress?: string;
  role?: string;
  status?: "APPROVED" | "PENDING" | "REJECTED" | string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  subscriptionActive?: boolean;
  dashboardControl?: DashboardControl;
};

type MetalRateForm = {
  city: string;
  rateDate: string;
  gold24kRate: string;
  gold22kRate: string;
  silverRate: string;
};

type MetalRateResponse = {
  city: string;
  rateDate: string;
  gold24kRate: number;
  gold22kRate: number;
  silverRate: number;
};

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  const [notifyModal, setNotifyModal] = useState(false);
  const [message, setMessage] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [approveModal, setApproveModal] = useState(false);
  const [approveDealerTarget, setApproveDealerTarget] =
    useState<Dealer | null>(null);
  const [selectedDashboardControl, setSelectedDashboardControl] =
    useState<DashboardControl>("PARTIALITY");

  const [dealerDetailsModal, setDealerDetailsModal] = useState(false);
  const [dealerDetailsLoading, setDealerDetailsLoading] = useState(false);
  const [dealerDetailsError, setDealerDetailsError] = useState("");
  const [selectedDealer, setSelectedDealer] =
    useState<DealerProfile | null>(null);
  const [selectedDealerId, setSelectedDealerId] = useState<number | string>("");

  const [popup, setPopup] = useState({
    show: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const todayIsoDate = new Date().toISOString().slice(0, 10);

  const [metalRateForm, setMetalRateForm] = useState<MetalRateForm>({
    city: "Karnataka",
    rateDate: todayIsoDate,
    gold24kRate: "",
    gold22kRate: "",
    silverRate: "",
  });

  const [metalRateLoading, setMetalRateLoading] = useState(false);
  const [latestMetalRate, setLatestMetalRate] =
    useState<MetalRateResponse | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("ps_token");
    const role = localStorage.getItem("ps_role");

    if (!token || (role !== "ADMIN" && role !== "ROLE_ADMIN")) {
      navigate("/", { replace: true });
      return;
    }

    loadDealers();
  }, [navigate]);

  const stats = useMemo(() => {
    const now = new Date();

    const approved = dealers.filter((d) => d.status === "APPROVED").length;
    const pending = dealers.filter((d) => d.status === "PENDING").length;
    const rejected = dealers.filter((d) => d.status === "REJECTED").length;

    const renewDue = dealers.filter((d) => {
      if (d.status !== "APPROVED") return false;
      if (!d.subscriptionEnd) return true;

      return new Date(d.subscriptionEnd) <= now;
    }).length;

    return {
      total: dealers.length,
      approved,
      pending,
      rejected,
      renewDue,
    };
  }, [dealers]);

  function handleLogout() {
    localStorage.removeItem("ps_token");
    localStorage.removeItem("ps_role");
    localStorage.removeItem("ps_dealer_id");
    localStorage.removeItem("ps_dealer_name");
    localStorage.removeItem("ps_dashboard_control");

    navigate("/", { replace: true });
  }

  function openApproveModal(dealer: Dealer) {
    setApproveDealerTarget(dealer);
    setSelectedDashboardControl(dealer.dashboardControl || "PARTIALITY");
    setApproveModal(true);
  }

  function closeApproveModal() {
    setApproveModal(false);
    setApproveDealerTarget(null);
    setSelectedDashboardControl("PARTIALITY");
  }

  function openDealerDashboard(dealer: Dealer | DealerProfile) {
    const dealerName =
      "shopName" in dealer && dealer.shopName
        ? dealer.shopName
        : "name" in dealer && dealer.name
        ? dealer.name
        : "Dealer";

    const dashboardControl =
      "dashboardControl" in dealer && dealer.dashboardControl
        ? dealer.dashboardControl
        : "FULLVIEW";

    const path =
      dashboardControl === "PARTIALITY"
        ? "/dealer/dashboard-partial"
        : "/dealer/dashboard";

    navigate(
      `${path}?adminView=true&dealerId=${dealer.id}&dealerName=${encodeURIComponent(
        dealerName
      )}`
    );
  }

  function getDealerIdDisplay(id?: string | number | null) {
    if (!id) return "-";

    const value = String(id);

    return value.startsWith("DP") ? value : `DP${value}`;
  }

  function getInitials(name?: string) {
    if (!name) return "D";

    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function formatDateTime(value?: string) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  async function viewDealerDetails(dealerId: number | string) {
    try {
      setSelectedDealerId(dealerId);
      setDealerDetailsModal(true);
      setDealerDetailsLoading(true);
      setDealerDetailsError("");
      setSelectedDealer(null);

      const cleanDealerId = String(dealerId).replace(/^DP/i, "");

      const res = await fetch(`${API_BASE}/auth/dealer/${cleanDealerId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ps_token")}`,
        },
      });

      if (!res.ok) {
        const msg = await res.text();

        setDealerDetailsError(msg || "Failed to load dealer details");
        return;
      }

      const data: DealerProfile = await res.json();

      setSelectedDealer(data);
    } catch (error) {
      console.error("Failed to load dealer details", error);
      setDealerDetailsError("Server error while loading dealer details");
    } finally {
      setDealerDetailsLoading(false);
    }
  }

  async function loadDealers() {
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/dealers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ps_token")}`,
        },
      });

      if (!res.ok) {
        setPopup({
          show: true,
          type: "error",
          message: "Failed to load dealers",
        });
        return;
      }

      const data = await res.json();
      setDealers(data);
    } catch {
      setPopup({
        show: true,
        type: "error",
        message: "Failed to load dealers",
      });
    } finally {
      setLoading(false);
    }
  }

  async function approveDealer() {
    if (!approveDealerTarget?.id) {
      setPopup({
        show: true,
        type: "error",
        message: "Dealer not selected for approval",
      });
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/admin/approve/${approveDealerTarget.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("ps_token")}`,
          },
          body: JSON.stringify({
            dashboardControl: selectedDashboardControl,
          }),
        }
      );

      const msg = await res.text();

      if (!res.ok) {
        setPopup({ show: true, type: "error", message: msg });
        return;
      }

      setPopup({ show: true, type: "success", message: msg });
      closeApproveModal();
      loadDealers();
    } catch {
      setPopup({
        show: true,
        type: "error",
        message: "Server error. Please try again.",
      });
    }
  }

  async function renewDealer(id: number) {
    try {
      const res = await fetch(`${API_BASE}/admin/renew/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ps_token")}`,
        },
      });

      const msg = await res.text();

      if (!res.ok) {
        setPopup({ show: true, type: "error", message: msg });
        return;
      }

      setPopup({ show: true, type: "success", message: msg });
      loadDealers();
    } catch {
      setPopup({
        show: true,
        type: "error",
        message: "Server unavailable",
      });
    }
  }

  async function sendNotification() {
    if (!message.trim()) {
      setPopup({
        show: true,
        type: "error",
        message: "Please enter notification message",
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/notify-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ps_token")}`,
        },
        body: JSON.stringify({ message }),
      });

      const msg = await res.text();

      if (!res.ok) {
        setPopup({ show: true, type: "error", message: msg });
        return;
      }

      setPopup({
        show: true,
        type: "success",
        message: "Notification sent to all dealers ✅",
      });

      setNotifyModal(false);
      setMessage("");
    } catch {
      setPopup({
        show: true,
        type: "error",
        message: "Failed to send notification",
      });
    }
  }

  function updateMetalRateField(key: keyof MetalRateForm, value: string) {
    setMetalRateForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function saveMetalRates() {
    if (!metalRateForm.city.trim()) {
      setPopup({
        show: true,
        type: "error",
        message: "Please select state",
      });
      return;
    }

    if (!metalRateForm.rateDate) {
      setPopup({
        show: true,
        type: "error",
        message: "Rate date is required",
      });
      return;
    }

    if (!metalRateForm.gold24kRate || Number(metalRateForm.gold24kRate) <= 0) {
      setPopup({
        show: true,
        type: "error",
        message: "Enter valid Gold 24K rate",
      });
      return;
    }

    if (!metalRateForm.gold22kRate || Number(metalRateForm.gold22kRate) <= 0) {
      setPopup({
        show: true,
        type: "error",
        message: "Enter valid Gold 22K rate",
      });
      return;
    }

    if (!metalRateForm.silverRate || Number(metalRateForm.silverRate) <= 0) {
      setPopup({
        show: true,
        type: "error",
        message: "Enter valid Silver rate",
      });
      return;
    }

    setMetalRateLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/metal-rates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ps_token")}`,
        },
        body: JSON.stringify({
          city: metalRateForm.city.trim(),
          rateDate: metalRateForm.rateDate,
          gold24kRate: Number(metalRateForm.gold24kRate),
          gold22kRate: Number(metalRateForm.gold22kRate),
          silverRate: Number(metalRateForm.silverRate),
        }),
      });

      if (!res.ok) {
        const msg = await res.text();

        setPopup({
          show: true,
          type: "error",
          message: msg || "Failed to save metal rates",
        });
        return;
      }

      const data: MetalRateResponse = await res.json();

      setLatestMetalRate(data);

      setPopup({
        show: true,
        type: "success",
        message: "Metal rates saved successfully ✅",
      });
    } catch {
      setPopup({
        show: true,
        type: "error",
        message: "Server error while saving metal rates",
      });
    } finally {
      setMetalRateLoading(false);
    }
  }

  async function loadLatestMetalRate() {
    if (!metalRateForm.city.trim()) {
      setPopup({
        show: true,
        type: "error",
        message: "Select state to load latest rates",
      });
      return;
    }

    setMetalRateLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/admin/metal-rates/latest?city=${encodeURIComponent(
          metalRateForm.city.trim()
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ps_token")}`,
          },
        }
      );

      if (!res.ok) {
        const msg = await res.text();

        setPopup({
          show: true,
          type: "error",
          message: msg || "Latest metal rates not found",
        });
        return;
      }

      const data: MetalRateResponse = await res.json();

      setLatestMetalRate(data);

      setMetalRateForm({
        city: data.city || "",
        rateDate: data.rateDate || todayIsoDate,
        gold24kRate: String(data.gold24kRate || ""),
        gold22kRate: String(data.gold22kRate || ""),
        silverRate: String(data.silverRate || ""),
      });
    } catch {
      setPopup({
        show: true,
        type: "error",
        message: "Server error while loading latest metal rates",
      });
    } finally {
      setMetalRateLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] overflow-x-hidden">
      {/* ================= DESKTOP VIEW ================= */}
      <div className="hidden lg:flex min-h-screen">
        <aside className="w-64 bg-white border-r border-gray-200 px-5 py-6 fixed left-0 top-0 bottom-0 z-40">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
              <img
                src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
                alt="PawnSecure"
                className="w-10 h-10 bg-white rounded-lg p-1"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold text-purple-700 truncate">
                PawnSecure
              </h1>
              <p className="text-xs text-gray-500">Admin Portal</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl flex items-center gap-3 font-semibold">
              <FaHome />
              Dashboard
            </button>

            <button className="w-full text-gray-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-100 font-semibold">
              <FaUsers />
              Manage Dealers
            </button>

            <button className="w-full text-gray-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-100 font-semibold">
              <FaChartBar />
              Reports
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-red-50 font-semibold mt-8"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </nav>
        </aside>

        <main className="ml-64 w-[calc(100vw-16rem)] min-w-0 overflow-x-hidden">
          <div className="h-16 bg-white border-b border-gray-200 px-5 xl:px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                Admin Dashboard
              </h2>
              <p className="text-xs text-gray-500 truncate">
                Manage dealers, approvals, renewals and notifications
              </p>
            </div>

            <div className="flex items-center gap-5 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold"
                >
                  AD
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-bold text-gray-800">Admin</p>
                      <p className="text-xs text-gray-500">Admin Portal</p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2"
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 xl:p-8">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-2xl p-5 mb-5">
              <p className="text-sm opacity-90">Welcome Admin 👋</p>
              <h1 className="text-2xl font-bold mt-1">Manage Dealers</h1>
              <p className="text-sm opacity-80 mt-2">
                Approve dealer accounts, choose dashboard view, renew
                subscriptions and send announcements.
              </p>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-5">
              <StatCard
                icon={<FaStore />}
                title="Total Dealers"
                value={String(stats.total)}
                color="bg-purple-600"
              />

              <StatCard
                icon={<FaUserCheck />}
                title="Approved Dealers"
                value={String(stats.approved)}
                color="bg-green-600"
              />

              <StatCard
                icon={<FaUserClock />}
                title="Pending Approval"
                value={String(stats.pending)}
                color="bg-orange-500"
              />

              <StatCard
                icon={<FaSyncAlt />}
                title="Renew Accounts"
                value={String(stats.renewDue)}
                color="bg-blue-600"
              />

              <StatCard
                icon={<FaCoins />}
                title="Rejected Dealers"
                value={String(stats.rejected)}
                color="bg-red-500"
              />
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 xl:p-6 border-b flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">
                    Manage Dealers
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {dealers.length} registered dealers
                  </p>
                </div>

                <button
                  onClick={() => setNotifyModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 xl:px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0"
                >
                  <FaPaperPlane />
                  Send Notification
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-gray-500">Loading dealers...</div>
              ) : dealers.length === 0 ? (
                <div className="p-8 text-gray-500">No dealers found</div>
              ) : (
                <div className="p-4 xl:p-5 space-y-3">
                  <div className="hidden xl:grid grid-cols-12 gap-4 bg-purple-50 text-purple-700 text-xs uppercase font-bold px-4 py-3 rounded-2xl">
                    <div className="col-span-3">Shop Name</div>
                    <div className="col-span-2">GST Number</div>
                    <div className="col-span-2">Phone</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Subscription</div>
                    <div className="col-span-2">Action</div>
                  </div>

                  {dealers.map((dealer) => {
                    const now = new Date();
                    const subEnd = dealer.subscriptionEnd
                      ? new Date(dealer.subscriptionEnd)
                      : null;

                    const isActive = !!subEnd && subEnd > now;
                    const isApproved = dealer.status === "APPROVED";
                    const canApprove = dealer.status === "PENDING";
                    const canRenew = isApproved && !isActive;

                    return (
                      <div
                        key={dealer.id}
                        className="border border-gray-100 rounded-2xl px-4 py-4 hover:bg-gray-50 transition"
                      >
                        <div className="hidden xl:grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {dealer.shopName}
                            </p>
                            <p className="text-xs text-gray-400">
                              Dealer ID: DP{dealer.id}
                            </p>

                            {dealer.dashboardControl && (
                              <p className="text-xs text-purple-600 font-bold mt-1">
                                Dashboard: {dealer.dashboardControl}
                              </p>
                            )}
                          </div>

                          <div className="col-span-2">
                            <p className="font-mono text-xs text-gray-600 truncate">
                              {dealer.gstNumber || "-"}
                            </p>
                          </div>

                          <div className="col-span-2">
                            <p className="text-sm text-gray-700">
                              {dealer.phoneNumber || "-"}
                            </p>
                          </div>

                          <div className="col-span-1">
                            <StatusBadge status={dealer.status} />
                          </div>

                          <div className="col-span-2">
                            <SubscriptionBadge active={isActive} />
                          </div>

                          <div className="col-span-2">
                            <div className="flex flex-wrap gap-2 justify-end">
                              <button
                                onClick={() => viewDealerDetails(dealer.id)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                              >
                                <FaEye />
                                View
                              </button>

                              <button
                                onClick={() => openApproveModal(dealer)}
                                disabled={!canApprove}
                                className={`px-3 py-2 rounded-lg text-xs font-bold ${
                                  !canApprove
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-purple-600 text-white hover:bg-purple-700"
                                }`}
                              >
                                {isApproved ? "Approved" : "Approve"}
                              </button>

                              <button
                                onClick={() => renewDealer(dealer.id)}
                                disabled={!canRenew}
                                className={`px-3 py-2 rounded-lg text-xs font-bold ${
                                  !canRenew
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                                }`}
                              >
                                Renew
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="xl:hidden">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 truncate">
                                {dealer.shopName}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1 break-all">
                                GST: {dealer.gstNumber || "-"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Phone: {dealer.phoneNumber || "-"}
                              </p>

                              {dealer.dashboardControl && (
                                <p className="text-xs text-purple-600 font-bold mt-1">
                                  Dashboard: {dealer.dashboardControl}
                                </p>
                              )}
                            </div>

                            <StatusBadge status={dealer.status} />
                          </div>

                          <div className="mt-3">
                            <SubscriptionBadge active={isActive} />
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2">
                            <button
                              onClick={() => viewDealerDetails(dealer.id)}
                              className="bg-blue-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                            >
                              <FaEye />
                              View
                            </button>

                            <button
                              onClick={() => openApproveModal(dealer)}
                              disabled={!canApprove}
                              className={`py-2 rounded-xl text-xs font-bold ${
                                !canApprove
                                  ? "bg-gray-200 text-gray-400"
                                  : "bg-purple-600 text-white"
                              }`}
                            >
                              Approve
                            </button>

                            <button
                              onClick={() => renewDealer(dealer.id)}
                              disabled={!canRenew}
                              className={`py-2 rounded-xl text-xs font-bold ${
                                !canRenew
                                  ? "bg-gray-200 text-gray-400"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
                              Renew
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <MetalRateCard
              metalRateForm={metalRateForm}
              latestMetalRate={latestMetalRate}
              metalRateLoading={metalRateLoading}
              updateMetalRateField={updateMetalRateField}
              loadLatestMetalRate={loadLatestMetalRate}
              saveMetalRates={saveMetalRates}
              isMobile={false}
            />
          </div>
        </main>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="lg:hidden pb-24">
        <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] px-5 py-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
                alt="PawnSecure"
                className="w-12 h-12 bg-white rounded-xl p-1 shrink-0"
              />

              <div className="min-w-0">
                <h1 className="font-bold text-xl truncate">PawnSecure</h1>
                <p className="text-xs opacity-80">Admin Portal</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-white/20 px-3 py-2 rounded-lg text-sm font-semibold shrink-0"
            >
              Logout
            </button>
          </div>

          <p className="text-sm opacity-90">Welcome Admin 👋</p>
          <h2 className="text-2xl font-bold mt-1">Manage Dealers</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 -mt-6 relative z-10 px-4">
          <StatCard
            icon={<FaStore />}
            title="Total"
            value={String(stats.total)}
            color="bg-purple-600"
          />

          <StatCard
            icon={<FaUserCheck />}
            title="Approved"
            value={String(stats.approved)}
            color="bg-green-600"
          />

          <StatCard
            icon={<FaUserClock />}
            title="Pending"
            value={String(stats.pending)}
            color="bg-orange-500"
          />

          <StatCard
            icon={<FaSyncAlt />}
            title="Renew"
            value={String(stats.renewDue)}
            color="bg-blue-600"
          />

          <StatCard
            icon={<FaCoins />}
            title="Rejected"
            value={String(stats.rejected)}
            color="bg-red-500"
          />
        </div>

        <div className="px-4 mt-7">
          <button
            onClick={() => setNotifyModal(true)}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <FaPaperPlane />
            Send Notification
          </button>
        </div>

        <MetalRateCard
          metalRateForm={metalRateForm}
          latestMetalRate={latestMetalRate}
          metalRateLoading={metalRateLoading}
          updateMetalRateField={updateMetalRateField}
          loadLatestMetalRate={loadLatestMetalRate}
          saveMetalRates={saveMetalRates}
          isMobile
        />

        <div className="px-4 mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Dealer List</h2>
            <p className="text-xs text-gray-500">{dealers.length} dealers</p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              Loading dealers...
            </div>
          ) : dealers.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm text-gray-500">
              No dealers found
            </div>
          ) : (
            dealers.map((dealer) => {
              const now = new Date();
              const subEnd = dealer.subscriptionEnd
                ? new Date(dealer.subscriptionEnd)
                : null;

              const isActive = !!subEnd && subEnd > now;
              const isApproved = dealer.status === "APPROVED";
              const canApprove = dealer.status === "PENDING";
              const canRenew = isApproved && !isActive;

              return (
                <div
                  key={dealer.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-base truncate">
                        {dealer.shopName}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1 break-all">
                        GST: {dealer.gstNumber || "-"}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Phone: {dealer.phoneNumber || "-"}
                      </p>

                      {dealer.dashboardControl && (
                        <p className="text-xs text-purple-600 font-bold mt-1">
                          Dashboard: {dealer.dashboardControl}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      <StatusBadge status={dealer.status} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <SubscriptionBadge active={isActive} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => viewDealerDetails(dealer.id)}
                      className="bg-blue-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <FaEye />
                      View
                    </button>

                    <button
                      onClick={() => openApproveModal(dealer)}
                      disabled={!canApprove}
                      className={`py-2 rounded-xl text-xs font-bold ${
                        !canApprove
                          ? "bg-gray-200 text-gray-400"
                          : "bg-purple-600 text-white"
                      }`}
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => renewDealer(dealer.id)}
                      disabled={!canRenew}
                      className={`py-2 rounded-xl text-xs font-bold ${
                        !canRenew
                          ? "bg-gray-200 text-gray-400"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      Renew
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= APPROVE MODAL ================= */}
      {approveModal && approveDealerTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Approve Dealer</h2>

            <p className="text-sm text-gray-500 mb-4">
              Select dashboard view before approving this dealer.
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-400 font-bold uppercase">
                Dealer
              </p>

              <p className="text-sm font-bold text-gray-900 mt-1">
                {approveDealerTarget.shopName || `DP${approveDealerTarget.id}`}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Dealer ID: DP{approveDealerTarget.id}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                Dashboard View
              </label>

              <select
                value={selectedDashboardControl}
                onChange={(e) =>
                  setSelectedDashboardControl(e.target.value as DashboardControl)
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="FULLVIEW">Full View</option>
                <option value="PARTIALITY">Partiality View</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeApproveModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={approveDealer}
                className="px-4 py-2 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700"
              >
                Approve Dealer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DEALER DETAILS MODAL ================= */}
      {dealerDetailsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-purple-700 to-indigo-600 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Dealer Details</h2>
                <p className="text-sm text-white/80">
                  Full registered dealer information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDealerDetailsModal(false)}
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xl font-bold"
              >
                ×
              </button>
            </div>

            {dealerDetailsLoading ? (
              <div className="p-10 text-center text-gray-500">
                Loading dealer details...
              </div>
            ) : dealerDetailsError ? (
              <div className="p-10 text-center">
                <p className="text-red-600 font-semibold text-sm">
                  {dealerDetailsError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    selectedDealerId && viewDealerDetails(selectedDealerId)
                  }
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-sm font-bold"
                >
                  Retry
                </button>
              </div>
            ) : selectedDealer ? (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold shrink-0">
                    {getInitials(selectedDealer.shopName || selectedDealer.name)}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      {selectedDealer.shopName ||
                        selectedDealer.name ||
                        "Dealer"}
                    </h3>

                    <p className="text-sm text-gray-500">
                      Dealer ID: {getDealerIdDisplay(selectedDealer.id)}
                    </p>

                    {selectedDealer.status && (
                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                          selectedDealer.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : selectedDealer.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {selectedDealer.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                  <AdminDealerDetailRow
                    label="Dealer Name"
                    value={selectedDealer.name}
                  />

                  <AdminDealerDetailRow
                    label="Shop Name"
                    value={selectedDealer.shopName}
                  />

                  <AdminDealerDetailRow
                    label="Email"
                    value={selectedDealer.email}
                  />

                  <AdminDealerDetailRow
                    label="Phone Number"
                    value={selectedDealer.phoneNumber}
                  />

                  <AdminDealerDetailRow
                    label="State"
                    value={selectedDealer.city}
                  />

                  <AdminDealerDetailRow
                    label="GST Number"
                    value={selectedDealer.gstNumber}
                  />

                  <AdminDealerDetailRow
                    label="Shop Address"
                    value={selectedDealer.shopAddress}
                  />

                  <AdminDealerDetailRow label="Role" value={selectedDealer.role} />

                  <AdminDealerDetailRow
                    label="Status"
                    value={selectedDealer.status}
                  />

                  <AdminDealerDetailRow
                    label="Dashboard View"
                    value={selectedDealer.dashboardControl}
                  />

                  <AdminDealerDetailRow
                    label="Subscription Start"
                    value={formatDateTime(selectedDealer.subscriptionStart)}
                  />

                  <AdminDealerDetailRow
                    label="Subscription End"
                    value={formatDateTime(selectedDealer.subscriptionEnd)}
                  />
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  {selectedDealer.status === "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => openDealerDashboard(selectedDealer)}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold"
                    >
                      Open Dashboard
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDealerDetailsModal(false)}
                    className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-gray-500">
                Dealer details not found
              </div>
            )}
          </div>
        </div>
      )}

      {notifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Send Notification</h2>
            <p className="text-sm text-gray-500 mb-4">
              This message will be sent to all dealers.
            </p>

            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message..."
              className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setNotifyModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={sendNotification}
                disabled={!message.trim()}
                className={`px-4 py-2 rounded-lg font-bold text-white ${
                  !message.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {popup.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div
              className={`text-5xl mb-3 ${
                popup.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {popup.type === "success" ? "✔" : "✖"}
            </div>

            <h2 className="text-xl font-bold mb-2">
              {popup.type === "success" ? "Success" : "Error"}
            </h2>

            <p className="text-gray-600 mb-5">{popup.message}</p>

            <button
              onClick={() => setPopup({ ...popup, show: false })}
              className={`text-white px-5 py-2 rounded-lg font-semibold ${
                popup.type === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetalRateCard({
  metalRateForm,
  latestMetalRate,
  metalRateLoading,
  updateMetalRateField,
  loadLatestMetalRate,
  saveMetalRates,
  isMobile,
}: {
  metalRateForm: MetalRateForm;
  latestMetalRate: MetalRateResponse | null;
  metalRateLoading: boolean;
  updateMetalRateField: (key: keyof MetalRateForm, value: string) => void;
  loadLatestMetalRate: () => void;
  saveMetalRates: () => void;
  isMobile: boolean;
}) {
  if (isMobile) {
    return (
      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Metal Rates</h2>
              <p className="text-xs text-gray-500">Update state-wise rates</p>
            </div>

            <button
              type="button"
              onClick={loadLatestMetalRate}
              disabled={metalRateLoading}
              className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center disabled:opacity-60"
            >
              <FaSyncAlt />
            </button>
          </div>

          <div className="space-y-3">
            <MetalRateSelect
              label="State"
              value={metalRateForm.city}
              onChange={(v) => updateMetalRateField("city", v)}
            />

            <MetalRateInput
              label="Rate Date"
              type="date"
              value={metalRateForm.rateDate}
              onChange={(v) => updateMetalRateField("rateDate", v)}
            />

            <MetalRateInput
              label="Gold 24K Rate"
              type="number"
              value={metalRateForm.gold24kRate}
              onChange={(v) => updateMetalRateField("gold24kRate", v)}
            />

            <MetalRateInput
              label="Gold 22K Rate"
              type="number"
              value={metalRateForm.gold22kRate}
              onChange={(v) => updateMetalRateField("gold22kRate", v)}
            />

            <MetalRateInput
              label="Silver Rate"
              type="number"
              value={metalRateForm.silverRate}
              onChange={(v) => updateMetalRateField("silverRate", v)}
            />

            {latestMetalRate && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700">
                <p className="font-bold">
                  Latest: {latestMetalRate.city} - {latestMetalRate.rateDate}
                </p>
                <p className="mt-1">
                  24K ₹{latestMetalRate.gold24kRate} | 22K ₹
                  {latestMetalRate.gold22kRate} | Silver ₹
                  {latestMetalRate.silverRate}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={saveMetalRates}
              disabled={metalRateLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              <FaCoins />
              {metalRateLoading ? "Saving..." : "Save Rates"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="p-5 xl:p-6 border-b flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Update Metal Rates
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Admin can update state-wise gold and silver rates
          </p>
        </div>

        <button
          type="button"
          onClick={loadLatestMetalRate}
          disabled={metalRateLoading}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-60"
        >
          <FaSyncAlt />
          Load Latest
        </button>
      </div>

      <div className="p-5 xl:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <MetalRateSelect
            label="State"
            value={metalRateForm.city}
            onChange={(v) => updateMetalRateField("city", v)}
          />

          <MetalRateInput
            label="Rate Date"
            type="date"
            value={metalRateForm.rateDate}
            onChange={(v) => updateMetalRateField("rateDate", v)}
          />

          <MetalRateInput
            label="Gold 24K Rate"
            type="number"
            value={metalRateForm.gold24kRate}
            onChange={(v) => updateMetalRateField("gold24kRate", v)}
          />

          <MetalRateInput
            label="Gold 22K Rate"
            type="number"
            value={metalRateForm.gold22kRate}
            onChange={(v) => updateMetalRateField("gold22kRate", v)}
          />

          <MetalRateInput
            label="Silver Rate"
            type="number"
            value={metalRateForm.silverRate}
            onChange={(v) => updateMetalRateField("silverRate", v)}
          />
        </div>

        <div className="mt-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {latestMetalRate ? (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 text-sm">
              <p className="font-bold text-purple-800">
                Latest Saved Rate: {latestMetalRate.city} -{" "}
                {latestMetalRate.rateDate}
              </p>
              <p className="text-purple-700 mt-1">
                24K ₹{latestMetalRate.gold24kRate} | 22K ₹
                {latestMetalRate.gold22kRate} | Silver ₹
                {latestMetalRate.silverRate}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Select state, enter rates and click Save Rates.
            </p>
          )}

          <button
            type="button"
            onClick={saveMetalRates}
            disabled={metalRateLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            <FaCoins />
            {metalRateLoading ? "Saving..." : "Save Rates"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl px-3 py-3 shadow-sm border border-gray-100 min-h-[72px]">
      <div className="flex items-center gap-2">
        <div
          className={`${color} text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[11px] text-gray-500 truncate leading-tight">
            {title}
          </p>
          <h2 className="text-base font-bold leading-tight mt-1">{value}</h2>
        </div>
      </div>
    </div>
  );
}

function MetalRateSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
      >
        <option value="">Select State</option>
        {INDIAN_STATES.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>
    </div>
  );
}

function MetalRateInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        placeholder={label}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: Dealer["status"] }) {
  if (status === "APPROVED") {
    return (
      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap">
        ● APPROVED
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap">
        ● REJECTED
      </span>
    );
  }

  return (
    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap">
      ● PENDING
    </span>
  );
}

function SubscriptionBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
      Expired / Inactive
    </span>
  );
}

function AdminDealerDetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-bold">
        {label}
      </p>

      <p className="text-sm font-semibold text-gray-800 break-words mt-1">
        {value || "-"}
      </p>
    </div>
  );
}