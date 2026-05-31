import { useNavigate } from "react-router-dom";
import { useGirvi } from "./GirviContext";
import DealerBottomNav from "../dealer/DealerBottomNav";

export default function CustomerSearch() {
  const nav = useNavigate();
  const { setCustomer } = useGirvi();

  // ✅ Dummy data (replace with API later)
  const customers = [
    { id: 1, name: "Ramesh Kumar", phone: "9876543210" },
    { id: 2, name: "Suresh Babu", phone: "9123456780" },
  ];

  function selectCustomer(cust: any) {
    setCustomer(cust);
    nav("/dealer/customer-details");
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-32 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            Select Customer
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Choose an existing customer to continue Girvi process.
          </p>
        </div>

        <div className="space-y-3">
          {customers.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCustomer(c)}
              className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 active:scale-[0.99] transition"
            >
              <p className="font-bold text-gray-900">{c.name}</p>

              <p className="text-sm text-gray-500 mt-1">{c.phone}</p>

              <p className="text-xs text-purple-600 font-semibold mt-3">
                Tap to continue →
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ✅ BOTTOM NAV */}
      <DealerBottomNav />
    </div>
  );
}