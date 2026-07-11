import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCoins,
  FaHome,
  FaPlus,
  FaRupeeSign,
  FaUserFriends,
  FaCheck,
  FaTimes,
  FaWhatsapp,
  FaDownload,
  FaFileInvoice,
} from "react-icons/fa";
import DealerSidebar from "../dealer/DealerSidebar";
import MobileDealerSidebar from "../dealer/MobileDealerSidebar";
import { useGirvi } from "./GirviContext";
import { API_BASE } from "../config/api";
import {
  LOGO_URL,
  imageUrlToDataUrl,
  buildInvoiceDataFromBackend,
  generateFrontendInvoicePdfFile,
  formatInvoiceCurrency,
} from "./InvoicePdf";

type GirviItemForm = {
  itemName: string;
  itemType: string;
  itemCount: string;
  itemWeightGram: string;
  goldKarat: string;
  lessWeightGram: string;
  netWeightGram: string;
  ratePerGram: string;
};

export default function AddGirvi() {
  const nav = useNavigate();
  const location = useLocation();

  const navState = location.state as any;
  const returnTo = navState?.returnTo || "/dealer/customer";

  const query = new URLSearchParams(window.location.search);
  const isAdminView = query.get("adminView") === "true";

  const dealerName =
    query.get("dealerName") ||
    localStorage.getItem("ps_dealer_name") ||
    "Dealer";

  const dealerIdForSidebar =
    query.get("dealerId") || localStorage.getItem("ps_dealer_id") || "-";

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const todayDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const todayDay = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
  });

  const { customer, setCustomer, loanDetails, setLoanDetails, resetGirvi } =
    useGirvi();

  const token = localStorage.getItem("ps_token");
  const dealerId = localStorage.getItem("ps_dealer_id");

  const [loading, setLoading] = useState(false);
const [photo, setPhoto] = useState<File | null>(null);

const initialItemPhotoUrl =
  navState?.itemPhotoUrl ||
  navState?.girvi?.itemPhotoUrl ||
  loanDetails?.itemPhotoUrl ||
  "";

const [itemPhotoUrl, setItemPhotoUrl] = useState(initialItemPhotoUrl);
const [photoPreview, setPhotoPreview] = useState(
  getDisplayImageUrl(initialItemPhotoUrl)
);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<number | null>(null);
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState("");
  const [savedGirviData, setSavedGirviData] = useState<any>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoiceLogoDataUrl, setInvoiceLogoDataUrl] = useState("");

  const [form, setForm] = useState({
    actualLoanAmount: "",
    interestRate: "",
    girviDate: "",
    maturityDate: "",
    remarks: "",
  });

  const [items, setItems] = useState<GirviItemForm[]>([
    {
      itemName: "",
      itemType: "Gold",
      itemCount: "1",
      itemWeightGram: "",
      goldKarat: "",
      lessWeightGram: "",
      netWeightGram: "",
      ratePerGram: "",
    },
  ]);

  const steps = [
    { id: 1, label: "Customer" },
    { id: 2, label: "Item Details" },
    { id: 3, label: "Loan Details" },
    { id: 4, label: "Review" },
  ];

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
    if (navState?.customerId) {
      const incomingId = String(navState.customerId);
      const currentId = String(customer?.id || customer?.customerId || "");

      if (currentId !== incomingId) {
        resetGirvi();

        setCustomer({
          ...(customer || {}),
          id: navState.customerId,
          customerId: navState.customerId,
          fullName: navState.customerName || customer?.fullName,
          customerName: navState.customerName || customer?.customerName,
          phoneNumber:
            navState.phoneNumber ||
            navState.customerPhone ||
            navState.customerPhoneNumber ||
            customer?.phoneNumber ||
            customer?.phone ||
            customer?.mobile,
          phone:
            navState.phone ||
            navState.phoneNumber ||
            navState.customerPhone ||
            customer?.phone ||
            customer?.phoneNumber,
          mobile:
            navState.mobile ||
            navState.phoneNumber ||
            navState.customerPhone ||
            customer?.mobile,
          customerAddress:
            navState.customerAddress ||
            navState.address ||
            customer?.customerAddress ||
            customer?.address,
          address:
            navState.address ||
            navState.customerAddress ||
            customer?.address ||
            customer?.customerAddress,
            customerPhotoUrl:
  navState.customerPhotoUrl ||
  navState.photoUrl ||
  navState.customer?.customerPhotoUrl ||
  customer?.customerPhotoUrl ||
  customer?.photoUrl,
photoUrl:
  navState.photoUrl ||
  navState.customerPhotoUrl ||
  navState.customer?.photoUrl ||
  customer?.photoUrl ||
  customer?.customerPhotoUrl,
        });
      }
    }
  }, [navState, customer?.id, customer?.customerId, resetGirvi, setCustomer]);

  const resolvedCustomerId =
    loanDetails.customerId ||
    customer?.id ||
    customer?.customerId ||
    customer?.customer_id;

  const customerName =
    customer?.fullName ||
    customer?.name ||
    customer?.customerName ||
    navState?.customerName ||
    "Selected Customer";

