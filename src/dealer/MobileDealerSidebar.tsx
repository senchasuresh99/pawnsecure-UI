import { useEffect, useState } from "react";
import {
  FaHome,
  FaUserFriends,
  FaUserPlus,
  FaCoins,
  FaEye,
  FaUserCheck,
  FaSignOutAlt,
  FaTimes,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaStore,
  FaIdCard,
  FaShieldAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

type MobileDealerSidebarProps = {
  open: boolean;
  onClose: () => void;
  isAdminView?: boolean;
  dealerName: string;
  dealerId: string;
};

type DealerProfile = {
  id: number;
  name: string;
  email?: string;
  phoneNumber?: string;
  city?: string;
  gstNumber?: string;
  shopName?: string;
  shopAddress?: string;
  role?: string;
  status?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  subscriptionActive?: boolean;
};

export default function MobileDealerSidebar({
  open,
  onClose,
  isAdminView = false,
  dealerName,
  dealerId,
}: MobileDealerSidebarProps) {
  const navigate = useNavigate();

  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(
    null
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [showDealerDetails, setShowDealerDetails] = useState(false);

  function normalizeDealerId(id: string | null | undefined) {
    if (!id || id === "-") return "";
    return String(id).replace(/^DP/i, "");
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getDealerIdDisplay(id: string | number | null | undefined) {
    if (!id || id === "-") return "-";

    const value = String(id);

    return value.startsWith("DP") ? value : `DP${value}`;
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

  async function fetchDealerProfile() {
    const rawDealerId =
      dealerId || localStorage.getItem("ps_dealer_id") || "-";

    const cleanDealerId = normalizeDealerId(rawDealerId);

    if (!cleanDealerId) return;

    try {
      setProfileLoading(true);

      const token = localStorage.getItem("ps_token");

      const res = await fetch(`${API_BASE}/auth/dealer/${cleanDealerId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const msg = await res.text();
        console.warn("Failed to load dealer profile:", msg);
        return;
      }

      const data: DealerProfile = await res.json();

      setDealerProfile(data);

      localStorage.setItem("ps_dealer_id", String(data.id));
      localStorage.setItem("ps_dealer_name", data.name);
    } catch (error) {
      console.error("Failed to fetch dealer profile", error);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      fetchDealerProfile();
    }
  }, [open, dealerId]);

  if (!open) return null;

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

  const displayName =
    dealerProfile?.name ||
    localStorage.getItem("ps_dealer_name") ||
    dealerName ||
    "Dealer";

  const displayDealerId = getDealerIdDisplay(
    dealerProfile?.id || normalizeDealerId(dealerId)
  );

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
      path: "/dealer/due-today",
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

          {/* ✅ Clickable Dealer Profile Card */}
          <button
            type="button"
            onClick={() => setShowDealerDetails(true)}
            className="mt-5 w-full flex items-center gap-3 bg-white/10 rounded-2xl p-3 border border-white/10 text-left hover:bg-white/20 active:bg-white/25 transition"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shrink-0">
              {profileLoading ? "..." : getInitials(displayName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold truncate">
                {profileLoading ? "Loading..." : displayName}
              </p>

              <p className="text-xs opacity-80">
                Dealer ID: {displayDealerId}
              </p>

              <p className="text-[10px] opacity-70 mt-0.5">
                Tap to view profile
              </p>
            </div>
          </button>

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

      {/* ✅ Dealer Details Modal */}
      {showDealerDetails && (
        <div className="absolute inset-0 z-[1000] bg-black/50 flex items-end justify-center">
          <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Dealer Profile
                </h2>
                <p className="text-xs text-gray-500">
                  Logged-in dealer details
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDealerDetails(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            {/* Profile Top */}
            <div className="px-5 py-5 bg-gradient-to-br from-purple-700 to-indigo-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                  {getInitials(displayName)}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xl font-bold truncate">
                    {displayName}
                  </h3>
                  <p className="text-sm text-white/85">
                    Dealer ID: {displayDealerId}
                  </p>

                  {dealerProfile?.status && (
                    <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {dealerProfile.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3">
              <ProfileRow
                icon={<FaEnvelope />}
                label="Email"
                value={dealerProfile?.email}
              />

              <ProfileRow
                icon={<FaPhoneAlt />}
                label="Phone Number"
                value={dealerProfile?.phoneNumber}
              />

              <ProfileRow
                icon={<FaMapMarkerAlt />}
                label="State"
                value={dealerProfile?.city}
              />

              <ProfileRow
                icon={<FaIdCard />}
                label="GST Number"
                value={dealerProfile?.gstNumber}
              />

              <ProfileRow
                icon={<FaStore />}
                label="Shop Name"
                value={dealerProfile?.shopName}
              />

              <ProfileRow
                icon={<FaMapMarkerAlt />}
                label="Shop Address"
                value={dealerProfile?.shopAddress}
              />

              <ProfileRow
                icon={<FaCalendarAlt />}
                label="Subscription Start"
                value={formatDateTime(dealerProfile?.subscriptionStart)}
              />

              <ProfileRow
                icon={<FaCalendarAlt />}
                label="Subscription End"
                value={formatDateTime(dealerProfile?.subscriptionEnd)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-bold">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-800 break-words mt-0.5">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}