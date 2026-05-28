import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

export default function RegisterCustomer() {

  const navigate = useNavigate();

  const location = useLocation();

  const aadhaarData =
    location.state?.aadhaarData;

  const [loading, setLoading] =
    useState(false);

  const [popup, setPopup] =
    useState<any>(null);

  const [formData, setFormData] =
    useState({

      fullName:
        aadhaarData?.name || "",

      aadhaarNumber:
        aadhaarData?.aadhaarNumber || "",

      gender:
        aadhaarData?.gender || "",

      address:
        aadhaarData?.address || "",

      mobileNumber: "",

    });

  function showPopup(
    type: "success" | "error",
    message: string
  ) {

    setPopup({
      type,
      message,
    });

  }

  async function registerCustomer() {

    if (
      formData.mobileNumber.length !== 10
    ) {

      showPopup(
        "error",
        "Enter valid mobile number"
      );

      return;

    }

    const token =
      localStorage.getItem("ps_token");

    try {

      setLoading(true);

      const response = await fetch(

        `${API_BASE}/customers`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,

          },
body: JSON.stringify({

  name:
    formData.fullName,

  aadhaar:
    formData.aadhaarNumber,

  gender:
    formData.gender,

  customerAddress:
    formData.address,

  phoneNumber:
    formData.mobileNumber,

}),
        }

      );

      const message =
        await response.text();

      if (!response.ok) {

        showPopup(
          "error",
          message
        );

        return;

      }

      showPopup(
        "success",
        "Customer registered successfully"
      );

      setTimeout(() => {

        navigate(
          "/dealer/customer-search"
        );

      }, 1500);

    } catch {

      showPopup(
        "error",
        "Server error"
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className="min-h-screen bg-[#f4f5f7] p-4">

      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Register Customer
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Aadhaar details auto-filled from QR
        </p>

        <div className="mt-6 space-y-4">

          <div>

            <label className="text-sm font-semibold">
              Full Name
            </label>

            <input
              value={formData.fullName}
              readOnly
              className="w-full mt-2 border rounded-xl px-4 py-3 bg-gray-100"
            />

          </div>

          <div>

            <label className="text-sm font-semibold">
              Aadhaar Number
            </label>

            <input
              value={formData.aadhaarNumber}
              readOnly
              className="w-full mt-2 border rounded-xl px-4 py-3 bg-gray-100"
            />

          </div>

          <div>

            <label className="text-sm font-semibold">
              Gender
            </label>

            <input
              value={formData.gender}
              readOnly
              className="w-full mt-2 border rounded-xl px-4 py-3 bg-gray-100"
            />

          </div>

          <div>

            <label className="text-sm font-semibold">
              Address
            </label>

            <textarea
              value={formData.address}
              readOnly
              rows={3}
              className="w-full mt-2 border rounded-xl px-4 py-3 bg-gray-100"
            />

          </div>

          <div>

            <label className="text-sm font-semibold">
              Mobile Number
            </label>

            <input
              value={formData.mobileNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mobileNumber:
                    e.target.value.replace(/\D/g, ""),
                })
              }
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
          {loading
            ? "Registering..."
            : "Register Customer"}
        </button>

      </div>

      {popup && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">

            <div
              className={`text-5xl mb-3 ${
                popup.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {popup.type === "success"
                ? "✔"
                : "✖"}
            </div>

            <h2 className="text-xl font-bold">
              {popup.type === "success"
                ? "Success"
                : "Error"}
            </h2>

            <p className="text-gray-600 mt-2">
              {popup.message}
            </p>

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