import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUserFriends,
  FaRupeeSign,
  FaCoins,
  FaChartBar,
  FaSignOutAlt,
  FaTimes,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaStore,
  FaIdCard,
  FaShieldAlt,
  FaCalendarAlt,
  FaUserCircle,
} from "react-icons/fa";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

type DealerSidebarProps = {
  isAdminView?: boolean;
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

export default function DealerSidebar({
  isAdminView = false,
}: DealerSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(
    null
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [showDealerDetails, setShowDealerDetails] = useState(false);

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

  function normalizeDealerId(id: string | null | undefined) {
    if (!id || id === "-") return "";
    return String(id).replace(/^DP/i, "");
  }

  function getDealerIdDisplay(id: string | number | null | undefined) {
    if (!id || id === "-") return "-";

    const value = String(id);

    return value.startsWith("DP") ? value : `DP${value}`;
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
    const rawDealerId = localStorage.getItem("ps_dealer_id") || "-";
    const cleanDealerId = normalizeDealerId(rawDealerId);

    if (!cleanDealerId) {
      setProfileError("Dealer ID not found");
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError("");

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

        setProfileError(msg || "Unable to load dealer profile");
        return;
      }

      const data: DealerProfile = await res.json();

      setDealerProfile(data);

      localStorage.setItem("ps_dealer_id", String(data.id));
      localStorage.setItem("ps_dealer_name", data.name);
    } catch (error) {
      console.error("Failed to fetch dealer profile", error);
      setProfileError("Unable to load dealer profile");
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    fetchDealerProfile();
  }, []);

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

  const displayName =
    dealerProfile?.name ||
    localStorage.getItem("ps_dealer_name") ||
    "Dealer";

  const displayDealerId = getDealerIdDisplay(
    dealerProfile?.id || localStorage.getItem("ps_dealer_id")
  );

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 px-5 py-6 fixed left-0 top-0 bottom-0 z-40 flex flex-col">
        {/* Logo */}
        <button
          type="button"
          onClick={() => setShowDealerDetails(true)}
          className="flex items-center gap-3 mb-5 text-left hover:bg-purple-50 rounded-2xl p-2 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <img
              src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
              alt="PawnSecure"
              className="w-10 h-10 bg-white rounded-lg p-1 object-contain"
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-purple-700 truncate">
              PawnSecure
            </h1>
            <p className="text-xs text-gray-500">
              {isAdminView ? "Admin Preview" : "Dealer Portal"}
            </p>
          </div>
        </button>

        {/* Dealer Profile Card */}
        <button
          type="button"
          onClick={() => setShowDealerDetails(true)}
          className="mb-6 bg-gradient-to-br from-purple-700 to-indigo-600 text-white rounded-2xl p-3 flex items-center gap-3 text-left hover:shadow-md active:scale-[0.99] transition"
        >
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold shrink-0">
            {profileLoading ? "..." : getInitials(displayName)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm truncate">
              {profileLoading ? "Loading..." : displayName}
            </p>
            <p className="text-xs text-white/85">
              Dealer ID: {displayDealerId}
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">
              Click to view profile
            </p>
          </div>
        </button>

        {/* Admin View Banner */}
        {isAdminView && (
          <div className="mb-5 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm font-semibold">
            Viewing dealer dashboard as Admin
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-3 flex-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const disabled =
              item.disabled ||
              (isAdminView && item.path !== "/dealer/dashboard");

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
                title={
                  disabled ? "This feature is currently disabled" : item.label
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 bg-red-50 text-red-600 px-4 py-3.5 rounded-xl flex items-center gap-3 hover:bg-red-100 cursor-pointer font-semibold text-sm transition"
        >
          <FaSignOutAlt className="text-lg" />
          <span>{isAdminView ? "Back to Admin" : "Logout"}</span>
        </button>
      </aside>

      {/* Dealer Details Modal */}
      {showDealerDetails && (
        <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-purple-700 to-indigo-600 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Dealer Profile</h2>
                <p className="text-sm text-white/80">
                  Logged-in dealer details
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDealerDetails(false)}
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
              >
                <FaTimes />
              </button>
            </div>

            {profileLoading ? (
              <div className="p-10 text-center text-gray-500">
                Loading dealer profile...
              </div>
            ) : profileError ? (
              <div className="p-10 text-center">
                <FaUserCircle className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">{profileError}</p>
                <button
                  type="button"
                  onClick={fetchDealerProfile}
                  className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {/* Profile Top */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
                    {getInitials(displayName)}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      {displayName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Dealer ID: {displayDealerId}
                    </p>

                    {dealerProfile?.status && (
                      <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                        {dealerProfile.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
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
              </>
            )}
          </div>
        </div>
      )}
    </>
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
    <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-bold">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-800 break-words mt-1">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}