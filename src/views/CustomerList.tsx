import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DealerSidebar from "../dealer/DealerSidebar";
import MobileDealerSidebar from "../dealer/MobileDealerSidebar";
import DealerMobileBottomNav from "../dealer/DealerMobileBottomNav";
import {
  FaSearch,
  FaUser,
  FaShieldAlt,
  FaBox,
  FaPlus,
  FaEdit,
  FaTrash,
  FaPhone,
  FaIdCard,
  FaStar,
  FaFilter,
  FaTimes,
  FaCheckCircle,
  FaThumbsUp,
  FaHeart,
} from "react-icons/fa";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

/* ================= TYPES ================= */

type ReviewResponseDTO = {
  id?: number;
  reviewType?: string;
  comment?: string;
};

type CustomerResponseDTO = {
  id: number;
  fullName: string;
  customerAddress?: string;
  phoneNumber?: string;
  kycStatus?: string;
  fraudStatus?: string;
  aadhaarLastFour?: string;
  maskedAadhaar?: string;
  reviews?: ReviewResponseDTO[];
};

type CustomerPageResponse = {
  content: CustomerResponseDTO[];
  totalPages: number;
  totalElements: number;
};

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

  /* ✅ Pagination */
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerResponseDTO | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);

  /* ✅ Avatar photos */
  const [photoMap, setPhotoMap] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchCustomers();
  }, [page, size]);

  useEffect(() => {
    customers.forEach((c) => loadCustomerPhoto(c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers]);

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
      const res = await fetch(
        `${API_BASE}/customers/allCustomer?page=${page}&size=${size}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-DEALER-ID": currentDealerId,
          },
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Failed to load customers");
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setCustomers(data);
        setTotalElements(data.length);
        setTotalPages(1);
      } else {
        const pageData = data as CustomerPageResponse;
        setCustomers(pageData.content || []);
        setTotalElements(pageData.totalElements || 0);
        setTotalPages(pageData.totalPages || 1);
      }
    } catch {
      setError("Server unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomerById(customerId: number) {
    const currentDealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!currentDealerId || !token) return;

    setDetailLoading(true);

    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": currentDealerId,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      setSelectedCustomer(data);
    } catch (err) {
      console.error("Error loading profile metrics", err);
    } finally {
      setDetailLoading(false);
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
        setSelectedCustomerId(null);
        fetchCustomers();
      } else {
        alert("Failed to delete customer");
      }
    } catch {
      alert("Error occurred while deleting");
    }
  }

  async function loadCustomerPhoto(customerId: number) {
    if (photoMap[customerId]) return;

    const currentDealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!currentDealerId || !token) return;

    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}/photo`, {
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
      c.aadhaarLastFour?.includes(q) ||
      c.maskedAadhaar?.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans">
      {/* ================= DESKTOP VIEW WITH GLOBAL SIDEBAR ================= */}
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={isAdminView} />

        <main className="ml-64 flex-1 flex flex-col">
          {/* Top Header */}
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
            {/* Purple Page Banner */}
            <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-8 py-6 mb-8">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold">Customers</h1>
                  <p className="text-sm opacity-80 mt-1">
                    Total Records : {totalElements}
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

            {/* Search Bar */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 flex items-center border border-gray-100">
                  <FaSearch className="text-gray-400 mr-3" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full outline-none text-sm text-gray-700 bg-transparent"
                    placeholder="Search by name, phone or Aadhaar"
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

            {/* Customer List */}
            <CustomerCards
              loading={loading}
              error={error}
              customers={customers}
              filteredCustomers={filteredCustomers}
              photoMap={photoMap}
              kycBadge={kycBadge}
              setSelectedCustomerId={setSelectedCustomerId}
              fetchCustomerById={fetchCustomerById}
              navigate={navigate}
              totalElements={totalElements}
              page={page}
              size={size}
              totalPages={totalPages}
              setPage={setPage}
              setSize={setSize}
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

        {/* Mobile White Header */}
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
          {/* Purple Page Banner */}
          <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-5 py-5 mb-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs opacity-80">Customer Management</p>
                <h1 className="text-2xl font-bold mt-1">Customers</h1>
                <p className="text-sm opacity-80 mt-1">
                  Total Records : {totalElements}
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

          {/* Search Bar */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 flex items-center border border-gray-100">
                <FaSearch className="text-gray-400 mr-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full outline-none text-sm text-gray-700 bg-transparent"
                  placeholder="Search by name, phone or Aadhaar"
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
            customers={customers}
            filteredCustomers={filteredCustomers}
            photoMap={photoMap}
            kycBadge={kycBadge}
            setSelectedCustomerId={setSelectedCustomerId}
            fetchCustomerById={fetchCustomerById}
            navigate={navigate}
            totalElements={totalElements}
            page={page}
            size={size}
            totalPages={totalPages}
            setPage={setPage}
            setSize={setSize}
          />
        </div>

        <DealerMobileBottomNav active="customers" isAdminView={isAdminView} />
      </div>

      {/* ================= MODAL DETAILS ================= */}
      {selectedCustomerId !== null && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[480px] rounded-[32px] p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => {
                setSelectedCustomer(null);
                setSelectedCustomerId(null);
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition"
            >
              <FaTimes />
            </button>

            {detailLoading || !selectedCustomer ? (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              </div>
            ) : (
              <>
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

                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <FaShieldAlt
                      className={
                        selectedCustomer.fraudStatus === "Medium Risk"
                          ? "text-orange-500"
                          : "text-green-500"
                      }
                    />

                    <span
                      className={`font-semibold text-sm ${
                        selectedCustomer.fraudStatus === "Medium Risk"
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {selectedCustomer.fraudStatus || "Safe Customer"}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-1 mt-2 text-yellow-400 text-sm">
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar className="text-gray-300" />

                    <span className="text-gray-600 font-semibold ml-1 text-xs">
                      4.0{" "}
                      <span className="font-normal opacity-70">
                        ({selectedCustomer.reviews?.length || 0} Reviews)
                      </span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <InfoCard
                    label="Phone"
                    value={selectedCustomer.phoneNumber || "-"}
                  />

                  <InfoCard
                    label="Aadhaar"
                    value={selectedCustomer.maskedAadhaar || "-"}
                  />

                  <InfoCard
                    label="KYC Status"
                    value={selectedCustomer.kycStatus || "PENDING"}
                  />

                  <InfoCard label="Total Girvi" value="0" />
                  <InfoCard label="Active Loan" value="₹ 0" />
                  <InfoCard label="Since" value="Today" />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sm text-gray-900">
                      Customer Reviews
                    </h4>

                    <button
                      type="button"
                      className="text-purple-700 text-xs font-bold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 bg-green-50/50 border border-green-100 rounded-xl p-3 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <FaThumbsUp /> Positive
                      </div>
                      <span className="font-bold text-green-700">0</span>
                    </div>

                    <div className="flex-1 bg-red-50/50 border border-red-100 rounded-xl p-3 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-red-500 font-semibold">
                        <FaHeart /> Negative
                      </div>
                      <span className="font-bold text-red-600">0</span>
                    </div>
                  </div>
                </div>

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
                    className="flex-1 min-w-[120px] bg-purple-50 text-purple-700 font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm hover:bg-purple-100"
                  >
                    <FaBox className="opacity-70" /> View Girvi
                  </button>
                </div>

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

                  <button
                    type="button"
                    onClick={() => deleteCustomer(selectedCustomer.id)}
                    className="w-14 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-2xl transition flex items-center justify-center border border-red-100"
                    title="Delete Customer"
                  >
                    <FaTrash />
                  </button>
                </div>
              </>
            )}
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
  customers,
  filteredCustomers,
  photoMap,
  kycBadge,
  setSelectedCustomerId,
  fetchCustomerById,
  navigate,
  totalElements,
  page,
  size,
  totalPages,
  setPage,
  setSize,
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

      {!loading && !error && customers.length === 0 && <EmptyState />}

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
                        <FaIdCard className="text-xs" />{" "}
                        {c.maskedAadhaar || "-"}
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

              <div className="bg-gray-50/50 rounded-2xl p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <FaShieldAlt
                      className={
                        c.fraudStatus === "Medium Risk"
                          ? "text-orange-500"
                          : "text-green-500"
                      }
                    />

                    <span
                      className={`font-semibold ${
                        c.fraudStatus === "Medium Risk"
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {c.fraudStatus || "Safe Customer"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-yellow-400 text-[10px]">
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar className="text-gray-300" />

                    <span className="text-gray-500 font-medium ml-1">
                      4.0 ({c.reviews?.length || 0})
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <p className="text-gray-500 font-medium mb-1">
                    Active Girvi :{" "}
                    <span className="font-bold text-gray-900">0</span>
                  </p>

                  <p className="text-gray-500 font-medium">
                    Total Loan :{" "}
                    <span className="font-bold text-gray-900">₹ 0</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(c.id);
                    fetchCustomerById(c.id);
                  }}
                  className="text-purple-700 font-bold text-sm px-2 hover:underline"
                >
                  View Details
                </button>

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

/* ================= HELPERS ================= */

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-3 w-full">
      <p className="text-[11px] text-gray-500 font-medium mb-1">{label}</p>
      <p className="font-bold text-gray-900 text-sm truncate">{value}</p>
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