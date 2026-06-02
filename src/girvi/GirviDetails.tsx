import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSave, FaUpload } from "react-icons/fa";
import DealerBottomNav from "../dealer/DealerBottomNav";
import { useGirvi } from "./GirviContext";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

export default function AddGirvi() {
  const nav = useNavigate();

  const { customer, loanDetails, setLoanDetails } = useGirvi();

  const token = localStorage.getItem("ps_token");
  const dealerId = localStorage.getItem("ps_dealer_id");

  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);

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
  }

  const resolvedCustomerId =
    loanDetails.customerId ||
    customer?.id ||
    customer?.customerId ||
    customer?.customer_id ||
    localStorage.getItem("ps_customer_id");

  useEffect(() => {
    if (!loanDetails.customerId) {
      const savedCustomerId =
        customer?.id ||
        customer?.customerId ||
        customer?.customer_id ||
        localStorage.getItem("ps_customer_id");

      if (savedCustomerId) {
        setLoanDetails((prev: any) => ({
          ...prev,
          customerId: savedCustomerId,
        }));
      }
    }
  }, [loanDetails.customerId, customer, setLoanDetails]);

  const totalValue =
    Number(form.itemWeightGram || 0) * Number(form.ratePerGram || 0);

  async function saveGirvi() {
    const customerId =
      loanDetails.customerId ||
      customer?.id ||
      customer?.customerId ||
      customer?.customer_id ||
      localStorage.getItem("ps_customer_id");

    if (!customerId) {
      alert("Customer not selected");
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

    if (!form.itemName.trim()) {
      alert("Please enter item name");
      return;
    }

    if (!form.itemWeightGram || Number(form.itemWeightGram) <= 0) {
      alert("Please enter valid item weight");
      return;
    }

    if (!form.ratePerGram || Number(form.ratePerGram) <= 0) {
      alert("Please enter valid rate per gram");
      return;
    }

    if (form.interestRate === "" || Number(form.interestRate) < 0) {
      alert("Please enter valid interest rate");
      return;
    }

    if (!form.girviDate) {
      alert("Please select girvi date");
      return;
    }

    if (!form.maturityDate) {
      alert("Please select maturity date");
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
        let message = "Failed to save girvi";

        try {
          const data = await res.json();
          message = data.message || message;
        } catch {
          message = await res.text();
        }

        throw new Error(message || "Failed to save girvi");
      }

      alert("Girvi added successfully");

      nav("/dealer/girvi");
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-32">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => nav(-1)}>
            <FaArrowLeft className="text-xl" />
          </button>

          <div className="text-center">
            <h1 className="font-bold text-lg">Add Girvi</h1>
            <p className="text-xs opacity-80">PawnSecure</p>
          </div>

          <div className="w-6" />
        </div>

        <h2 className="text-2xl font-bold">Add New Girvi</h2>

        <p className="text-sm opacity-80 mt-1">
          Enter girvi details and upload item photo
        </p>
      </div>

      {/* CARD */}
      <div className="max-w-md mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-5">
          {/* CUSTOMER */}
          <Section title="Customer">
            <Info
              label="Customer ID"
              value={resolvedCustomerId || "Not selected"}
            />
          </Section>

          {/* GIRVI DATES */}
          <Section title="Girvi Dates">
            <Input
              label="Girvi Date"
              type="date"
              value={form.girviDate}
              onChange={(v: any) => update("girviDate", v)}
            />

            <Input
              label="Maturity Date"
              type="date"
              value={form.maturityDate}
              onChange={(v: any) => update("maturityDate", v)}
            />

            <Input
              label="Interest Rate (%)"
              value={form.interestRate}
              onChange={(v: any) => update("interestRate", v)}
              placeholder="Enter interest rate"
            />
          </Section>

          {/* ITEM DETAILS */}
          <Section title="Item Details">
            <Input
              label="Item Name"
              value={form.itemName}
              onChange={(v: any) => update("itemName", v)}
              placeholder="Enter item name"
            />

            <div>
              <label className="text-xs font-semibold text-gray-500">
                Item Type
              </label>

              <select
                value={form.itemType}
                onChange={(e) => update("itemType", e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-2xl border bg-gray-50 outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
              </select>
            </div>

            <Input
              label="Weight (Gram)"
              value={form.itemWeightGram}
              onChange={(v: any) => update("itemWeightGram", v)}
              placeholder="Enter weight"
            />

            <Input
              label="Rate per Gram (₹)"
              value={form.ratePerGram}
              onChange={(v: any) => update("ratePerGram", v)}
              placeholder="Enter rate per gram"
            />

            <div className="bg-purple-50 text-purple-700 rounded-xl px-4 py-3 text-sm font-bold">
              Total Value: ₹ {totalValue.toFixed(2)}
            </div>
          </Section>

          {/* PHOTO */}
          <Section title="Upload Item Photo">
            <label className="flex items-center justify-center gap-2 border-dashed border-2 rounded-xl p-4 cursor-pointer bg-gray-50">
              <FaUpload />

              <span>{photo ? photo.name : "Choose Image (Optional)"}</span>

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </label>
          </Section>

          {/* REMARKS */}
          <Section title="Remarks">
            <textarea
              value={form.remarks}
              onChange={(e) => update("remarks", e.target.value)}
              className="w-full border rounded-xl p-3 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Optional remarks"
              rows={3}
            />
          </Section>

          {/* SAVE */}
          <button
            type="button"
            onClick={saveGirvi}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FaSave />

            {loading ? "Saving..." : "Save Girvi"}
          </button>
        </div>
      </div>

      <DealerBottomNav />
    </div>
  );
}

/* ---------- UI HELPERS ---------- */

function Section({ title, children }: any) {
  return (
    <div>
      <h3 className="font-bold text-sm mb-2">{title}</h3>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500">{label}</label>

      <input
        type={type}
        value={value}
        placeholder={placeholder || label}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );
}

function Info({ label, value }: any) {
  return (
    <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm">
      <span className="font-semibold">{label}:</span> {value}
    </div>
  );
}
