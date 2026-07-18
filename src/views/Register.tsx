import { useState } from "react";
import { Link } from "react-router-dom";
import TermsModal from "../components/TermsModal";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE } from "../config/api";

// ✅ WhatsApp details
const waNumber = 918290818133;
const waGroupLink =
  "https://chat.whatsapp.com/KrCnMpNvmJP6ZCa3FW1hPB?s=sh&p=a&mlu=4";
const waText = encodeURIComponent(
  "Hello, I have registered and am awaiting approval."
);
const waChatLink = `https://wa.me/${waNumber}?text=${waText}`;
const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  gst?: string;
  shopName?: string;
  city?: string;
  shopAddress?: string;
  licenseNumber?: string;
  agree?: string;
};

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    gst: "",
    shopName: "",
    city: "",
    shopAddress: "",
    licenseNumber: "",
    agree: false,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ POPUPS
  const [popupError, setPopupError] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: any) {
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: undefined });
  }

  function validate(): boolean {
    const e: Errors = {};

    if (!form.name.trim()) e.name = "Full name is required";

    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address";
    }

    if (!form.password) {
      e.password = "Password is required";
    } else if (form.password.length < 6) {
      e.password = "Minimum 6 characters required";
    }

    if (!form.phone) {
      e.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(form.phone)) {
      e.phone = "Enter a valid 10-digit phone number";
    }

    if (!form.gst) e.gst = "GST number is required";
    //if (!form.licenseNumber) e.licenseNumber = "License number is required";
    if (!form.shopName) e.shopName = "Shop name is required";
    if (!form.city) e.city = "Please select your state";
    if (!form.shopAddress) e.shopAddress = "Shop address is required";
    if (!form.agree) e.agree = "Please accept the terms & conditions";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;

    setLoading(true);
    setPopupError("");

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phoneNumber: form.phone,
          gstNumber: form.gst,
          licenseNumber: form.licenseNumber,
          shopName: form.shopName,
          city: form.city,
          shopAddress: form.shopAddress,
        }),
      });

      if (!res.ok) {
        const msg = (await res.text()).toLowerCase();
        if (msg.includes("email")) {
          setPopupError("Email address already in use.");
        } else if (msg.includes("phone")) {
          setPopupError("Phone number already in use.");
        } else if (msg.includes("gst")) {
          setPopupError("GST Number already in use.");
        } else {
          setPopupError("Registration failed. Please try again.");
        }
        return;
      }

      // ✅ SHOW SUCCESS POPUP
      setShowSuccessPopup(true);

      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        gst: "",
        shopName: "",
        city: "",
        shopAddress: "",
        licenseNumber: "",
        agree: false,
      });
      setErrors({});
    } catch {
      setPopupError("Server unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ HANDLE OK → REDIRECT TO LOGIN
  function handleSuccessOk() {
    setShowSuccessPopup(false);
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <img
              src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo3.png?raw=true"
              alt="PawnSecure"
              className="mx-auto h-60 object-contain"
            />
          </div>

          <Input
            icon="👤"
            placeholder="Full Name"
            value={form.name}
            error={errors.name}
            onChange={(v: any) => update("name", v)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              icon="📧"
              placeholder="Email"
              value={form.email}
              error={errors.email}
              onChange={(v: any) => update("email", v)}
            />
            <Input
              icon="🔒"
              type="password"
              placeholder="Password"
              value={form.password}
              error={errors.password}
              onChange={(v: any) => update("password", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              icon="📞"
              placeholder="Phone Number"
              value={form.phone}
              error={errors.phone}
              onChange={(v: any) => update("phone", v)}
            />
            <Input
              icon="🧾"
              placeholder="GST Number"
              value={form.gst}
              error={errors.gst}
              onChange={(v: any) => update("gst", v)}
            />
          </div>

          {/* <Input
            icon="🆔"
            placeholder="Shop License Number"
            value={form.licenseNumber}
            //error={errors.licenseNumber}
            onChange={(v: any) => update("licenseNumber", v)}
          /> */}

          <Input
  icon="📋" // Changed from 🆔 to 📋
  placeholder="Shop License Number (Optional)" // Added (Optional) to the text
  value={form.licenseNumber}
  onChange={(v: any) => update("licenseNumber", v)}
  // error is not passed, so it will never show a red border for this field
/>

          <Input
            icon="🏪"
            placeholder="Shop Name"
            value={form.shopName}
            error={errors.shopName}
            onChange={(v: any) => update("shopName", v)}
          />

          <Textarea
            icon="📍"
            placeholder="Shop Address"
            value={form.shopAddress}
            error={errors.shopAddress}
            onChange={(v: any) => update("shopAddress", v)}
          />

          <Select
            icon="🌍"
            placeholder="Select State"
            value={form.city}
            error={errors.city}
            options={indianStates}
            onChange={(v: any) => update("city", v)}
          />

          <label className="flex items-start gap-2 text-sm text-gray-600 mt-4">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => update("agree", e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-indigo-600 font-semibold hover:underline"
              >
                terms and conditions
              </button>
            </span>
          </label>
          {errors.agree && (
            <p className="text-xs text-red-600 mt-1">{errors.agree}</p>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className={`w-full mt-5 py-3 rounded-xl font-bold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            }`}
          >
            {loading ? "Creating Account..." : "👤 Create Dealer Account"}
          </button>

          <div className="border-t my-6"></div>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/" className="text-indigo-600 font-bold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </main>

      <Footer />

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      {popupError && (
        <ErrorModal
          message={popupError}
          onClose={() => setPopupError("")}
        />
      )}

      {showSuccessPopup && (
        <RegistrationSuccessModal onClose={handleSuccessOk} />
      )}
    </div>
  );
}

function Select({ icon, placeholder, value, error, options, onChange }: any) {
  return (
    <div className="mt-3">
      <div
        className={`flex items-center gap-3 border rounded-lg px-3 py-3 bg-gray-50 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <span className="text-indigo-500">{icon}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent outline-none w-full text-sm text-gray-700"
        >
          <option value="">{placeholder}</option>
          {options.map((item: string) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function RegistrationSuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="text-green-600 text-5xl mb-3">✔</div>
        <h2 className="text-xl font-bold mb-2">Registration Successful</h2>
        <p className="text-gray-600 mb-4">
          Your account has been created successfully.
          <br />
          <span className="font-semibold">Await admin approval.</span>
        </p>
        <div className="bg-gray-50 rounded-lg p-3 mb-5 text-sm text-left">
          <p className="font-semibold mb-2">Next Steps:</p>
          <ul className="space-y-2">
            <li>
              👉{" "}
              <a href={waChatLink} target="_blank" rel="noreferrer" className="text-green-600 font-semibold hover:underline">
                Chat with Admin on WhatsApp
              </a>
            </li>
            <li>
              👉{" "}
              <a href={waGroupLink} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold hover:underline">
                Join Dealer WhatsApp Group
              </a>
            </li>
          </ul>
        </div>
        <button
          onClick={onClose}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          OK
        </button>
      </div>
    </div>
  );
}

function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="text-purple-600 text-5xl mb-3">✖</div>
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="text-gray-600 mb-5">{message}</p>
        <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold">
          OK
        </button>
      </div>
    </div>
  );
}

function Input({ icon, placeholder, value, error, onChange, type = "text" }: any) {
  return (
    <div className="mt-3">
      <div className={`flex items-center gap-3 border rounded-lg px-3 py-3 bg-gray-50 ${error ? "border-red-500" : "border-gray-300"}`}>
        <span className="text-indigo-500">{icon}</span>
        <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="bg-transparent outline-none w-full text-sm" />
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Textarea({ icon, placeholder, value, error, onChange }: any) {
  return (
    <div className="mt-3">
      <div className={`flex items-start gap-3 border rounded-lg px-3 py-3 bg-gray-50 ${error ? "border-red-500" : "border-gray-300"}`}>
        <span className="text-indigo-500 mt-1">{icon}</span>
        <textarea rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="bg-transparent outline-none w-full text-sm resize-none" />
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}