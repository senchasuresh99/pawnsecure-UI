import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBox,
  FaCoins,
  FaEdit,
  FaHome,
  FaPlus,
  FaRupeeSign,
  FaSearch,
  FaTimes,
  FaUserFriends,
} from "react-icons/fa";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

type GirviResponseDTO = {
  id?: number;
  customerId: number;
  customerName: string;
  itemName: string;
  itemType: string;
  itemWeightGram: number;
  ratePerGram?: number;
  loanAmount: number;
  interestRate: number;
  girviDate: string;
  maturityDate: string;
  status: string;
  remarks?: string;
  createdAt?: string;
  itemPhotoBase64?: string;
  itemPhotoContentType?: string;
};

type GirviPageResponse = {
  content: GirviResponseDTO[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

type GirviUpdateForm = {
  itemName: string;
  itemWeightGram: string;
  ratePerGram: string;
  interestRate: string;
  maturityDate: string;
  remarks: string;
};

export default function GirviList() {
  const navigate = useNavigate();

  const [girviList, setGirviList] = useState<GirviResponseDTO[]>([]);
  const [filteredList, setFilteredList] = useState<GirviResponseDTO[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [photoMap, setPhotoMap] = useState<Record<number, string>>({});
  const photoMapRef = useRef<Record<number, string>>({});

  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedGirvi, setSelectedGirvi] =
    useState<GirviResponseDTO | null>(null);

  const [editForm, setEditForm] = useState<GirviUpdateForm>({
    itemName: "",
    itemWeightGram: "",
    ratePerGram: "",
    interestRate: "",
    maturityDate: "",
    remarks: "",
  });

  function goToAddGirvi() {
    navigate("/dealer/details", {
      state: { returnTo: "/dealer/customer" },
    });
  }

  useEffect(() => {
    fetchGirviList();
  }, [page, size]);

  useEffect(() => {
    const q = search.toLowerCase().trim();

    if (!q) {
      setFilteredList(girviList);
      return;
    }

    const result = girviList.filter((item) => {
      return (
        item.customerName?.toLowerCase().includes(q) ||
        item.itemName?.toLowerCase().includes(q) ||
        item.itemType?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q) ||
        String(item.id || "").includes(q) ||
        String(item.customerId || "").includes(q)
      );
    });

    setFilteredList(result);
  }, [search, girviList]);

  useEffect(() => {
    girviList.forEach((item) => {
      if (item.id) fetchGirviPhoto(item.id);
    });
  }, [girviList]);

  useEffect(() => {
    return () => {
      Object.values(photoMapRef.current).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  async function fetchGirviList() {
    const dealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!dealerId) {
      setError("Dealer ID not found. Please login again.");
      return;
    }

    if (!token) {
      setError("Login token not found. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/girvi?page=${page}&size=${size}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerId,
        },
      });

      if (!res.ok) {
        const message = await res.text();
        setError(
          message || `Failed to fetch Girvi records. Status code: ${res.status}`
        );
        return;
      }

      const data: GirviPageResponse | GirviResponseDTO[] = await res.json();

      if (Array.isArray(data)) {
        setGirviList(data);
        setFilteredList(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setGirviList(data.content || []);
        setFilteredList(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error("GET Girvi failed:", err);
      setError("Server unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchGirviPhoto(girviId?: number) {
    if (!girviId) return;
    if (photoMapRef.current[girviId]) return;

    const dealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!dealerId || !token) return;

    try {
      const res = await fetch(`${API_BASE}/girvi/${girviId}/photo`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerId,
        },
      });

      if (!res.ok) return;

      const blob = await res.blob();
      if (!blob || blob.size === 0) return;

      const imageUrl = URL.createObjectURL(blob);

      setPhotoMap((prev) => {
        if (prev[girviId]) {
          URL.revokeObjectURL(imageUrl);
          return prev;
        }

        const next = {
          ...prev,
          [girviId]: imageUrl,
        };

        photoMapRef.current = next;
        return next;
      });
    } catch (err) {
      console.error("Girvi photo load failed:", err);
    }
  }

  function openEditModal(item: GirviResponseDTO) {
    setSelectedGirvi(item);

    setEditForm({
      itemName: item.itemName || "",
      itemWeightGram:
        item.itemWeightGram !== undefined && item.itemWeightGram !== null
          ? String(item.itemWeightGram)
          : "",
      ratePerGram:
        item.ratePerGram !== undefined && item.ratePerGram !== null
          ? String(item.ratePerGram)
          : "",
      interestRate:
        item.interestRate !== undefined && item.interestRate !== null
          ? String(item.interestRate)
          : "",
      maturityDate: item.maturityDate || "",
      remarks: item.remarks || "",
    });

    setShowEditModal(true);
  }

  async function submitUpdateGirvi() {
    if (!selectedGirvi?.id) {
      alert("Girvi ID not found");
      return;
    }

    const dealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!dealerId) {
      alert("Dealer ID not found. Please login again.");
      return;
    }

    if (!token) {
      alert("Login token not found. Please login again.");
      return;
    }

    if (!editForm.itemName.trim()) {
      alert("Item name is required");
      return;
    }

    if (!editForm.itemWeightGram || Number(editForm.itemWeightGram) <= 0) {
      alert("Valid item weight is required");
      return;
    }

    if (!editForm.ratePerGram || Number(editForm.ratePerGram) <= 0) {
      alert("Valid rate per gram is required");
      return;
    }

    if (editForm.interestRate === "" || Number(editForm.interestRate) < 0) {
      alert("Valid interest rate is required");
      return;
    }

    if (!editForm.maturityDate) {
      alert("Maturity date is required");
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch(`${API_BASE}/girvi/${selectedGirvi.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerId,
        },
        body: JSON.stringify({
          itemName: editForm.itemName.trim(),
          itemWeightGram: Number(editForm.itemWeightGram),
          ratePerGram: Number(editForm.ratePerGram),
          interestRate: Number(editForm.interestRate),
          maturityDate: editForm.maturityDate,
          remarks: editForm.remarks.trim(),
        }),
      });

      if (!res.ok) {
        const message = await res.text();
        alert(message || "Failed to update Girvi record");
        return;
      }

      const updatedGirvi: GirviResponseDTO = await res.json();

      setGirviList((prev) =>
        prev.map((item) => (item.id === updatedGirvi.id ? updatedGirvi : item))
      );

      setFilteredList((prev) =>
        prev.map((item) => (item.id === updatedGirvi.id ? updatedGirvi : item))
      );

      setShowEditModal(false);
      setSelectedGirvi(null);

      alert("Girvi record updated successfully");
    } catch (err) {
      console.error("Update Girvi failed:", err);
      alert("Server unavailable. Please try again later.");
    } finally {
      setUpdating(false);
    }
  }

  function getImageSrc(item: GirviResponseDTO) {
    if (item.id && photoMap[item.id]) {
      return photoMap[item.id];
    }

    if (!item.itemPhotoBase64) {
      return "";
    }

    const contentType = item.itemPhotoContentType || "image/png";

    return `data:${contentType};base64,${item.itemPhotoBase64}`;
  }

  function formatCurrency(value: number | string | undefined) {
    if (value === undefined || value === null || value === "") return "₹0";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  }

  function formatDate(date?: string) {
    if (!date) return "-";

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  }

  function getStatusClass(status?: string) {
    const s = status?.toLowerCase();

    if (s === "active") return "bg-green-50 text-green-700 border-green-200";
    if (s === "closed") return "bg-gray-50 text-gray-700 border-gray-200";
    if (s === "overdue") return "bg-red-50 text-red-700 border-red-200";

    return "bg-purple-50 text-purple-700 border-purple-200";
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* ================= DESKTOP ================= */}
      <div className="hidden lg:flex min-h-screen">
        <aside className="w-64 bg-white border-r border-gray-200 px-5 py-6 fixed left-0 top-0 bottom-0">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <img
                src="https://github.com/senchasuresh99/LearningScalare/blob/main/logo1.png?raw=true"
                alt="PawnSecure"
                className="w-10 h-10 bg-white rounded-lg p-1"
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-purple-700">
                PawnSecure
              </h1>
              <p className="text-xs text-gray-500">Dealer Portal</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => navigate("/dealer/dashboard")}
              className="w-full text-gray-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-100"
            >
              <FaHome />
              Dashboard
            </button>

            <button
              onClick={() => navigate("/dealer/customer-register")}
              className="w-full text-gray-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-100"
            >
              <FaUserFriends />
              Customers
            </button>

            <button
              onClick={() => navigate("/dealer/customer")}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl flex items-center gap-3 font-semibold"
            >
              <FaRupeeSign />
              Girvi List
            </button>

            <button
              onClick={() => navigate("/dealer/collections")}
              className="w-full text-gray-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-100"
            >
              <FaCoins />
              Collections
            </button>
          </nav>
        </aside>

        <main className="ml-64 flex-1 overflow-x-hidden">
          <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Girvi Records
              </h2>
              <p className="text-xs text-gray-500">
                View all Girvi records created by this dealer
              </p>
            </div>
            <div />
          </div>

          <div className="p-8">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl p-8 mb-8">
              <p className="text-sm opacity-90">Dealer Portal</p>
              <h1 className="text-3xl font-bold mt-2">Girvi Records</h1>
              <p className="text-sm opacity-80 mt-3">
                Track all pledged items, customer details, loan amount and
                maturity dates.
              </p>
            </div>

            <RecordsPanel
              loading={loading}
              error={error}
              filteredList={filteredList}
              totalElements={totalElements}
              search={search}
              setSearch={setSearch}
              goToAddGirvi={goToAddGirvi}
              getImageSrc={getImageSrc}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusClass={getStatusClass}
              openEditModal={openEditModal}
              page={page}
              size={size}
              totalPages={totalPages}
              setPage={setPage}
              setSize={setSize}
            />
          </div>
        </main>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="lg:hidden pb-24">
        <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] px-5 py-6">
          <div className="flex items-center justify-between mb-6">
            <button type="button" onClick={() => navigate("/dealer/dashboard")}>
              <FaArrowLeft className="text-xl" />
            </button>

            <div className="text-center">
              <h1 className="font-bold text-lg">Girvi Records</h1>
              <p className="text-xs opacity-80">PawnSecure</p>
            </div>

            <button
              type="button"
              onClick={goToAddGirvi}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold"
            >
              <FaPlus />
            </button>
          </div>

          <h2 className="text-2xl font-bold">All Girvi</h2>
          <p className="text-sm opacity-80 mt-1">
            Total Records: {totalElements}
          </p>
        </div>

        <div className="px-4 -mt-5 relative z-10">
          <MobileRecordsPanel
            loading={loading}
            error={error}
            filteredList={filteredList}
            totalElements={totalElements}
            search={search}
            setSearch={setSearch}
            getImageSrc={getImageSrc}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusClass={getStatusClass}
            openEditModal={openEditModal}
            page={page}
            size={size}
            totalPages={totalPages}
            setPage={setPage}
            setSize={setSize}
          />
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-3 z-50">
          <button
            onClick={() => navigate("/dealer/dashboard")}
            className="text-gray-500 flex flex-col items-center text-xs"
          >
            <FaHome className="text-xl mb-1" />
            Dashboard
          </button>

          <button
            onClick={() => navigate("/dealer/customer-register")}
            className="text-gray-500 flex flex-col items-center text-xs"
          >
            <FaUserFriends className="text-xl mb-1" />
            Customers
          </button>

          <button
            onClick={() => navigate("/dealer/customer")}
            className="text-purple-700 flex flex-col items-center text-xs font-semibold"
          >
            <FaRupeeSign className="text-xl mb-1" />
            Girvi
          </button>

          <button
            onClick={() => navigate("/dealer/collections")}
            className="text-gray-500 flex flex-col items-center text-xs"
          >
            <FaCoins className="text-xl mb-1" />
            Collections
          </button>
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {showEditModal && selectedGirvi && (
        <EditModal
          selectedGirvi={selectedGirvi}
          editForm={editForm}
          setEditForm={setEditForm}
          updating={updating}
          submitUpdateGirvi={submitUpdateGirvi}
          close={() => {
            setShowEditModal(false);
            setSelectedGirvi(null);
          }}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

/* ================= DESKTOP PANEL ================= */

function RecordsPanel({
  loading,
  error,
  filteredList,
  totalElements,
  search,
  setSearch,
  goToAddGirvi,
  getImageSrc,
  formatCurrency,
  formatDate,
  getStatusClass,
  openEditModal,
  page,
  size,
  totalPages,
  setPage,
  setSize,
}: any) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">All Girvi</h2>
          <p className="text-sm text-gray-500">
            Total Records: {totalElements}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <button
            type="button"
            onClick={goToAddGirvi}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap flex items-center justify-center gap-2"
          >
            <FaPlus />
            New Girvi
          </button>

          <div className="w-full sm:w-80 flex items-center border rounded-xl px-4 py-3 bg-gray-50">
            <FaSearch className="text-gray-400 mr-3 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none bg-transparent text-sm"
              placeholder="Search current page..."
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-500 font-semibold">
          Loading Girvi records...
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm font-semibold">
          {error}
        </div>
      )}

      {!loading && !error && filteredList.length === 0 && <EmptyState />}

      {!loading && !error && filteredList.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-3">Photo</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Item Type</th>
                  <th className="py-3 px-3">Weight</th>
                  <th className="py-3 px-3">Loan Amount</th>
                  <th className="py-3 px-3">Interest</th>
                  <th className="py-3 px-3">Girvi Date</th>
                  <th className="py-3 px-3">Maturity Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredList.map((item: GirviResponseDTO, index: number) => {
                  const imageSrc = getImageSrc(item);

                  return (
                    <tr
                      key={item.id || `${item.customerId}-${index}`}
                      className="border-b last:border-0 hover:bg-purple-50/40"
                    >
                      <td className="py-4 px-3">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={item.itemName || "Item photo"}
                            className="w-16 h-16 rounded-xl object-cover border bg-white"
                          />
                        ) : (
                          <PhotoPlaceholder size="sm" />
                        )}
                      </td>

                      <td className="py-4 px-3">
                        <p className="font-semibold text-gray-900">
                          {item.customerName || "-"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Customer ID: {item.customerId || "-"}
                        </p>
                      </td>

                      <td className="py-4 px-3 font-semibold text-gray-900">
                        {item.itemName || "-"}
                      </td>

                      <td className="py-4 px-3">{item.itemType || "-"}</td>

                      <td className="py-4 px-3">
                        {item.itemWeightGram || 0} gm
                      </td>

                      <td className="py-4 px-3 font-bold text-green-600">
                        {formatCurrency(item.loanAmount)}
                      </td>

                      <td className="py-4 px-3">
                        {item.interestRate || 0}%
                      </td>

                      <td className="py-4 px-3">
                        {formatDate(item.girviDate)}
                      </td>

                      <td className="py-4 px-3">
                        {formatDate(item.maturityDate)}
                      </td>

                      <td className="py-4 px-3">
                        <span
                          className={`px-3 py-1 rounded-full border text-xs font-bold ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status || "ACTIVE"}
                        </span>
                      </td>

                      <td className="py-4 px-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-2"
                        >
                          <FaEdit />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            size={size}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setPage}
            onSizeChange={(newSize) => {
              setSize(newSize);
              setPage(0);
            }}
          />
        </>
      )}
    </div>
  );
}

