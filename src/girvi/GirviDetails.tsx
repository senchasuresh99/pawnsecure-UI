import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaUpload,
  FaRupeeSign,
  FaPlus,
  FaCheck,
  FaTimes,
  FaCoins
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
    <div className="min-h-screen bg-[#f4f5f7] pb-24 xl:pb-12 font-sans flex flex-col">
      {/* HEADER - Increased padding for desktop view */}
      <div className="bg-[#4820C5] text-white pt-6 md:pt-10 pb-20 md:pb-28 px-4 shadow-sm relative">
        <div className="max-w-4xl mx-auto flex items-center justify-center relative">
          <button
            type="button"
            onClick={() => nav(returnTo)}
            className="absolute left-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-lg md:text-2xl font-bold">Add New Girvi</h1>
        </div>
      </div>

      {/* MAIN CONTENT CARD - Wider on desktop, negative margin adjusted */}
      <div className="max-w-4xl mx-auto px-4 w-full -mt-12 md:-mt-16 relative z-10 flex-grow">
        <div className="bg-white rounded-[24px] shadow-lg border border-gray-100 p-6 sm:p-8 md:p-10">
          
          {/* STEPPER */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center justify-between relative px-2 sm:px-8">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-100 z-0 px-8 sm:px-16"></div>
              {steps.map((step) => (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2 sm:px-4">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-colors ${
                      currentStep > step.id
                        ? "bg-[#4820C5] text-white"
                        : currentStep === step.id
                        ? "bg-[#4820C5] text-white ring-4 ring-purple-100"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {currentStep > step.id ? <FaCheck className="text-[12px] md:text-sm" /> : step.id}
                  </div>
                  <span
                    className={`text-[11px] md:text-sm font-semibold whitespace-nowrap ${
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
            <div className="bg-red-50 text-red-600 p-3 md:p-4 rounded-xl text-sm md:text-base font-medium mb-6 text-center border border-red-100">
              {errors.form}
            </div>
          )}

          {/* ================= STEP 1: CUSTOMER ================= */}
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Customer Information</h2>
              {/* Responsive Grid: 1 col on mobile, 2 cols on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-gray-50/50 rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
                  <p className="text-xs md:text-sm text-gray-500 font-semibold mb-1">Customer ID</p>
                  <p className="font-bold text-gray-900 text-lg md:text-xl">{resolvedCustomerId || "Not selected"}</p>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
                  <p className="text-xs md:text-sm text-gray-500 font-semibold mb-1">Customer Name</p>
                  <p className="font-bold text-gray-900 text-lg md:text-xl">{customerName}</p>
                </div>
              </div>
              {errors.customer && <p className="text-red-500 text-sm mt-3">{errors.customer}</p>}
            </div>
          )}

          {/* ================= STEP 2: ITEM DETAILS ================= */}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Item Information</h2>
              <div className="space-y-5 md:space-y-6">
                <Input 
                  label="Item Name *" 
                  value={form.itemName} 
                  onChange={(v: any) => update("itemName", v)} 
                  error={errors.itemName} 
                />
                
                {/* Responsive Grid: 1 col on mobile, 2 cols on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                  <div>
                    <label className="text-xs md:text-sm font-bold text-gray-600 block mb-1.5 md:mb-2">Item Type *</label>
                    <div className="relative">
                      <select 
                        value={form.itemType} 
                        onChange={(e) => update("itemType", e.target.value)} 
                        className="w-full px-4 py-3.5 md:py-4 rounded-xl border border-gray-200 bg-white text-sm md:text-base font-medium outline-none focus:border-[#4820C5] focus:ring-1 focus:ring-[#4820C5] appearance-none"
                      >
                        <option value="Gold">Gold</option>
                        <option value="Silver">Silver</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs md:text-sm">▼</div>
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
                  <label className="text-xs md:text-sm font-bold text-gray-600 block mb-2 md:mb-3">Item Photo</label>
                  <div className="flex flex-wrap gap-3 md:gap-4">
                    {photoPreview && (
                      <div className="relative w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                        <img src={photoPreview} alt="Item" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => { setPhoto(null); setPhotoPreview(""); }}
                          className="absolute top-1.5 right-1.5 bg-black/60 text-white w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"
                        >
                          <FaTimes className="text-[12px]" />
                        </button>
                      </div>
                    )}
                    
                    <label className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 flex flex-col items-center justify-center gap-1.5 md:gap-2 cursor-pointer hover:bg-purple-50 transition text-[#4820C5]">
                      <FaPlus className="md:text-lg" />
                      <span className="text-xs md:text-sm font-semibold">Add</span>
                      <input type="file" accept="image/*" hidden onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  {errors.photo && <p className="text-red-500 text-xs md:text-sm mt-2">{errors.photo}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: LOAN DETAILS ================= */}
          {currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Loan Information</h2>
              <div className="space-y-5 md:space-y-6">
                
                <div>
                  <label className="text-xs md:text-sm font-bold text-gray-600 block mb-1.5 md:mb-2">Estimated Value</label>
                  <div className="w-full px-4 py-3.5 md:py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold text-sm md:text-base">
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

                {/* Responsive Grid for Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
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
            </div>
          )}

          {/* ================= STEP 4: REVIEW ================= */}
          {currentStep === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Review Information</h2>
              
              <div className="space-y-4 md:space-y-6">
                  <ItemSummaryCard 
                    photo={photoPreview} 
                    name={form.itemName} 
                    type={form.itemType} 
                    weight={`${form.itemWeightGram} gram`} 
                  />
                  
                  {/* Grid on desktop, stack on mobile */}
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 md:p-8 text-sm md:text-base">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6">
                      <ReviewRow label="Customer" value={customerName} />
                      <ReviewRow label="Interest Rate" value={`${form.interestRate}%`} />
                      <ReviewRow label="Girvi Date" value={form.girviDate} />
                      <ReviewRow label="Maturity Date" value={form.maturityDate} />
                    </div>
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                      <ReviewRow label="Calculated Value" value={`₹ ${totalValue.toLocaleString('en-IN')}`} isHighlight />
                    </div>
                  </div>
              </div>
            </div>
          )}

          {/* ================= FOOTER BUTTONS ================= */}
          <div className="flex items-center justify-between mt-10 md:mt-12 pt-6 md:pt-8 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                className="text-[#4820C5] font-bold px-4 py-3 md:px-6 md:py-3.5 flex items-center gap-2 hover:bg-purple-50 rounded-xl transition md:text-lg"
              >
                <FaArrowLeft className="text-sm md:text-base" /> Previous
              </button>
            ) : (
              <div></div> // Empty div for flex spacing
            )}

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="bg-[#4820C5] hover:bg-[#3d1aab] text-white font-bold px-8 py-3.5 md:px-10 md:py-4 rounded-xl flex items-center gap-2 transition shadow-md shadow-purple-200 md:text-lg"
              >
                Next Step <FaArrowRight className="text-sm md:text-base" />
              </button>
            ) : (
              <button
                onClick={saveGirvi}
                disabled={loading}
                className={`font-bold px-8 py-3.5 md:px-10 md:py-4 rounded-xl flex items-center gap-2 transition shadow-md md:text-lg ${loading ? 'bg-gray-400 text-white' : 'bg-[#28A745] hover:bg-[#218838] text-white shadow-xl shadow-green-200/50'}`}
              >
                {loading ? (
                  <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <><FaCheck className="text-lg md:text-xl" /> Save Girvi</>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
      
      {/* Hidden on desktop since it's a mobile bottom nav */}
      <div className="xl:hidden"><DealerBottomNav /></div>
    </div>
  );
}

// UI HELPERS
function Input({ label, value, onChange, type = "text", placeholder, error }: any) {
  return (
    <div>
      <label className="text-xs md:text-sm font-bold text-gray-600 block mb-1.5 md:mb-2">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3.5 md:py-4 rounded-xl border bg-white text-sm md:text-base font-medium outline-none transition
          ${error ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-gray-200 focus:border-[#4820C5] focus:ring-1 focus:ring-[#4820C5]"}`}
      />
      {error && <p className="text-red-500 text-xs md:text-sm mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

function ReviewRow({ label, value, isHighlight = false }: { label: string, value: string, isHighlight?: boolean }) {
  // Mobile uses borders, desktop relies on grid spacing. So we apply border-b mainly for sm (mobile) screens where they stack.
  return (
    <div className={`flex items-center justify-between pb-3 sm:pb-0 border-b border-gray-100 sm:border-b-0 last:border-0 last:pb-0 ${isHighlight ? 'text-[#4820C5]' : ''}`}>
      <span className={`text-xs md:text-sm font-semibold ${isHighlight ? 'opacity-80 md:text-base' : 'text-gray-500'}`}>{label}</span>
      <span className={`font-bold ${isHighlight ? 'text-xl md:text-2xl' : 'text-gray-900 md:text-base'}`}>{value}</span>
    </div>
  );
}

function ItemSummaryCard({ photo, name, type, weight }: { photo: string | null; name: string; type: string; weight: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 flex items-center gap-4 md:gap-6 shadow-sm">
      {photo ? (
        <img src={photo} className="w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl object-cover shadow-sm" alt="Item" />
      ) : (
        <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
          <FaCoins size={28} className="md:w-10 md:h-10" />
        </div>
      )}
      <div className="flex-1">
        <p className="font-bold text-gray-900 text-base md:text-xl">{name || "Unnamed Item"}</p>
        <div className="flex items-center gap-2 mt-2 md:mt-3">
           <span className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold ${type === 'Gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{type}</span>
           <span className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-green-100 text-green-700 text-[10px] md:text-xs font-bold">22K (916)</span>
        </div>
        <p className="font-semibold text-gray-700 text-sm md:text-base mt-2 md:mt-3">{weight}</p>
      </div>
    </div>
  );
}
