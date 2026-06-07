import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaUpload,
  FaRupeeSign,
  FaUserFriends,
  FaCoins,
} from "react-icons/fa";
import DealerBottomNav from "../dealer/DealerBottomNav";
import { useGirvi } from "./GirviContext";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

export default function AddGirvi() {
  const nav = useNavigate();
  const location = useLocation();

  const navState = location.state as any;
  const returnTo = navState?.returnTo || "/dealer/coustomer";

  const { customer, setCustomer, loanDetails, setLoanDetails, resetGirvi } = useGirvi();

  const token = localStorage.getItem("ps_token");
  const dealerId = localStorage.getItem("ps_dealer_id");

  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  
  // Validation error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    itemName: "",
    itemType: "GOLD",
    itemWeightGram: "",
    ratePerGram: "",
    interestRate: "",
    girviDate: "",
    maturityDate: "",
    remarks: "",
  });

  function update(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error for the field being typed in
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  }

  // Intercept router state and clear stale data
  useEffect(() => {
    if (navState?.customerId) {
      const incomingId = String(navState.customerId);
      const currentId = String(customer?.id || customer?.customerId || "");

      if (currentId !== incomingId) {
        resetGirvi();
        setCustomer({
          id: navState.customerId,
          customerId: navState.customerId,
          fullName: navState.customerName,
          customerName: navState.customerName,
        });
      }
    }
  }, [navState, customer?.id, customer?.customerId, resetGirvi, setCustomer]);

  const resolvedCustomerId =
    loanDetails.customerId ||
    customer?.id ||
    customer?.customerId ||
    customer?.customer_id;

  const customerName =
    customer?.fullName ||
    customer?.name ||
    customer?.customerName ||
    "Selected Customer";

  useEffect(() => {
    if (!loanDetails.customerId) {
      const savedCustomerId =
        customer?.id ||
        customer?.customerId ||
        customer?.customer_id;

      if (savedCustomerId) {
        setLoanDetails((prev: any) => ({
          ...prev,
          customerId: savedCustomerId,
        }));
      }
    }
  }, [loanDetails.customerId, customer, setLoanDetails]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const totalValue =
    Number(form.itemWeightGram || 0) * Number(form.ratePerGram || 0);

  function handlePhotoChange(file: File | null) {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    if (!file) {
      setPhoto(null);
      setPhotoPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, photo: "Only image files allowed" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "Photo must be less than 5MB" }));
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, photo: "" }));
  }

  async function saveGirvi() {
    const newErrors: Record<string, string> = {};
    const customerId = resolvedCustomerId || localStorage.getItem("ps_customer_id");

    if (!customerId) newErrors.customer = "Customer not selected";
    if (!form.itemName.trim()) newErrors.itemName = "Please enter item name";
    if (!form.itemWeightGram || Number(form.itemWeightGram) <= 0) newErrors.itemWeightGram = "Enter valid weight";
    if (!form.ratePerGram || Number(form.ratePerGram) <= 0) newErrors.ratePerGram = "Enter valid rate";
    if (form.interestRate === "" || Number(form.interestRate) < 0) newErrors.interestRate = "Enter valid interest rate";
    if (!form.girviDate) newErrors.girviDate = "Select girvi date";
    if (!form.maturityDate) newErrors.maturityDate = "Select maturity date";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!token) {
      alert("Session expired. Please login again.");
      nav("/", { replace: true });
      return;
    }

    if (!dealerId) {
      alert("Dealer ID not found. Please login again.");
      return;
    }

    setLoading(true);

    try {
      const girviPayload = {
        customerId: Number(customerId),
        itemName: form.itemName.trim(),
        itemType: form.itemType,
        itemWeightGram: Number(form.itemWeightGram),
        ratePerGram: Number(form.ratePerGram),
        interestRate: Number(form.interestRate),
        girviDate: form.girviDate,
        maturityDate: form.maturityDate,
        remarks: form.remarks.trim(),
      };

      const formData = new FormData();
      formData.append("girvi", JSON.stringify(girviPayload));

      if (photo) {
        formData.append("photo", photo);
      }

      const res = await fetch(`${API_BASE}/girvi/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerId,
        },
        body: formData,
      });

      if (res.status === 401 || res.status === 403) {
        alert("Session expired or unauthorized. Please login again.");
        nav("/", { replace: true });
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save girvi");
      }

      alert("Girvi added successfully");
      nav(returnTo, { replace: true });
    } catch (err: any) {
      setErrors({ form: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-32 xl:pb-10">
      <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] xl:rounded-b-[40px] px-5 xl:px-10 py-6 xl:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => nav(returnTo)}
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25"
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <div className="text-center xl:hidden">
              <h1 className="font-bold text-lg">Add Girvi</h1>
              <p className="text-xs opacity-80">PawnSecure</p>
            </div>
            <div className="hidden xl:block">
              <p className="text-sm opacity-80">PawnSecure Dealer Portal</p>
            </div>
            <div className="w-10" />
          </div>

          <div className="xl:flex xl:items-end xl:justify-between">
            <div>
              <p className="hidden xl:block text-sm opacity-80 mb-2">Girvi Management</p>
              <h2 className="text-2xl xl:text-4xl font-bold">Add New Girvi</h2>
            </div>
            <div className="hidden xl:grid grid-cols-3 gap-4 mt-6 min-w-[420px]">
              <HeaderStat icon={<FaUserFriends />} label="Customer" value="Selected" />
              <HeaderStat icon={<FaCoins />} label="Item Type" value={form.itemType} />
              <HeaderStat icon={<FaRupeeSign />} label="Value" value={`₹${totalValue.toFixed(0)}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 xl:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 xl:p-8 space-y-7">
              <Section title="Customer Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Info label="Customer ID" value={resolvedCustomerId || "Not selected"} />
                  <Info label="Customer Name" value={customerName} />
                </div>
                {errors.customer && <p className="text-red-500 text-xs mt-2">{errors.customer}</p>}
              </Section>

              <Section title="Girvi Dates & Interest">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Girvi Date" type="date" value={form.girviDate} onChange={(v: any) => update("girviDate", v)} error={errors.girviDate} />
                  <Input label="Maturity Date" type="date" value={form.maturityDate} onChange={(v: any) => update("maturityDate", v)} error={errors.maturityDate} />
                  <Input label="Interest Rate (%)" type="number" value={form.interestRate} onChange={(v: any) => update("interestRate", v)} error={errors.interestRate} />
                </div>
              </Section>

              <Section title="Item Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Item Name" value={form.itemName} onChange={(v: any) => update("itemName", v)} error={errors.itemName} />
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Item Type</label>
                    <select value={form.itemType} onChange={(e) => update("itemType", e.target.value)} className="w-full mt-1 px-4 py-3 rounded-2xl border bg-gray-50 outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                    </select>
                  </div>
                  <Input label="Weight (Gram)" type="number" value={form.itemWeightGram} onChange={(v: any) => update("itemWeightGram", v)} error={errors.itemWeightGram} />
                  <Input label="Rate per Gram (₹)" type="number" value={form.ratePerGram} onChange={(v: any) => update("ratePerGram", v)} error={errors.ratePerGram} />
                </div>
                <div className="mt-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 text-purple-800 rounded-2xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold opacity-70">Calculated Item Value</p>
                    <p className="text-2xl font-bold">₹ {totalValue.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center"><FaRupeeSign /></div>
                </div>
              </Section>

              <Section title="Upload Item Photo">
                <label className="flex flex-col md:flex-row items-center justify-center gap-4 border-dashed border-2 border-purple-200 rounded-2xl p-5 cursor-pointer bg-purple-50/40 hover:bg-purple-50 transition">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Item preview" className="w-28 h-28 rounded-2xl object-cover border bg-white" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center"><FaUpload className="text-xl" /></div>
                  )}
                  <div className="text-center md:text-left">
                    <p className="text-sm font-bold text-gray-800">{photo ? photo.name : "Choose Item Image"}</p>
                    <p className="text-xs text-gray-500 mt-1">Optional. Upload JPG, PNG or WEBP. Max 5MB.</p>
                  </div>
                  <input type="file" accept="image/*" hidden onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)} />
                </label>
                {errors.photo && <p className="text-red-500 text-xs mt-2">{errors.photo}</p>}
              </Section>

              <Section title="Remarks">
                <textarea value={form.remarks} onChange={(e) => update("remarks", e.target.value)} className="w-full border rounded-2xl p-4 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-purple-500" placeholder="Optional remarks" rows={4} />
              </Section>

              <button type="button" onClick={saveGirvi} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
                <FaSave />
                {loading ? "Saving..." : "Save Girvi"}
              </button>
              {errors.form && <p className="text-red-500 text-center">{errors.form}</p>}
            </div>
          </div>

          <div className="hidden xl:block xl:col-span-4">
            <div className="sticky top-6 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Girvi Summary</h3>
                <div className="space-y-3">
                  <SummaryRow label="Customer ID" value={resolvedCustomerId || "—"} />
                  <SummaryRow label="Customer" value={customerName} />
                  <SummaryRow label="Item" value={form.itemName || "—"} />
                  <SummaryRow label="Type" value={form.itemType} />
                  <SummaryRow label="Weight" value={form.itemWeightGram ? `${form.itemWeightGram} gm` : "—"} />
                  <SummaryRow label="Rate" value={form.ratePerGram ? `₹${form.ratePerGram}/gm` : "—"} />
                </div>
                <div className="mt-5 bg-purple-600 text-white rounded-2xl p-5">
                  <p className="text-xs opacity-80">Total Value</p>
                  <p className="text-3xl font-bold mt-1">₹ {totalValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="xl:hidden"><DealerBottomNav /></div>
    </div>
  );
}

// UI HELPERS
function HeaderStat({ icon, label, value }: any) {
  return (
    <div className="bg-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-white/80 text-xs">{icon} <span>{label}</span></div>
      <p className="font-bold mt-2 text-white truncate">{value}</p>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <h3 className="font-bold text-base text-gray-900 mb-3">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, error }: any) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder || label}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full mt-1 px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none focus:ring-2 ${error ? "border-red-400 focus:ring-red-200" : "focus:ring-purple-500"}`}
      />
      {error && <p className="text-red-500 text-[10px] mt-1 font-medium">{error}</p>}
    </div>
  );
}

function Info({ label, value }: any) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm">
      <p className="text-xs text-gray-500 font-semibold">{label}</p>
      <p className="font-bold text-gray-800 mt-1 break-words">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: any) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800 text-right truncate">{value}</span>
    </div>
  );
}