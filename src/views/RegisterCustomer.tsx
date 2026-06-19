import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const API_BASE = "https://pawnsecure.onrender.com/api";

export default function RegisterCustomer() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract data from navigation state
  const aadhaarData = location.state?.aadhaarData;

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<any>(null);

  // Initialize state with empty strings, then populate via useEffect
  const [formData, setFormData] = useState({
    fullName: "",
    aadhaarNumber: "",
    gender: "",
    address: "",
    mobileNumber: "",
  });

  // Use useEffect to sync state when aadhaarData arrives
  useEffect(() => {
    if (aadhaarData) {
      setFormData({
        fullName: aadhaarData.name || "",
        aadhaarNumber: aadhaarData.aadhaarNumber || "",
        gender: aadhaarData.gender || "",
        address: aadhaarData.address || "",
        mobileNumber: "",
      });
    }
  }, [aadhaarData]);

  function showPopup(type: "success" | "error", message: string) {
    setPopup({ type, message });
  }

  async function registerCustomer() {
    if (formData.aadhaarNumber.length < 12) {
      showPopup("error", "Enter a valid 12-digit [Aadhaar Redacted] number");
      return;
    }
    if (formData.mobileNumber.length !== 10) {
      showPopup("error", "Enter a valid 10-digit mobile number");
      return;
    }

    const token = localStorage.getItem("ps_token");

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.fullName,
          aadhaar: formData.aadhaarNumber,
          gender: formData.gender,
          customerAddress: formData.address,
          phoneNumber: formData.mobileNumber,
        }),
      });

      const message = await response.text();
      if (!response.ok) {
        showPopup("error", message);
        return;
      }

      showPopup("success", "Customer registered successfully");
      setTimeout(() => {
        navigate("/dealer/customer-search");
      }, 1500);
    } catch {
      showPopup("error", "Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] p-4">
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Register Customer</h1>
        <p className="text-sm text-gray-500 mt-1">
          {aadhaarData 
            ? "Aadhaar details auto-filled from QR" 
            : "Enter customer details manually"}
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold">Full Name</label>
            <input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={`w-full mt-2 border rounded-xl px-4 py-3 ${aadhaarData ? "bg-gray-100" : "bg-white"}`}
              placeholder="Full Name"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">[Aadhaar Redacted] Number</label>
            <input
              value={formData.aadhaarNumber}
              readOnly={!!aadhaarData?.aadhaarNumber}
              onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value.replace(/\D/g, "") })}
              maxLength={12}
              className={`w-full mt-2 border rounded-xl px-4 py-3 ${aadhaarData?.aadhaarNumber ? "bg-gray-100" : "bg-white"}`}
              placeholder="Enter 12-digit [Aadhaar Redacted] number"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Gender</label>
            <input
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className={`w-full mt-2 border rounded-xl px-4 py-3 ${aadhaarData ? "bg-gray-100" : "bg-white"}`}
              placeholder="Gender"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className={`w-full mt-2 border rounded-xl px-4 py-3 ${aadhaarData ? "bg-gray-100" : "bg-white"}`}
              placeholder="Address"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Mobile Number</label>
            <input
              value={formData.mobileNumber}
              onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, "") })}
              maxLength={10}
              placeholder="Enter mobile number"
              className="w-full mt-2 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <button
          onClick={registerCustomer}
          disabled={loading}
          className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold"
        >
          {loading ? "Registering..." : "Register Customer"}
        </button>
      </div>

      {popup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className={`text-5xl mb-3 ${popup.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {popup.type === "success" ? "✔" : "✖"}
            </div>
            <h2 className="text-xl font-bold">{popup.type === "success" ? "Success" : "Error"}</h2>
            <p className="text-gray-600 mt-2">{popup.message}</p>
            <button
              onClick={() => setPopup(null)}
              className="mt-5 bg-purple-600 text-white px-5 py-2 rounded-xl"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}