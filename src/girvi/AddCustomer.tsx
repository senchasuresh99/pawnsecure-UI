import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGirvi } from "../girvi/GirviContext";
import DealerSidebar from "../dealer/DealerSidebar";
import MobileDealerSidebar from "../dealer/MobileDealerSidebar";
import DealerMobileBottomNav from "../dealer/DealerMobileBottomNav";
import {
  FaArrowLeft,
  FaSave,
  FaUpload,
  FaUser,
  FaIdCard,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { API_BASE } from "../config/api";

type CustomerForm = {
  name: string;
  aadhaar: string;
  maskedAadhaar: string;
  dob: string;
  gender: string;
  address: string;
  phone: string;
  customerPhoto: File | null;
  customerPhotoUrl: string;
};

type Errors = {
  name?: string;
  aadhaar?: string;
  dob?: string;
  gender?: string;
  address?: string;
  phone?: string;
  customerPhoto?: string;
};

export default function AddCustomer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCustomer } = useGirvi();

  const query = new URLSearchParams(window.location.search);
  const isAdminView = query.get("adminView") === "true";

  const dealerName =
    query.get("dealerName") ||
    localStorage.getItem("ps_dealer_name") ||
    "Dealer";

  const dealerIdForSidebar =
    query.get("dealerId") || localStorage.getItem("ps_dealer_id") || "-";

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const dashboardControl = String(
    localStorage.getItem("ps_dashboard_control") || "FULLVIEW"
  ).toUpperCase();

  const isPartialityDashboard = dashboardControl === "PARTIALITY";

  const todayDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const todayDay = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
  });

  const prefill: any = location.state || {};

  function getDisplayImageUrl(photoUrl?: string) {
    if (!photoUrl || !photoUrl.trim()) return "";

    if (
      photoUrl.startsWith("http://") ||
      photoUrl.startsWith("https://") ||
      photoUrl.startsWith("blob:")
    ) {
      return photoUrl;
    }

    return `${API_BASE}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
  }

  const initialCustomerPhotoUrl =
    prefill.customerPhotoUrl ||
    prefill.photoUrl ||
    prefill.customer?.customerPhotoUrl ||
    "";

  const [form, setForm] = useState<CustomerForm>({
    name: prefill.fullName || prefill.name || prefill.customerName || "",
    aadhaar: prefill.aadhaar || "",
    maskedAadhaar: prefill.maskedAadhaar || "",
    dob: prefill.dob || "",
    gender: prefill.gender || "",
    address: prefill.address || prefill.customerAddress || "",
    phone: prefill.phoneNumber || prefill.mobile || prefill.phone || "",
    customerPhoto: null,
    customerPhotoUrl: initialCustomerPhotoUrl,
  });

  const [photoPreview, setPhotoPreview] = useState(
    getDisplayImageUrl(initialCustomerPhotoUrl)
  );

  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("ps_token");

    if (!token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function getToken() {
    return localStorage.getItem("ps_token");
  }

  function update<K extends keyof CustomerForm>(
    key: K,
    value: CustomerForm[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: undefined,
    }));
  }

  function showPopup(type: "success" | "error", message: string) {
    setPopup({ type, message });
  }

  function closePopup() {
    setPopup(null);
  }

  function normalizeGender(gender: string) {
    if (!gender) return "";

    const g = gender.toUpperCase();

    if (g === "MALE") return "M";
    if (g === "FEMALE") return "F";
    if (g === "OTHER") return "O";

    if (g === "M") return "M";
    if (g === "F") return "F";
    if (g === "O") return "O";

    return g;
  }

  function getAadhaarValue() {
    return form.aadhaar || form.maskedAadhaar || "";
  }

  function validate() {
    const e: Errors = {};
    const aadhaarValue = getAadhaarValue();

    if (!form.name.trim()) {
      e.name = "Customer name is required";
    }

    if (!aadhaarValue.trim()) {
      e.aadhaar = "Aadhaar is required";
    } else if (!/^[0-9]{12}$/.test(aadhaarValue)) {
      e.aadhaar = "Enter valid 12-digit Aadhaar";
    }

    if (!form.dob.trim()) {
      e.dob = "Date of birth is required";
    }

    if (!form.gender.trim()) {
      e.gender = "Gender is required";
    }

    if (!form.address.trim()) {
      e.address = "Address is required";
    }

    if (!form.phone.trim()) {
      e.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(form.phone)) {
      e.phone = "Enter valid 10-digit phone number";
    }

    if (!form.customerPhoto && !form.customerPhotoUrl) {
      e.customerPhoto = "Customer photo is required";
    } else if (
      form.customerPhoto &&
      !form.customerPhoto.type.startsWith("image/")
    ) {
      e.customerPhoto = "Only image files are allowed";
    } else if (form.customerPhoto && form.customerPhoto.size > 5 * 1024 * 1024) {
      e.customerPhoto = "Photo size must be less than 5MB";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handlePhotoChange(file: File | null) {
    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    if (!file) {
      setForm((prev) => ({
        ...prev,
        customerPhoto: null,
        customerPhotoUrl: "",
      }));

      setPhotoPreview("");

      setErrors((prev) => ({
        ...prev,
        customerPhoto: "Customer photo is required",
      }));

      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        customerPhoto: "Only image files are allowed",
      }));

      setForm((prev) => ({
        ...prev,
        customerPhoto: null,
        customerPhotoUrl: "",
      }));

      setPhotoPreview("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        customerPhoto: "Photo size must be less than 5MB",
      }));

      setForm((prev) => ({
        ...prev,
        customerPhoto: null,
        customerPhotoUrl: "",
      }));

      setPhotoPreview("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      customerPhoto: file,
      customerPhotoUrl: "",
    }));

    setPhotoPreview(URL.createObjectURL(file));

    setErrors((prev) => ({
      ...prev,
      customerPhoto: undefined,
    }));
  }

  async function saveCustomer() {
    if (!validate()) return;

    const token = getToken();

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    setSaving(true);

    try {
      const aadhaarValue = getAadhaarValue();

      const formData = new FormData();

      formData.append("fullName", form.name);
      formData.append("maskedAadhaar", aadhaarValue);
      formData.append("dob", form.dob);
      formData.append("gender", normalizeGender(form.gender));
      formData.append("address", form.address);
      formData.append("phoneNumber", form.phone);

      if (form.customerPhoto) {
        formData.append("customerPhoto", form.customerPhoto);
      }

      const res = await fetch(`${API_BASE}/customers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("ps_token");
        localStorage.removeItem("ps_role");
        localStorage.removeItem("ps_dealer_id");
        localStorage.removeItem("ps_dealer_name");
        localStorage.removeItem("ps_dashboard_control");

        showPopup("error", "Session expired. Please login again.");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1200);

        return;
      }

      if (!res.ok) {
        let message = "Could not save customer";

        try {
          const data = await res.json();
          message = data.message || message;
        } catch {
          try {
            message = await res.text();
          } catch {
            message = "Could not save customer";
          }
        }

        showPopup("error", message || "Could not save customer");
        return;
      }

      let savedCustomer: any = null;

      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        savedCustomer = await res.json();
      } else {
        const textMessage = await res.text();
        savedCustomer = {
          message: textMessage || "Customer saved successfully",
        };
      }

      const customerId =
        savedCustomer.id ||
        savedCustomer.customerId ||
        savedCustomer.customer_id ||
        savedCustomer.customer?.id ||
        savedCustomer.customer?.customerId ||
        "";

      if (!customerId) {
        showPopup(
          "error",
          "Customer saved, but customer ID was not returned by backend."
        );
        return;
      }

      const customerPhotoUrl =
        savedCustomer.customerPhotoUrl ||
        savedCustomer.photoUrl ||
        savedCustomer.photo ||
        savedCustomer.customer?.customerPhotoUrl ||
        savedCustomer.customer?.photoUrl ||
        form.customerPhotoUrl ||
        "";

      const normalizedCustomer = {
        ...savedCustomer,
        id: customerId,
        customerId: customerId,
        fullName:
          savedCustomer.fullName ||
          savedCustomer.name ||
          savedCustomer.customerName ||
          form.name,
        name:
          savedCustomer.name ||
          savedCustomer.fullName ||
          savedCustomer.customerName ||
          form.name,
        customerName:
          savedCustomer.customerName ||
          savedCustomer.fullName ||
          savedCustomer.name ||
          form.name,
        phoneNumber:
          savedCustomer.phoneNumber ||
          savedCustomer.mobile ||
          savedCustomer.phone ||
          form.phone,
        maskedAadhaar:
          savedCustomer.maskedAadhaar ||
          savedCustomer.masked_aadhaar ||
          aadhaarValue,
        dob: savedCustomer.dob || form.dob,
        gender: savedCustomer.gender || normalizeGender(form.gender),
        address:
          savedCustomer.address ||
          savedCustomer.customerAddress ||
          form.address,
        customerAddress:
          savedCustomer.customerAddress ||
          savedCustomer.address ||
          form.address,
        customerPhotoUrl,
      };

      setCustomer(normalizedCustomer);

      localStorage.setItem("ps_customer_id", String(customerId));
      localStorage.setItem(
        "ps_selected_customer",
        JSON.stringify(normalizedCustomer)
      );

      showPopup(
        "success",
        normalizedCustomer.message || "Customer saved successfully"
      );

      setTimeout(() => {
        if (isPartialityDashboard) {
          navigate("/dealer/customer-search", {
            state: {
              mode: "RENEWAL_EXTEND",
              customer: normalizedCustomer,
            },
            replace: true,
          });
          return;
        }

        navigate("/dealer/details", {
          state: {
            customer: normalizedCustomer,
          },
        });
      }, 900);
    } catch (err) {
      console.error("Save customer failed:", err);
      showPopup("error", "Server error while saving customer");
    } finally {
      setSaving(false);
    }
  }

  function maskAadhaar(a: string) {
    if (!a || a.length !== 12) return a;
    return `XXXX-XXXX-${a.slice(8)}`;
  }

  const aadhaarValue = getAadhaarValue();

  const aadhaarDisplay = aadhaarValue
    ? maskAadhaar(aadhaarValue)
    : "Aadhaar not available";

  const completionItems = [
    !!form.name.trim(),
    !!aadhaarValue.trim(),
    !!form.dob.trim(),
    !!form.gender.trim(),
    !!form.address.trim(),
    /^[6-9]\d{9}$/.test(form.phone),
    !!form.customerPhoto || !!form.customerPhotoUrl,
  ];

  const completedCount = completionItems.filter(Boolean).length;
  const progress = Math.round((completedCount / completionItems.length) * 100);

  function renderFormCard() {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 xl:p-8">
        <div className="bg-green-50 border border-green-100 text-green-700 rounded-2xl px-4 py-3 text-sm font-semibold mb-6 flex items-center gap-2">
          <FaCheckCircle />
          Aadhaar details loaded successfully
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Form Completion</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <FaIdCard />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-purple-600 font-semibold">
              Aadhaar Number
            </p>

            <p className="text-sm font-bold text-purple-800 mt-1 truncate">
              {aadhaarDisplay}
            </p>

            {errors.aadhaar && (
              <p className="text-xs text-red-600 mt-1">{errors.aadhaar}</p>
            )}
          </div>
        </div>

        <Section title="Personal Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={form.name}
              error={errors.name}
              icon={<FaUser />}
              onChange={(v: string) => update("name", v)}
            />

            <Input
              label="Date of Birth *"
              value={form.dob}
              error={errors.dob}
              placeholder="DD-MM-YYYY"
              onChange={(v: string) => update("dob", v)}
            />

            <Select
              label="Gender *"
              value={form.gender}
              error={errors.gender}
              onChange={(v: string) => update("gender", v)}
            />

            <Input
              label="Phone Number *"
              value={form.phone}
              error={errors.phone}
              icon={<FaPhoneAlt />}
              placeholder="Enter customer phone number"
              onChange={(v: string) =>
                update("phone", v.replace(/\D/g, "").slice(0, 10))
              }
            />
          </div>
        </Section>

        <Section title="Address Details">
          <Textarea
            label="Address *"
            value={form.address}
            error={errors.address}
            icon={<FaMapMarkerAlt />}
            onChange={(v: string) => update("address", v)}
          />
        </Section>

        <Section title="Customer Photo">
          <CustomerPhotoUploader
            photoPreview={photoPreview}
            error={errors.customerPhoto}
            onChange={handlePhotoChange}
          />
        </Section>

        <button
          type="button"
          onClick={saveCustomer}
          disabled={saving}
          className="w-full mt-7 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <FaSave />
          {saving ? "Saving Customer..." : "Save Customer"}
        </button>
      </div>
    );
  }

  function renderPreviewCard() {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">
            Customer Preview
          </h3>

          <div className="flex items-center gap-4 mb-5">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Customer"
                className="w-20 h-20 rounded-2xl object-cover border bg-gray-50"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-2xl">
                {(form.name || "C").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">
                {form.name || "Customer Name"}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {aadhaarDisplay}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <SummaryRow label="DOB" value={form.dob || "—"} />
            <SummaryRow label="Gender" value={form.gender || "—"} />
            <SummaryRow label="Phone" value={form.phone || "—"} />
            <SummaryRow
              label="Address"
              value={form.address || "—"}
              multiline
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-700 to-indigo-600 text-white rounded-3xl p-6">
          <h3 className="font-bold text-lg mb-2">Next Step</h3>
          <p className="text-sm opacity-85">
            {isPartialityDashboard
              ? "After saving this customer, you can continue to customer review."
              : "After saving this customer, the dealer can continue to Girvi details and add pledged item information."}
          </p>

          <div className="mt-5 bg-white/10 rounded-2xl p-4">
            <p className="text-xs opacity-80">Current Step</p>
            <p className="font-bold mt-1">
              {isPartialityDashboard
                ? "Customer Registration / Review"
                : "Customer Registration"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans">
      {/* ================= DESKTOP VIEW WITH GLOBAL SIDEBAR ================= */}
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={isAdminView} />

        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Register Customer
              </h2>
              <p className="text-xs text-gray-500">
                Review Aadhaar details, enter contact information, upload photo,
                and save profile
              </p>
            </div>

            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-gray-800">
                {todayDate}
              </p>
              <p className="text-xs text-gray-400">{todayDay}</p>
            </div>
          </header>

          <div className="p-5 xl:p-6 max-w-[1400px] w-full mx-auto flex-1">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-8 py-5 mb-6">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm opacity-90">Customer Onboarding</p>
                  <h1 className="text-2xl font-bold mt-1">
                    Customer Details
                  </h1>
                  <p className="text-sm opacity-80 mt-1">
                    {isPartialityDashboard
                      ? "Complete customer profile before customer review."
                      : "Complete customer profile before continuing to Girvi details."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/dealer/customer-register")}
                  className="bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition"
                >
                  <FaArrowLeft /> Back
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-8">
                {renderFormCard()}
              </div>

              <div className="hidden xl:block xl:col-span-4">
                <div className="sticky top-24">{renderPreviewCard()}</div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="lg:hidden pb-32 bg-[#f4f5f7] min-h-screen">
        <MobileDealerSidebar
          open={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
          isAdminView={isAdminView}
          dealerName={dealerName}
          dealerId={dealerIdForSidebar}
        />

        <div className="max-w-md mx-auto bg-[#f4f5f7] min-h-screen">
          <header className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isAdminView) {
                    navigate("/admin/dashboard", { replace: true });
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
                  Register Customer
                </h2>
                <p className="text-[11px] text-gray-500">
                  {isPartialityDashboard
                    ? "Save profile before review"
                    : "Save profile before Girvi"}
                </p>
              </div>
            </div>

            <div className="text-right leading-tight">
              <p className="text-xs font-semibold text-gray-800">
                {todayDate}
              </p>
              <p className="text-[10px] text-gray-400">{todayDay}</p>
            </div>
          </header>

          <div className="px-4 pt-4">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-5 py-5 mb-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs opacity-80">Customer Onboarding</p>
                  <h1 className="text-2xl font-bold mt-1">
                    Customer Details
                  </h1>
                  <p className="text-sm opacity-80 mt-1">
                    {isPartialityDashboard
                      ? "Complete customer profile before customer review."
                      : "Complete customer profile before continuing to Girvi details."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/dealer/customer-register")}
                  className="w-11 h-11 bg-white/20 active:bg-white/30 rounded-2xl flex items-center justify-center transition shrink-0"
                  title="Back"
                >
                  <FaArrowLeft />
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 relative z-10">{renderFormCard()}</div>

          <div className="px-4 mt-4">{renderPreviewCard()}</div>
        </div>

        <DealerMobileBottomNav active="register" isAdminView={isAdminView} />
      </div>

      {/* POPUP */}
      {popup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div
              className={`text-5xl mb-3 ${
                popup.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {popup.type === "success" ? "✔" : "✖"}
            </div>

            <h2 className="text-xl font-bold mb-2">
              {popup.type === "success" ? "Success" : "Error"}
            </h2>

            <p className="text-gray-600 text-sm mb-5">{popup.message}</p>

            <button
              type="button"
              onClick={closePopup}
              className={`px-5 py-2 rounded-lg text-white font-semibold ${
                popup.type === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function Section({ title, children }: any) {
  return (
    <div className="mt-7 first:mt-0">
      <h3 className="font-bold text-base text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  error,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  icon?: any;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-semibold">{label}</label>

      <div
        className={`mt-1 flex items-center gap-3 border rounded-2xl px-4 py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-purple-500 ${
          error ? "border-red-500" : "border-gray-200"
        }`}
      >
        {icon && <span className="text-gray-400 shrink-0">{icon}</span>}

        <input
          value={value}
          placeholder={placeholder || label}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Select({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-semibold">{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full mt-1 border rounded-2xl px-4 py-3 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500 ${
          error ? "border-red-500" : "border-gray-200"
        }`}
      >
        <option value="">Select Gender</option>
        <option value="M">Male</option>
        <option value="F">Female</option>
        <option value="O">Other</option>
      </select>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Textarea({
  label,
  value,
  error,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  error?: string;
  icon?: any;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-semibold">{label}</label>

      <div
        className={`mt-1 flex gap-3 border rounded-2xl px-4 py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-purple-500 ${
          error ? "border-red-500" : "border-gray-200"
        }`}
      >
        {icon && <span className="text-gray-400 mt-1 shrink-0">{icon}</span>}

        <textarea
          rows={4}
          value={value}
          placeholder={label}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm outline-none bg-transparent resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function CustomerPhotoUploader({
  photoPreview,
  error,
  onChange,
}: {
  photoPreview: string;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-2xl p-5 bg-purple-50/40 ${
          error ? "border-red-500" : "border-purple-200"
        }`}
      >
        {!photoPreview ? (
          <label className="cursor-pointer flex flex-col items-center justify-center text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <FaUpload />
            </div>

            <p className="text-sm font-bold text-gray-800">
              Upload Customer Photo
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Required. JPG, PNG or WEBP. Max 5MB.
            </p>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onChange(file);
              }}
            />
          </label>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={photoPreview}
              alt="Customer preview"
              className="w-28 h-28 rounded-2xl object-cover border border-gray-200 bg-white"
            />

            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-bold text-gray-800">
                Customer photo selected
              </p>

              <p className="text-xs text-gray-500 mt-1">
                This photo will be saved with customer profile.
              </p>

              <div className="flex justify-center sm:justify-start gap-2 mt-3">
                <label className="cursor-pointer px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      onChange(file);
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value, multiline }: any) {
  return (
    <div className="border-b border-gray-200 py-3">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-sm ${multiline ? "break-words" : "truncate"}`}>
        {value}
      </p>
    </div>
  );
}