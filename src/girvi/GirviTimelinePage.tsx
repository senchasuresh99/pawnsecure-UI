import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaUniversity,
  FaPercentage,
  FaWallet,
  FaGem,
  FaCheckCircle,
  FaDownload,
  FaPrint,
  FaRegUser,
  FaPhoneAlt,
  FaRegCalendarAlt,
  FaBolt,
  FaInfoCircle,
  FaTimes,
  FaBox,
  FaCheck
} from "react-icons/fa";
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

type GirviItemDTO = {
  id?: number;
  itemName?: string;
  itemType?: string;
  itemWeightGram?: number;
  ratePerGram?: number;
  itemValue?: number;
  status?: string;
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
  remarks?: string;
};

export default function GirviTimelinePage() {
  const { girviId } = useParams<{ girviId: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // Used to grab items from GirviList
  
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Extract items passed from GirviList navigation state
  const passedItems: GirviItemDTO[] = location.state?.passedItems || [];

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  function showToast(message: string, type: "success" | "error" | "info" = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
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

  const formatCurrency = (val: number | undefined) =>
    `₹ ${Number(val || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Calculate totals
  const totalInterestPaid = data?.timeline?.reduce((acc, ev) => acc + (ev.interestPaid || 0), 0) || 0;
  const totalPrincipalPaid = data?.timeline?.reduce((acc, ev) => acc + (ev.principalPaid || 0), 0) || 0;
  
  const activeItemsValue = passedItems.filter(i => String(i.status).toUpperCase() === 'ACTIVE').reduce((acc, i) => acc + (i.itemValue || 0), 0);
  const releasedItemsValue = passedItems.filter(i => String(i.status).toUpperCase() === 'RELEASED').reduce((acc, i) => acc + (i.itemValue || 0), 0);
  const totalItemsValue = activeItemsValue + releasedItemsValue;

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans">
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={false} />
        <main className="ml-64 flex-1 flex flex-col p-6 max-w-[1300px] w-full mx-auto">
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
          <button onClick={() => setShowMobileSidebar(true)} className="text-xl">
            ☰
          </button>
          <h2 className="font-bold text-gray-900">Metro Map</h2>
          <button onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
        </header>
        <div className="p-4 space-y-4">
          {renderHeaderMobile()}
          {renderContent()}
        </div>
        <DealerMobileBottomNav active="girvi" isAdminView={false} />
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );

  function renderHeader() {
    return (
      <div className="mb-6">
        <div className="text-xs text-gray-500 font-medium mb-3">
          Dashboard {">"} Girvi List {">"} Girvi Details {">"} <span className="text-gray-900 font-bold">Metro Map</span>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4 mb-1">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Girvi Metro Map</h1>
              {data && (
                <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  data.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                }`}>
                  {data.status}
                </span>
              )}
            </div>
            {data && (
              <div className="text-sm text-gray-500 ml-9 border-l-2 pl-3 border-gray-300">
                Girvi ID: GV-2026-{data.girviId} <span className="mx-2">|</span> Invoice: INV-{data.girviId}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition shadow-sm">
              <FaDownload /> Download Report
            </button>
            <button className="flex items-center gap-2 bg-[#1a233a] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2c3859] transition shadow-sm">
              <FaPrint /> Print
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderHeaderMobile() {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          Girvi Metro Map
        </h1>
        {data && (
          <div className="text-xs text-gray-500">
            Girvi ID: GV-2026-{data.girviId} <br /> Invoice: INV-{data.girviId}
          </div>
        )}
      </div>
    );
  }

  function renderContent() {
    if (loading)
      return (
        <div className="text-center py-20 text-sm font-semibold text-gray-500">
          <div className="w-8 h-8 border-3 border-[#4820C5] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading timeline data...
        </div>
      );
    if (error)
      return (
        <div className="bg-red-50 text-red-600 border rounded-2xl p-4 text-sm font-semibold">
          {error}
        </div>
      );
    if (!data) return null;

    return (
      <div className="space-y-6">
        {/* --- TOP SECTION: LATEST DETAILS --- */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Girvi Latest Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] lg:grid-cols-[280px_1fr] gap-8">
            
            {/* Left Side: Customer & Loan Info */}
            <div className="space-y-5">
              <DetailRow icon={<FaRegUser />} label="Customer Name" value={data.customerName} />
              <DetailRow icon={<FaPhoneAlt />} label="Mobile Number" value={data.customerMobile || "-"} />
              <DetailRow icon={<FaRegCalendarAlt />} label="Girvi Date" value={formatDate(data.girviDate)} />
              <DetailRow icon={<FaRegCalendarAlt />} label="Maturity Date" value={formatDate(data.maturityDate)} />
              <DetailRow icon={<FaPercentage />} label="Interest Rate" value={`${data.interestRate}% (Per Month)`} />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                  <FaBolt />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Status</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    data.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {data.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Metrics & Table */}
            <div>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <MetricCard 
                  title="Outstanding Principal" 
                  value={formatCurrency(data.outstandingLoanAmount)} 
                  subtext="(After Last Transaction)" 
                  icon={<FaWallet className="text-blue-500" />} 
                  borderColor="border-blue-200" 
                  bgColor="bg-blue-50/50" 
                  textColor="text-blue-900"
                />
                <MetricCard 
                  title="Total Interest Paid" 
                  value={formatCurrency(totalInterestPaid)} 
                  subtext="(Till Date)" 
                  icon={<FaPercentage className="text-green-500" />} 
                  borderColor="border-green-200" 
                  bgColor="bg-green-50/50" 
                  textColor="text-green-900"
                />
                <MetricCard 
                  title="Total Paid (Principal)" 
                  value={formatCurrency(totalPrincipalPaid)} 
                  subtext="(Till Date)" 
                  icon={<FaWallet className="text-orange-500" />} 
                  borderColor="border-orange-200" 
                  bgColor="bg-orange-50/50" 
                  textColor="text-orange-900"
                />
              </div>

              {/* Simple Text Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 border-b border-gray-100 pb-6">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Actual Loan Amount</p>
                  <p className="font-bold text-gray-900">{formatCurrency(data.totalLoanAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Calculated Loan Amount (Based on items)</p>
                  <p className="font-bold text-gray-900">{formatCurrency(totalItemsValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Remarks</p>
                  <p className="font-medium text-gray-800 text-sm truncate">{data.remarks || "-"}</p>
                </div>
              </div>

              {/* Items Summary Table */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Current Items Summary</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-semibold text-xs border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Item Name</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Weight (Gram)</th>
                        <th className="px-4 py-3">Rate/Gram</th>
                        <th className="px-4 py-3">Item Value</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {passedItems && passedItems.length > 0 ? (
                        passedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition">
                            <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                              <FaGem className={item.itemType?.toUpperCase() === 'GOLD' ? 'text-yellow-500' : 'text-gray-400'} /> 
                              {item.itemName || "Item"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.itemType?.toUpperCase() || "GOLD"}</td>
                            <td className="px-4 py-3 text-gray-600">{item.itemWeightGram?.toFixed(3) || "0.000"}</td>
                            <td className="px-4 py-3 text-gray-600">{formatCurrency(item.ratePerGram || 0)}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(item.itemValue || 0)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                String(item.status).toUpperCase() === "ACTIVE" ? "text-green-600 bg-green-50" : "text-gray-500 bg-gray-100"
                              }`}>
                                {item.status || "ACTIVE"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-xs italic">
                            Detailed item breakdown not currently available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-wrap justify-center gap-4 sm:gap-6 text-xs text-gray-600 font-medium">
                    <span>Active Items Value: <span className="font-bold text-gray-900">{formatCurrency(activeItemsValue)}</span></span>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span>Released Items Value: <span className="font-bold text-gray-900">{formatCurrency(releasedItemsValue)}</span></span>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span>Total Items Value: <span className="font-bold text-gray-900">{formatCurrency(totalItemsValue)}</span></span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* --- BOTTOM SECTION: TIMELINE --- */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-bold text-gray-900">Girvi Metro Map (Timeline)</h3>
            <span className="text-xs text-gray-500 font-medium">All amounts in ₹</span>
          </div>

          <div className="relative pl-[100px] md:pl-[140px] pb-10">
            {/* The continuous vertical line */}
            <div className="absolute left-[89px] md:left-[129px] top-6 bottom-0 w-0.5 bg-gray-300 z-0"></div>

            <div className="space-y-10">
              {data.timeline.map((event, idx) => {
                const config = getEventConfig(event.transactionType);
                
                return (
                  <div key={event.transactionId || idx} className="relative flex items-start">
                    
                    {/* Left: Date & Time Stacked */}
                    <div className="absolute left-[-100px] md:left-[-140px] w-[70px] md:w-[100px] text-right mt-1">
                      <div className={`font-bold text-[13px] ${config.textColor}`}>{formatDate(event.transactionDate)}</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">{formatTime(event.transactionDate)}</div>
                    </div>

                    {/* Center: The Metro Node Icon */}
                    <div className={`absolute -left-5 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ring-4 ring-white ${config.bgColor}`}>
                      {config.icon}
                    </div>

                    {/* Right: The Content Card */}
                    <div className="w-full pl-10">
                      <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white relative">
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          
                          {/* Title & Desc */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-base font-bold text-gray-900">{event.title}</h4>
                              {event.transactionType === 'ITEM_RELEASE' && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                  {event.releasedItemIds ? event.releasedItemIds.split(',').length : 1} Item
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">{event.description}</p>
                          </div>

                          {/* Specific Metric Block based on Type */}
                          <div className="flex flex-wrap md:flex-nowrap items-center gap-6 shrink-0 mt-3 md:mt-0">
                            {renderEventMetric(event, config.textColor)}
                            
                            {/* Outstanding Badge */}
                            <div className={`rounded-lg px-4 py-2 border ${config.lightBg} ${config.borderColor}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${config.textColor}`}>Outstanding Principal</p>
                              <p className={`text-sm font-black ${config.textColor}`}>{formatCurrency(event.principalAfter)}</p>
                            </div>
                          </div>

                        </div>

                        {/* Optional Sub-table for Item Releases */}
                        {event.transactionType === 'ITEM_RELEASE' && event.releasedItemIds && passedItems.length > 0 && (
                          <div className="mt-4 border border-gray-100 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                                <tr>
                                  <th className="px-3 py-2">Released Item</th>
                                  <th className="px-3 py-2">Type</th>
                                  <th className="px-3 py-2">Weight (Gram)</th>
                                  <th className="px-3 py-2">Rate/Gram</th>
                                  <th className="px-3 py-2">Item Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {passedItems.filter(i => event.releasedItemIds.includes(String(i.id))).map((item, idxx) => (
                                  <tr key={idxx}>
                                    <td className="px-3 py-2 font-medium flex items-center gap-2">
                                      <FaGem className="text-yellow-500" /> {item.itemName}
                                    </td>
                                    <td className="px-3 py-2">{item.itemType}</td>
                                    <td className="px-3 py-2">{item.itemWeightGram}</td>
                                    <td className="px-3 py-2">{formatCurrency(item.ratePerGram)}</td>
                                    <td className="px-3 py-2 font-medium">{formatCurrency(item.itemValue)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-2 text-xs text-gray-600">
            <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0" />
            <p><strong>Note:</strong> Interest is calculated on outstanding principal at the given rate of {data.interestRate}% per month.</p>
          </div>
        </div>

      </div>
    );
  }

  // --- HELPER COMPONENTS FOR TIMELINE ---

  function DetailRow({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 text-lg">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
          <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
        </div>
      </div>
    );
  }

  function MetricCard({ title, value, subtext, icon, borderColor, bgColor, textColor }: any) {
    return (
      <div className={`border rounded-xl p-4 flex flex-col justify-between ${borderColor}`}>
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${textColor}`}>{title}</p>
          <p className="text-xl font-black text-gray-900">{value}</p>
        </div>
        <div className="flex justify-between items-end mt-2">
          <p className="text-[10px] text-gray-500 font-medium">{subtext}</p>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${bgColor}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  }

  function getEventConfig(type: string) {
    switch (type) {
      case "CREATE": 
        return { bgColor: "bg-blue-600", textColor: "text-blue-600", lightBg: "bg-blue-50", borderColor: "border-blue-100", icon: <FaUniversity className="text-lg" /> };
      case "INTEREST_PAYMENT": 
        return { bgColor: "bg-green-500", textColor: "text-green-600", lightBg: "bg-green-50", borderColor: "border-green-100", icon: <FaPercentage className="text-lg" /> };
      case "PRINCIPAL_PAYMENT": 
      case "INTEREST_AND_PRINCIPAL_PAYMENT": 
        return { bgColor: "bg-orange-500", textColor: "text-orange-600", lightBg: "bg-orange-50", borderColor: "border-orange-100", icon: <FaWallet className="text-lg" /> };
      case "ITEM_RELEASE": 
        return { bgColor: "bg-purple-500", textColor: "text-purple-600", lightBg: "bg-purple-50", borderColor: "border-purple-100", icon: <FaGem className="text-lg" /> };
      case "GIRVI_CLOSED": 
        return { bgColor: "bg-red-500", textColor: "text-red-600", lightBg: "bg-red-50", borderColor: "border-red-100", icon: <FaCheckCircle className="text-lg" /> };
      default: 
        return { bgColor: "bg-gray-500", textColor: "text-gray-600", lightBg: "bg-gray-50", borderColor: "border-gray-100", icon: <FaCheckCircle className="text-lg" /> };
    }
  }

  function renderEventMetric(event: TimelineEvent, colorClass: string) {
    if (event.transactionType === "CREATE") {
      return (
        <div className="text-right border-r border-gray-100 pr-6 mr-2">
          <p className="text-[11px] text-gray-500 font-medium mb-0.5">Loan Provided (Actual)</p>
          <p className={`text-base font-black ${colorClass}`}>{formatCurrency(event.principalBefore)}</p>
        </div>
      );
    }
    if (event.transactionType === "INTEREST_PAYMENT") {
      return (
        <div className="text-right border-r border-gray-100 pr-6 mr-2">
          <p className="text-[11px] text-gray-500 font-medium mb-0.5">Interest Paid</p>
          <p className={`text-base font-black ${colorClass}`}>{formatCurrency(event.interestPaid)}</p>
        </div>
      );
    }
    if (event.transactionType === "PRINCIPAL_PAYMENT" || event.transactionType === "INTEREST_AND_PRINCIPAL_PAYMENT") {
      return (
        <div className="flex gap-6 border-r border-gray-100 pr-6 mr-2">
          {event.interestPaid > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-gray-500 font-medium mb-0.5">Interest Paid</p>
              <p className="text-base font-black text-green-600">{formatCurrency(event.interestPaid)}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[11px] text-gray-500 font-medium mb-0.5">Principal Paid</p>
            <p className={`text-base font-black ${colorClass}`}>{formatCurrency(event.principalPaid)}</p>
          </div>
        </div>
      );
    }
    if (event.transactionType === "ITEM_RELEASE") {
      return (
        <div className="text-right border-r border-gray-100 pr-6 mr-2">
          <p className="text-[11px] text-gray-500 font-medium mb-0.5">Item Value</p>
          <p className={`text-base font-black ${colorClass}`}>{formatCurrency(event.principalPaid)}</p>
        </div>
      );
    }
    if (event.transactionType === "GIRVI_CLOSED") {
      return (
        <div className="text-right border-r border-gray-100 pr-6 mr-2">
          <p className="text-[11px] text-gray-500 font-medium mb-0.5">Total Paid</p>
          <p className={`text-base font-black ${colorClass}`}>{formatCurrency(event.principalPaid + event.interestPaid)}</p>
        </div>
      );
    }
    return null;
  }
}

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
