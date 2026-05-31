import { useNavigate } from "react-router-dom";
import { useGirvi } from "./GirviContext";
import { FaArrowLeft, FaLock, FaSave } from "react-icons/fa";
import DealerBottomNav from "../dealer/DealerBottomNav";

export default function LockerReview() {
  const nav = useNavigate();
  const { loanDetails, items, locker, setLocker } = useGirvi();

  function update(key: string, val: any) {
    setLocker({ ...locker, [key]: val });
  }

  const totalWeight = items.reduce(
    (sum: number, i: any) => sum + Number(i.weight || 0),
    0
  );

  const charges =
    Number(locker.processingFee || 0) + Number(locker.otherCharges || 0);

  const totalPayable = Number(loanDetails.amount || 0) + charges;

  async function confirm() {
    const token = localStorage.getItem("ps_token");

    const payload = {
      customerId: loanDetails.customerId || 1, // adjust if needed
      loanAmount: Number(loanDetails.amount),
      interestRate: Number(loanDetails.interestRate),
      interestType: loanDetails.interestType,
      pledgeDate: loanDetails.pledgeDate,
      maturityDate: loanDetails.maturityDate,

      items: items.map((i: any) => ({
        name: i.name,
        weight: Number(i.weight),
        purity: i.purity,
        description: i.desc,
      })),

      locker: {
        packetNo: locker.packetNo,
        lockerNo: locker.lockerNo,
        shelf: locker.shelf,
        box: locker.box,
      },

      charges: {
        processingFee: Number(locker.processingFee || 0),
        otherCharges: Number(locker.otherCharges || 0),
      },
    };

    try {
      const res = await fetch("https://pawnsecure-1.onrender.com/api/girvi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Failed to create girvi");
        return;
      }

      const data = await res.json();

      nav("/dealer/success", {
        state: {
          transactionId: data.transactionId,
          createdAt: data.createdAt,
        },
      });
    } catch {
      alert("Server error");
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
            <h1 className="font-bold text-lg">New Girvi</h1>
            <p className="text-xs opacity-80">PawnSecure</p>
          </div>

          <div className="w-6" />
        </div>

        <h2 className="text-2xl font-bold">Locker & Review</h2>
        <p className="text-sm opacity-80 mt-1">
          Verify details before final submission
        </p>
      </div>

      {/* CARD */}
      <div className="max-w-md mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          {/* STEP INDICATOR */}
          <div className="flex justify-between items-center text-xs font-semibold mb-6">
            <span className="text-green-600">Customer</span>
            <div className="flex-1 h-[2px] bg-green-600 mx-2" />

            <span className="text-green-600">Girvi</span>
            <div className="flex-1 h-[2px] bg-green-600 mx-2" />

            <span className="text-green-600">Items</span>
            <div className="flex-1 h-[2px] bg-purple-600 mx-2" />

            <span className="text-purple-600">Review</span>
          </div>

          {/* LOCKER INFO */}
          <Section title="Locker Details" icon={<FaLock />}>
            <Input
              label="Packet No"
              value={locker.packetNo}
              onChange={(v: any) => update("packetNo", v)}
            />

            <Input
              label="Locker No"
              value={locker.lockerNo}
              onChange={(v: any) => update("lockerNo", v)}
            />

            <Input
              label="Shelf"
              value={locker.shelf}
              onChange={(v: any) => update("shelf", v)}
            />

            <Input
              label="Box No"
              value={locker.box}
              onChange={(v: any) => update("box", v)}
            />
          </Section>

          {/* CHARGES */}
          <Section title="Charges">
            <Input
              label="Processing Fee (₹)"
              value={locker.processingFee}
              onChange={(v: any) => update("processingFee", v)}
            />

            <Input
              label="Other Charges (₹)"
              value={locker.otherCharges}
              onChange={(v: any) => update("otherCharges", v)}
            />
          </Section>

          {/* SUMMARY */}
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mt-4 text-sm">
            <p>
              <span className="font-semibold">Loan Amount:</span> ₹
              {loanDetails.amount}
            </p>

            <p className="mt-1">
              <span className="font-semibold">Total Weight:</span>{" "}
              {totalWeight} gm
            </p>

            <p className="mt-2 font-bold text-purple-700">
              Total Payable: ₹{totalPayable}
            </p>
          </div>

          {/* CONFIRM */}
          <button
            type="button"
            onClick={confirm}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            <FaSave />
            Confirm & Save Girvi
          </button>
        </div>
      </div>

      {/* ✅ BOTTOM NAV */}
      <DealerBottomNav />
    </div>
  );
}

/* ---------------- SECTION ---------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-purple-600">{icon}</span>}
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

/* ---------------- INPUT ---------------- */

function Input({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-semibold">{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border rounded-2xl px-4 py-3 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );
}