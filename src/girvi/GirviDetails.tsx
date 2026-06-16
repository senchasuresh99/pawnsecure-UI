import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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

const API_BASE = "https://pawnsecure-1.onrender.com/api";
const LOGO_URL =
  "https://raw.githubusercontent.com/senchasuresh99/LearningScalare/main/logo1.png";

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
  const [photoPreview, setPhotoPreview] = useState("");

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
    itemName: "",
    itemType: "Gold",
    itemWeightGram: "",
    ratePerGram: "",
    interestRate: "",
    girviDate: "",
    maturityDate: "",
    remarks: "",
  });

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
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const totalValue =
    Number(form.itemWeightGram || 0) * Number(form.ratePerGram || 0);

  function update(key: string, value: any) {
    setForm((prev) => {
      const next = {
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

  function handlePhotoChange(file: File | null) {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    if (!file) {
      setPhoto(null);
      setPhotoPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, photo: "Only image files allowed" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "Photo must be less than 5MB" }));
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
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
      if (!form.itemName.trim()) {
        newErrors.itemName = "Please enter item name";
      }

      if (!form.itemWeightGram || Number(form.itemWeightGram) <= 0) {
        newErrors.itemWeightGram = "Enter valid weight";
      }

      if (!form.ratePerGram || Number(form.ratePerGram) <= 0) {
        newErrors.ratePerGram = "Enter valid rate";
      }
    }

    if (step === 3) {
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

  function formatInvoiceCurrency(value: any) {
    if (value === undefined || value === null || value === "") return "₹0";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  }

  function formatInvoiceDate(value?: string) {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value;
    }
  }

  function escapeHtml(value: any) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function firstValue(...values: any[]) {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }

    return "";
  }

  async function imageUrlToDataUrl(url: string): Promise<string> {
    try {
      const res = await fetch(url, {
        mode: "cors",
        cache: "force-cache",
      });

      if (!res.ok) return "";

      const blob = await res.blob();

      return await new Promise((resolve) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          resolve(String(reader.result || ""));
        };

        reader.onerror = () => {
          resolve("");
        };

        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Logo load failed:", err);
      return "";
    }
  }

  function waitForImagesToLoad(element: HTMLElement) {
    const images = Array.from(element.querySelectorAll("img"));

    return Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve(true);
        }

        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      })
    );
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

  function buildInvoiceDataFromBackend({
    invoiceDetails,
    savedGirvi,
    invoiceId,
    invoiceNumber,
  }: {
    invoiceDetails: any;
    savedGirvi: any;
    invoiceId: any;
    invoiceNumber: string;
  }) {
    const data = invoiceDetails?.data || invoiceDetails || {};

    return {
      ...savedGirvi,
      ...data,

      invoiceId,
      invoiceNumber: firstValue(
        data.invoiceNumber,
        savedGirvi?.invoiceNumber,
        invoiceNumber
      ),

      shopName: firstValue(data.shopName, savedGirvi?.shopName),
      gstNumber: firstValue(data.gstNumber, data.gstin, savedGirvi?.gstNumber),
      dealerName: firstValue(data.dealerName, savedGirvi?.dealerName),
      dealerPhone: firstValue(
        data.dealerPhone,
        data.dealerMobile,
        savedGirvi?.dealerPhone
      ),
      shopAddress: firstValue(
        data.shopAddress,
        data.dealerShopAddress,
        savedGirvi?.shopAddress
      ),

      customerId: firstValue(data.customerId, savedGirvi?.customerId),
      customerName: firstValue(data.customerName, savedGirvi?.customerName),
      customerPhone: firstValue(
        data.customerPhone,
        data.customerPhoneNumber,
        data.phoneNumber,
        savedGirvi?.customerPhone
      ),
      customerAddress: firstValue(
        data.customerAddress,
        savedGirvi?.customerAddress
      ),

      itemName: firstValue(data.itemName, savedGirvi?.itemName, form.itemName),
      itemType: firstValue(data.itemType, savedGirvi?.itemType, form.itemType),
      itemWeightGram: firstValue(
        data.itemWeightGram,
        savedGirvi?.itemWeightGram,
        form.itemWeightGram
      ),
      ratePerGram: firstValue(
        data.ratePerGram,
        savedGirvi?.ratePerGram,
        form.ratePerGram
      ),

      loanAmount: firstValue(
        data.loanAmount,
        savedGirvi?.loanAmount,
        Number(form.itemWeightGram || 0) * Number(form.ratePerGram || 0)
      ),
      interestRate: firstValue(
        data.interestRate,
        savedGirvi?.interestRate,
        form.interestRate
      ),
      girviDate: firstValue(
        data.girviDate,
        savedGirvi?.girviDate,
        form.girviDate
      ),
      maturityDate: firstValue(
        data.maturityDate,
        savedGirvi?.maturityDate,
        form.maturityDate
      ),
      remarks: firstValue(data.remarks, savedGirvi?.remarks, form.remarks, "-"),
      status: firstValue(data.status, savedGirvi?.status, "ACTIVE"),
    };
  }

  function invoicePanelHtml(title: string, rows: [string, any][]) {
    return `
      <div style="
        border:1px solid #eef2f7;
        border-radius:20px;
        overflow:hidden;
        background:#ffffff;
        margin-bottom:18px;
      ">
        <div style="
          background:#f8fafc;
          padding:14px 18px;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:0.6px;
          color:#4820C5;
          border-bottom:1px solid #eef2f7;
        ">
          ${escapeHtml(title)}
        </div>

        <div style="padding:16px 18px;">
          ${rows
            .map(
              ([label, value]) => `
                <div style="
                  display:flex;
                  justify-content:space-between;
                  gap:18px;
                  padding:10px 0;
                  border-bottom:1px dashed #e5e7eb;
                  font-size:13px;
                ">
                  <span style="color:#64748b; font-weight:700; min-width:120px;">
                    ${escapeHtml(label)}
                  </span>
                  <span style="color:#111827; font-weight:800; text-align:right; word-break:break-word;">
                    ${escapeHtml(value)}
                  </span>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function getInvoiceHtmlForPdf(invoiceId: number) {
    if (!savedGirviData) return "";

    const invoiceNumber =
      savedInvoiceNumber || savedGirviData.invoiceNumber || `INV-${invoiceId}`;

    const dealerName =
      savedGirviData.dealerName ||
      localStorage.getItem("ps_dealer_name") ||
      "PawnSecure Dealer";

    const shopName =
      savedGirviData.shopName ||
      savedGirviData.dealerShopName ||
      localStorage.getItem("ps_shop_name") ||
      dealerName ||
      "PawnSecure";

    const gstNumber = savedGirviData.gstNumber || savedGirviData.gstin || "-";

    const shopAddress =
      savedGirviData.shopAddress ||
      savedGirviData.dealerShopAddress ||
      localStorage.getItem("ps_shop_address") ||
      "-";

    const dealerPhone =
      savedGirviData.dealerPhone ||
      savedGirviData.dealerMobile ||
      localStorage.getItem("ps_dealer_phone") ||
      "-";

    const customerDisplayName =
      savedGirviData.customerName || customerName || "Selected Customer";

    const customerPhone =
      savedGirviData.customerPhone ||
      savedGirviData.phoneNumber ||
      savedGirviData.customerPhoneNumber ||
      customer?.phoneNumber ||
      customer?.phone ||
      "-";

    const customerAddress =
      savedGirviData.customerAddress ||
      customer?.customerAddress ||
      customer?.address ||
      "-";

    const itemName = savedGirviData.itemName || form.itemName || "-";
    const itemType = savedGirviData.itemType || form.itemType || "-";
    const weight = savedGirviData.itemWeightGram || form.itemWeightGram || "-";
    const ratePerGram = savedGirviData.ratePerGram || form.ratePerGram || 0;

    const loanAmount =
      savedGirviData.loanAmount ||
      Number(form.itemWeightGram || 0) * Number(form.ratePerGram || 0);

    const interestRate = savedGirviData.interestRate || form.interestRate || 0;
    const girviDate = savedGirviData.girviDate || form.girviDate;
    const maturityDate = savedGirviData.maturityDate || form.maturityDate;
    const remarks = savedGirviData.remarks || form.remarks || "-";

    const logoHtml = invoiceLogoDataUrl
      ? `<img src="${invoiceLogoDataUrl}" alt="PawnSecure" style="width:44px;height:44px;object-fit:contain;display:block;" />`
      : "PS";

    return `
      <div id="frontend-invoice-pdf" style="
        width:794px;
        min-height:1123px;
        background:#ffffff;
        font-family:Arial, Helvetica, sans-serif;
        color:#111827;
        box-sizing:border-box;
        overflow:hidden;
      ">
        <div style="
          background:linear-gradient(135deg, #4820C5, #24106D);
          color:white;
          padding:34px 40px;
        ">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:24px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="
                width:58px;
                height:58px;
                background:white;
                color:#4820C5;
                border-radius:18px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-weight:900;
                font-size:22px;
                overflow:hidden;
              ">
                ${logoHtml}
              </div>

              <div>
                <h1 style="font-size:28px; font-weight:900; margin:0;">
                  PawnSecure
                </h1>
                <div style="font-size:12px; opacity:0.85; margin-top:4px;">
                  Secure Girvi Invoice / Pledge Receipt
                </div>
              </div>
            </div>

            <div style="
              background:rgba(255,255,255,0.14);
              border:1px solid rgba(255,255,255,0.24);
              padding:12px 16px;
              border-radius:16px;
              text-align:right;
              min-width:230px;
            ">
              <div style="font-size:11px; text-transform:uppercase; opacity:0.75; letter-spacing:0.8px;">
                Invoice Number
              </div>
              <strong style="font-size:15px; word-break:break-word;">
                ${escapeHtml(invoiceNumber)}
              </strong>
            </div>
          </div>
        </div>

        <div style="padding:34px 40px 40px;">
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; margin-bottom:28px;">
            <div style="background:#ecfdf5; border:1px solid #bbf7d0; border-radius:18px; padding:16px;">
              <div style="font-size:11px; color:#64748b; font-weight:800; text-transform:uppercase; margin-bottom:8px;">
                Loan Amount
              </div>
              <div style="font-size:18px; font-weight:900; color:#15803d;">
                ${escapeHtml(formatInvoiceCurrency(loanAmount))}
              </div>
            </div>

            <div style="background:#f8fafc; border:1px solid #eef2f7; border-radius:18px; padding:16px;">
              <div style="font-size:11px; color:#64748b; font-weight:800; text-transform:uppercase; margin-bottom:8px;">
                Interest Rate
              </div>
              <div style="font-size:18px; font-weight:900;">
                ${escapeHtml(interestRate)}%
              </div>
            </div>

            <div style="background:#f8fafc; border:1px solid #eef2f7; border-radius:18px; padding:16px;">
              <div style="font-size:11px; color:#64748b; font-weight:800; text-transform:uppercase; margin-bottom:8px;">
                Maturity Date
              </div>
              <div style="font-size:18px; font-weight:900;">
                ${escapeHtml(formatInvoiceDate(maturityDate))}
              </div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px;">
            ${invoicePanelHtml("Shop Details", [
              ["Shop Name", shopName],
              ["GST Number", gstNumber],
              ["Dealer", dealerName],
              ["Mobile", dealerPhone],
              ["Address", shopAddress],
            ])}

            ${invoicePanelHtml("Customer Details", [
              ["Name", customerDisplayName],
              [
                "Customer ID",
                savedGirviData.customerId || resolvedCustomerId || "-",
              ],
              ["Phone", customerPhone],
              ["Address", customerAddress],
            ])}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px;">
            ${invoicePanelHtml("Item Details", [
              ["Item Name", itemName],
              ["Item Type", itemType],
              ["Weight", `${weight} gm`],
              ["Rate / Gram", formatInvoiceCurrency(ratePerGram)],
            ])}

            ${invoicePanelHtml("Loan Details", [
              ["Girvi Date", formatInvoiceDate(girviDate)],
              ["Maturity Date", formatInvoiceDate(maturityDate)],
              ["Status", savedGirviData.status || "ACTIVE"],
              ["Remarks", remarks],
            ])}
          </div>

          <div style="
            background:#fff7ed;
            border:1px solid #fed7aa;
            color:#9a3412;
            padding:16px 18px;
            border-radius:18px;
            font-size:12px;
            line-height:1.6;
            margin-top:4px;
            margin-bottom:28px;
          ">
            <strong style="display:block; font-size:13px; margin-bottom:6px;">
              Terms &amp; Declaration
            </strong>
            This invoice is generated for the pledged item and loan details recorded in PawnSecure.
            Customer and dealer are advised to verify item details, loan amount, interest rate and maturity date before signing.
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:34px;">
            <div style="
              height:95px;
              border:1px dashed #cbd5e1;
              border-radius:18px;
              display:flex;
              align-items:flex-end;
              justify-content:center;
              padding-bottom:12px;
              color:#64748b;
              font-size:12px;
              font-weight:800;
            ">Customer Signature</div>

            <div style="
              height:95px;
              border:1px dashed #cbd5e1;
              border-radius:18px;
              display:flex;
              align-items:flex-end;
              justify-content:center;
              padding-bottom:12px;
              color:#64748b;
              font-size:12px;
              font-weight:800;
            ">Dealer Signature</div>
          </div>
        </div>

        <div style="
          text-align:center;
          padding:18px 40px 28px;
          font-size:11px;
          color:#64748b;
          border-top:1px solid #eef2f7;
        ">
          Generated by <strong style="color:#4820C5;">PawnSecure</strong> • Secure pledge management system
        </div>
      </div>
    `;
  }

  async function generateFrontendInvoicePdfFile(invoiceId: number) {
    const invoiceNumber =
      savedInvoiceNumber || savedGirviData?.invoiceNumber || `INV-${invoiceId}`;

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.background = "#ffffff";
    container.innerHTML = getInvoiceHtmlForPdf(invoiceId);

    document.body.appendChild(container);

    const invoiceElement = container.querySelector(
      "#frontend-invoice-pdf"
    ) as HTMLElement;

    if (!invoiceElement) {
      document.body.removeChild(container);
      throw new Error("Invoice template not found.");
    }

    await waitForImagesToLoad(invoiceElement);

    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    const blob = pdf.output("blob");

    document.body.removeChild(container);

    return new File([blob], `${invoiceNumber}.pdf`, {
      type: "application/pdf",
    });
  }

  async function downloadInvoice(invoiceId: number) {
    if (!savedGirviData) {
      alert("Invoice data not available. Please try again.");
      return;
    }

    setDownloadingInvoice(true);

    try {
      const file = await generateFrontendInvoicePdfFile(invoiceId);
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
      const file = await generateFrontendInvoicePdfFile(invoiceId);

      const message = `PawnSecure Invoice

Invoice No: ${
        savedInvoiceNumber || savedGirviData.invoiceNumber || `INV-${invoiceId}`
      }
Customer: ${savedGirviData.customerName || customerName || "-"}
Loan Amount: ${formatInvoiceCurrency(savedGirviData.loanAmount || totalValue)}

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

      alert(
        "PDF downloaded. Your browser does not support direct WhatsApp PDF sharing. Please attach the downloaded PDF manually in WhatsApp."
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
      const girviPayload = {
        customerId: Number(customerId),
        itemName: form.itemName.trim(),
        itemType: form.itemType.toUpperCase(),
        itemWeightGram: Number(form.itemWeightGram),
        ratePerGram: Number(form.ratePerGram),
        interestRate: Number(form.interestRate),
        girviDate: form.girviDate,
        maturityDate: form.maturityDate,
        remarks: form.remarks.trim(),
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

      const invoiceDataForFrontend = buildInvoiceDataFromBackend({
        invoiceDetails,
        savedGirvi,
        invoiceId,
        invoiceNumber,
      });

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
              <Input
                label="Item Name *"
                value={form.itemName}
                onChange={(v: any) => update("itemName", v)}
                error={errors.itemName}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                <div>
                  <label className="text-xs md:text-sm font-bold text-gray-600 block mb-1.5 md:mb-2">
                    Item Type *
                  </label>

                  <div className="relative">
                    <select
                      value={form.itemType}
                      onChange={(e) => update("itemType", e.target.value)}
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
                  label="Rate per Gram (₹) *"
                  type="number"
                  value={form.ratePerGram}
                  onChange={(v: any) => update("ratePerGram", v)}
                  error={errors.ratePerGram}
                />
              </div>

              <Input
                label="Weight (Gram) *"
                type="number"
                value={form.itemWeightGram}
                onChange={(v: any) => update("itemWeightGram", v)}
                error={errors.itemWeightGram}
              />

              <Input
                label="Description (Optional)"
                value={form.remarks}
                onChange={(v: any) => update("remarks", v)}
              />

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
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
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
                    <span className="text-xs md:text-sm font-semibold">
                      Add
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) =>
                        handlePhotoChange(e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>

                {errors.photo && (
                  <p className="text-red-500 text-xs md:text-sm mt-2">
                    {errors.photo}
                  </p>
                )}
              </div>
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
                    minimumFractionDigits: 0,
                  })}
                </div>
              </div>

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
              <ItemSummaryCard
                photo={photoPreview}
                name={form.itemName}
                type={form.itemType}
                weight={`${form.itemWeightGram} gram`}
              />

              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 md:p-8 text-sm md:text-base">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6">
                  <ReviewRow label="Customer" value={customerName} />
                  <ReviewRow
                    label="Interest Rate"
                    value={`${form.interestRate}%`}
                  />
                  <ReviewRow label="Girvi Date" value={form.girviDate} />
                  <ReviewRow label="Maturity Date" value={form.maturityDate} />
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <ReviewRow
                    label="Calculated Value"
                    value={`₹ ${totalValue.toLocaleString("en-IN")}`}
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
  weight,
}: {
  photo: string | null;
  name: string;
  type: string;
  weight: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 flex items-center gap-4 md:gap-6 shadow-sm">
      {photo ? (
        <img
          src={photo}
          alt={name || "Item"}
          className="w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl object-cover"
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

        <div className="flex items-center gap-2 mt-2 md:mt-3">
          <span
            className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold ${
              type === "Gold"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {type}
          </span>
        </div>

        <p className="font-semibold text-gray-700 text-sm md:text-base mt-2 md:mt-3">
          {weight}
        </p>
      </div>
    </div>
  );
}