/* ================= MOBILE PANEL ================= */

function MobileRecordsPanel({
  loading,
  error,
  filteredList,
  totalElements,
  search,
  setSearch,
  getImageSrc,
  formatCurrency,
  formatDate,
  getStatusClass,
  openEditModal,
  page,
  size,
  totalPages,
  setPage,
  setSize,
}: any) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <div className="flex items-center border rounded-xl px-4 py-3 bg-gray-50 mb-4">
        <FaSearch className="text-gray-400 mr-3" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none bg-transparent text-sm"
          placeholder="Search current page..."
        />
      </div>

      {loading && (
        <p className="text-center py-8 text-gray-500 font-semibold">
          Loading...
        </p>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      {!loading && !error && filteredList.length === 0 && <EmptyState />}

      {!loading &&
        !error &&
        filteredList.map((item: GirviResponseDTO, index: number) => {
          const imageSrc = getImageSrc(item);

          return (
            <div
              key={item.id || `${item.customerId}-${index}`}
              className="border border-gray-100 rounded-2xl p-4 mb-4 bg-white shadow-sm"
            >
              <div className="flex gap-4">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={item.itemName || "Item photo"}
                    className="w-24 h-24 rounded-2xl object-cover border bg-white shrink-0"
                  />
                ) : (
                  <PhotoPlaceholder size="lg" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-bold text-gray-900 truncate">
                      {item.itemName || "-"}
                    </h3>

                    <span
                      className={`px-2 py-1 rounded-full border text-[10px] font-bold ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status || "ACTIVE"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    {item.itemType || "-"} • {item.itemWeightGram || 0} g
                  </p>

                  <p className="text-sm font-semibold text-gray-800 mt-2">
                    {item.customerName || "-"}
                  </p>

                  <p className="text-xs text-gray-500">
                    Customer ID: {item.customerId || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <InfoBox
                  label="Loan Amount"
                  value={formatCurrency(item.loanAmount)}
                />
                <InfoBox
                  label="Interest"
                  value={`${item.interestRate || 0}%`}
                />
                <InfoBox label="Girvi Date" value={formatDate(item.girviDate)} />
                <InfoBox label="Maturity" value={formatDate(item.maturityDate)} />
              </div>

              <button
                type="button"
                onClick={() => openEditModal(item)}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <FaEdit />
                Edit Girvi
              </button>
            </div>
          );
        })}

      {!loading && !error && totalElements > 0 && (
        <Pagination
          page={page}
          size={size}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={setPage}
          onSizeChange={(newSize) => {
            setSize(newSize);
            setPage(0);
          }}
        />
      )}
    </div>
  );
}

/* ================= EDIT MODAL ================= */

function EditModal({
  selectedGirvi,
  editForm,
  setEditForm,
  updating,
  submitUpdateGirvi,
  close,
  formatCurrency,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold">Update Girvi Record</h2>
            <p className="text-xs opacity-80">
              Customer: {selectedGirvi.customerName}
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <EditInput
            label="Item Name"
            value={editForm.itemName}
            onChange={(value: string) =>
              setEditForm({ ...editForm, itemName: value })
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditInput
              label="Weight Gram"
              type="number"
              value={editForm.itemWeightGram}
              onChange={(value: string) =>
                setEditForm({ ...editForm, itemWeightGram: value })
              }
            />

            <EditInput
              label="Rate Per Gram"
              type="number"
              value={editForm.ratePerGram}
              onChange={(value: string) =>
                setEditForm({ ...editForm, ratePerGram: value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditInput
              label="Interest Rate %"
              type="number"
              value={editForm.interestRate}
              onChange={(value: string) =>
                setEditForm({ ...editForm, interestRate: value })
              }
            />

            <EditInput
              label="Maturity Date"
              type="date"
              value={editForm.maturityDate}
              onChange={(value: string) =>
                setEditForm({ ...editForm, maturityDate: value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">
              Remarks
            </label>
            <textarea
              value={editForm.remarks}
              onChange={(e) =>
                setEditForm({ ...editForm, remarks: e.target.value })
              }
              rows={3}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
              placeholder="Remarks"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Updated Loan Amount</p>
            <p className="text-xl font-bold text-green-600 mt-1">
              {formatCurrency(
                Number(editForm.itemWeightGram || 0) *
                  Number(editForm.ratePerGram || 0)
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submitUpdateGirvi}
              disabled={updating}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold disabled:bg-gray-400"
            >
              {updating ? "Updating..." : "Update Girvi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function EditInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        placeholder={label}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-2xl mb-3">
        <FaBox />
      </div>
      <h3 className="font-bold text-gray-800">No Girvi Records Found</h3>
      <p className="text-sm text-gray-500 mt-1">
        Create a new Girvi to see records here.
      </p>
    </div>
  );
}

function PhotoPlaceholder({ size }: { size: "sm" | "lg" }) {
  const cls =
    size === "sm"
      ? "w-16 h-16 rounded-xl"
      : "w-24 h-24 rounded-2xl shrink-0";

  return (
    <div
      className={`${cls} bg-purple-100 text-purple-700 flex items-center justify-center`}
    >
      <FaBox />
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold text-gray-900 mt-1">{value}</p>
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
}: {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}) {
  const currentPage = page + 1;

  if (totalElements === 0) return null;

  const startRecord = page * size + 1;
  const endRecord = Math.min((page + 1) * size, totalElements);

  return (
    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-5">
      <div className="text-sm text-gray-500 text-center sm:text-left">
        Showing <span className="font-bold text-gray-800">{startRecord}</span>{" "}
        to <span className="font-bold text-gray-800">{endRecord}</span> of{" "}
        <span className="font-bold text-gray-800">{totalElements}</span>{" "}
        records
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Rows:</span>

          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg border text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Prev
          </button>

          <span className="text-sm font-semibold text-gray-700 px-2">
            Page {currentPage} of {totalPages || 1}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-lg border text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
