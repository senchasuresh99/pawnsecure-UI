import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
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

const API_BASE = "https://pawnsecure-1.onrender.com/api";

type Dealer = {
  id: number;
  shopName: string;
  gstNumber: string;
  phoneNumber: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  subscriptionEnd?: string;
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  const [notifyModal, setNotifyModal] = useState(false);
  const [message, setMessage] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [popup, setPopup] = useState({
    show: false,
    type: "success" as "success" | "error",
    message: "",
  });

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

    navigate("/", { replace: true });
  }

  function openDealerDashboard(dealer: Dealer) {
    navigate(
      `/dealer/dashboard?adminView=true&dealerId=${dealer.id}&dealerName=${encodeURIComponent(
        dealer.shopName
      )}`
    );
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

  async function approveDealer(id: number) {
    try {
      const res = await fetch(`${API_BASE}/admin/approve/${id}`, {
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

  return (
    <div className="min-h-screen bg-[#f4f5f7] overflow-x-hidden">
      {/* ================= DESKTOP VIEW ================= */}
      <div className="hidden lg:flex min-h-screen">
        {/* SIDEBAR */}
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

        {/* MAIN */}
        <main className="ml-64 w-[calc(100vw-16rem)] min-w-0 overflow-x-hidden">
          {/* TOPBAR */}
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
              {/* <div className="relative">
                <FaBell className="text-purple-700 text-xl" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full px-1">
                  {stats.pending}
                </span>
              </div> */}

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
            {/* HERO */}
            <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-2xl p-5 mb-5">
              <p className="text-sm opacity-90">Welcome Admin 👋</p>
              <h1 className="text-2xl font-bold mt-1">
                Manage Dealers
              </h1>
              <p className="text-sm opacity-80 mt-2">
                Approve dealer accounts, renew subscriptions and send
                announcements.
              </p>
            </div>

            {/* STATS - EXTRA COMPACT */}
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

            {/* DEALERS LIST CARD */}
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
                  {/* DESKTOP LIST HEADER */}
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
                        {/* LAPTOP / DESKTOP ROW */}
                        <div className="hidden xl:grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {dealer.shopName}
                            </p>
                            <p className="text-xs text-gray-400">
                              Dealer ID: DP{dealer.id}
                            </p>
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
                                onClick={() => openDealerDashboard(dealer)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                              >
                                <FaEye />
                                View
                              </button>

                              <button
                                onClick={() => approveDealer(dealer.id)}
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

                        {/* TABLET / SMALL LAPTOP ROW */}
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
                            </div>

                            <StatusBadge status={dealer.status} />
                          </div>

                          <div className="mt-3">
                            <SubscriptionBadge active={isActive} />
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2">
                            <button
                              onClick={() => openDealerDashboard(dealer)}
                              className="bg-blue-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                            >
                              <FaEye />
                              View
                            </button>

                            <button
                              onClick={() => approveDealer(dealer.id)}
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
          </div>
        </main>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="lg:hidden pb-24">
        {/* MOBILE HEADER */}
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

        {/* MOBILE STATS */}
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

        {/* MOBILE ACTION */}
        <div className="px-4 mt-7">
          <button
            onClick={() => setNotifyModal(true)}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <FaPaperPlane />
            Send Notification
          </button>
        </div>

        {/* MOBILE DEALER CARDS */}
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
                      onClick={() => openDealerDashboard(dealer)}
                      className="bg-blue-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <FaEye />
                      View
                    </button>

                    <button
                      onClick={() => approveDealer(dealer.id)}
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

      {/* NOTIFICATION MODAL */}
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

      {/* POPUP */}
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

/* ================= REUSABLE COMPONENTS ================= */

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