import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUserFriends,
  FaRupeeSign,
  FaCoins,
  FaEllipsisH,
} from "react-icons/fa";

export default function DealerBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  function isActive(paths: string[]) {
    return paths.some((path) => location.pathname === path);
  }

  const navItems = [
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
      activePaths: ["/dealer/customer-register", "/dealer/add-customer"],
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
    },
    {
      label: "More",
      icon: <FaEllipsisH className="text-xl mb-1" />,
      path: "/dealer/more",
      activePaths: ["/dealer/more"],
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-3 z-50 xl:hidden">
      {navItems.map((item) => {
        const active = isActive(item.activePaths);

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center text-xs ${
              active ? "text-purple-700 font-semibold" : "text-gray-500"
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