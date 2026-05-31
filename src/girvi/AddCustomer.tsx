import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGirvi } from "./GirviContext";
import { FaArrowLeft, FaSave, FaUpload } from "react-icons/fa";
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

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-32">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate("/dealer/customer-register")}
          >
            <FaArrowLeft className="text-xl" />
          </button>

          <div className="text-center">
            <h1 className="font-bold text-lg">Register Customer</h1>
            <p className="text-xs opacity-80">PawnSecure</p>
          </div>

          <div className="w-6" />
        </div>

        <h2 className="text-2xl font-bold">Customer Details</h2>
        <p className="text-sm opacity-80 mt-1">
          Aadhaar details are auto-filled. Enter phone and upload customer photo.
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-5 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          {/* VERIFIED STATUS */}
          <div className="bg-green-50 border border-green-100 text-green-700 rounded-2xl px-4 py-3 text-sm font-semibold mb-5">
            ✅ Aadhaar details loaded successfully
          </div>

          {/* AADHAAR DISPLAY */}
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-5">
            <p className="text-xs text-purple-600 font-semibold">
              Aadhaar Number
            </p>

            <p className="text-sm font-bold text-purple-800 mt-1">
              {aadhaarDisplay}
            </p>

            {errors.aadhaar && (
              <p className="text-xs text-red-600 mt-1">{errors.aadhaar}</p>
            )}
          </div>

          <Input
            label="Full Name *"
            value={form.name}
            error={errors.name}
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

          <Textarea
            label="Address *"
            value={form.address}
            error={errors.address}
            onChange={(v: string) => update("address", v)}
          />

          <Input
            label="Phone Number *"
            value={form.phone}
            error={errors.phone}
            placeholder="Enter customer phone number"
            onChange={(v: string) =>
              update("phone", v.replace(/\D/g, "").slice(0, 10))
            }
          />

          {/* CUSTOMER PHOTO */}
          <div className="mt-4">
            <label className="text-xs text-gray-500 font-semibold">
              Customer Photo <span className="text-red-500">*</span>
            </label>

            <div
              className={`mt-1 border-2 border-dashed rounded-2xl p-4 bg-gray-50 ${
                errors.customerPhoto ? "border-red-500" : "border-purple-200"
              }`}
            >
              {!photoPreview ? (
                <label className="cursor-pointer flex flex-col items-center justify-center text-center py-5">
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
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
                      handlePhotoChange(file);
                    }}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-4">
                  <img
                    src={photoPreview}
                    alt="Customer preview"
                    className="w-24 h-24 rounded-2xl object-cover border border-gray-200"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">
                      Customer photo selected
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      This photo will be saved with customer profile.
                    </p>

                    <div className="flex gap-2 mt-3">
                      <label className="cursor-pointer px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            handlePhotoChange(file);
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handlePhotoChange(null)}
                        className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {errors.customerPhoto && (
              <p className="text-xs text-red-600 mt-1">
                {errors.customerPhoto}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={saveCustomer}
            disabled={saving}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            <FaSave />
            {saving ? "Saving Customer..." : "Save Customer"}
          </button>
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

      {/* ✅ BOTTOM NAV */}
      <DealerBottomNav />
    </div>
  );
}

/* ---------------- INPUT ---------------- */

function Input({
  label,
  value,
  error,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-4">
      <label className="text-xs text-gray-500 font-semibold">{label}</label>

      <input
        value={value}
        placeholder={placeholder || label}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full mt-1 border rounded-2xl px-4 py-3 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500 ${
          error ? "border-red-500" : "border-gray-200"
        }`}
      />

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

/* ---------------- SELECT ---------------- */

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
    <div className="mt-4">
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

/* ---------------- TEXTAREA ---------------- */

function Textarea({
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
    <div className="mt-4">
      <label className="text-xs text-gray-500 font-semibold">{label}</label>

      <textarea
        rows={4}
        value={value}
        placeholder={label}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full mt-1 border rounded-2xl px-4 py-3 text-sm outline-none bg-gray-50 resize-none focus:ring-2 focus:ring-purple-500 ${
          error ? "border-red-500" : "border-gray-200"
        }`}
      />

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}