function getDisplayImageUrl(photoUrl?: string) {
  if (!photoUrl || !photoUrl.trim()) return "";

  if (
    photoUrl.startsWith("http://") ||
    photoUrl.startsWith("https://") ||
    photoUrl.startsWith("blob:")
  ) {
    return photoUrl;
  }

  return `${API_BASE}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
}

  useEffect(() => {
    if (!loanDetails.customerId) {
      const savedCustomerId =
        customer?.id || customer?.customerId || customer?.customer_id;

      if (savedCustomerId) {
        setLoanDetails((prev: any) => ({
          ...prev,
          customerId: savedCustomerId,
        }));
      }
    }
  }, [loanDetails.customerId, customer, setLoanDetails]);

useEffect(() => {
  return () => {
    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
  };
}, [photoPreview]);

  function calculateNetWeight(gross: any, less: any) {
    const grossWeight = Number(gross || 0);
    const lessWeight = Number(less || 0);
    const net = grossWeight - lessWeight;

    return net > 0 ? net : 0;
  }

  const totalValue = items.reduce((sum, item) => {
    const rowNet =
      item.netWeightGram !== ""
        ? Number(item.netWeightGram || 0)
        : calculateNetWeight(item.itemWeightGram, item.lessWeightGram);

    const rowRate = Number(item.ratePerGram || 0);

    return sum + rowNet * rowRate;
  }, 0);

  function getInvoiceForm() {
    const firstItem = items[0];

    const firstNetWeight =
      firstItem?.netWeightGram ||
      String(
        calculateNetWeight(
          firstItem?.itemWeightGram,
          firstItem?.lessWeightGram
        )
      );

    return {
      itemName: firstItem?.itemName || "",
      itemType: firstItem?.itemType || "Gold",
      itemCount: firstItem?.itemCount || "1",
      itemWeightGram: firstItem?.itemWeightGram || "",
      goldKarat: firstItem?.goldKarat || "",
      lessWeightGram: firstItem?.lessWeightGram || "",
      netWeightGram: firstNetWeight,
      ratePerGram: firstItem?.ratePerGram || "",
      actualLoanAmount: form.actualLoanAmount,
      interestRate: form.interestRate,
      girviDate: form.girviDate,
      maturityDate: form.maturityDate,
      remarks: form.remarks,
    };
  }

  function update(key: string, value: any) {
    setForm((prev) => {
      const next: any = {
        ...prev,
        [key]: value,
      };

      if (
        key === "girviDate" &&
        next.maturityDate &&
        value &&
        new Date(next.maturityDate) < new Date(value)
      ) {
        next.maturityDate = "";
      }

      return next;
    });

    if (errors[key]) {
      setErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }

    if (key === "girviDate" && errors.maturityDate) {
      setErrors((prev) => ({
        ...prev,
        maturityDate: "",
      }));
    }
  }

  function updateItem(index: number, key: keyof GirviItemForm, value: string) {
    setItems((prev) => {
      const next = [...prev];

      next[index] = {
        ...next[index],
        [key]: value,
      };

      if (key === "itemWeightGram" || key === "lessWeightGram") {
        const gross = Number(
          key === "itemWeightGram"
            ? value || 0
            : next[index].itemWeightGram || 0
        );

        const less = Number(
          key === "lessWeightGram"
            ? value || 0
            : next[index].lessWeightGram || 0
        );

        const net = Math.max(gross - less, 0);

        next[index].netWeightGram = net ? String(net) : "";
      }

      return next;
    });

    const errorKey = `${key}_${index}`;

    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: "",
      }));
    }
  }

  function addItemRow() {
    setItems((prev) => [
      ...prev,
      {
        itemName: "",
        itemType: "Gold",
        itemCount: "1",
        itemWeightGram: "",
        goldKarat: "",
        lessWeightGram: "",
        netWeightGram: "",
        ratePerGram: "",
      },
    ]);
  }

  function removeItemRow(index: number) {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

function handlePhotoChange(file: File | null) {
  if (photoPreview && photoPreview.startsWith("blob:")) {
    URL.revokeObjectURL(photoPreview);
  }

  if (!file) {
    setPhoto(null);
    setItemPhotoUrl("");
    setPhotoPreview("");
    return;
  }

  if (!file.type.startsWith("image/")) {
    setErrors((prev) => ({ ...prev, photo: "Only image files allowed" }));
    setPhoto(null);
    setItemPhotoUrl("");
    setPhotoPreview("");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setErrors((prev) => ({ ...prev, photo: "Photo must be less than 5MB" }));
    setPhoto(null);
    setItemPhotoUrl("");
    setPhotoPreview("");
    return;
  }

  setPhoto(file);
  setItemPhotoUrl("");

  const previewUrl = URL.createObjectURL(file);
  setPhotoPreview(previewUrl);

  setErrors((prev) => ({ ...prev, photo: "" }));
}

  function validateStep(step: number) {
    const newErrors: Record<string, string> = {};
    const customerId =
      resolvedCustomerId || localStorage.getItem("ps_customer_id");

    if (step === 1) {
      if (!customerId) {
        newErrors.customer =
          "Customer not selected. Please go back and select a customer.";
      }
    }

    if (step === 2) {
      items.forEach((item, index) => {
        if (!item.itemName.trim()) {
          newErrors[`itemName_${index}`] = "Please enter item name";
        }

        if (!item.itemCount || Number(item.itemCount) <= 0) {
          newErrors[`itemCount_${index}`] = "Enter valid No.Pc count";
        }

        if (!item.itemWeightGram || Number(item.itemWeightGram) <= 0) {
          newErrors[`itemWeightGram_${index}`] = "Enter valid gross weight";
        }

        if (item.lessWeightGram !== "" && Number(item.lessWeightGram) < 0) {
          newErrors[`lessWeightGram_${index}`] =
            "Less weight cannot be negative";
        }

        if (Number(item.lessWeightGram || 0) > Number(item.itemWeightGram || 0)) {
          newErrors[`lessWeightGram_${index}`] =
            "Less weight cannot be greater than gross weight";
        }

        if (!item.netWeightGram || Number(item.netWeightGram) <= 0) {
          newErrors[`netWeightGram_${index}`] =
            "Net weight must be greater than zero";
        }

        if (!item.ratePerGram || Number(item.ratePerGram) <= 0) {
          newErrors[`ratePerGram_${index}`] = "Enter valid rate";
        }

        if (item.itemType === "Gold" && !item.goldKarat.trim()) {
          newErrors[`goldKarat_${index}`] = "Please enter gold karat";
        }
      });
    }

    if (step === 3) {
      if (!form.actualLoanAmount || Number(form.actualLoanAmount) <= 0) {
        newErrors.actualLoanAmount = "Actual loan amount is required";
      }

      if (form.interestRate === "" || Number(form.interestRate) < 0) {
        newErrors.interestRate = "Enter valid interest rate";
      }

      if (!form.girviDate) {
        newErrors.girviDate = "Select girvi date";
      }

      if (!form.maturityDate) {
        newErrors.maturityDate = "Select maturity date";
      }

      if (form.girviDate && form.maturityDate) {
        const girviDateObj = new Date(form.girviDate);
        const maturityDateObj = new Date(form.maturityDate);

        if (maturityDateObj < girviDateObj) {
          newErrors.maturityDate = "Maturity date cannot be before Girvi date";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  }

  function prevStep() {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  async function fetchInvoiceDetailsForFrontend(invoiceId: number) {
    const authToken = localStorage.getItem("ps_token");
    const currentDealerId = localStorage.getItem("ps_dealer_id");

    if (!authToken || !currentDealerId || !invoiceId) return null;

    try {
      const res = await fetch(`${API_BASE}/invoices/${invoiceId}/details`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "X-DEALER-ID": currentDealerId,
        },
      });

      if (!res.ok) {
        console.warn("Invoice details API failed:", res.status);
        return null;
      }

      return await res.json();
    } catch (err) {
      console.warn("Invoice details fetch failed:", err);
      return null;
    }
  }

  async function downloadInvoice(invoiceId: number) {
    if (!savedGirviData) {
      alert("Invoice data not available. Please try again.");
      return;
    }

    setDownloadingInvoice(true);

    try {
      const invoiceForm = getInvoiceForm();

      const file = await generateFrontendInvoicePdfFile({
        invoiceId,
        savedInvoiceNumber,
        savedGirviData,
        invoiceLogoDataUrl,
        customerName,
        customer,
        resolvedCustomerId,
        form: invoiceForm,
      });

      const url = window.URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Invoice download failed:", err);
      alert("Could not generate invoice PDF.");
    } finally {
      setDownloadingInvoice(false);
    }
  }

  async function sendInvoiceOnWhatsApp(invoiceId: number) {
    if (!savedGirviData) {
      alert("Invoice data not available. Please try again.");
      return;
    }

    setSendingInvoice(true);

    try {
      const invoiceForm = getInvoiceForm();

      const file = await generateFrontendInvoicePdfFile({
        invoiceId,
        savedInvoiceNumber,
        savedGirviData,
        invoiceLogoDataUrl,
        customerName,
        customer,
        resolvedCustomerId,
        form: invoiceForm,
      });

      const message = `PawnSecure Invoice

Invoice No: ${
        savedInvoiceNumber || savedGirviData.invoiceNumber || `INV-${invoiceId}`
      }
Customer: ${savedGirviData.customerName || customerName || "-"}
Actual Loan Amount: ${formatInvoiceCurrency(
        savedGirviData.actualLoanAmount || form.actualLoanAmount
      )}
Calculated Value: ${formatInvoiceCurrency(savedGirviData.loanAmount || totalValue)}

Please find attached invoice PDF.`;

      const navAny = navigator as any;

      if (
        navAny.share &&
        navAny.canShare &&
        navAny.canShare({ files: [file] })
      ) {
        try {
          await navAny.share({
            title: "PawnSecure Invoice",
            text: message,
            files: [file],
          });

          return;
        } catch (shareErr) {
          console.warn("Native share failed, falling back to download:", shareErr);
        }
      }

      const url = window.URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      alert(
        "PDF downloaded. If WhatsApp does not attach the PDF automatically, please attach the downloaded PDF manually."
      );
    } catch (err) {
      console.error("Invoice PDF share failed:", err);
      alert("Could not share invoice PDF.");
    } finally {
      setSendingInvoice(false);
    }
  }

  function closeInvoicePopupAndGoBack() {
    setShowInvoicePopup(false);
    setSavedInvoiceId(null);
    setSavedInvoiceNumber("");
    setSavedGirviData(null);
    nav(returnTo, { replace: true });
  }

  async function saveGirvi() {
    if (!validateStep(3)) return;

    const customerId =
      resolvedCustomerId || localStorage.getItem("ps_customer_id");

    if (!customerId) {
      alert("Customer not selected. Please select a customer.");
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

    setLoading(true);
    setErrors({});

    try {
      const firstItem = items[0];

      const firstNetWeight =
        firstItem?.netWeightGram !== ""
          ? Number(firstItem?.netWeightGram || 0)
          : calculateNetWeight(firstItem?.itemWeightGram, firstItem?.lessWeightGram);

      const girviPayload = {
        customerId: Number(customerId),

        actualLoanAmount: Number(form.actualLoanAmount),

        interestRate: Number(form.interestRate),
        girviDate: form.girviDate,
        maturityDate: form.maturityDate,
        remarks: form.remarks.trim(),

        items: items.map((item) => {
          const rowNet =
            item.netWeightGram !== ""
              ? Number(item.netWeightGram || 0)
              : calculateNetWeight(item.itemWeightGram, item.lessWeightGram);

          return {
            itemName: item.itemName.trim(),
            itemType: item.itemType.toUpperCase(),
            itemCount: Number(item.itemCount || 1),
            itemWeightGram: Number(item.itemWeightGram || 0),
            goldKarat: item.goldKarat.trim(),
            lessWeightGram: Number(item.lessWeightGram || 0),
            netWeightGram: rowNet,
            ratePerGram: Number(item.ratePerGram || 0),
          };
        }),

        // Backward compatibility root fields
        itemName: firstItem?.itemName?.trim() || "",
        itemType: (firstItem?.itemType || "Gold").toUpperCase(),
        itemCount: Number(firstItem?.itemCount || 1),
        itemWeightGram: Number(firstItem?.itemWeightGram || 0),
        goldKarat: firstItem?.goldKarat?.trim() || "",
        lessWeightGram: Number(firstItem?.lessWeightGram || 0),
        netWeightGram: firstNetWeight,
        ratePerGram: Number(firstItem?.ratePerGram || 0),
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save girvi");
      }

      const savedGirvi = await res.json().catch(() => null);

      if (!savedGirvi) {
        throw new Error("Girvi saved, but backend did not return Girvi data.");
      }

      const savedItemPhotoUrl =
  savedGirvi?.itemPhotoUrl ||
  savedGirvi?.photoUrl ||
  savedGirvi?.data?.itemPhotoUrl ||
  savedGirvi?.data?.photoUrl ||
  savedGirvi?.items?.[0]?.itemPhotoUrl ||
  savedGirvi?.data?.items?.[0]?.itemPhotoUrl ||
  "";

if (savedItemPhotoUrl) {
  setItemPhotoUrl(savedItemPhotoUrl);
  setPhotoPreview(getDisplayImageUrl(savedItemPhotoUrl));
}

      const girviId =
        savedGirvi?.id ||
        savedGirvi?.girviId ||
        savedGirvi?.data?.id ||
        savedGirvi?.data?.girviId;

      if (!girviId) {
        setErrors({
          form: "Girvi saved successfully, but Girvi ID was not returned.",
        });
        return;
      }

      const invoiceId =
        savedGirvi?.invoiceId ||
        savedGirvi?.invoice?.id ||
        savedGirvi?.invoice?.invoiceId ||
        savedGirvi?.data?.invoiceId ||
        savedGirvi?.data?.invoice?.id ||
        savedGirvi?.data?.invoice?.invoiceId;

      const invoiceNumber =
        savedGirvi?.invoiceNumber ||
        savedGirvi?.invoice?.invoiceNumber ||
        savedGirvi?.data?.invoiceNumber ||
        savedGirvi?.data?.invoice?.invoiceNumber ||
        "";

      if (!invoiceId) {
        setErrors({
          form:
            "Girvi saved successfully, but invoice ID was not returned by backend. Please include invoiceId in GirviResponseDTO.",
        });
        return;
      }

      const invoiceDetails = await fetchInvoiceDetailsForFrontend(
        Number(invoiceId)
      );

      const invoiceForm = getInvoiceForm();

      const invoiceDataForFrontend = {
  ...buildInvoiceDataFromBackend({
    invoiceDetails,
    savedGirvi,
    invoiceId,
    invoiceNumber,
    form: invoiceForm,
  }),
  itemPhotoUrl:
    savedGirvi?.itemPhotoUrl ||
    savedGirvi?.photoUrl ||
    savedGirvi?.data?.itemPhotoUrl ||
    savedGirvi?.data?.photoUrl ||
    savedGirvi?.items?.[0]?.itemPhotoUrl ||
    savedGirvi?.data?.items?.[0]?.itemPhotoUrl ||
    itemPhotoUrl ||
    "",
};

      setSavedGirviData(invoiceDataForFrontend);
      setSavedInvoiceId(Number(invoiceId));
      setSavedInvoiceNumber(invoiceNumber);
      setShowInvoicePopup(true);
    } catch (err: any) {
      setErrors({
        form: err?.message || "Girvi save failed. Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  function renderPhotoUpload() {
    return (
      <div>
        <label className="text-xs md:text-sm font-bold text-gray-600 block mb-2 md:mb-3">
          Item Photo
        </label>

        <div className="flex flex-wrap gap-3 md:gap-4">
          {photoPreview && (
            <div className="relative w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
              <img
  src={photoPreview}
  alt="Item"
  className="w-full h-full object-cover"
  onError={(e) => {
    e.currentTarget.style.display = "none";
  }}
/>

              <button
                type="button"
                onClick={() => {
  if (photoPreview && photoPreview.startsWith("blob:")) {
    URL.revokeObjectURL(photoPreview);
  }

  setPhoto(null);
  setItemPhotoUrl("");
  setPhotoPreview("");
}}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"
              >
                <FaTimes className="text-[12px]" />
              </button>
            </div>
          )}

          <label className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 flex flex-col items-center justify-center gap-1.5 md:gap-2 cursor-pointer hover:bg-purple-50 transition text-[#4820C5]">
            <FaPlus className="md:text-lg" />
            <span className="text-xs md:text-sm font-semibold">Add</span>

            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {errors.photo && (
          <p className="text-red-500 text-xs md:text-sm mt-2">
            {errors.photo}
          </p>
        )}
      </div>
    );
  }

  function renderWizardCard() {
    return (
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 sm:p-7 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between relative px-2 sm:px-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-100 z-0 px-8 sm:px-16"></div>

            {steps.map((step) => (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center gap-2 bg-white px-2 sm:px-4"
              >
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-colors ${
                    currentStep > step.id
                      ? "bg-[#4820C5] text-white"
                      : currentStep === step.id
                      ? "bg-[#4820C5] text-white ring-4 ring-purple-100"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {currentStep > step.id ? (
                    <FaCheck className="text-[12px] md:text-sm" />
                  ) : (
                    step.id
                  )}
                </div>

                <span
                  className={`text-[11px] md:text-sm font-semibold whitespace-nowrap ${
                    currentStep >= step.id ? "text-[#4820C5]" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {errors.form && (
          <div className="bg-red-50 text-red-600 p-3 md:p-4 rounded-xl text-sm md:text-base font-medium mb-6 text-center border border-red-100">
            {errors.form}
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              Customer Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-gray-50/50 rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
                <p className="text-xs md:text-sm text-gray-500 font-semibold mb-1">
                  Customer ID
                </p>
                <p className="font-bold text-gray-900 text-lg md:text-xl">
                  {resolvedCustomerId || "Not selected"}
                </p>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
                <p className="text-xs md:text-sm text-gray-500 font-semibold mb-1">
                  Customer Name
                </p>
                <p className="font-bold text-gray-900 text-lg md:text-xl">
                  {customerName}
                </p>
              </div>
            </div>

            {errors.customer && (
              <p className="text-red-500 text-sm mt-3">{errors.customer}</p>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              Item Information
            </h2>

            <div className="space-y-5 md:space-y-6">
              {items.map((item, index) => {
                const rowNet =
                  item.netWeightGram !== ""
                    ? Number(item.netWeightGram || 0)
                    : calculateNetWeight(
                        item.itemWeightGram,
                        item.lessWeightGram
                      );

                const rowValue = rowNet * Number(item.ratePerGram || 0);

                return (
                  <div
                    key={index}
                    className="border border-gray-100 rounded-2xl p-4 md:p-5 bg-white shadow-sm space-y-5"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-gray-900">
                        Item {index + 1}
                      </h3>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-red-600 text-xs font-bold bg-red-50 px-3 py-2 rounded-xl"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <Input
                      label="Item Name *"
                      value={item.itemName}
                      onChange={(v: any) => updateItem(index, "itemName", v)}
                      error={errors[`itemName_${index}`]}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
                      <div>
                        <label className="text-xs md:text-sm font-bold text-gray-600 block mb-1.5 md:mb-2">
                          Item Type *
                        </label>

                        <div className="relative">
                          <select
                            value={item.itemType}
                            onChange={(e) =>
                              updateItem(index, "itemType", e.target.value)
                            }
                            className="w-full px-4 py-3.5 md:py-4 rounded-xl border border-gray-200 bg-white text-sm md:text-base font-medium outline-none focus:border-[#4820C5] focus:ring-1 focus:ring-[#4820C5] appearance-none"
                          >
                            <option value="Gold">Gold</option>
                            <option value="Silver">Silver</option>
                          </select>

                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs md:text-sm">
                            ▼
                          </div>
                        </div>
                      </div>

                      <Input
                        label="No.Pc Count *"
                        type="number"
                        value={item.itemCount}
                        onChange={(v: any) =>
                          updateItem(index, "itemCount", v)
                        }
                        error={errors[`itemCount_${index}`]}
                      />

                      <Input
                        label="Rate per Gram (₹) *"
                        type="number"
                        value={item.ratePerGram}
                        onChange={(v: any) =>
                          updateItem(index, "ratePerGram", v)
                        }
                        error={errors[`ratePerGram_${index}`]}
                      />
                    </div>

                    {item.itemType === "Gold" && (
  <div>
    <label className="text-xs md:text-sm font-bold text-gray-600 block mb-1.5 md:mb-2">
      Gold Karat *
    </label>

    <div className="relative">
      <select
        value={item.goldKarat}
        onChange={(e) => updateItem(index, "goldKarat", e.target.value)}
        className={`w-full px-4 py-3.5 md:py-4 rounded-xl border bg-white text-sm md:text-base font-medium outline-none focus:border-[#4820C5] focus:ring-1 focus:ring-[#4820C5] appearance-none ${
          errors[`goldKarat_${index}`]
            ? "border-red-400 focus:ring-red-400"
            : "border-gray-200"
        }`}
      >
        <option value="">Select Gold Karat</option>
        <option value="9K">9K</option>
        <option value="10K">10K</option>
        <option value="11K">11K</option>
        <option value="12K">12K</option>
        <option value="13K">13K</option>
        <option value="14K">14K</option>
        <option value="15K">15K</option>
        <option value="16K">16K</option>
        <option value="17K">17K</option>
        <option value="18K">18K</option>
        <option value="19K">19K</option>
        <option value="20K">20K</option>
        <option value="21K">21K</option>
        <option value="22K">22K</option>
        <option value="23K">23K</option>
        <option value="24K">24K</option>
      </select>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs md:text-sm">
        ▼
      </div>
    </div>

    {errors[`goldKarat_${index}`] && (
      <p className="text-red-500 text-xs md:text-sm mt-1.5 font-medium">
        {errors[`goldKarat_${index}`]}
      </p>
    )}
  </div>
)}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
                      <Input
                        label="Gross Weight (Gram) *"
                        type="number"
                        value={item.itemWeightGram}
                        onChange={(v: any) =>
                          updateItem(index, "itemWeightGram", v)
                        }
                        error={errors[`itemWeightGram_${index}`]}
                      />

                      <Input
                        label="Less Weight (Gram)"
                        type="number"
                        value={item.lessWeightGram}
                        onChange={(v: any) =>
                          updateItem(index, "lessWeightGram", v)
                        }
                        error={errors[`lessWeightGram_${index}`]}
                      />

                      <Input
                        label="Net Weight (Gram) *"
                        type="number"
                        value={item.netWeightGram}
                        onChange={(v: any) =>
                          updateItem(index, "netWeightGram", v)
                        }
                        error={errors[`netWeightGram_${index}`]}
                        disabled
                      />
                    </div>

                    <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wide">
                        Item Value
                      </p>
                      <p className="text-2xl font-black text-green-700 mt-1">
                        ₹{" "}
                        {rowValue.toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Net Weight ({rowNet || 0} gm) × Rate ₹
                        {item.ratePerGram || 0}
                      </p>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addItemRow}
                className="w-full bg-purple-50 hover:bg-purple-100 text-[#4820C5] py-3.5 rounded-2xl font-extrabold transition"
              >
                + Add Another Item
              </button>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                  Total Calculated Item Value
                </p>
                <p className="text-2xl font-black text-blue-700 mt-1">
                  ₹{" "}
                  {totalValue.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <Input
                label="Description (Optional)"
                value={form.remarks}
                onChange={(v: any) => update("remarks", v)}
              />

              {renderPhotoUpload()}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              Loan Information
            </h2>

            <div className="space-y-5 md:space-y-6">
              <div>
                <label className="text-xs md:text-sm font-bold text-gray-600 block mb-1.5 md:mb-2">
                  Estimated Value
                </label>

                <div className="w-full px-4 py-3.5 md:py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold text-sm md:text-base">
                  ₹{" "}
                  {totalValue.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              <Input
                label="Actual Loan Amount *"
                type="number"
                value={form.actualLoanAmount}
                onChange={(v: any) => update("actualLoanAmount", v)}
                error={errors.actualLoanAmount}
                placeholder="Amount actually given to customer"
              />

              <Input
                label="Interest Rate (%) *"
                type="number"
                value={form.interestRate}
                onChange={(v: any) => update("interestRate", v)}
                error={errors.interestRate}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                <Input
                  label="Girvi Date *"
                  type="date"
                  value={form.girviDate}
                  onChange={(v: any) => update("girviDate", v)}
                  error={errors.girviDate}
                />

                <Input
                  label="Maturity Date *"
                  type="date"
                  value={form.maturityDate}
                  min={form.girviDate || undefined}
                  onChange={(v: any) => update("maturityDate", v)}
                  error={errors.maturityDate}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              Review Information
            </h2>

            <div className="space-y-4 md:space-y-6">
              {items.map((item, index) => {
                const rowNet =
                  item.netWeightGram !== ""
                    ? Number(item.netWeightGram || 0)
                    : calculateNetWeight(
                        item.itemWeightGram,
                        item.lessWeightGram
                      );

                return (
                  <ItemSummaryCard
                    key={index}
                    photo={index === 0 ? photoPreview || getDisplayImageUrl(itemPhotoUrl) : ""}
                    name={item.itemName}
                    type={item.itemType}
                    itemCount={item.itemCount}
                    karat={item.goldKarat}
                    grossWeight={`${item.itemWeightGram || 0} gram`}
                    lessWeight={`${item.lessWeightGram || 0} gram`}
                    netWeight={`${rowNet || 0} gram`}
                  />
                );
              })}

              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 md:p-8 text-sm md:text-base">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6">
                  <ReviewRow label="Customer" value={customerName} />
                  <ReviewRow label="Total Items" value={`${items.length}`} />
                  <ReviewRow
                    label="Actual Loan Amount"
                    value={`₹ ${Number(
                      form.actualLoanAmount || 0
                    ).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}`}
                  />
                  <ReviewRow
                    label="Interest Rate"
                    value={`${form.interestRate}%`}
                  />
                  <ReviewRow label="Girvi Date" value={form.girviDate} />
                  <ReviewRow label="Maturity Date" value={form.maturityDate} />
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <ReviewRow
                    label="Calculated Item Value"
                    value={`₹ ${totalValue.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}`}
                    isHighlight
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-10 md:mt-12 pt-6 md:pt-8 border-t border-gray-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="text-[#4820C5] font-bold px-4 py-3 md:px-6 md:py-3.5 flex items-center gap-2 hover:bg-purple-50 rounded-xl transition md:text-lg"
            >
              <FaArrowLeft className="text-sm md:text-base" /> Previous
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="bg-[#4820C5] hover:bg-[#3d1aab] text-white font-bold px-8 py-3.5 md:px-10 md:py-4 rounded-xl flex items-center gap-2 transition shadow-md shadow-purple-200 md:text-lg"
            >
              Next Step <FaArrowRight className="text-sm md:text-base" />
            </button>
          ) : (
            <button
              type="button"
              onClick={saveGirvi}
              disabled={loading}
              className={`font-bold px-8 py-3.5 md:px-10 md:py-4 rounded-xl flex items-center gap-2 transition shadow-md md:text-lg ${
                loading
                  ? "bg-gray-400 text-white"
                  : "bg-[#28A745] hover:bg-[#218838] text-white shadow-xl shadow-green-200/50"
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FaCheck className="text-lg md:text-xl" /> Save Girvi
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans">
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={isAdminView} />

        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Add New Girvi
              </h2>
              <p className="text-xs text-gray-500">
                Complete customer, item, loan and review details
              </p>
            </div>

            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-gray-800">
                {todayDate}
              </p>
              <p className="text-xs text-gray-400">{todayDay}</p>
            </div>
          </header>

          <div className="p-5 xl:p-6 max-w-[1400px] w-full mx-auto flex-1">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-8 py-5 mb-6">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm opacity-90">Girvi Flow</p>
                  <h1 className="text-2xl font-bold mt-1">Add New Girvi</h1>
                  <p className="text-sm opacity-80 mt-1">
                    Create a secure pledge record for selected customer
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => nav(returnTo)}
                  className="bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition"
                >
                  <FaArrowLeft /> Back
                </button>
              </div>
            </div>

            <div className="max-w-5xl mx-auto">{renderWizardCard()}</div>
          </div>
        </main>
      </div>

      <div className="lg:hidden min-h-screen bg-[#f4f5f7] pb-24">
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
                  nav("/admin/dashboard", { replace: true });
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
                Add New Girvi
              </h2>
              <p className="text-[11px] text-gray-500">
                Customer, item, loan and review
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
                <p className="text-xs opacity-80">Girvi Flow</p>
                <h1 className="text-2xl font-bold mt-1">Add New Girvi</h1>
                <p className="text-sm opacity-80 mt-1">
                  Create a secure pledge record for selected customer
                </p>
              </div>

              <button
                type="button"
                onClick={() => nav(returnTo)}
                className="w-11 h-11 bg-white/20 active:bg-white/30 rounded-2xl flex items-center justify-center transition shrink-0"
                title="Back"
              >
                <FaArrowLeft />
              </button>
            </div>
          </div>

          <div className="relative z-10">{renderWizardCard()}</div>
        </div>

        {!isAdminView && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around py-3 z-50 shadow-xl">
            <button
              type="button"
              onClick={() => nav("/dealer/dashboard")}
              className="text-gray-400 flex flex-col items-center text-[11px] font-medium gap-1"
            >
              <FaHome className="text-xl" />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => nav("/dealer/customer-register")}
              className="text-gray-400 flex flex-col items-center text-[11px] font-medium gap-1"
            >
              <FaUserFriends className="text-xl" />
              Customers
            </button>

            <button
              type="button"
              onClick={() => nav("/dealer/customer")}
              className="text-[#4820C5] flex flex-col items-center text-[11px] font-bold gap-1"
            >
              <FaRupeeSign className="text-xl" />
              Girvi
            </button>

            <button
              type="button"
              disabled
              title="Collections feature is currently disabled"
              className="text-gray-300 flex flex-col items-center text-[11px] font-medium gap-1 cursor-not-allowed"
            >
              <FaCoins className="text-xl" />
              Collections
            </button>
          </div>
        )}

        {isAdminView && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t p-3 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <button
              type="button"
              onClick={() => nav("/admin/dashboard", { replace: true })}
              className="w-full bg-purple-600 active:bg-purple-700 text-white py-3 rounded-xl font-bold transition"
            >
              Back to Admin Dashboard
            </button>
          </div>
        )}
      </div>

      {showInvoicePopup && savedInvoiceId && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-[430px] overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-2 bg-gradient-to-r from-[#4820C5] via-purple-500 to-green-500" />

            <div className="px-6 py-7">
              <div className="w-20 h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto text-3xl mb-5 border border-green-100">
                <FaFileInvoice />
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900">
                Girvi Saved Successfully
              </h2>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Invoice has been generated successfully. You can send it on
                WhatsApp or download a copy.
              </p>

              {savedInvoiceNumber && (
                <div className="mt-5 bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3">
                  <p className="text-[11px] text-purple-500 font-bold uppercase tracking-wide">
                    Invoice Number
                  </p>
                  <p className="text-sm font-extrabold text-purple-800 mt-1 break-all">
                    {savedInvoiceNumber}
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => sendInvoiceOnWhatsApp(savedInvoiceId)}
                  disabled={sendingInvoice}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl font-bold disabled:bg-gray-400 transition flex items-center justify-center gap-2 shadow-md shadow-green-100"
                >
                  <FaWhatsapp className="text-lg" />
                  {sendingInvoice
                    ? "Preparing PDF..."
                    : "Share PDF on WhatsApp"}
                </button>

                <button
                  type="button"
                  onClick={() => downloadInvoice(savedInvoiceId)}
                  disabled={downloadingInvoice}
                  className="w-full bg-[#4820C5] hover:bg-[#3917a3] text-white py-3.5 rounded-2xl font-bold disabled:bg-gray-400 transition flex items-center justify-center gap-2 shadow-md shadow-purple-100"
                >
                  <FaDownload className="text-lg" />
                  {downloadingInvoice
                    ? "Preparing Invoice..."
                    : "Download Invoice"}
                </button>

                <button
                  type="button"
                  onClick={closeInvoicePopupAndGoBack}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  min,
  max,
}: any) {
  return (
    <div>
      <label className="text-xs md:text-sm font-bold text-gray-600 block mb-1.5 md:mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3.5 md:py-4 rounded-xl border bg-white text-sm md:text-base font-medium outline-none transition ${
          error
            ? "border-red-400 focus:ring-1 focus:ring-red-400"
            : "border-gray-200 focus:border-[#4820C5] focus:ring-1 focus:ring-[#4820C5]"
        }`}
      />

      {error && (
        <p className="text-red-500 text-xs md:text-sm mt-1.5 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  isHighlight = false,
}: {
  label: string;
  value: string;
  isHighlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between pb-3 sm:pb-0 border-b border-gray-100 sm:border-b-0 last:border-0 last:pb-0 ${
        isHighlight ? "text-[#4820C5]" : ""
      }`}
    >
      <span
        className={`text-xs md:text-sm font-semibold ${
          isHighlight ? "opacity-80 md:text-base" : "text-gray-500"
        }`}
      >
        {label}
      </span>

      <span
        className={`font-bold ${
          isHighlight ? "text-xl md:text-2xl" : "text-gray-900 md:text-base"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ItemSummaryCard({
  photo,
  name,
  type,
  itemCount,
  karat,
  grossWeight,
  lessWeight,
  netWeight,
}: {
  photo: string | null;
  name: string;
  type: string;
  itemCount?: string;
  karat?: string;
  grossWeight: string;
  lessWeight: string;
  netWeight: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 flex items-center gap-4 md:gap-6 shadow-sm">
      {photo ? (
        <img
  src={photo}
  alt={name || "Item"}
  className="w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl object-cover"
  onError={(e) => {
    e.currentTarget.style.display = "none";
  }}
/>
      ) : (
        <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
          <FaCoins size={28} className="md:w-10 md:h-10" />
        </div>
      )}

      <div className="flex-1">
        <p className="font-bold text-gray-900 text-base md:text-xl">
          {name || "Unnamed Item"}
        </p>

        <div className="flex items-center gap-2 mt-2 md:mt-3 flex-wrap">
          <span
            className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold ${
              type === "Gold"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {type}
          </span>

          {type === "Gold" && karat && (
            <span className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-amber-50 text-amber-700">
              {karat}
            </span>
          )}

          <span className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-green-50 text-green-700">
            No.Pc: {itemCount || 1}
          </span>
        </div>

        <div className="mt-2 md:mt-3 text-xs md:text-sm text-gray-600 font-semibold space-y-1">
          <p>Gross: {grossWeight}</p>
          <p>Less: {lessWeight}</p>
          <p className="text-green-700 font-bold">Net: {netWeight}</p>
        </div>
      </div>
    </div>
  );
}