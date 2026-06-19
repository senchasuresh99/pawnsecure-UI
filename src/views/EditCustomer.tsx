import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DealerSidebar from "../dealer/DealerSidebar";
import MobileDealerSidebar from "../dealer/MobileDealerSidebar";
import DealerMobileBottomNav from "../dealer/DealerMobileBottomNav";
import {
  FaArrowLeft,
  FaPhone,
  FaMapMarkerAlt,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const API_BASE = "https://pawnsecure.onrender.com/api";

type CustomerResponseDTO = {
  id: number;
  fullName: string;
  customerAddress?: string;
  phoneNumber?: string;
  kycStatus?: string;
  aadhaarLastFour?: string;
  maskedAadhaar?: string;
};

export default function EditCustomer() {
  const navigate = useNavigate();
  const { id } = useParams();

  const query = new URLSearchParams(window.location.search);
  const isAdminView = query.get("adminView") === "true";

  const dealerName =
    query.get("dealerName") ||
    localStorage.getItem("ps_dealer_name") ||
    "Dealer";

  const dealerId =
    query.get("dealerId") || localStorage.getItem("ps_dealer_id") || "-";

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [customer, setCustomer] = useState<CustomerResponseDTO | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadCustomer() {
    const currentDealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!id || !currentDealerId || !token) {
      setError("Session expired. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      /*
        ✅ First try dealer-protected detail API
        ✅ If it fails, fallback to allCustomer list and find customer by id
      */
      const detailRes = await fetch(`${API_BASE}/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": currentDealerId,
        },
      });

      if (detailRes.ok) {
        const data: CustomerResponseDTO = await detailRes.json();
        setCustomer(data);
        setPhoneNumber(data.phoneNumber || "");
        setCustomerAddress(data.customerAddress || "");
        return;
      }

      const allRes = await fetch(`${API_BASE}/customers/allCustomer`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": currentDealerId,
        },
      });

      if (!allRes.ok) {
        setError("Failed to load customer details");
        return;
      }

      const list: CustomerResponseDTO[] = await allRes.json();
      const found = list.find((c) => String(c.id) === String(id));

      if (!found) {
        setError("Customer not found");
        return;
      }

      setCustomer(found);
      setPhoneNumber(found.phoneNumber || "");
      setCustomerAddress(found.customerAddress || "");
    } catch {
      setError("Server unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  function validatePhone(phone: string) {
    return /^[6-9][0-9]{9}$/.test(phone);
  }

  async function updateCustomer() {
    const currentDealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!id || !currentDealerId || !token) {
      setError("Session expired. Please login again.");
      return;
    }

    setError("");
    setSuccess("");

    if (!phoneNumber.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (!validatePhone(phoneNumber.trim())) {
      setError("Phone number must be 10 digits and start with 6, 7, 8, or 9.");
      return;
    }

    if (!customerAddress.trim()) {
      setError("Address is required.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": currentDealerId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          customerAddress: customerAddress.trim(),
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          const data = await res.json();

          if (data.phoneNumber) {
            setError(data.phoneNumber);
            return;
          }

          if (data.customerAddress) {
            setError(data.customerAddress);
            return;
          }

          setError("Failed to update customer");
          return;
        }

        const msg = await res.text();
        setError(msg || "Failed to update customer");
        return;
      }

      const updated: CustomerResponseDTO = await res.json();

      setCustomer(updated);
      setPhoneNumber(updated.phoneNumber || "");
      setCustomerAddress(updated.customerAddress || "");

      setSuccess("Customer updated successfully.");

      setTimeout(() => {
        navigate("/dealer/customers");
      }, 900);
    } catch {
      setError("Server unavailable. Please try again later.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans">
      {/* ================= DESKTOP ================= */}
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={isAdminView} />

        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Edit Customer
              </h2>
              <p className="text-xs text-gray-500">
                Update customer phone number and address
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dealer/customers")}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm flex items-center gap-2 hover:bg-gray-200 transition"
            >
              <FaArrowLeft /> Back
            </button>
          </header>

          <div className="p-6 xl:p-8 max-w-[900px] w-full mx-auto flex-1">
            <EditForm
              loading={loading}
              saving={saving}
              error={error}
              success={success}
              customer={customer}
              phoneNumber={phoneNumber}
              customerAddress={customerAddress}
              setPhoneNumber={setPhoneNumber}
              setCustomerAddress={setCustomerAddress}
              updateCustomer={updateCustomer}
              cancel={() => navigate("/dealer/customers")}
            />
          </div>
        </main>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="lg:hidden min-h-screen bg-[#f4f5f7] pb-32">
        <MobileDealerSidebar
          open={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
          isAdminView={isAdminView}
          dealerName={dealerName}
          dealerId={dealerId}
        />

        <header className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isAdminView) {
                  navigate("/admin/dashboard");
                  return;
                }

                setShowMobileSidebar(true);
              }}
              className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl text-gray-700 active:bg-gray-100"
            >
              {isAdminView ? "←" : "☰"}
            </button>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Edit Customer
              </h2>
              <p className="text-[11px] text-gray-500">
                Phone & address only
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dealer/customers")}
            className="text-xs font-bold text-purple-700"
          >
            Back
          </button>
        </header>

        <div className="max-w-md mx-auto px-4 pt-4">
          <EditForm
            loading={loading}
            saving={saving}
            error={error}
            success={success}
            customer={customer}
            phoneNumber={phoneNumber}
            customerAddress={customerAddress}
            setPhoneNumber={setPhoneNumber}
            setCustomerAddress={setCustomerAddress}
            updateCustomer={updateCustomer}
            cancel={() => navigate("/dealer/customers")}
          />
        </div>

        <DealerMobileBottomNav active="customers" isAdminView={isAdminView} />
      </div>
    </div>
  );
}

/* ================= FORM ================= */

function EditForm({
  loading,
  saving,
  error,
  success,
  customer,
  phoneNumber,
  customerAddress,
  setPhoneNumber,
  setCustomerAddress,
  updateCustomer,
  cancel,
}: any) {
  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 sm:p-8">
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 font-semibold">
            Loading customer...
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {customer?.fullName || "Customer"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Only phone number and address can be updated.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 border border-green-100 rounded-xl px-4 py-3 mb-5 text-sm font-semibold">
              {success}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Phone Number
              </label>

              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center border border-gray-100 focus-within:border-purple-400">
                <FaPhone className="text-gray-400 mr-3" />
                <input
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="w-full outline-none text-sm text-gray-700 bg-transparent"
                  placeholder="Enter 10 digit mobile number"
                  maxLength={10}
                />
              </div>

              <p className="text-[11px] text-gray-400 mt-1">
                Must be 10 digits and start with 6, 7, 8, or 9.
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Full Address
              </label>

              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-start border border-gray-100 focus-within:border-purple-400">
                <FaMapMarkerAlt className="text-gray-400 mr-3 mt-1" />
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full outline-none text-sm text-gray-700 bg-transparent min-h-[120px] resize-none"
                  placeholder="Enter customer full address"
                  maxLength={2000}
                />
              </div>

              <p className="text-[11px] text-gray-400 mt-1">
                Maximum 2000 characters.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              type="button"
              onClick={updateCustomer}
              disabled={saving}
              className="flex-1 bg-[#7128E6] hover:bg-[#5b1abf] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm"
            >
              <FaSave />
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm border border-gray-100"
            >
              <FaTimes />
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}