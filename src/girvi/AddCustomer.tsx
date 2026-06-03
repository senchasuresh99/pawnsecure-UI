import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGirvi } from "./GirviContext";
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
import DealerBottomNav from "../dealer/DealerBottomNav";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

type CustomerForm = {
  name: string;
  aadhaar: string;
  maskedAadhaar: string;
  dob: string;
  gender: string;
  address: string;
  phone: string;
  customerPhoto: File | null;
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

  const prefill: any = location.state || {};

  const [form, setForm] = useState<CustomerForm>({
    name: prefill.fullName || prefill.name || "",
    aadhaar: prefill.aadhaar || "",
    maskedAadhaar: prefill.maskedAadhaar || "",
    dob: prefill.dob || "",
    gender: prefill.gender || "",
    address: prefill.address || "",
    phone: prefill.phoneNumber || prefill.mobile || prefill.phone || "",
    customerPhoto: null,
  });

  const [photoPreview, setPhotoPreview] = useState("");
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
      if (photoPreview) {
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

    if (!form.customerPhoto) {
      e.customerPhoto = "Customer photo is required";
    } else if (!form.customerPhoto.type.startsWith("image/")) {
      e.customerPhoto = "Only image files are allowed";
    } else if (form.customerPhoto.size > 5 * 1024 * 1024) {
      e.customerPhoto = "Photo size must be less than 5MB";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handlePhotoChange(file: File | null) {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    if (!file) {
      update("customerPhoto", null);
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
      update("customerPhoto", null);
      setPhotoPreview("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        customerPhoto: "Photo size must be less than 5MB",
      }));
      update("customerPhoto", null);
      setPhotoPreview("");
      return;
    }

    update("customerPhoto", file);
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

      setCustomer(savedCustomer);

      showPopup(
        "success",
        savedCustomer.message || "Customer saved successfully"
      );

      setTimeout(() => {
        navigate("/dealer/details");
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
    !!form.customerPhoto,
  ];

  const completedCount = completionItems.filter(Boolean).length;
  const progress = Math.round((completedCount / completionItems.length) * 100);

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-32 xl:pb-10">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] xl:rounded-b-[42px] px-5 xl:px-10 py-6 xl:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigate("/dealer/customer-register")}
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition"
            >
              <FaArrowLeft className="text-xl" />
            </button>

            <div className="text-center xl:hidden">
              <h1 className="font-bold text-lg">Register Customer</h1>
              <p className="text-xs opacity-80">PawnSecure</p>
            </div>

            <div className="hidden xl:block">
              <p className="text-sm opacity-80">PawnSecure Dealer Portal</p>
            </div>

            <div className="w-10" />
          </div>

          <div className="xl:flex xl:items-end xl:justify-between">
            <div>
              <p className="hidden xl:block text-sm opacity-80 mb-2">
                Customer Onboarding
              </p>

              <h2 className="text-2xl xl:text-4xl font-bold">
                Customer Details
              </h2>

              <p className="text-sm xl:text-base opacity-80 mt-2 max-w-2xl">
                Review Aadhaar details, enter contact information, upload
                customer photo, and save the customer profile.
              </p>
            </div>

            <div className="hidden xl:grid grid-cols-3 gap-4 mt-6 min-w-[430px]">
              <HeaderStat
                icon={<FaCheckCircle />}
                label="Progress"
                value={`${progress}%`}
              />
              <HeaderStat
                icon={<FaIdCard />}
                label="Aadhaar"
                value={aadhaarDisplay}
              />
              <HeaderStat
                icon={<FaPhoneAlt />}
                label="Phone"
                value={form.phone || "Pending"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 xl:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* LEFT FORM */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 xl:p-8">
              {/* VERIFIED STATUS */}
              <div className="bg-green-50 border border-green-100 text-green-700 rounded-2xl px-4 py-3 text-sm font-semibold mb-6 flex items-center gap-2">
                <FaCheckCircle />
                Aadhaar details loaded successfully
              </div>

              {/* PROGRESS MOBILE */}
              <div className="xl:hidden mb-6">
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

              {/* AADHAAR DISPLAY */}
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
                    <p className="text-xs text-red-600 mt-1">
                      {errors.aadhaar}
                    </p>
                  )}
                </div>
              </div>

              {/* FORM SECTIONS */}
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
          </div>

          {/* RIGHT SUMMARY - LAPTOP */}
          <div className="hidden xl:block xl:col-span-4">
            <div className="sticky top-6 space-y-6">
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
                  After saving this customer, the dealer can continue to Girvi
                  details and add pledged item information.
                </p>

                <div className="mt-5 bg-white/10 rounded-2xl p-4">
                  <p className="text-xs opacity-80">Current Step</p>
                  <p className="font-bold mt-1">Customer Registration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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

      <div className="xl:hidden">
        <DealerBottomNav />
      </div>
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function HeaderStat({ icon, label, value }: any) {
  return (
    <div className="bg-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-white/80 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-bold mt-2 text-white truncate">{value}</p>
    </div>
  );
}

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
    <div className="border-b border-gray-100 pb-3">
      <p className="text-xs text-gray-500 font-semibold">{label}</p>
      <p
        className={`text-sm font-bold text-gray-800 mt-1 ${
          multiline ? "break-words" : "truncate"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
