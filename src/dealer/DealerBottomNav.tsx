import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUserFriends,
  FaRupeeSign,
  FaCoins,
  FaEllipsisH,
  FaUserPlus,
  FaUserCheck,
} from "react-icons/fa";
import type { ReactNode } from "react";

type DashboardControl = "FULLVIEW" | "PARTIALITY";

type NavItem = {
  label: string;
  icon: ReactNode;
  path: string;
  activePaths: string[];
  state?: any;
  disabled?: boolean;
};

export default function DealerBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardControl = String(
    localStorage.getItem("ps_dashboard_control") || "FULLVIEW"
  ).toUpperCase() as DashboardControl;

  function isActive(paths: string[]) {
    return paths.some((path) => location.pathname === path);
  }

  const fullViewNavItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: <FaHome className="text-xl mb-1" />,
      path: "/dealer/dashboard",
      activePaths: ["/dealer/dashboard"],
    },
    {
      label: "Customers",
      icon: <FaUserFriends className="text-xl mb-1" />,
      path: "/dealer/customer-register",
      activePaths: [
        "/dealer/customers",
        "/dealer/customer-register",
        "/dealer/add-customer",
        "/dealer/customer-search",
      ],
    },
    {
      label: "Girvi",
      icon: <FaRupeeSign className="text-xl mb-1" />,
      path: "/dealer/customer",
      activePaths: [
        "/dealer/customer",
        "/dealer/details",
        "/dealer/items",
        "/dealer/review",
        "/dealer/success",
      ],
    },
    {
      label: "Collections",
      icon: <FaCoins className="text-xl mb-1" />,
      path: "/dealer/collections",
      activePaths: ["/dealer/collections"],
      disabled: true,
    },
    {
      label: "More",
      icon: <FaEllipsisH className="text-xl mb-1" />,
      path: "/dealer/more",
      activePaths: ["/dealer/more"],
      disabled: true,
    },
  ];

  const partialityNavItems: NavItem[] = [
    {
      label: "Home",
      icon: <FaHome className="text-xl mb-1" />,
      path: "/dealer/dashboard-partial",
      activePaths: ["/dealer/dashboard-partial"],
    },
    {
      label: "Register",
      icon: <FaUserPlus className="text-xl mb-1" />,
      path: "/dealer/customer-register",
      activePaths: ["/dealer/customer-register", "/dealer/add-customer"],
      state: { mode: "CUSTOMER_REVIEW" },
    },
    {
      label: "Review",
      icon: <FaUserCheck className="text-xl mb-1" />,
      path: "/dealer/customer-search",
      activePaths: ["/dealer/customer-search"],
      state: { mode: "RENEWAL_EXTEND" },
    },
  ];

  const navItems: NavItem[] =
    dashboardControl === "PARTIALITY"
      ? partialityNavItems
      : fullViewNavItems;

  function handleNavigate(item: NavItem) {
    if (item.disabled) return;

    if (item.state) {
      navigate(item.path, { state: item.state });
      return;
    }

    navigate(item.path);
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-3 z-50 xl:hidden">
      {navItems.map((item) => {
        const active = isActive(item.activePaths);

        return (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            onClick={() => handleNavigate(item)}
            className={`flex flex-col items-center text-xs ${
              dashboardControl === "PARTIALITY" ? "w-24" : "w-16"
            } ${
              item.disabled
                ? "text-gray-300 cursor-not-allowed opacity-60"
                : active
                ? "text-purple-700 font-semibold"
                : "text-gray-500"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}