import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DealerSidebar from "../dealer/DealerSidebar";
import MobileDealerSidebar from "../dealer/MobileDealerSidebar";
import DealerMobileBottomNav from "../dealer/DealerMobileBottomNav";
import { API_BASE } from "../config/api";
import {
  FaSearch,
  FaUser,
  FaBox,
  FaPlus,
  FaEdit,
  FaTrash,
  FaPhone,
  FaIdCard,
  FaFilter,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";

const REVIEW_API = `${API_BASE}/reviews`;

/* ================= TYPES ================= */

type CustomerResponseDTO = {
  id: number;
  fullName: string;
  customerAddress?: string;
  phoneNumber?: string;
  kycStatus?: string;
  aadhaarLastFour?: string;
  maskedAadhaar?: string;
  
  // Added fields for cleaner history tracking
  totalGirvi?: number;
  activeLoan?: number;
  createdAt?: string; 
};

type ReviewResponseDTO = {
  id?: number;
  reviewType?: string;
  comment?: string;
  reviewText?: string;
  rating?: number;
  createdAt?: string;
  reviewerName?: string;
};

/* ================= HELPERS ================= */

function formatAadhaar(c: CustomerResponseDTO) {
  if (c.maskedAadhaar && /\d{4}$/.test(c.maskedAadhaar)) {
    return c.maskedAadhaar;
  }

  if (c.aadhaarLastFour && /^\d{4}$/.test(c.aadhaarLastFour)) {
    return `XXXX-XXXX-${c.aadhaarLastFour}`;
  }

  return "XXXX-XXXX-****";
}

function formatReviewDate(date?: string) {
  if (!date) return "";

  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/* ================= COMPONENT ================= */

export default function CustomerList() {
  const navigate = useNavigate();

  const query = new URLSearchParams(window.location.search);
  const isAdminView = query.get("adminView") === "true";

  const dealerName =
    query.get("dealerName") ||
    localStorage.getItem("ps_dealer_name") ||
    "Dealer";

  const dealerId =
    query.get("dealerId") || localStorage.getItem("ps_dealer_id") || "-";

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

  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [onlyMine, setOnlyMine] = useState(true);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerResponseDTO | null>(null);

  const [photoMap, setPhotoMap] = useState<Record<number, string>>({});

  /* ✅ Reviews */
  const [reviews, setReviews] = useState<ReviewResponseDTO[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, onlyMine]);

  useEffect(() => {
    setPhotoMap({});
    customers.forEach((c) => loadCustomerPhoto(c.id));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, onlyMine]);

  useEffect(() => {
    setPage(0);
  }, [search, onlyMine]);

  /* ================= API ================= */

  async function fetchCustomers() {
    const currentDealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!currentDealerId || !token) {
      setError("Session expired. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = onlyMine
        ? `${API_BASE}/customers/yourCustomer`
        : `${API_BASE}/customers/allCustomer`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": currentDealerId,
        },
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Failed to load customers");
        return;
      }

      const data: CustomerResponseDTO[] = await res.json();

      setCustomers(data);
      setTotalElements(data.length);
    } catch {
      setError("Server unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomerReviews(customerId: number) {
    const currentDealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!currentDealerId || !token) return;

    setReviewLoading(true);
    setReviewError("");
    setReviews([]);

    try {
      const res = await fetch(`${REVIEW_API}/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": currentDealerId,
        },
      });

      if (!res.ok) {
        setReviewError("Failed to load customer reviews");
        return;
      }

      const data: ReviewResponseDTO[] = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviewError("Unable to load customer reviews");
    } finally {
      setReviewLoading(false);
    }
  }

  async function fetchCustomerById(
    id: number,
    fallbackCustomer?: CustomerResponseDTO
  ) {
    const dealerIdFromStorage = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!dealerIdFromStorage || !token) {
      if (fallbackCustomer) {
        setSelectedCustomer(fallbackCustomer);
        fetchCustomerReviews(id);
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerIdFromStorage,
        },
      });

      if (!res.ok) {
        if (fallbackCustomer) {
          setSelectedCustomer(fallbackCustomer);
          fetchCustomerReviews(id);
        }
        return;
      }

      const data: CustomerResponseDTO = await res.json();

      setSelectedCustomer(data);
      fetchCustomerReviews(id);

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === data.id
            ? {
                ...c,
                ...data,
                customerAddress: data.customerAddress || c.customerAddress,
                maskedAadhaar: data.maskedAadhaar || c.maskedAadhaar,
                aadhaarLastFour: data.aadhaarLastFour || c.aadhaarLastFour,
              }
            : c
        )
      );
    } catch {
      if (fallbackCustomer) {
        setSelectedCustomer(fallbackCustomer);
        fetchCustomerReviews(id);
      }
    }
  }

  async function deleteCustomer(id: number) {
    if (
      !window.confirm(
        "Are you sure you want to delete this customer? This action cannot be undone."
      )
    ) {
      return;
    }

    const currentDealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!currentDealerId || !token) {
      alert("Session expired or invalid login. Please login again.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": currentDealerId,
        },
      });

      if (res.ok) {
        setSelectedCustomer(null);
        setReviews([]);
        setReviewError("");
        fetchCustomers();
      } else {
        alert("Failed to delete customer");
      }
    } catch {
      alert("Error occurred while deleting");
    }
  }

  async function loadCustomerPhoto(customerId: number) {
    const currentDealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!currentDealerId || !token) return;

    try {
      const photoUrl = onlyMine
        ? `${API_BASE}/customers/${customerId}/photo`
        : `${API_BASE}/customers/${customerId}/photo/all`;

      const res = await fetch(photoUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": currentDealerId,
        },
      });

      if (!res.ok) return;

      const blob = await res.blob();
      if (!blob || blob.size === 0) return;

      const url = URL.createObjectURL(blob);

      setPhotoMap((prev) => ({
        ...prev,
        [customerId]: url,
      }));
    } catch {
      // ignore image error
    }
  }

  function closeModal() {
    setSelectedCustomer(null);
    setReviews([]);
    setReviewError("");
  }

  function kycBadge(status?: string) {
    return status === "VERIFIED"
      ? "bg-green-50 text-green-600 border-green-200"
      : "bg-yellow-50 text-yellow-600 border-yellow-200";
  }

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase().trim();

    if (!q) return true;

    return (
      c.fullName?.toLowerCase().includes(q) ||
      c.phoneNumber?.includes(q) ||
      c.customerAddress?.toLowerCase().includes(q) ||
      c.aadhaarLastFour?.includes(q) ||
      c.maskedAadhaar?.toLowerCase().includes(q) ||
      formatAadhaar(c).toLowerCase().includes(q)
    );
  });

  const calculatedTotalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / size)
  );

  const paginatedCustomers = filteredCustomers.slice(
    page * size,
    page * size + size
  );

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans">
      {/* ================= DESKTOP VIEW WITH GLOBAL SIDEBAR ================= */}
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={isAdminView} />

        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Customers</h2>
              <p className="text-xs text-gray-500">
                Manage customer records and reviews
              </p>
            </div>

            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-gray-800">
                {todayDate}
              </p>
              <p className="text-xs text-gray-400">{todayDay}</p>
            </div>
          </header>

          <div className="p-6 xl:p-8 max-w-[1400px] w-full mx-auto flex-1">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-8 py-6 mb-8">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold">Customers</h1>
                  <p className="text-sm opacity-80 mt-1">
                    Total Records : {filteredCustomers.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/dealer/customer-register")}
                  className="bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition"
                >
                  <FaPlus /> Add Customer
                </button>
              </div>
            </div>

            {isPartialityDashboard && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl px-5 py-4 mb-6 text-sm font-semibold">
                Partiality view: You can view customer details. Girvi actions
                are disabled.
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setOnlyMine(true);
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                  onlyMine
                    ? "bg-purple-600 text-white"
                    : "bg-white border border-gray-200 text-gray-700"
                }`}
              >
                My Customers
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnlyMine(false);
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                  !onlyMine
                    ? "bg-purple-600 text-white"
                    : "bg-white border border-gray-200 text-gray-700"
                }`}
              >
                All Customers
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 flex items-center border border-gray-100">
                  <FaSearch className="text-gray-400 mr-3" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full outline-none text-sm text-gray-700 bg-transparent"
                    placeholder="Search by name, phone, address or Aadhaar"
                  />
                </div>

                <button
                  type="button"
                  className="bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 text-gray-500 hover:text-purple-600 transition"
                >
                  <FaFilter />
                </button>
              </div>
            </div>

            <CustomerCards
              loading={loading}
              error={error}
              filteredCustomers={paginatedCustomers}
              photoMap={photoMap}
              kycBadge={kycBadge}
              fetchCustomerById={fetchCustomerById}
              navigate={navigate}
              totalElements={filteredCustomers.length}
              page={page}
              size={size}
              totalPages={calculatedTotalPages}
              setPage={setPage}
              setSize={setSize}
              isPartialityDashboard={isPartialityDashboard}
            />
          </div>
        </main>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="lg:hidden min-h-screen bg-[#f4f5f7] pb-32">
        <MobileDealerSidebar
          open={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
          isAdminView={isAdminView}
          dealerName={dealerName}
          dealerId={dealerId}
        />

        <header className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isAdminView) {
                  navigate("/admin/dashboard");
                  return;
                }

                setShowMobileSidebar(true);
              }}
              className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl text-gray-700 active:bg-gray-100"
            >
              {isAdminView ? "←" : "☰"}
            </button>

            <div>
              <h2 className="text-base font-bold text-gray-900">Customers</h2>
              <p className="text-[11px] text-gray-500">
                Manage customer records
              </p>
            </div>
          </div>

          <div className="text-right leading-tight">
            <p className="text-xs font-semibold text-gray-800">{todayDate}</p>
            <p className="text-[10px] text-gray-400">{todayDay}</p>
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-5 py-5 mb-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs opacity-80">Customer Management</p>
                <h1 className="text-2xl font-bold mt-1">Customers</h1>
                <p className="text-sm opacity-80 mt-1">
                  Total Records : {filteredCustomers.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/dealer/customer-register")}
                className="w-11 h-11 bg-white/20 active:bg-white/30 rounded-2xl flex items-center justify-center transition shrink-0"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          {isPartialityDashboard && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl px-4 py-3 mb-4 text-xs font-semibold">
              Partiality view: Girvi actions are disabled. View Details is
              available.
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setOnlyMine(true);
                setPage(0);
              }}
              className={`flex-1 py-2 rounded-2xl text-sm font-semibold ${
                onlyMine
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700"
              }`}
            >
              My Customers
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyMine(false);
                setPage(0);
              }}
              className={`flex-1 py-2 rounded-2xl text-sm font-semibold ${
                !onlyMine
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700"
              }`}
            >
              All Customers
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 flex items-center border border-gray-100">
                <FaSearch className="text-gray-400 mr-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full outline-none text-sm text-gray-700 bg-transparent"
                  placeholder="Search by name, phone, address or Aadhaar"
                />
              </div>

              <button
                type="button"
                className="bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 text-gray-500 active:bg-gray-100 transition"
              >
                <FaFilter />
              </button>
            </div>
          </div>

          <CustomerCards
            loading={loading}
            error={error}
            filteredCustomers={paginatedCustomers}
            photoMap={photoMap}
            kycBadge={kycBadge}
            fetchCustomerById={fetchCustomerById}
            navigate={navigate}
            totalElements={filteredCustomers.length}
            page={page}
            size={size}
            totalPages={calculatedTotalPages}
            setPage={setPage}
            setSize={setSize}
            isPartialityDashboard={isPartialityDashboard}
          />
        </div>

        <DealerMobileBottomNav
          active={isPartialityDashboard ? undefined : "customers"}
          isAdminView={isAdminView}
        />
      </div>

      {/* ================= MODAL DETAILS ================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[560px] rounded-[32px] p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition"
            >
              <FaTimes />
            </button>

            <div className="text-center mb-6">
              <div className="relative inline-block">
                {photoMap[selectedCustomer.id] ? (
                  <img
                    src={photoMap[selectedCustomer.id]}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    alt="Customer"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-md">
                    <FaUser className="text-gray-400 text-3xl" />
                  </div>
                )}

                <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5">
                  <FaCheckCircle className="text-green-500 text-xl" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-3">
                {selectedCustomer.fullName}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <InfoCard
                label="Phone"
                value={selectedCustomer.phoneNumber || "-"}
              />

              <InfoCard
                label="Aadhaar"
                value={formatAadhaar(selectedCustomer)}
              />

              <InfoCard
                label="KYC Status"
                value={selectedCustomer.kycStatus || "PENDING"}
              />

              <InfoCard label="Reviews" value={`${reviews.length}`} />

              <div className="col-span-2 sm:col-span-3">
                <InfoCard
                  label="Address"
                  value={selectedCustomer.customerAddress || "-"}
                />
              </div>

              {/* CLEAN CONDITIONAL RENDERING FOR HISTORY STATS */}
              {!isPartialityDashboard && (
                selectedCustomer.totalGirvi && selectedCustomer.totalGirvi > 0 ? (
                  <>
                    <InfoCard label="Total Girvi" value={String(selectedCustomer.totalGirvi)} />
                    <InfoCard 
                      label="Active Loan" 
                      value={`₹ ${Number(selectedCustomer.activeLoan || 0).toLocaleString('en-IN')}`} 
                    />
                    <InfoCard 
                      label="Member Since" 
                      value={selectedCustomer.createdAt ? formatReviewDate(selectedCustomer.createdAt) : "-"} 
                    />
                  </>
                ) : (
                  <div className="col-span-2 sm:col-span-3 bg-gray-50 border border-gray-100 text-gray-500 text-[11px] sm:text-xs py-3 px-4 rounded-2xl text-center font-semibold flex items-center justify-center gap-2 mt-1">
                    <FaUser className="text-gray-400 shrink-0" />
                    <span>New Customer • No active history</span>
                    {selectedCustomer.createdAt && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span>Member Since: {formatReviewDate(selectedCustomer.createdAt)}</span>
                      </>
                    )}
                  </div>
                )
              )}
            </div>

            {/* ================= REVIEWS SECTION ================= */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-gray-900">
                  Customer Reviews
                </h4>

                <span className="text-xs font-semibold text-gray-500">
                  {reviews.length} Reviews
                </span>
              </div>

              {reviewLoading && (
                <p className="text-sm text-gray-500 font-semibold">
                  Loading reviews...
                </p>
              )}

              {reviewError && (
                <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 text-sm font-semibold">
                  {reviewError}
                </div>
              )}

              {!reviewLoading && !reviewError && reviews.length === 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-500 font-semibold">
                  No reviews found for this customer.
                </div>
              )}

              {!reviewLoading && !reviewError && reviews.length > 0 && (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {reviews.map((r, index) => (
                    <div
                      key={r.id || index}
                      className="bg-gray-50 border border-gray-100 rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="text-sm font-bold text-gray-900">
                          {r.reviewType || "Review"}
                        </p>

                        {r.createdAt && (
                          <span className="text-[10px] text-gray-400 font-semibold shrink-0">
                            {formatReviewDate(r.createdAt)}
                          </span>
                        )}
                      </div>

                      {typeof r.rating === "number" && (
                        <p className="text-xs text-purple-600 font-bold mb-1">
                          Rating: {r.rating}
                        </p>
                      )}

                      {r.reviewerName && (
                        <p className="text-xs text-gray-400 font-semibold mb-1">
                          By: {r.reviewerName}
                        </p>
                      )}

                      <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">
                        {r.comment || r.reviewText || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isPartialityDashboard && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-2xl text-xs font-semibold mb-3 text-center">
                Girvi actions are not available in Partiality view.
              </div>
            )}

            {!isPartialityDashboard && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/dealer/details", {
                      state: {
                        customerId: selectedCustomer.id,
                        customerName: selectedCustomer.fullName,
                        returnTo: "/dealer/customers",
                      },
                    });
                  }}
                  className="flex-1 min-w-[120px] bg-[#7128E6] hover:bg-[#5b1abf] text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-purple-200/50 flex items-center justify-center gap-2 text-sm"
                >
                  <FaPlus /> New Girvi
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/dealer/customer", {
                      state: {
                        customerId: selectedCustomer.id,
                        customerName: selectedCustomer.fullName,
                        returnTo: "/dealer/customers",
                      },
                    })
                  }
                  className="flex-1 min-w-[120px] bg-purple-50 text-purple-700 font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm hover:bg-purple-100"
                >
                  <FaBox className="opacity-70" /> View Girvi
                </button>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/dealer/edit-customer/${selectedCustomer.id}`)
                }
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm border border-gray-100"
              >
                <FaEdit className="text-gray-400" /> Edit Customer
              </button>

              {onlyMine && (
                <button
                  type="button"
                  onClick={() => deleteCustomer(selectedCustomer.id)}
                  className="w-14 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-2xl transition flex items-center justify-center border border-red-100"
                  title="Delete Customer"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= CUSTOMER CARDS ================= */

function CustomerCards({
  loading,
  error,
  filteredCustomers,
  photoMap,
  kycBadge,
  fetchCustomerById,
  navigate,
  totalElements,
  page,
  size,
  totalPages,
  setPage,
  setSize,
  isPartialityDashboard,
}: any) {
  return (
    <>
      {loading && (
        <p className="text-center py-10 text-gray-500 font-semibold">
          Loading customers...
        </p>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm font-semibold">
          {error}
        </div>
      )}

      {!loading && !error && filteredCustomers.length === 0 && <EmptyState />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {!loading &&
          !error &&
          filteredCustomers.map((c: CustomerResponseDTO) => (
            <div
              key={c.id}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  {photoMap[c.id] ? (
                    <img
                      src={photoMap[c.id]}
                      className="w-14 h-14 rounded-full object-cover border border-gray-100 shadow-sm"
                      alt="profile"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                      <FaUser className="text-gray-400 text-xl" />
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-gray-900 text-[17px] leading-tight">
                      {c.fullName}
                    </h3>

                    <div className="text-gray-500 text-sm mt-1 flex flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <FaPhone className="text-xs" /> {c.phoneNumber || "-"}
                      </span>

                      <span className="flex items-center gap-2">
                        <FaIdCard className="text-xs" /> {formatAadhaar(c)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${kycBadge(
                      c.kycStatus
                    )}`}
                  >
                    {c.kycStatus || "PENDING"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => fetchCustomerById(c.id, c)}
                  className="text-purple-700 font-bold text-sm px-2 hover:underline"
                >
                  View Details
                </button>

                {!isPartialityDashboard && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/dealer/details", {
                        state: {
                          customerId: c.id,
                          customerName: c.fullName,
                          returnTo: "/dealer/customers",
                        },
                      })
                    }
                    className="bg-[#7128E6] hover:bg-[#5b1abf] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
                  >
                    <FaPlus /> New Girvi
                  </button>
                )}

                {isPartialityDashboard && (
                  <span className="text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-xl font-bold">
                    Girvi Disabled
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>

      {filteredCustomers.length > 0 && (
        <Pagination
          page={page}
          size={size}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={setPage}
          onSizeChange={(s: any) => {
            setSize(s);
            setPage(0);
          }}
        />
      )}
    </>
  );
}

/* ================= UI HELPERS ================= */

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-3 w-full">
      <p className="text-[11px] text-gray-500 font-medium mb-1">{label}</p>
      <p className="font-bold text-gray-900 text-sm break-words whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto text-3xl mb-4 text-purple-200">
        <FaBox />
      </div>

      <h3 className="font-bold text-gray-800 text-lg">No Customers Found</h3>

      <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
        You haven't registered any customers yet or no match found for your
        search.
      </p>
    </div>
  );
}

function Pagination({
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onSizeChange,
}: any) {
  const start = totalElements === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);

  return (
    <div className="mt-8 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="text-sm text-gray-500 text-center sm:text-left">
        Showing <b className="text-gray-800">{start}</b> to{" "}
        <b className="text-gray-800">{end}</b> of{" "}
        <b className="text-gray-800">{totalElements}</b> records
      </div>

      <div className="flex items-center justify-center gap-2">
        <select
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-purple-400"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>

        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 border-r border-gray-200 transition"
          >
            Prev
          </button>

          <span className="text-xs font-bold px-4 py-2.5 min-w-[75px] text-center bg-gray-50 text-gray-600">
            {page + 1} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 border-l border-gray-200 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
