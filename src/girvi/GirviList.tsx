import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DealerSidebar from "../dealer/DealerSidebar";
import MobileDealerSidebar from "../dealer/MobileDealerSidebar";
import DealerMobileBottomNav from "../dealer/DealerMobileBottomNav";
import {
  FaBox,
  FaEdit,
  FaPlus,
  FaRupeeSign,
  FaSearch,
  FaTimes,
  FaSyncAlt,
  FaFileInvoice,
  FaDownload,
  FaWhatsapp,
} from "react-icons/fa";
import {
  LOGO_URL,
  imageUrlToDataUrl,
  buildInvoiceDataFromBackend,
  generateFrontendInvoicePdfFile,
} from "./InvoicePdf";

const API_BASE = "https://pawnsecure.onrender.com/api";

type GirviResponseDTO = {
  id?: number;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  phoneNumber?: string;
  itemName: string;
  itemType: string;

  itemCount?: number;

  itemWeightGram: number;
  goldKarat?: string;
  lessWeightGram?: number;
  netWeightGram?: number;

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

  invoiceId?: number;
  invoiceNumber?: string;
  invoiceDownloadUrl?: string;
  invoice?: {
    id?: number;
    invoiceId?: number;
    invoiceNumber?: string;
  };

  customer?: any;
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
  itemCount: string;
  itemWeightGram: string;
  goldKarat: string;
  lessWeightGram: string;
  netWeightGram: string;
  ratePerGram: string;
  interestRate: string;
  maturityDate: string;
  remarks: string;
};

