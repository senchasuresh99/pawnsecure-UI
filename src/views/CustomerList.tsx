import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaUser,
  FaShieldAlt,
  FaBox,
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaTrash,
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

  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ✅ Pagination */
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponseDTO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ✅ Avatar photos */
  const [photoMap, setPhotoMap] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchCustomers();
  }, [page, size]);

  /* ================= API ================= */

  async function fetchCustomers() {
    const dealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!dealerId || !token) {
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
            "X-DEALER-ID": dealerId,
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
    const dealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");
    if (!dealerId || !token) return;

    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerId,
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
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;

    const dealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!dealerId || !token) {
      alert("Session expired or invalid login. Please login again.");
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerId,
        },
      });

      if (res.ok) {
        setSelectedCustomer(null);
        setSelectedCustomerId(null);
        fetchCustomers(); // Refresh list
      } else {
        alert("Failed to delete customer");
      }
    } catch (err) {
      alert("Error occurred while deleting");
    }
  }

  async function loadCustomerPhoto(customerId: number) {
    if (photoMap[customerId]) return;

    const dealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");
    if (!dealerId || !token) return;

    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}/photo`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerId,
        },
      });

      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setPhotoMap((prev) => ({ ...prev, [customerId]: url }));
    } catch {
      // ignore image error
    }
  }

  useEffect(() => {
    customers.forEach((c) => loadCustomerPhoto(c.id));
  }, [customers]);

  function kycClass(status?: string) {
    return status === "VERIFIED"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-yellow-100 text-yellow-700 border-yellow-200";
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
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* ================= DESKTOP ================= */}
      <div className="hidden lg:block p-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dealer/dashboard")}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">All Customers</h2>
                <p className="text-sm text-gray-500">Total Records: {totalElements}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-80 flex items-center border rounded-xl px-4 py-3 bg-gray-50">
                <FaSearch className="text-gray-400 mr-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full outline-none bg-transparent text-sm"
                  placeholder="Search customer..."
                />
              </div>

              <button
                onClick={() => navigate("/dealer/customer-register")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
              >
                <FaPlus /> Register Customer
              </button>
            </div>
          </div>

          {loading && <p className="text-center py-10 text-gray-500 font-semibold">Loading customers...</p>}
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm font-semibold">
              {error}
            </div>
          )}
          {!loading && !error && customers.length === 0 && !search && <EmptyState />}

          {!loading && !error && filteredCustomers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Identity Card</th>
                    <th className="py-3 px-3">KYC</th>
                    <th className="py-3 px-3">Fraud</th>
                    <th className="py-3 px-3">Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        fetchCustomerById(c.id);
                      }}
                      className="border-b hover:bg-purple-50/40 cursor-pointer transition"
                    >
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          {photoMap[c.id] ? (
                            <img src={photoMap[c.id]} className="w-12 h-12 rounded-xl object-cover" alt="" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                              <FaUser className="text-purple-700" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{c.fullName}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{c.customerAddress || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3">{c.phoneNumber || "-"}</td>
                      <td className="py-4 px-3">{c.maskedAadhaar || "-"}</td>
                      <td className="py-4 px-3">
                        <span className={`px-3 py-1 rounded-full border text-xs font-bold ${kycClass(c.kycStatus)}`}>
                          {c.kycStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="py-4 px-3 flex items-center gap-1"><FaShieldAlt /> {c.fraudStatus || "NA"}</td>
                      <td className="py-4 px-3">{c.reviews?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={page}
                size={size}
                totalPages={totalPages}
                totalElements={totalElements}
                onPageChange={setPage}
                onSizeChange={(s:any) => { setSize(s); setPage(0); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {selectedCustomerId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-xl relative">
            <button
              onClick={() => { setSelectedCustomer(null); setSelectedCustomerId(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition"
            >✕</button>

            {detailLoading || !selectedCustomer ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 border-b pb-2">{selectedCustomer.fullName}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <Info label="Phone" value={selectedCustomer.phoneNumber || "-"} />
                  <Info label="Identification Card" value={selectedCustomer.maskedAadhaar || "-"} />
                  <Info label="KYC Status" value={selectedCustomer.kycStatus || "PENDING"} />
                  <Info label="Fraud Metric" value={selectedCustomer.fraudStatus || "NA"} />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigate("/dealer/details", { 
                        state: { 
                          customerId: selectedCustomer.id,
                          customerName: selectedCustomer.fullName,
                          returnTo: "/dealer/customer" 
                        } 
                      });
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-purple-200"
                  >
                    Create New Girvi
                  </button>
                  
                  <button
                    onClick={() => navigate(`/dealer/edit-customer/${selectedCustomer.id}`)}
                    className="flex items-center gap-2 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                  >
                    <FaEdit />
                  </button>

                  <button
                    onClick={() => deleteCustomer(selectedCustomer.id)}
                    className="flex items-center gap-2 px-5 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition"
                  >
                    <FaTrash />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MOBILE ================= */}
      <div className="lg:hidden pb-28">
        <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] px-5 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/dealer/dashboard")}><FaArrowLeft /></button>
              <div>
                <h1 className="font-bold text-lg">Customers</h1>
                <p className="text-xs opacity-80">Total: {totalElements}</p>
              </div>
            </div>
            <button onClick={() => navigate("/dealer/customer-register")} className="bg-white/20 p-2 rounded-lg"><FaPlus /></button>
          </div>
        </div>

        <div className="px-4 -mt-5 relative z-30">
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <div className="flex items-center border rounded-xl px-4 py-3 bg-gray-50 mb-4">
              <FaSearch className="text-gray-400 mr-3" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full outline-none bg-transparent text-sm" placeholder="Search customer..." />
            </div>

            {loading && <p className="text-center py-6 text-gray-500 font-semibold text-sm">Loading...</p>}
            {!loading && filteredCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => { setSelectedCustomerId(c.id); fetchCustomerById(c.id); }}
                className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm active:bg-purple-50 transition text-left"
              >
                <div className="flex gap-4">
                  {photoMap[c.id] ? <img src={photoMap[c.id]} className="w-16 h-16 rounded-2xl object-cover" alt="" /> : <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0"><FaUser className="text-purple-700 text-xl" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{c.fullName}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{c.customerAddress || "-"}</p>
                  </div>
                </div>
              </div>
            ))}
            <Pagination page={page} size={size} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} onSizeChange={(s:any) => { setSize(s); setPage(0); }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 w-full">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="font-bold text-gray-900 mt-1 break-all">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-2xl mb-3"><FaBox /></div>
      <h3 className="font-bold text-gray-800">No Customers Found</h3>
      <p className="text-sm text-gray-500 mt-1">Register a customer to see records here.</p>
    </div>
  );
}

function Pagination({ page, size, totalPages, totalElements, onPageChange, onSizeChange }: any) {
  const start = totalElements === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);
  return (
    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-5">
      <div className="text-sm text-gray-500">Showing <b>{start}</b> to <b>{end}</b> of <b>{totalElements}</b> records</div>
      <div className="flex items-center justify-end gap-2">
        <select value={size} onChange={(e) => onSizeChange(Number(e.target.value))} className="border rounded-lg px-2 py-2 text-sm bg-white">
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <button onClick={() => onPageChange(page - 1)} disabled={page === 0} className="px-3 py-2 border rounded-lg text-sm font-bold bg-white disabled:opacity-40">Prev</button>
        <span className="text-xs font-semibold px-1 min-w-[75px] text-center">{page + 1} / {totalPages}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} className="px-3 py-2 border rounded-lg text-sm font-bold bg-white disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}