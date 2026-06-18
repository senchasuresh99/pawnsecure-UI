import { type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUserFriends,
  FaRupeeSign,
  FaCoins,
  FaEllipsisH,
} from "react-icons/fa";

type BottomNavKey = "home" | "customers" | "girvi" | "collect" | "more";

type BottomAction = {
  key: BottomNavKey;
  label: string;
  icon: ReactNode;
  path: string;
  state?: any;
  disabled?: boolean;
};

type DealerMobileBottomNavProps = {
  active?: BottomNavKey;
  isAdminView?: boolean;
  showCollect?: boolean;
};

export default function DealerMobileBottomNav({
  active,
  isAdminView = false,
  showCollect = true,
}: DealerMobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  if (isAdminView) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-3 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <button
          type="button"
          onClick={() => navigate("/admin/dashboard", { replace: true })}
          className="w-full bg-purple-600 active:bg-purple-700 text-white py-3 rounded-xl font-bold transition"
        >
          Back to Admin Dashboard
        </button>
      </div>
    );
  }

  const bottomActions: BottomAction[] = [
    {
      key: "home",
      label: "Home",
      icon: <FaHome />,
      path: "/dealer/dashboard",
    },
    {
      key: "customers",
      label: "Customers",
      icon: <FaUserFriends />,
      path: "/dealer/customers",
    },
    {
      key: "girvi",
      label: "Girvi",
      icon: <FaRupeeSign />,
      path: "/dealer/customer",
    },
    {
      key: "collect",
      label: "Collect",
      icon: <FaCoins />,
      path: "/dealer/collections",
      disabled: true,
    },
    {
      key: "more",
      label: "More",
      icon: <FaEllipsisH />,
      path: "/dealer/more",
      disabled: true,
    },
  ];

  const visibleActions = bottomActions.filter(
    (item) => showCollect || item.key !== "collect"
  );

  function isActive(item: BottomAction) {
    if (item.disabled) return false;

    if (active) return active === item.key;

    const pathname = location.pathname;

    if (item.key === "home") {
      return pathname === "/dealer/dashboard";
    }

    if (item.key === "customers") {
      return (
        pathname === "/dealer/customers" ||
        pathname === "/dealer/customer-register" ||
        pathname === "/dealer/add-customer" ||
        pathname === "/dealer/customer-search"
      );
    }

    if (item.key === "girvi") {
      return (
        pathname === "/dealer/customer" ||
        pathname === "/dealer/new-girvi" ||
        pathname === "/dealer/details"
      );
    }

    if (item.key === "collect") {
      return pathname === "/dealer/collections";
    }

    if (item.key === "more") {
      return pathname === "/dealer/more";
    }

    return false;
  }

  function handleNavigate(item: BottomAction) {
    if (item.disabled) {
      return;
    }

    if (item.state) {
      navigate(item.path, { state: item.state });
      return;
    }

    navigate(item.path);
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around py-2 px-1 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      {visibleActions.map((item) => {
        const activeItem = isActive(item);

        return (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={() => handleNavigate(item)}
            className={`flex flex-col items-center text-[10px] w-16 transition ${
              item.disabled
                ? "text-gray-300 font-medium cursor-not-allowed opacity-60"
                : activeItem
                ? "text-purple-700 font-semibold"
                : "text-gray-500 hover:text-gray-900 font-medium"
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}