export default function GirviList() {
  const navigate = useNavigate();

  const query = new URLSearchParams(window.location.search);
  const isAdminView = query.get("adminView") === "true";

  const dealerName =
    query.get("dealerName") ||
    localStorage.getItem("ps_dealer_name") ||
    "Dealer";

  const dealerIdForSidebar =
    query.get("dealerId") || localStorage.getItem("ps_dealer_id") || "-";

  const todayDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const todayDay = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
  });

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

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
    itemCount: "1",
    itemWeightGram: "",
    goldKarat: "",
    lessWeightGram: "",
    netWeightGram: "",
    ratePerGram: "",
    interestRate: "",
    maturityDate: "",
    remarks: "",
  });

  const [invoiceLogoDataUrl, setInvoiceLogoDataUrl] = useState("");
  const [downloadingPdfGirviId, setDownloadingPdfGirviId] = useState<
    number | string | null
  >(null);
  const [sendingWhatsAppGirviId, setSendingWhatsAppGirviId] = useState<
    number | string | null
  >(null);

  function goToAddGirvi() {
    navigate("/dealer/details", {
      state: { returnTo: "/dealer/customer" },
    });
  }

  useEffect(() => {
    fetchGirviList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  useEffect(() => {
    let active = true;

    async function loadInvoiceLogo() {
      const dataUrl = await imageUrlToDataUrl(LOGO_URL);

      if (active) {
        setInvoiceLogoDataUrl(dataUrl);
      }
    }

    loadInvoiceLogo();

    return () => {
      active = false;
    };
  }, []);

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
        item.goldKarat?.toLowerCase().includes(q) ||
        String(item.itemCount || "").includes(q) ||
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [girviList]);

  useEffect(() => {
    return () => {
      Object.values(photoMapRef.current).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  function calculateNetWeight(gross: any, less: any) {
    const grossWeight = Number(gross || 0);
    const lessWeight = Number(less || 0);
    const net = grossWeight - lessWeight;

    return net > 0 ? net : 0;
  }

  function formatWeight(value: number | string | undefined) {
    if (value === undefined || value === null || value === "") return "0 gm";

    return `${Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 3,
    })} gm`;
  }

  function formatCount(value: number | string | undefined) {
    if (value === undefined || value === null || value === "") return "1.00";

    const num = Number(value || 1);

    if (Number.isNaN(num)) return "1.00";

    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function updateEditForm(key: keyof GirviUpdateForm, value: string) {
    setEditForm((prev) => {
      const next: GirviUpdateForm = {
        ...prev,
        [key]: value,
      };

      if (key === "itemWeightGram" || key === "lessWeightGram") {
        const netWeight = calculateNetWeight(
          key === "itemWeightGram" ? value : next.itemWeightGram,
          key === "lessWeightGram" ? value : next.lessWeightGram
        );

        next.netWeightGram = netWeight ? String(netWeight) : "";
      }

      return next;
    });
  }

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

  async function handleRenewGirvi(girviId?: number) {
    if (!girviId) {
      alert("Invalid Girvi Record Identifier");
      return;
    }

    const confirmRenew = window.confirm(
      "Are you sure you want to renew this loan application record?"
    );

    if (!confirmRenew) return;

    const dealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!dealerId || !token) {
      alert("Authentication tokens expired. Please re-authenticate login session.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/girvi/${girviId}/renew`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-DEALER-ID": dealerId,
        },
      });

      if (!res.ok) {
        const message = await res.text();
        alert(message || "Backend configuration rejected loan renewal sequence.");
        return;
      }

      alert(
        "Girvi secure asset portfolio loan configuration extended/renewed successfully."
      );

      fetchGirviList();
    } catch (err) {
      console.error("Renewal transaction failure:", err);
      alert("Network subsystem interface uncommunicative. Try execution again later.");
    }
  }

  function openEditModal(item: GirviResponseDTO) {
    setSelectedGirvi(item);

    setEditForm({
      itemName: item.itemName || "",

      itemCount:
        item.itemCount !== undefined && item.itemCount !== null
          ? String(item.itemCount)
          : "1",

      itemWeightGram:
        item.itemWeightGram !== undefined && item.itemWeightGram !== null
          ? String(item.itemWeightGram)
          : "",

      goldKarat: item.goldKarat || "",

      lessWeightGram:
        item.lessWeightGram !== undefined && item.lessWeightGram !== null
          ? String(item.lessWeightGram)
          : "",

      netWeightGram:
        item.netWeightGram !== undefined && item.netWeightGram !== null
          ? String(item.netWeightGram)
          : String(calculateNetWeight(item.itemWeightGram, item.lessWeightGram)),

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

    if (!editForm.itemCount || Number(editForm.itemCount) <= 0) {
      alert("Valid No.Pc count is required");
      return;
    }

    if (!editForm.itemWeightGram || Number(editForm.itemWeightGram) <= 0) {
      alert("Valid gross weight is required");
      return;
    }

    if (Number(editForm.lessWeightGram || 0) < 0) {
      alert("Less weight cannot be negative");
      return;
    }

    if (
      Number(editForm.lessWeightGram || 0) >
      Number(editForm.itemWeightGram || 0)
    ) {
      alert("Less weight cannot be greater than gross weight");
      return;
    }

    if (!editForm.netWeightGram || Number(editForm.netWeightGram) <= 0) {
      alert("Valid net weight is required");
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
          itemCount: Number(editForm.itemCount || 1),
          itemWeightGram: Number(editForm.itemWeightGram),
          goldKarat: editForm.goldKarat.trim(),
          lessWeightGram: Number(editForm.lessWeightGram || 0),
          netWeightGram: Number(
            editForm.netWeightGram ||
              calculateNetWeight(editForm.itemWeightGram, editForm.lessWeightGram)
          ),
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

  function getGirviRowKey(item: GirviResponseDTO) {
    return item.id || `${item.customerId}-${item.itemName}-${item.girviDate}`;
  }

  function getGirviInvoiceId(item: GirviResponseDTO) {
    return item.invoiceId || item.invoice?.id || item.invoice?.invoiceId || null;
  }

  function getGirviInvoiceNumber(item: GirviResponseDTO, invoiceId: any) {
    return item.invoiceNumber || item.invoice?.invoiceNumber || `INV-${invoiceId}`;
  }

  function buildInvoiceFormFromGirvi(item: GirviResponseDTO) {
    return {
      itemName: String(item.itemName || ""),
      itemType: String(item.itemType || ""),
      itemCount: String(item.itemCount || 1),
      itemWeightGram: String(item.itemWeightGram || ""),
      goldKarat: String(item.goldKarat || ""),
      lessWeightGram: String(item.lessWeightGram || ""),
      netWeightGram: String(
        item.netWeightGram ||
          calculateNetWeight(item.itemWeightGram, item.lessWeightGram)
      ),
      ratePerGram: String(item.ratePerGram || ""),
      interestRate: String(item.interestRate || ""),
      girviDate: String(item.girviDate || ""),
      maturityDate: String(item.maturityDate || ""),
      remarks: String(item.remarks || "-"),
    };
  }

  function getCustomerPhoneForWhatsApp(item: GirviResponseDTO) {
    return (
      item.customerPhone ||
      item.phoneNumber ||
      item.customer?.phoneNumber ||
      item.customer?.phone ||
      item.customer?.mobile ||
      ""
    );
  }

  function normalizeWhatsAppPhone(phone: string) {
    const digits = String(phone || "").replace(/\D/g, "");

    if (!digits) return "";

    if (digits.length === 10) {
      return `91${digits}`;
    }

    return digits;
  }

  async function generateGirviInvoiceFile(item: GirviResponseDTO) {
    const invoiceId = getGirviInvoiceId(item);

    if (!invoiceId) {
      throw new Error(
        "Invoice ID not found for this Girvi. Please return invoiceId and invoiceNumber in Girvi list API."
      );
    }

    const dealerId = localStorage.getItem("ps_dealer_id");
    const token = localStorage.getItem("ps_token");

    if (!dealerId || !token) {
      throw new Error("Session expired. Please login again.");
    }

    const res = await fetch(`${API_BASE}/invoices/${invoiceId}/details`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-DEALER-ID": dealerId,
      },
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Unable to load invoice details");
    }

    const invoiceDetails = await res.json();
    const form = buildInvoiceFormFromGirvi(item);

    const invoiceNumber =
      invoiceDetails?.invoiceNumber || getGirviInvoiceNumber(item, invoiceId);

    const savedGirviData = buildInvoiceDataFromBackend({
      invoiceDetails,
      savedGirvi: item,
      invoiceId,
      invoiceNumber,
      form,
    });

    const file = await generateFrontendInvoicePdfFile({
      invoiceId: Number(invoiceId),
      savedInvoiceNumber: invoiceNumber,
      savedGirviData,
      invoiceLogoDataUrl,
      customerName: item.customerName || "Customer",
      customer: item.customer || {},
      resolvedCustomerId: item.customerId,
      form,
    });

    return {
      file,
      invoiceNumber,
      invoiceDetails,
    };
  }

  async function downloadGirviInvoicePdf(item: GirviResponseDTO) {
    const rowKey = getGirviRowKey(item);

    setDownloadingPdfGirviId(rowKey);

    try {
      const { file } = await generateGirviInvoiceFile(item);

      const url = window.URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Invoice PDF download failed:", err);
      alert(err?.message || "Could not download invoice PDF.");
    } finally {
      setDownloadingPdfGirviId(null);
    }
  }

  async function sendGirviInvoiceOnWhatsApp(item: GirviResponseDTO) {
    const rowKey = getGirviRowKey(item);

    setSendingWhatsAppGirviId(rowKey);

    try {
      const { file, invoiceNumber } = await generateGirviInvoiceFile(item);

      const message = `PawnSecure Invoice

Invoice No: ${invoiceNumber}
Customer: ${item.customerName || "-"}
Item: ${item.itemName || "-"}
No.Pc: ${formatCount(item.itemCount)}
Loan Amount: ${formatCurrency(item.loanAmount)}
Maturity Date: ${formatDate(item.maturityDate)}

Please find attached invoice PDF.`;

      const navAny = navigator as any;

      if (
        navAny.share &&
        navAny.canShare &&
        navAny.canShare({ files: [file] })
      ) {
        await navAny.share({
          title: "PawnSecure Invoice",
          text: message,
          files: [file],
        });

        return;
      }

      const url = window.URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      const phone = normalizeWhatsAppPhone(getCustomerPhoneForWhatsApp(item));

      const whatsappUrl = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, "_blank");

      alert(
        "PDF downloaded. If WhatsApp does not attach the PDF automatically, please attach the downloaded PDF manually."
      );
    } catch (err: any) {
      console.error("WhatsApp invoice share failed:", err);
      alert(err?.message || "Could not send invoice on WhatsApp.");
    } finally {
      setSendingWhatsAppGirviId(null);
    }
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

    if (s === "active") return "bg-green-50 text-green-700 border-green-100";
    if (s === "duetoday") return "bg-yellow-50 text-yellow-700 border-yellow-100";
    if (s === "due") return "bg-yellow-50 text-yellow-700 border-yellow-100";
    if (s === "overdue") return "bg-red-50 text-red-700 border-red-100";
    if (s === "partial_released")
      return "bg-blue-50 text-blue-700 border-blue-100";
    if (s === "released") return "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (s === "closed") return "bg-gray-100 text-gray-600 border-gray-200";

    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans">
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={isAdminView} />

        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Girvi Records</h2>
              <p className="text-xs text-gray-500">
                Manage and review secure customer pledge listings
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-gray-800">
                  {todayDate}
                </p>
                <p className="text-xs text-gray-400">{todayDay}</p>
              </div>

              <button
                type="button"
                onClick={goToAddGirvi}
                className="bg-[#4820C5] hover:bg-[#3917a3] text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition"
              >
                <FaPlus /> Add New Girvi
              </button>
            </div>
          </header>

          <div className="p-6 xl:p-8 max-w-[1400px] w-full mx-auto flex-1">
            <RecordsPanel
              loading={loading}
              error={error}
              filteredList={filteredList}
              totalElements={totalElements}
              search={search}
              setSearch={setSearch}
              getImageSrc={getImageSrc}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              formatWeight={formatWeight}
              formatCount={formatCount}
              calculateNetWeight={calculateNetWeight}
              getStatusClass={getStatusClass}
              openEditModal={openEditModal}
              handleRenewGirvi={handleRenewGirvi}
              downloadGirviInvoicePdf={downloadGirviInvoicePdf}
              downloadingPdfGirviId={downloadingPdfGirviId}
              sendGirviInvoiceOnWhatsApp={sendGirviInvoiceOnWhatsApp}
              sendingWhatsAppGirviId={sendingWhatsAppGirviId}
              getGirviRowKey={getGirviRowKey}
              page={page}
              size={size}
              totalPages={totalPages}
              setPage={setPage}
              setSize={setSize}
            />
          </div>
        </main>
      </div>

      <div className="lg:hidden min-h-screen bg-[#f4f5f7] pb-32">
        <MobileDealerSidebar
          open={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
          isAdminView={isAdminView}
          dealerName={dealerName}
          dealerId={dealerIdForSidebar}
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
              <h2 className="text-base font-bold text-gray-900">
                Girvi Records
              </h2>
              <p className="text-[11px] text-gray-500">
                Manage pledge records
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
                <p className="text-xs opacity-80">Girvi Management</p>
                <h1 className="text-2xl font-bold mt-1">Girvi Records</h1>
                <p className="text-sm opacity-80 mt-1">
                  Total Records : {totalElements}
                </p>
              </div>

              <button
                type="button"
                onClick={goToAddGirvi}
                className="w-11 h-11 bg-white/20 active:bg-white/30 rounded-2xl flex items-center justify-center transition shrink-0"
              >
                <FaPlus />
              </button>
            </div>
          </div>

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
            formatWeight={formatWeight}
            formatCount={formatCount}
            calculateNetWeight={calculateNetWeight}
            getStatusClass={getStatusClass}
            openEditModal={openEditModal}
            handleRenewGirvi={handleRenewGirvi}
            downloadGirviInvoicePdf={downloadGirviInvoicePdf}
            downloadingPdfGirviId={downloadingPdfGirviId}
            sendGirviInvoiceOnWhatsApp={sendGirviInvoiceOnWhatsApp}
            sendingWhatsAppGirviId={sendingWhatsAppGirviId}
            getGirviRowKey={getGirviRowKey}
            page={page}
            size={size}
            totalPages={totalPages}
            setPage={setPage}
            setSize={setSize}
          />
        </div>

        <DealerMobileBottomNav active="girvi" isAdminView={isAdminView} />
      </div>

      {showEditModal && selectedGirvi && (
        <EditModal
          selectedGirvi={selectedGirvi}
          editForm={editForm}
          updateEditForm={updateEditForm}
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

function RecordsPanel({
  loading,
  error,
  filteredList,
  totalElements,
  search,
  setSearch,
  getImageSrc,
  formatCurrency,
  formatDate,
  formatWeight,
  formatCount,
  calculateNetWeight,
  getStatusClass,
  openEditModal,
  handleRenewGirvi,
  downloadGirviInvoicePdf,
  downloadingPdfGirviId,
  sendGirviInvoiceOnWhatsApp,
  sendingWhatsAppGirviId,
  getGirviRowKey,
  page,
  size,
  totalPages,
  setPage,
  setSize,
}: any) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pledge Inventory</h2>
          <p className="text-sm text-gray-400 font-medium mt-0.5">
            Showing continuous listings ({totalElements} overall items)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="w-full sm:w-80 flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus-within:border-[#4820C5] focus-within:ring-1 focus-within:ring-[#4820C5] transition">
            <FaSearch className="text-gray-400 mr-3 shrink-0 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none bg-transparent text-sm font-medium text-gray-700"
              placeholder="Search by customer, item, status..."
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400 font-semibold text-sm">
          <div className="w-8 h-8 border-3 border-[#4820C5] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Syncing Girvi inventory records...
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 rounded-2xl px-4 py-3.5 mb-6 text-sm font-semibold">
          {error}
        </div>
      )}

      {!loading && !error && filteredList.length === 0 && <EmptyState />}

      {!loading && !error && filteredList.length > 0 && (
        <>
          <div className="space-y-4">
            {filteredList.map((item: GirviResponseDTO, index: number) => {
              const imageSrc = getImageSrc(item);
              const typeLower = String(item.itemType || "").toLowerCase();
              const rowKey = getGirviRowKey(item);
              const pdfLoading = downloadingPdfGirviId === rowKey;
              const whatsAppLoading = sendingWhatsAppGirviId === rowKey;

              const resolvedNetWeight =
                item.netWeightGram ||
                calculateNetWeight(item.itemWeightGram, item.lessWeightGram);

              return (
                <div
                  key={item.id || `${item.customerId}-${index}`}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-purple-100 transition"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.itemName || "Item asset"}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-100 bg-white shadow-sm"
                        />
                      ) : (
                        <PhotoPlaceholder size="sm" />
                      )}
                    </div>

                    <div className="col-span-3 min-w-0">
                      <p className="font-extrabold text-gray-900 text-sm truncate">
                        {item.customerName || "-"}
                      </p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        Customer ID: {item.customerId || "-"}
                      </p>

                      <div className="mt-3">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                          Item
                        </p>
                        <p className="font-bold text-gray-900 text-sm leading-snug break-words">
                          {item.itemName || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                        Asset Details
                      </p>

                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          typeLower === "gold"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.itemType || "-"}
                      </span>

                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] font-bold text-purple-700">
                          No.Pc: {formatCount(item.itemCount)}
                        </p>

                        {typeLower === "gold" && item.goldKarat && (
                          <p className="text-[11px] font-bold text-amber-700">
                            Karat: {item.goldKarat}
                          </p>
                        )}

                        <p className="text-xs font-bold text-gray-700">
                          Gross: {formatWeight(item.itemWeightGram)}
                        </p>

                        <p className="text-xs font-bold text-gray-500">
                          Less: {formatWeight(item.lessWeightGram)}
                        </p>

                        <p className="text-xs font-extrabold text-green-700">
                          Net: {formatWeight(resolvedNetWeight)}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Loan Amount
                      </p>

                      <p className="font-black text-green-600 text-base mt-1">
                        {formatCurrency(item.loanAmount)}
                      </p>

                      <p className="text-xs text-gray-400 mt-2">
                        Interest:{" "}
                        <span className="font-bold text-gray-700">
                          {item.interestRate || 0}%
                        </span>
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Timeline
                      </p>

                      <div className="mt-1 text-xs font-medium text-gray-600 leading-relaxed">
                        <p>
                          <span className="text-gray-400">Start:</span>{" "}
                          {formatDate(item.girviDate)}
                        </p>
                        <p>
                          <span className="text-gray-400">Maturity:</span>{" "}
                          {formatDate(item.maturityDate)}
                        </p>
                      </div>

                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full border text-[10px] font-extrabold tracking-wide uppercase ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "ACTIVE"}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="w-full bg-purple-50 hover:bg-purple-100 text-[#4820C5] px-2 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <FaEdit />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRenewGirvi(item.id)}
                          className="w-full bg-green-50 hover:bg-green-100 text-[#28A745] px-2 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <FaSyncAlt className="text-[10px]" />
                          Renew
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadGirviInvoicePdf(item)}
                          disabled={pdfLoading}
                          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          {pdfLoading ? (
                            <>
                              <FaDownload className="animate-pulse" />
                              PDF...
                            </>
                          ) : (
                            <>
                              <FaFileInvoice />
                              PDF
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => sendGirviInvoiceOnWhatsApp(item)}
                          disabled={whatsAppLoading}
                          className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          {whatsAppLoading ? (
                            <>
                              <FaDownload className="animate-pulse" />
                              Share...
                            </>
                          ) : (
                            <>
                              <FaWhatsapp />
                              WhatsApp
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            page={page}
            size={size}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setPage}
            onSizeChange={(newSize: number) => {
              setSize(newSize);
              setPage(0);
            }}
          />
        </>
      )}
    </div>
  );
}

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
  formatWeight,
  formatCount,
  calculateNetWeight,
  getStatusClass,
  openEditModal,
  handleRenewGirvi,
  downloadGirviInvoicePdf,
  downloadingPdfGirviId,
  sendGirviInvoiceOnWhatsApp,
  sendingWhatsAppGirviId,
  getGirviRowKey,
  page,
  size,
  totalPages,
  setPage,
  setSize,
}: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-4">
      <div className="flex items-center border border-gray-200 rounded-xl px-3 py-3 bg-gray-50/50 mb-5 focus-within:border-[#4820C5] transition">
        <FaSearch className="text-gray-400 mr-2.5 text-sm" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none bg-transparent text-sm text-gray-700 font-medium"
          placeholder="Search items, names or details..."
        />
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400 font-medium text-sm">
          <div className="w-7 h-7 border-2 border-[#4820C5] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading entries...
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold">
          {error}
        </div>
      )}

      {!loading && !error && filteredList.length === 0 && <EmptyState />}

      {!loading &&
        !error &&
        filteredList.map((item: GirviResponseDTO, index: number) => {
          const imageSrc = getImageSrc(item);
          const rowKey = getGirviRowKey(item);
          const pdfLoading = downloadingPdfGirviId === rowKey;
          const whatsAppLoading = sendingWhatsAppGirviId === rowKey;

          const resolvedNetWeight =
            item.netWeightGram ||
            calculateNetWeight(item.itemWeightGram, item.lessWeightGram);

          return (
            <div
              key={item.id || `${item.customerId}-${index}`}
              className="border border-gray-100 rounded-2xl p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4 items-start">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={item.itemName || "Item Asset"}
                    className="w-20 h-20 rounded-2xl object-cover border border-gray-100 bg-white shrink-0 shadow-xs"
                  />
                ) : (
                  <PhotoPlaceholder size="lg" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-gray-900 text-base truncate leading-tight">
                      {item.itemName || "-"}
                    </h3>

                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold tracking-wider uppercase shrink-0 ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status || "ACTIVE"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        String(item.itemType || "").toLowerCase() === "gold"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.itemType || "-"}
                    </span>

                    <span className="text-xs font-bold text-purple-700">
                      No.Pc: {formatCount(item.itemCount)}
                    </span>

                    <span className="text-xs font-bold text-green-700">
                      Net: {formatWeight(resolvedNetWeight)}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-gray-800 mt-2 truncate">
                    {item.customerName || "-"}
                  </p>

                  <p className="text-[11px] text-gray-400 font-medium">
                    Cust ID: {item.customerId || "-"}
                  </p>

                  <div className="mt-2 text-[11px] text-gray-500 font-semibold space-y-0.5">
                    {String(item.itemType || "").toLowerCase() === "gold" &&
                      item.goldKarat && <p>Karat: {item.goldKarat}</p>}

                    <p>Gross: {formatWeight(item.itemWeightGram)}</p>
                    <p>Less: {formatWeight(item.lessWeightGram)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-50">
                <InfoBox
                  label="Loan Amount"
                  value={formatCurrency(item.loanAmount)}
                  isPrimary
                />
                <InfoBox
                  label="Interest Rate"
                  value={`${item.interestRate || 0}%`}
                />
                <InfoBox label="Girvi Date" value={formatDate(item.girviDate)} />
                <InfoBox
                  label="Maturity Date"
                  value={formatDate(item.maturityDate)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="bg-purple-50 hover:bg-purple-100 text-[#4820C5] py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <FaEdit className="text-xs" />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleRenewGirvi(item.id)}
                  className="bg-[#28A745]/5 hover:bg-[#28A745]/10 text-[#28A745] py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <FaSyncAlt className="text-[10px]" />
                  Renew
                </button>

                <button
                  type="button"
                  onClick={() => downloadGirviInvoicePdf(item)}
                  disabled={pdfLoading}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {pdfLoading ? (
                    <>
                      <FaDownload className="animate-pulse" />
                      PDF...
                    </>
                  ) : (
                    <>
                      <FaFileInvoice className="text-xs" />
                      PDF
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => sendGirviInvoiceOnWhatsApp(item)}
                  disabled={whatsAppLoading}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {whatsAppLoading ? (
                    <>
                      <FaDownload className="animate-pulse" />
                      Share...
                    </>
                  ) : (
                    <>
                      <FaWhatsapp className="text-xs" />
                      WhatsApp
                    </>
                  )}
                </button>
              </div>
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
          onSizeChange={(newSize: number) => {
            setSize(newSize);
            setPage(0);
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  selectedGirvi,
  editForm,
  updateEditForm,
  updating,
  submitUpdateGirvi,
  close,
  formatCurrency,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col border border-gray-100">
        <div className="bg-[#4820C5] text-white px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Modify Girvi Entry
            </h2>
            <p className="text-xs opacity-80 font-medium mt-0.5">
              Customer Account: {selectedGirvi.customerName}
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <EditInput
            label="Item Component Name"
            value={editForm.itemName}
            onChange={(value: string) => updateEditForm("itemName", value)}
          />

          <EditInput
            label="No.Pc Count"
            type="number"
            value={editForm.itemCount}
            onChange={(value: string) => updateEditForm("itemCount", value)}
          />

          <EditInput
            label="Gold Karat"
            value={editForm.goldKarat}
            onChange={(value: string) => updateEditForm("goldKarat", value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditInput
              label="Gross Weight (Gram)"
              type="number"
              value={editForm.itemWeightGram}
              onChange={(value: string) =>
                updateEditForm("itemWeightGram", value)
              }
            />

            <EditInput
              label="Less Weight (Gram)"
              type="number"
              value={editForm.lessWeightGram}
              onChange={(value: string) =>
                updateEditForm("lessWeightGram", value)
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditInput
              label="Net Weight (Gram)"
              type="number"
              value={editForm.netWeightGram}
              onChange={(value: string) =>
                updateEditForm("netWeightGram", value)
              }
            />

            <EditInput
              label="Rate Specification per Gram"
              type="number"
              value={editForm.ratePerGram}
              onChange={(value: string) =>
                updateEditForm("ratePerGram", value)
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditInput
              label="Interest Fee Percent (%)"
              type="number"
              value={editForm.interestRate}
              onChange={(value: string) =>
                updateEditForm("interestRate", value)
              }
            />

            <EditInput
              label="Settlement Maturity Date"
              type="date"
              value={editForm.maturityDate}
              onChange={(value: string) =>
                updateEditForm("maturityDate", value)
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Internal Log Remarks
            </label>
            <textarea
              value={editForm.remarks}
              onChange={(e) => updateEditForm("remarks", e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#4820C5] text-sm resize-none transition bg-gray-50/30"
              placeholder="Add auxiliary transactional remarks here..."
            />
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Recalculated Loan Value
              </p>
              <p className="text-2xl font-black text-green-600 mt-0.5">
                {formatCurrency(
                  Number(editForm.netWeightGram || 0) *
                    Number(editForm.ratePerGram || 0)
                )}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <FaRupeeSign className="text-base" />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={close}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 py-3.5 rounded-xl font-bold text-sm transition order-2 sm:order-1"
          >
            Cancel Dismiss
          </button>

          <button
            type="button"
            onClick={submitUpdateGirvi}
            disabled={updating}
            className="flex-1 bg-[#4820C5] hover:bg-[#3917a3] text-white py-3.5 rounded-xl font-bold text-sm disabled:bg-gray-400 transition shadow-md shadow-purple-100 order-1 sm:order-2"
          >
            {updating ? "Updating Record..." : "Confirm & Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#4820C5] text-sm font-medium transition bg-gray-50/30 text-gray-800"
        placeholder={label}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
      <div className="w-14 h-14 rounded-full bg-purple-50 text-[#4820C5] flex items-center justify-center mx-auto text-xl mb-3 shadow-inner">
        <FaBox />
      </div>
      <h3 className="font-bold text-gray-800 text-base">
        No Matching Pledge Records
      </h3>
      <p className="text-xs text-gray-400 font-medium mt-1 max-w-xs mx-auto">
        Your current search parameter query could not locate database listings.
      </p>
    </div>
  );
}

function PhotoPlaceholder({ size }: { size: "sm" | "lg" }) {
  const cls =
    size === "sm"
      ? "w-14 h-14 rounded-xl"
      : "w-20 h-20 rounded-2xl shrink-0 shadow-xs border border-gray-100";

  return (
    <div
      className={`${cls} bg-purple-50 text-[#4820C5] flex items-center justify-center text-lg`}
    >
      <FaBox />
    </div>
  );
}

function InfoBox({
  label,
  value,
  isPrimary = false,
}: {
  label: string;
  value: string;
  isPrimary?: boolean;
}) {
  return (
    <div className="bg-gray-50/70 rounded-xl p-2.5 border border-gray-100/50">
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`mt-0.5 font-bold ${
          isPrimary
            ? "text-green-600 text-sm font-extrabold"
            : "text-gray-800 text-xs"
        }`}
      >
        {value}
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
    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-100 pt-5">
      <div className="text-xs font-medium text-gray-400 text-center sm:text-left">
        Showing <span className="font-bold text-gray-700">{startRecord}</span>{" "}
        to <span className="font-bold text-gray-700">{endRecord}</span> of{" "}
        <span className="font-bold text-gray-700">{totalElements}</span> items
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Rows:
          </span>
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white outline-none font-bold text-gray-700 focus:border-[#4820C5]"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Prev
          </button>

          <span className="text-xs font-bold text-gray-500 px-1">
            {currentPage} / {totalPages || 1}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}