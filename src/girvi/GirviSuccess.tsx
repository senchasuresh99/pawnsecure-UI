import { useNavigate, useLocation } from "react-router-dom";
import { useGirvi } from "./GirviContext";
import jsPDF from "jspdf";
import DealerBottomNav from "../dealer/DealerBottomNav";

export default function GirviSuccess() {
  const nav = useNavigate();
  const location = useLocation();

  const { customer, loanDetails, items, locker } = useGirvi();

  // ✅ GET DATA FROM BACKEND (passed from LockerReview)
  const { transactionId, createdAt } = location.state || {};

  // ✅ FALLBACK (if user refreshes page)
  const txnId =
    transactionId || "TXN" + Math.floor(100000 + Math.random() * 900000);

  const today = createdAt || new Date().toLocaleString();

  // ✅ CALCULATIONS
  const totalWeight = items.reduce(
    (sum: any, i: any) => sum + Number(i.weight || 0),
    0
  );

  const charges =
    Number(locker.processingFee || 0) + Number(locker.otherCharges || 0);

  const totalPayable = Number(loanDetails.amount || 0) + charges;

  const customerName =
    customer?.fullName || customer?.name || customer?.customerName || "N/A";

  // ✅ WhatsApp Message (uses backend txn)
  const whatsappMessage = encodeURIComponent(`
Girvi Created Successfully ✅

Customer: ${customerName}
Loan Amount: ₹${loanDetails.amount}
Total Weight: ${totalWeight} gm
Maturity Date: ${loanDetails.maturityDate}

Locker:
Packet No: ${locker.packetNo}
Locker No: ${locker.lockerNo}

Transaction ID: ${txnId}
`);

  function openWhatsapp() {
    window.open(`https://wa.me/?text=${whatsappMessage}`);
  }

  function printReceipt() {
    const doc = new jsPDF();

    let y = 20;

    // ✅ HEADER
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("PawnSecure", 105, 12, { align: "center" });

    y = 30;

    doc.setTextColor(0, 0, 0);

    // ✅ TITLE
    doc.setFontSize(14);
    doc.text("Girvi Receipt", 105, y, { align: "center" });

    y += 6;

    doc.setFontSize(10);
    doc.text(`Txn ID: ${txnId}`, 20, y);
    doc.text(`Date: ${today}`, 130, y);

    y += 8;

    // ✅ SECTION BOX FUNCTION
    function drawBox(title: string, lines: string[]) {
      doc.setDrawColor(200);
      doc.rect(15, y - 4, 180, lines.length * 6 + 10);

      doc.setFontSize(11);
      doc.text(title, 20, y);

      y += 6;

      doc.setFontSize(10);
      lines.forEach((line) => {
        doc.text(line, 20, y);
        y += 6;
      });

      y += 4;
    }

    // ✅ CUSTOMER
    drawBox("Customer Details", [`Name: ${customerName}`]);

    // ✅ LOAN
    drawBox("Loan Details", [
      `Loan Amount: Rs. ${loanDetails.amount}`,
      `Total Weight: ${totalWeight} gm`,
      `Maturity Date: ${loanDetails.maturityDate}`,
      `Total Payable: Rs. ${totalPayable}`,
    ]);

    // ✅ ITEMS
    drawBox(
      "Items",
      items.length > 0
        ? items.map(
            (i: any) => `${i.name} - ${i.weight} gm (${i.purity || "-"})`
          )
        : ["No items added"]
    );

    // ✅ LOCKER
    drawBox("Locker Details", [
      `Packet No: ${locker.packetNo}`,
      `Locker No: ${locker.lockerNo}`,
      `Shelf: ${locker.shelf}`,
      `Box: ${locker.box}`,
    ]);

    // ✅ FOOTER LINE
    doc.line(20, y, 190, y);
    y += 6;

    // ✅ FOOTER TEXT
    doc.setFontSize(10);
    doc.text("This is a digitally generated receipt", 105, y, {
      align: "center",
    });

    y += 5;

    doc.setFontSize(9);
    doc.text("Powered by PawnSecure", 105, y, {
      align: "center",
    });

    // ✅ SAVE
    doc.save(`Girvi-Receipt-${txnId}.pdf`);
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] px-3 sm:px-6 py-6 pb-32">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-2xl mx-auto">
        {/* ✅ SUCCESS CARD */}
        <div className="bg-green-50 border border-green-200 rounded-3xl p-6 text-center shadow-sm">
          <div className="text-green-600 text-4xl mb-2">✔</div>

          <h2 className="text-lg sm:text-xl font-bold text-green-700">
            Girvi Created Successfully!
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Transaction ID: {txnId}
          </p>

          <p className="text-xs text-gray-400">{today}</p>
        </div>

        {/* ✅ DETAILS */}
        <div className="mt-5 bg-white border rounded-3xl p-5 shadow-sm text-sm sm:text-base space-y-3">
          <Row label="Customer" value={customerName} />
          <Row label="Loan Amount" value={`₹${loanDetails.amount}`} />
          <Row label="Total Weight" value={`${totalWeight} gm`} />
          <Row label="Total Payable" value={`₹${totalPayable}`} />
          <Row label="Maturity Date" value={loanDetails.maturityDate} />
        </div>

        {/* ✅ LOCKER INFO */}
        <div className="mt-5 bg-white border rounded-3xl p-5 shadow-sm text-sm sm:text-base">
          <p className="font-bold mb-3 text-gray-900">Locker Details</p>

          <div className="space-y-2">
            <Row label="Packet No" value={locker.packetNo} />
            <Row label="Locker No" value={locker.lockerNo} />
            <Row label="Shelf" value={locker.shelf} />
            <Row label="Box No" value={locker.box} />
          </div>
        </div>

        {/* ✅ BUTTONS */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={printReceipt}
            className="w-full bg-gray-100 hover:bg-gray-200 py-4 rounded-2xl font-semibold text-sm sm:text-base"
          >
            🧾 Download PDF Receipt
          </button>

          <button
            type="button"
            onClick={openWhatsapp}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-sm sm:text-base"
          >
            📲 Share via WhatsApp
          </button>

          <button
            type="button"
            onClick={() => nav("/dealer/customer")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-sm sm:text-base"
          >
            + New Girvi
          </button>
        </div>
      </div>

      {/* ✅ BOTTOM NAV */}
      <DealerBottomNav />
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-gray-500">{label}</span>

      <span className="font-semibold text-right break-words max-w-[60%]">
        {value || "N/A"}
      </span>
    </div>
  );
}