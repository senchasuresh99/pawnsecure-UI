import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaSave,
  FaUpload,
  FaRupeeSign,
  FaPlus,
  FaCheck,
  FaTimes
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
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    itemName: "",
    itemType: "Gold", // Capitalized to match UI
    itemWeightGram: "",
    ratePerGram: "",
    interestRate: "",
    girviDate: "",
    maturityDate: "",
    remarks: "",
  });

  function update(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
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

  const totalValue = Number(form.itemWeightGram || 0) * Number(form.ratePerGram || 0);

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

  // Handle Wizard Navigation
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    const customerId = resolvedCustomerId || localStorage.getItem("ps_customer_id");

    if (step === 1) {
      if (!customerId) newErrors.customer = "Customer not selected. Please go back and select a customer.";
    } else if (step === 2) {
      if (!form.itemName.trim()) newErrors.itemName = "Please enter item name";
      if (!form.itemWeightGram || Number(form.itemWeightGram) <= 0) newErrors.itemWeightGram = "Enter valid weight";
      if (!form.ratePerGram || Number(form.ratePerGram) <= 0) newErrors.ratePerGram = "Enter valid rate";
    } else if (step === 3) {
      if (form.interestRate === "" || Number(form.interestRate) < 0) newErrors.interestRate = "Enter valid interest rate";
      if (!form.girviDate) newErrors.girviDate = "Select girvi date";
      if (!form.maturityDate) newErrors.maturityDate = "Select maturity date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  async function saveGirvi() {
    if (!validateStep(3)) return; // Final check

    const customerId = resolvedCustomerId || localStorage.getItem("ps_customer_id");

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
        itemType: form.itemType.toUpperCase(),
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

  const steps = [
    { id: 1, label: "Customer" },
    { id: 2, label: "Item Details" },
    { id: 3, label: "Loan Details" },
    { id: 4, label: "Review" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-24 xl:pb-10 font-sans">
      {/* HEADER */}
      <div className="bg-[#4820C5] text-white pt-6 pb-20 px-4 shadow-sm relative">
        <div className="max-w-3xl mx-auto flex items-center justify-center relative">
          <button
            type="button"
            onClick={() => nav(returnTo)}
            className="absolute left-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-lg font-bold">Add New Girvi</h1>
        </div>
      </div>

      {/* MAIN CONTENT CARD */}
      <div className="max-w-3xl mx-auto px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-[24px] shadow-lg border border-gray-100 p-6 sm:p-8">
          
          {/* STEPPER */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-100 z-0 px-8"></div>
              {steps.map((step) => (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      currentStep > step.id
                        ? "bg-[#4820C5] text-white"
                        : currentStep === step.id
                        ? "bg-[#4820C5] text-white ring-4 ring-purple-100"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {currentStep > step.id ? <FaCheck className="text-[12px]" /> : step.id}
                  </div>
                  <span
                    className={`text-[11px] font-semibold whitespace-nowrap ${
                      currentStep >= step.id ? "text-[#4820C5]" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {errors.form && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium mb-6 text-center border border-red-100">
              {errors.form}
            </div>
          )}

          {/* ================= STEP 1: CUSTOMER ================= */}
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Information</h2>
              <div className="space-y-4">
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-semibold mb-1">Customer ID</p>
                  <p className="font-bold text-gray-900 text-lg">{resolvedCustomerId || "Not selected"}</p>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-semibold mb-1">Customer Name</p>
                  <p className="font-bold text-gray-900 text-lg">{customerName}</p>
                </div>
                {errors.customer && <p className="text-red-500 text-sm mt-2">{errors.customer}</p>}
              </div>
            </div>
          )}

          {/* ================= STEP 2: ITEM DETAILS ================= */}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Item Information</h2>
              <div className="space-y-5">
                <Input 
                  label="Item Name *" 
                  value={form.itemName} 
                  onChange={(v: any) => update("itemName", v)} 
                  error={errors.itemName} 
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1.5">Item Type *</label>
                    <div className="relative">
                      <select 
                        value={form.itemType} 
                        onChange={(e) => update("itemType", e.target.value)} 
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium outline-none focus:border-[#4820C5] focus:ring-1 focus:ring-[#4820C5] appearance-none"
                      >
                        <option value="Gold">Gold</option>
                        <option value="Silver">Silver</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                    </div>
                  </div>
                  <Input 
                    label="Rate per Gram (₹) *" 
                    type="number" 
                    value={form.ratePerGram} 
                    onChange={(v: any) => update("ratePerGram", v)} 
                    error={errors.ratePerGram} 
                  />
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <Input 
                    label="Weight (Gram) *" 
                    type="number" 
                    value={form.itemWeightGram} 
                    onChange={(v: any) => update("itemWeightGram", v)} 
                    error={errors.itemWeightGram} 
                  />
                </div>

                <Input 
                  label="Description (Optional)" 
                  value={form.remarks} 
                  onChange={(v: any) => update("remarks", v)} 
                />

                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-2">Item Photo</label>
                  <div className="flex flex-wrap gap-3">
                    {photoPreview && (
                      <div className="relative w-[100px] h-[100px] rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={photoPreview} alt="Item" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => { setPhoto(null); setPhotoPreview(""); }}
                          className="absolute top-1 right-1 bg-black/60 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <FaTimes className="text-[10px]" />
                        </button>
                      </div>
                    )}
                    
                    <label className="w-[100px] h-[100px] rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-purple-50 transition text-[#4820C5]">
                      <FaPlus />
                      <span className="text-xs font-semibold">Add</span>
                      <input type="file" accept="image/*" hidden onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: LOAN DETAILS ================= */}
          {currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Loan Information</h2>
              <div className="space-y-5">
                
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Estimated Value</label>
                  <div className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold text-sm">
                    ₹ {totalValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </div>
                </div>

                <Input 
                  label="Interest Rate (%) *" 
                  type="number" 
                  value={form.interestRate} 
                  onChange={(v: any) => update("interestRate", v)} 
                  error={errors.interestRate} 
                />

                <Input 
                  label="Girvi Date *" 
                  type="date" 
                  value={form.girviDate} 
                  onChange={(v: any) => update("girviDate", v)} 
                  error={errors.girviDate} 
                />

                <Input 
                  label="Maturity Date *" 
                  type="date" 
                  value={form.maturityDate} 
                  onChange={(v: any) => update("maturityDate", v)} 
                  error={errors.maturityDate} 
                />
              </div>
            </div>
          )}

          {/* ================= STEP 4: REVIEW ================= */}
          {currentStep === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Review Information</h2>
              
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-4 text-sm">
                <ReviewRow label="Customer" value={customerName} />
                <ReviewRow label="Item Name" value={form.itemName} />
                <ReviewRow label="Item Type" value={form.itemType} />
                <ReviewRow label="Weight" value={`${form.itemWeightGram} Grams`} />
                <ReviewRow label="Rate" value={`₹ ${form.ratePerGram} / gm`} />
                <ReviewRow label="Calculated Value" value={`₹ ${totalValue.toLocaleString('en-IN')}`} isHighlight />
                <ReviewRow label="Interest Rate" value={`${form.interestRate}%`} />
                <ReviewRow label="Girvi Date" value={form.girviDate} />
                <ReviewRow label="Maturity Date" value={form.maturityDate} />
              </div>
            </div>
          )}

          {/* ================= FOOTER BUTTONS ================= */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                className="text-[#4820C5] font-bold px-4 py-3 flex items-center gap-2 hover:bg-purple-50 rounded-xl transition"
              >
                <FaArrowLeft className="text-sm" /> Previous
              </button>
            ) : (
              <div></div> // Empty div for flex spacing
            )}

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="bg-[#4820C5] hover:bg-[#3d1aab] text-white font-bold px-8 py-3.5 rounded-xl flex items-center gap-2 transition shadow-md shadow-purple-200"
              >
                Next Step <FaArrowRight className="text-sm" />
              </button>
            ) : (
              <button
                onClick={saveGirvi}
                disabled={loading}
                className="bg-[#4820C5] hover:bg-[#3d1aab] disabled:bg-gray-400 text-white font-bold px-8 py-3.5 rounded-xl flex items-center gap-2 transition shadow-md shadow-purple-200"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <><FaSave className="text-lg" /> Save Girvi</>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
      
      <div className="xl:hidden"><DealerBottomNav /></div>
    </div>
  );
}

// UI HELPERS
function Input({ label, value, onChange, type = "text", placeholder, error }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-600 block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3.5 rounded-xl border bg-white text-sm font-medium outline-none transition
          ${error ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-gray-200 focus:border-[#4820C5] focus:ring-1 focus:ring-[#4820C5]"}`}
      />
      {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
}

function ReviewRow({ label, value, isHighlight = false }: { label: string, value: string, isHighlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between pb-2 border-b border-gray-100 last:border-0 last:pb-0 ${isHighlight ? 'text-[#4820C5] pt-2' : ''}`}>
      <span className={`text-xs font-semibold ${isHighlight ? 'opacity-80' : 'text-gray-500'}`}>{label}</span>
      <span className={`font-bold ${isHighlight ? 'text-lg' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
