import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaHistory, FaCalendarAlt, FaCoins, FaCheck, FaTimes, FaBox } from "react-icons/fa";
import DealerSidebar from "../dealer/DealerSidebar";
import MobileDealerSidebar from "../dealer/MobileDealerSidebar";
import DealerMobileBottomNav from "../dealer/DealerMobileBottomNav";
import { API_BASE } from "../config/api";

type TimelineEvent = {
  transactionId: number;
  transactionType: string;
  title: string;
  description: string;
  principalBefore: number;
  principalAfter: number;
  interestPaid: number;
  principalPaid: number;
  releasedItemIds: string;
  transactionDate: string;
};

type TimelineResponse = {
  girviId: number;
  customerId: number;
  customerName: string;
  customerMobile: string;
  dealerId: number;
  totalLoanAmount: number;
  outstandingLoanAmount: number;
  interestRate: number;
  girviDate: string;
  maturityDate: string;
  status: string;
  totalItems: number;
  timeline: TimelineEvent[];
};

export default function GirviTimelinePage() {
  const { girviId } = useParams<{ girviId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // --- TOAST STATE ---
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  function showToast(
    message: string,
    type: "success" | "error" | "info" = "info"
  ) {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  const token = localStorage.getItem("ps_token");
  const dealerId = localStorage.getItem("ps_dealer_id");
  const dealerName = localStorage.getItem("ps_dealer_name") || "Dealer";

  useEffect(() => {
    if (!girviId || !token || !dealerId) {
      setError("Missing active authentication parameters.");
      setLoading(false);
      return;
    }

    async function fetchTimeline() {
      try {
        const res = await fetch(`${API_BASE}/girvi/${girviId}/timeline`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-DEALER-ID": dealerId!,
          },
        });

        if (!res.ok) throw new Error("Could not fetch the asset ledger logs.");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
        showToast(err.message || "Something went wrong.", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchTimeline();
  }, [girviId, token, dealerId]);

  const formatCurrency = (val: number) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans relative">
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={false} />
        <main className="ml-64 flex-1 flex flex-col p-6 xl:p-8 max-w-[1400px] w-full mx-auto">
          {renderHeader()}
          {renderContent()}
        </main>
      </div>

      <div className="lg:hidden min-h-screen pb-32">
        <MobileDealerSidebar 
          open={showMobileSidebar} 
          onClose={() => setShowMobileSidebar(false)} 
          isAdminView={false}
          dealerName={dealerName}
          dealerId={dealerId || "-"}
        />
        <header className="h-16 bg-white border-b px-4 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setShowMobileSidebar(true)} className="text-xl">☰</button>
          <h2 className="font-bold text-gray-900">Asset Ledger Logs</h2>
          <button onClick={() => navigate(-1)}><FaArrowLeft /></button>
        </header>
        <div className="p-4">{renderContent()}</div>
        <DealerMobileBottomNav active="girvi" isAdminView={false} />
      </div>

      {/* --- CUSTOM TOAST NOTIFICATION COMPONENT --- */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );

  function renderHeader() {
    return (
      <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl p-6 mb-6 flex justify-between items-center shadow-md">
        <div>
          <p className="text-xs uppercase font-bold opacity-75 tracking-wider">Audit History</p>
          <h1 className="text-2xl font-black mt-1">Girvi Lifecycle Token</h1>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition"
        >
          <FaArrowLeft /> Back
        </button>
      </div>
    );
  }

  function renderContent() {
    if (loading) return <div className="text-center py-20 text-sm font-semibold text-gray-500"><div className="w-8 h-8 border-3 border-[#4820C5] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>Syncing audit entries...</div>;
    if (error) return <div className="bg-red-50 text-red-600 border rounded-2xl p-4 text-sm font-semibold">{error}</div>;
    if (!data) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Loan Master Metadata Summary */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-black text-gray-900 text-base border-b pb-2 flex items-center gap-2">
            <FaCoins className="text-purple-600" /> Contract Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <p className="text-gray-400 uppercase tracking-wider text-[10px]">Customer</p>
              <p className="text-gray-800 text-sm font-bold truncate">{data.customerName}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider text-[10px]">Mobile</p>
              <p className="text-gray-800 text-sm font-bold">{data.customerMobile || "-"}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider text-[10px]">Principal Loan</p>
              <p className="text-green-600 text-sm font-black">{formatCurrency(data.totalLoanAmount)}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider text-[10px]">Outstanding Owed</p>
              <p className="text-red-600 text-sm font-black">{formatCurrency(data.outstandingLoanAmount)}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider text-[10px]">Contract Date</p>
              <p className="text-gray-700 font-bold">{formatDate(data.girviDate)}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider text-[10px]">Maturity Threshold</p>
              <p className="text-gray-700 font-bold">{formatDate(data.maturityDate)}</p>
            </div>
          </div>
          <div className="pt-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wide">
              {data.status}
            </span>
          </div>
        </div>

        {/* Dynamic Metric Tree Grid Vertical Stepper */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-black text-gray-900 text-base mb-6 flex items-center gap-2">
            <FaHistory className="text-purple-600" /> Step Sequence Activity Log
          </h3>
          
          <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
            {data.timeline.map((event, idx) => (
              <div key={event.transactionId || idx} className="relative pl-6">
                {/* Visual Connector Stepper Circle Dot */}
                <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-purple-600 ring-4 ring-purple-100 z-10" />
                
                <div className="border rounded-2xl p-4 shadow-2xl bg-white hover:border-purple-200 transition-all">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h4 className="font-black text-gray-900 text-sm leading-tight">{event.title}</h4>
                      <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-1">
                        <FaCalendarAlt /> {new Date(event.transactionDate).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border">
                      TXN #{event.transactionId}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-xs text-gray-500 font-medium italic mt-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                      "{event.description}"
                    </p>
                  )}

                  {/* Operational Ledger Data Summary block */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 text-[11px] font-bold">
                    {event.interestPaid > 0 && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2">
                        <span className="text-blue-500 block text-[9px] uppercase tracking-wider">Interest Collected</span>
                        <span className="text-blue-700 text-xs font-black">{formatCurrency(event.interestPaid)}</span>
                      </div>
                    )}
                    {event.principalPaid > 0 && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2">
                        <span className="text-emerald-500 block text-[9px] uppercase tracking-wider">Principal Collected</span>
                        <span className="text-emerald-700 text-xs font-black">{formatCurrency(event.principalPaid)}</span>
                      </div>
                    )}
                    {event.releasedItemIds && (
                      <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-2 col-span-2 md:col-span-1">
                        <span className="text-orange-500 block text-[9px] uppercase tracking-wider">Released Item IDs</span>
                        <span className="text-orange-700 truncate block text-xs">{event.releasedItemIds}</span>
                      </div>
                    )}
                    <div className="bg-gray-50 border rounded-xl p-2 col-span-2 md:col-span-3 flex justify-between items-center mt-1">
                      <span className="text-gray-400 text-[10px] uppercase">Outstanding Loan Balance</span>
                      <span className="text-gray-900 font-black text-sm">
                        {formatCurrency(event.principalBefore)} → {formatCurrency(event.principalAfter)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

// --- CUSTOM TOAST COMPONENT ---
function Toast({
  toast,
  onClose,
}: {
  toast: { message: string; type: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const bgColor =
    toast.type === "success"
      ? "bg-green-50 border-green-200"
      : toast.type === "error"
      ? "bg-red-50 border-red-200"
      : "bg-blue-50 border-blue-200";

  const textColor =
    toast.type === "success"
      ? "text-green-800"
      : toast.type === "error"
      ? "text-red-800"
      : "text-blue-800";

  const Icon =
    toast.type === "success"
      ? FaCheck
      : toast.type === "error"
      ? FaTimes
      : FaBox;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] animate-in slide-in-from-top-4 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl ${bgColor}`}
      >
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm ${textColor}`}
        >
          <Icon className="text-sm" />
        </div>
        <p className={`text-sm font-bold ${textColor}`}>{toast.message}</p>
        <button
          onClick={onClose}
          className={`ml-3 opacity-60 hover:opacity-100 transition ${textColor}`}
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}