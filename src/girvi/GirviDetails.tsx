import { useNavigate } from "react-router-dom";
import { useGirvi } from "./GirviContext";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import DealerBottomNav from "../dealer/DealerBottomNav";

export default function GirviDetails() {
  const nav = useNavigate();
  const { loanDetails, setLoanDetails } = useGirvi();

  function update(key: string, value: any) {
    setLoanDetails({ ...loanDetails, [key]: value });
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-32">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => nav(-1)}>
            <FaArrowLeft className="text-xl" />
          </button>

          <div className="text-center">
            <h1 className="font-bold text-lg">New Girvi</h1>
            <p className="text-xs opacity-80">PawnSecure</p>
          </div>

          <div className="w-6" />
        </div>

        <h2 className="text-2xl font-bold">Girvi Details</h2>
        <p className="text-sm opacity-80 mt-1">
          Enter loan & interest details
        </p>
      </div>

      {/* CARD */}
      <div className="max-w-md mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          {/* STEP INDICATOR */}
          <div className="flex justify-between items-center text-xs font-semibold mb-6">
            <span className="text-green-600">Customer</span>
            <div className="flex-1 h-[2px] bg-green-600 mx-2" />

            <span className="text-purple-600">Girvi</span>
            <div className="flex-1 h-[2px] bg-purple-600 mx-2" />

            <span className="text-gray-400">Items</span>
            <div className="flex-1 h-[2px] bg-gray-300 mx-2" />

            <span className="text-gray-400">Review</span>
          </div>

          {/* FORM */}
          <div className="space-y-4">
            <Input
              label="Loan Amount (₹)"
              value={loanDetails.amount}
              onChange={(v: any) => update("amount", v)}
              placeholder="Enter loan amount"
            />

            <Input
              label="Interest Rate (%)"
              value={loanDetails.interestRate}
              onChange={(v: any) => update("interestRate", v)}
              placeholder="Enter interest rate"
            />

            <div>
              <label className="text-xs text-gray-500 font-semibold">
                Interest Type
              </label>

              <select
                value={loanDetails.interestType}
                onChange={(e) => update("interestType", e.target.value)}
                className="w-full mt-1 border rounded-2xl px-4 py-3 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500"
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <Input
              type="date"
              label="Pledge Date"
              value={loanDetails.pledgeDate}
              onChange={(v: any) => update("pledgeDate", v)}
            />

            <Input
              type="date"
              label="Maturity Date"
              value={loanDetails.maturityDate}
              onChange={(v: any) => update("maturityDate", v)}
            />
          </div>

          {/* NEXT BUTTON */}
          <button
            type="button"
            onClick={() => nav("/dealer/items")}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            Next: Item Details
            <FaArrowRight />
          </button>
        </div>
      </div>

      {/* ✅ BOTTOM NAV */}
      <DealerBottomNav />
    </div>
  );
}

/* ---------------- INPUT ---------------- */

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: any) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-semibold">{label}</label>

      <input
        type={type}
        value={value}
        placeholder={placeholder || label}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border rounded-2xl px-4 py-3 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );
}