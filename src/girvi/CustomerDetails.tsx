import { useNavigate } from "react-router-dom";
import { useGirvi } from "./GirviContext";
import DealerBottomNav from "../dealer/DealerBottomNav";

export default function CustomerDetails() {
  const nav = useNavigate();
  const { customer } = useGirvi();

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] pb-32 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            No customer selected
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Please register or select a customer before continuing to Girvi.
          </p>

          <button
            type="button"
            onClick={() => nav("/dealer/customer-register")}
            className="w-full mt-5 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-2xl font-bold"
          >
            Go to Customer Register
          </button>
        </div>

        <DealerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-32 p-4">
      <div className="max-w-md mx-auto">
        <h2 className="text-lg font-bold mb-4 text-gray-900">
          Customer Details
        </h2>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-2xl px-4 py-3 font-semibold mb-4">
            ✅ Aadhaar Verified Successfully
          </p>

          <div className="space-y-3 text-sm">
            <Row
              label="Name"
              value={
                customer.fullName ||
                customer.name ||
                customer.customerName ||
                "N/A"
              }
            />

            <Row
              label="Phone"
              value={
                customer.phoneNumber ||
                customer.phone ||
                customer.mobile ||
                "N/A"
              }
            />

            {(customer.maskedAadhaar || customer.aadhaar) && (
              <Row
                label="Aadhaar"
                value={customer.maskedAadhaar || customer.aadhaar}
              />
            )}

            {customer.dob && <Row label="DOB" value={customer.dob} />}

            {customer.gender && <Row label="Gender" value={customer.gender} />}

            {customer.address && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-gray-500 text-xs font-semibold mb-1">
                  Address
                </p>
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                  {customer.address}
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => nav("/dealer/details")}
          className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-2xl font-bold"
        >
          Continue to Girvi Details
        </button>
      </div>

      <DealerBottomNav />
    </div>
  );
}

/* ✅ ROW */
function Row({ label, value }: any) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800 text-right">
        {value || "N/A"}
      </span>
    </div>
  );
}