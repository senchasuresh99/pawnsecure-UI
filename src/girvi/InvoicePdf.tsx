import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const LOGO_URL =
  "https://raw.githubusercontent.com/senchasuresh99/LearningScalare/main/logo1.png";

export type GirviInvoiceForm = {
  itemName: string;
  itemType: string;
  itemCount?: string;
  itemWeightGram: string;
  goldKarat?: string;
  lessWeightGram?: string;
  netWeightGram?: string;
  ratePerGram: string;
  actualLoanAmount?: string;
  interestRate: string;
  girviDate: string;
  maturityDate: string;
  remarks: string;
};

export type InvoicePdfInput = {
  invoiceId: number;
  savedInvoiceNumber: string;
  savedGirviData: any;
  invoiceLogoDataUrl: string;
  customerName: string;
  customer: any;
  resolvedCustomerId: any;
  form: GirviInvoiceForm;
};

type InvoiceItem = {
  id?: number | null;
  itemName?: string;
  itemType?: string;
  itemCount?: number | string;
  itemWeightGram?: number | string;
  weightGram?: number | string;
  goldKarat?: string;
  lessWeightGram?: number | string;
  netWeightGram?: number | string;
  ratePerGram?: number | string;
  itemValue?: number | string;
  status?: string;
};

export function formatInvoiceCurrency(value: any) {
  if (value === undefined || value === null || value === "") return "₹0";

  const amount = Number(value || 0);

  if (Number.isNaN(amount)) return "₹0";

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatPlainAmount(value: any) {
  const amount = Number(value || 0);

  if (Number.isNaN(amount)) return "0.00";

  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInvoiceDate(value?: string) {
  if (!value) return "-";

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return value;
  }
}

export function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function firstValue(...values: any[]) {
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

function toNumber(value: any) {
  const num = Number(value || 0);
  return Number.isNaN(num) ? 0 : num;
}

function formatWeight(value: any) {
  const num = toNumber(value);

  if (!num) return "0.000";

  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function calculateNetWeight(gross: any, less: any) {
  const grossWeight = toNumber(gross);
  const lessWeight = toNumber(less);
  const netWeight = grossWeight - lessWeight;

  return netWeight > 0 ? netWeight : 0;
}

function calculatePeriodText(start?: string, end?: string) {
  if (!start || !end) return "-";

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "-";
  }

  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  if (months >= 1) {
    if (months === 1) return "LAST TIME ONE MONTH ONLY";
    return `LAST TIME ${numberToWordsIndian(months)} MONTHS ONLY`;
  }

  const diffDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) return "-";
  if (diffDays === 1) return "LAST TIME ONE DAY ONLY";

  return `LAST TIME ${numberToWordsIndian(diffDays)} DAYS ONLY`;
}

function numberToWordsIndian(num: number): string {
  if (!num || Number.isNaN(num)) return "ZERO";

  const ones = [
    "",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
  ];

  const tens = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];

  function lessThanHundred(n: number) {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim();
  }

  function lessThanThousand(n: number) {
    if (n < 100) return lessThanHundred(n);

    return `${ones[Math.floor(n / 100)]} HUNDRED ${lessThanHundred(
      n % 100
    )}`.trim();
  }

  const rounded = Math.floor(num);

  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded / 100000) % 100);
  const thousand = Math.floor((rounded / 1000) % 100);
  const hundred = rounded % 1000;

  let words = "";

  if (crore) words += `${lessThanHundred(crore)} CRORE `;
  if (lakh) words += `${lessThanHundred(lakh)} LAKH `;
  if (thousand) words += `${lessThanHundred(thousand)} THOUSAND `;
  if (hundred) words += `${lessThanThousand(hundred)} `;

  return words.trim();
}

export async function imageUrlToDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      mode: "cors",
      cache: "force-cache",
    });

    if (!res.ok) return "";

    const blob = await res.blob();

    return await new Promise<string>((resolve) => {
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

function normalizeImageSrc(src?: string, contentType?: string) {
  if (!src) return "";

  if (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  ) {
    return src;
  }

  return `data:${contentType || "image/png"};base64,${src}`;
}

function normalizeInvoiceItems({
  data,
  savedGirvi,
  form,
}: {
  data: any;
  savedGirvi: any;
  form: GirviInvoiceForm;
}): InvoiceItem[] {
  const rawItems: InvoiceItem[] =
    Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : Array.isArray(savedGirvi?.items) && savedGirvi.items.length > 0
      ? savedGirvi.items
      : [];

  if (rawItems.length > 0) {
    return rawItems.map((item: InvoiceItem) => {
      const gross = firstValue(item.itemWeightGram, item.weightGram, 0);
      const less = firstValue(item.lessWeightGram, 0);
      const net = firstValue(
        item.netWeightGram,
        calculateNetWeight(gross, less)
      );
      const rate = firstValue(item.ratePerGram, 0);
      const value = firstValue(item.itemValue, toNumber(net) * toNumber(rate));

      return {
        id: item.id,
        itemName: firstValue(item.itemName, "-"),
        itemType: firstValue(item.itemType, "-"),
        itemCount: firstValue(item.itemCount, 1),
        itemWeightGram: gross,
        goldKarat: firstValue(item.goldKarat, ""),
        lessWeightGram: less,
        netWeightGram: net,
        ratePerGram: rate,
        itemValue: value,
        status: firstValue(item.status, "ACTIVE"),
      };
    });
  }

  const grossWeight = firstValue(
    data.itemWeightGram,
    savedGirvi?.itemWeightGram,
    form.itemWeightGram,
    0
  );

  const lessWeight = firstValue(
    data.lessWeightGram,
    savedGirvi?.lessWeightGram,
    form.lessWeightGram,
    0
  );

  const netWeight = firstValue(
    data.netWeightGram,
    savedGirvi?.netWeightGram,
    form.netWeightGram,
    calculateNetWeight(grossWeight, lessWeight)
  );

  const ratePerGram = firstValue(
    data.ratePerGram,
    savedGirvi?.ratePerGram,
    form.ratePerGram,
    0
  );

  return [
    {
      id: null,
      itemName: firstValue(data.itemName, savedGirvi?.itemName, form.itemName),
      itemType: firstValue(data.itemType, savedGirvi?.itemType, form.itemType),
      itemCount: firstValue(
        data.itemCount,
        savedGirvi?.itemCount,
        form.itemCount,
        1
      ),
      itemWeightGram: grossWeight,
      goldKarat: firstValue(
        data.goldKarat,
        savedGirvi?.goldKarat,
        form.goldKarat
      ),
      lessWeightGram: lessWeight,
      netWeightGram: netWeight,
      ratePerGram,
      itemValue: toNumber(netWeight) * toNumber(ratePerGram),
      status: firstValue(data.status, savedGirvi?.status, "ACTIVE"),
    },
  ];
}

function sumInvoiceItems(items: InvoiceItem[], key: keyof InvoiceItem) {
  return items.reduce(
    (sum: number, item: InvoiceItem) => sum + toNumber(item?.[key]),
    0
  );
}

export function buildInvoiceDataFromBackend({
  invoiceDetails,
  savedGirvi,
  invoiceId,
  invoiceNumber,
  form,
}: {
  invoiceDetails: any;
  savedGirvi: any;
  invoiceId: any;
  invoiceNumber: string;
  form: GirviInvoiceForm;
}) {
  const data = invoiceDetails?.data || invoiceDetails || {};

  const invoiceItems: InvoiceItem[] = normalizeInvoiceItems({
    data,
    savedGirvi,
    form,
  });

  const firstItem: InvoiceItem = invoiceItems[0] || {};

  const itemCount = firstValue(
    data.itemCount,
    savedGirvi?.itemCount,
    firstItem.itemCount,
    form.itemCount,
    1
  );

  const grossWeight = firstValue(
    data.itemWeightGram,
    savedGirvi?.itemWeightGram,
    firstItem.itemWeightGram,
    form.itemWeightGram
  );

  const lessWeight = firstValue(
    data.lessWeightGram,
    savedGirvi?.lessWeightGram,
    firstItem.lessWeightGram,
    form.lessWeightGram,
    0
  );

  const netWeight = firstValue(
    data.netWeightGram,
    savedGirvi?.netWeightGram,
    firstItem.netWeightGram,
    form.netWeightGram,
    calculateNetWeight(grossWeight, lessWeight)
  );

  const ratePerGram = firstValue(
    data.ratePerGram,
    savedGirvi?.ratePerGram,
    firstItem.ratePerGram,
    form.ratePerGram
  );

  const calculatedLoanAmount =
    invoiceItems.length > 0
      ? invoiceItems.reduce(
          (sum: number, item: InvoiceItem) =>
            sum +
            (item.itemValue !== undefined && item.itemValue !== null
              ? toNumber(item.itemValue)
              : toNumber(item.netWeightGram) * toNumber(item.ratePerGram)),
          0
        )
      : Number(netWeight || 0) * Number(ratePerGram || 0);

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

    customerPhoto: firstValue(
      data.customerPhoto,
      data.customerPhotoBase64,
      data.customer?.photo,
      data.customer?.photoBase64,
      savedGirvi?.customerPhoto,
      savedGirvi?.customerPhotoBase64,
      savedGirvi?.customer?.photo,
      savedGirvi?.customer?.photoBase64
    ),
    customerPhotoContentType: firstValue(
      data.customerPhotoContentType,
      data.customer?.photoContentType,
      savedGirvi?.customerPhotoContentType,
      savedGirvi?.customer?.photoContentType
    ),

    itemName: firstValue(
      data.itemName,
      savedGirvi?.itemName,
      firstItem.itemName,
      form.itemName
    ),
    itemType: firstValue(
      data.itemType,
      savedGirvi?.itemType,
      firstItem.itemType,
      form.itemType
    ),
    itemCount,
    itemWeightGram: grossWeight,

    goldKarat: firstValue(
      data.goldKarat,
      savedGirvi?.goldKarat,
      firstItem.goldKarat,
      form.goldKarat
    ),
    lessWeightGram: lessWeight,
    netWeightGram: netWeight,

    ratePerGram,

    items: invoiceItems,
    totalItemCount: firstValue(
      data.totalItemCount,
      savedGirvi?.totalItemCount,
      sumInvoiceItems(invoiceItems, "itemCount")
    ),
    totalGrossWeightGram: firstValue(
      data.totalGrossWeightGram,
      savedGirvi?.totalGrossWeightGram,
      sumInvoiceItems(invoiceItems, "itemWeightGram")
    ),
    totalLessWeightGram: firstValue(
      data.totalLessWeightGram,
      savedGirvi?.totalLessWeightGram,
      sumInvoiceItems(invoiceItems, "lessWeightGram")
    ),
    totalNetWeightGram: firstValue(
      data.totalNetWeightGram,
      savedGirvi?.totalNetWeightGram,
      sumInvoiceItems(invoiceItems, "netWeightGram")
    ),

    itemPhoto: firstValue(
      data.itemPhoto,
      data.itemPhotoBase64,
      savedGirvi?.itemPhoto,
      savedGirvi?.itemPhotoBase64
    ),
    itemPhotoContentType: firstValue(
      data.itemPhotoContentType,
      savedGirvi?.itemPhotoContentType
    ),

    loanAmount: firstValue(
      data.loanAmount,
      savedGirvi?.loanAmount,
      calculatedLoanAmount
    ),

    actualLoanAmount: firstValue(
      data.actualLoanAmount,
      savedGirvi?.actualLoanAmount,
      form.actualLoanAmount
    ),

    interestRate: firstValue(
      data.interestRate,
      savedGirvi?.interestRate,
      form.interestRate
    ),
    girviDate: firstValue(data.girviDate, savedGirvi?.girviDate, form.girviDate),
    maturityDate: firstValue(
      data.maturityDate,
      savedGirvi?.maturityDate,
      form.maturityDate
    ),
    remarks: firstValue(data.remarks, savedGirvi?.remarks, form.remarks, "-"),
    status: firstValue(data.status, savedGirvi?.status, "ACTIVE"),
  };
}

function td(value: any, style = "", options?: { colspan?: number }) {
  return `
    <td
      ${options?.colspan ? `colspan="${options.colspan}"` : ""}
      style="
        border:1px solid #cbd5e1;
        padding:7px 8px;
        font-size:12px;
        font-weight:700;
        vertical-align:top;
        color:#111827;
        ${style}
      "
    >
      ${escapeHtml(value)}
    </td>
  `;
}

function labelTd(value: any, width = "185px") {
  return `
    <td style="
      border:1px solid #cbd5e1;
      padding:7px 8px;
      font-size:12px;
      font-weight:900;
      width:${width};
      vertical-align:top;
      background:#f8fafc;
      color:#1e293b;
    ">
      ${escapeHtml(value)}
    </td>
  `;
}

function th(value: any, style = "") {
  return `
    <th style="
      border:1px solid #cbd5e1;
      padding:7px 5px;
      font-size:11px;
      font-weight:900;
      text-align:center;
      vertical-align:middle;
      background:#eef2ff;
      color:#312e81;
      ${style}
    ">
      ${escapeHtml(value)}
    </th>
  `;
}

function imageBox(title: string, src?: string) {
  if (src) {
    return `
      <div style="
        height:86px;
        border:1px solid #cbd5e1;
        background:#ffffff;
        overflow:hidden;
        border-radius:8px;
      ">
        <img
          src="${escapeHtml(src)}"
          alt="${escapeHtml(title)}"
          crossorigin="anonymous"
          style="
            width:100%;
            height:100%;
            object-fit:cover;
            display:block;
          "
        />
      </div>
    `;
  }

  return `
    <div style="
      height:86px;
      border:1px dashed #94a3b8;
      background:#f8fafc;
      border-radius:8px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:11px;
      font-weight:900;
      color:#64748b;
      text-align:center;
    ">
      ${escapeHtml(title)}
    </div>
  `;
}

function getInvoiceHtmlForPdf(input: InvoicePdfInput) {
  const {
    invoiceId,
    savedInvoiceNumber,
    savedGirviData,
    customerName,
    customer,
    form,
    invoiceLogoDataUrl,
  } = input;

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
    dealerName ||
    "PAWNSECURE DEALER";

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

  const invoiceItems: InvoiceItem[] =
    Array.isArray(savedGirviData.items) && savedGirviData.items.length > 0
      ? savedGirviData.items
      : normalizeInvoiceItems({
          data: savedGirviData,
          savedGirvi: savedGirviData,
          form,
        });

  const totalItemCount = firstValue(
    savedGirviData.totalItemCount,
    sumInvoiceItems(invoiceItems, "itemCount")
  );

  const totalGrossWeight = firstValue(
    savedGirviData.totalGrossWeightGram,
    sumInvoiceItems(invoiceItems, "itemWeightGram")
  );

  const totalLessWeight = firstValue(
    savedGirviData.totalLessWeightGram,
    sumInvoiceItems(invoiceItems, "lessWeightGram")
  );

  const totalNetWeight = firstValue(
    savedGirviData.totalNetWeightGram,
    sumInvoiceItems(invoiceItems, "netWeightGram")
  );

  const presentValue = invoiceItems.reduce(
    (sum: number, item: InvoiceItem) => {
      const rowNet = firstValue(
        item.netWeightGram,
        calculateNetWeight(item.itemWeightGram, item.lessWeightGram)
      );
      const rowRate = firstValue(item.ratePerGram, 0);

      return (
        sum +
        (item.itemValue !== undefined && item.itemValue !== null
          ? toNumber(item.itemValue)
          : toNumber(rowNet) * toNumber(rowRate))
      );
    },
    0
  );

  const loanAmount = firstValue(savedGirviData.loanAmount, presentValue);

  const actualLoanAmount = firstValue(
    savedGirviData.actualLoanAmount,
    form.actualLoanAmount
  );

  const girviDate = savedGirviData.girviDate || form.girviDate;
  const maturityDate = savedGirviData.maturityDate || form.maturityDate;
  const remarks = savedGirviData.remarks || form.remarks || "-";

  const customerPhoto = normalizeImageSrc(
    firstValue(
      savedGirviData.customerPhoto,
      savedGirviData.customerPhotoBase64,
      savedGirviData.customer?.photo,
      savedGirviData.customer?.photoBase64
    ),
    firstValue(
      savedGirviData.customerPhotoContentType,
      savedGirviData.customer?.photoContentType
    )
  );

  const itemPhoto = normalizeImageSrc(
    firstValue(savedGirviData.itemPhoto, savedGirviData.itemPhotoBase64),
    savedGirviData.itemPhotoContentType
  );

  const debtAmount = toNumber(actualLoanAmount);
  const amountInWords = `${numberToWordsIndian(debtAmount)} ONLY`;
  const periodText = calculatePeriodText(girviDate, maturityDate);

  const logoHtml = invoiceLogoDataUrl
    ? `<img
        src="${escapeHtml(invoiceLogoDataUrl)}"
        alt="PawnSecure"
        crossorigin="anonymous"
        style="
          width:44px;
          height:44px;
          object-fit:contain;
          display:block;
        "
      />`
    : `<span style="font-size:13px;font-weight:900;color:#312e81;">PS</span>`;

  const itemRowsHtml = invoiceItems
    .map((item: InvoiceItem) => {
      const rowGross = firstValue(item.itemWeightGram, item.weightGram, 0);
      const rowLess = firstValue(item.lessWeightGram, 0);
      const rowNet = firstValue(
        item.netWeightGram,
        calculateNetWeight(rowGross, rowLess)
      );
      const rowRate = firstValue(item.ratePerGram, 0);
      const rowValue = firstValue(
        item.itemValue,
        toNumber(rowNet) * toNumber(rowRate)
      );

      const rowItemType = firstValue(item.itemType, "-");
      const rowGoldKarat = firstValue(item.goldKarat, "");
      const rowCommodityName = `${firstValue(
        item.itemName,
        "-"
      )} ${rowItemType}${
        String(rowItemType).toLowerCase() === "gold" && rowGoldKarat
          ? ` (${rowGoldKarat})`
          : ""
      }`;

      return `
        <tr>
          ${td(rowCommodityName, "text-align:center;")}
          ${td(
            formatPlainAmount(firstValue(item.itemCount, 1)),
            "text-align:center;"
          )}
          ${td(formatWeight(rowGross), "text-align:center;")}
          ${td(formatWeight(rowLess), "text-align:center;")}
          ${td(formatWeight(rowNet), "text-align:center;")}
          ${td(formatPlainAmount(rowValue), "text-align:center;")}
        </tr>
      `;
    })
    .join("");

  return `
    <div
      id="frontend-invoice-pdf"
      style="
        width:794px;
        min-height:1123px;
        background:#ffffff;
        color:#111827;
        font-family:Arial, Helvetica, sans-serif;
        box-sizing:border-box;
        padding:18px 28px;
        overflow:hidden;
        position:relative;
      "
    >
      <div style="
        background:#ffffff;
        border:1.5px solid #334155;
        border-radius:14px;
        overflow:hidden;
        box-shadow:0 8px 22px rgba(15,23,42,0.10);
      ">
        <div style="
          position:relative;
          display:grid;
          grid-template-columns:1fr 178px;
          background:linear-gradient(135deg, #312e81, #6d28d9);
          color:#ffffff;
          border-bottom:1px solid #cbd5e1;
        ">
          <div style="
            position:relative;
            text-align:center;
            padding:12px 14px 10px 78px;
            min-height:176px;
            box-sizing:border-box;
          ">
            <div style="
              position:absolute;
              top:12px;
              left:14px;
              width:54px;
              height:54px;
              background:#ffffff;
              border:1px solid rgba(255,255,255,0.75);
              border-radius:12px;
              display:flex;
              align-items:center;
              justify-content:center;
              overflow:hidden;
              box-shadow:0 4px 12px rgba(15,23,42,0.18);
            ">
              ${logoHtml}
            </div>

            <div style="
              font-size:12px;
              font-weight:800;
              color:#ffffff;
              opacity:0.92;
              margin-bottom:4px;
            ">
              Shree Ganeshay Namaha
            </div>

            <div style="
              font-size:18px;
              font-weight:900;
              color:#ffffff;
              letter-spacing:0.6px;
              text-transform:uppercase;
            ">
              Money Lenders Pledge Receipt
            </div>

            <div style="
              height:4px;
              width:185px;
              margin:7px auto 8px;
              border-radius:999px;
              background:linear-gradient(90deg, #f59e0b, #facc15, #f59e0b);
            "></div>

            <div style="
              font-size:10px;
              line-height:1.45;
              color:#ffffff;
              opacity:0.88;
              font-weight:700;
            ">
              Inventory of articles taken in pawn as provided in subsection action<br/>
              and referred to in rule 25
            </div>

            <div style="
              font-size:22px;
              font-weight:900;
              margin-top:8px;
              text-transform:uppercase;
              letter-spacing:0.8px;
              color:#ffffff;
            ">
              ${escapeHtml(shopName)}
            </div>

            <div style="
              font-size:12px;
              font-weight:700;
              line-height:1.55;
              margin-top:4px;
              color:#ffffff;
              opacity:0.94;
            ">
              ${escapeHtml(shopAddress)}<br/>
              GST: ${escapeHtml(gstNumber)} &nbsp; | &nbsp; Cell: ${escapeHtml(
    dealerPhone
  )}
            </div>
          </div>

          <div style="
            border-left:1px solid rgba(255,255,255,0.25);
            padding:8px;
            display:grid;
            gap:8px;
            background:rgba(255,255,255,0.12);
          ">
            ${imageBox("CUSTOMER PHOTO", customerPhoto)}
            ${imageBox("ITEM PHOTO", itemPhoto)}
          </div>
        </div>

        <div style="
          height:5px;
          background:linear-gradient(90deg, #f59e0b, #facc15, #f59e0b);
        "></div>

        <div style="
          display:grid;
          grid-template-columns:1fr 245px;
          border-bottom:1px solid #cbd5e1;
          background:#f8fafc;
          font-size:13px;
          font-weight:900;
        ">
          <div style="padding:10px 12px;">
            Money Lending Licence No.
          </div>

          <div style="
            padding:10px 12px;
            border-left:1px solid #cbd5e1;
            color:#312e81;
          ">
            Bill No. ${escapeHtml(invoiceNumber)}
          </div>
        </div>

        <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
          <tbody>
            <tr>
              ${labelTd("1. Date of taking in Pawn")}
              ${td(formatInvoiceDate(girviDate))}
              ${labelTd("Cell No", "120px")}
              ${td(customerPhone)}
            </tr>

            <tr>
              ${labelTd("2. Name of Pawner with")}
              ${td(customerDisplayName, "text-transform:uppercase;", {
                colspan: 3,
              })}
            </tr>

            <tr>
              ${labelTd("3. Nationality or Religion")}
              ${td("-")}
              ${labelTd("Due Date", "120px")}
              ${td(formatInvoiceDate(maturityDate))}
            </tr>

            <tr>
              ${labelTd("4. Address of Pawner")}
              ${td(
                customerAddress,
                "height:66px; line-height:1.65; text-transform:uppercase;",
                { colspan: 3 }
              )}
            </tr>
          </tbody>
        </table>

        <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
          <thead>
            <tr>
              ${th("Name of Commodity")}
              ${th("No.Pc")}
              ${th("Gross Weight with stone")}
              ${th("Less Weight")}
              ${th("Net Weight")}
              ${th("Present Value Rs.")}
            </tr>
          </thead>

          <tbody>
            ${itemRowsHtml}
            <tr>
              ${td(
                "TOTAL",
                "text-align:center;background:#f8fafc;font-weight:900;"
              )}
              ${td(
                formatPlainAmount(totalItemCount),
                "text-align:center;background:#f8fafc;font-weight:900;"
              )}
              ${td(
                formatWeight(totalGrossWeight),
                "text-align:center;background:#f8fafc;font-weight:900;"
              )}
              ${td(
                formatWeight(totalLessWeight),
                "text-align:center;background:#f8fafc;font-weight:900;"
              )}
              ${td(
                formatWeight(totalNetWeight),
                "text-align:center;background:#f8fafc;font-weight:900;"
              )}
              ${td(
                formatPlainAmount(loanAmount),
                "text-align:center;background:#f8fafc;font-weight:900;"
              )}
            </tr>
          </tbody>
        </table>

        <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
          <tbody>
            <tr>
              <td style="
                border:1px solid #cbd5e1;
                padding:9px;
                font-size:14px;
                font-weight:900;
                width:180px;
                background:#f8fafc;
              ">
                5. AMOUNT OF DEBIT
              </td>

              <td style="
                border:1px solid #cbd5e1;
                padding:9px;
                font-size:14px;
                font-weight:900;
                width:130px;
                color:#15803d;
              ">
                ${escapeHtml(formatPlainAmount(debtAmount))}
              </td>

              <td style="
                border:1px solid #cbd5e1;
                padding:9px;
                font-size:12px;
                font-weight:900;
              ">
                In Words : &nbsp; Rupees : ${escapeHtml(amountInWords)}
              </td>
            </tr>

            <tr>
              <td style="
                border:1px solid #cbd5e1;
                padding:9px;
                font-size:13px;
                font-weight:900;
                line-height:1.3;
                background:#f8fafc;
              ">
                6. Period fixed for redemption<br/>of the pledge
              </td>

              <td colspan="2" style="
                border:1px solid #cbd5e1;
                padding:12px 9px;
                font-size:23px;
                font-weight:900;
                text-align:center;
                color:#312e81;
                letter-spacing:0.8px;
                background:#eef2ff;
              ">
                ${escapeHtml(periodText)}
              </td>
            </tr>

            <tr>
              <td style="
                border:1px solid #cbd5e1;
                padding:9px;
                font-size:13px;
                font-weight:900;
                background:#f8fafc;
              ">
                7. Remarks :
              </td>

              <td colspan="2" style="
                border:1px solid #cbd5e1;
                padding:9px;
                font-size:12px;
                font-weight:700;
                height:30px;
              ">
                ${escapeHtml(remarks)}
              </td>
            </tr>
          </tbody>
        </table>

        <div style="
          padding:10px 12px;
          border-bottom:1px solid #cbd5e1;
          background:#fff7ed;
          color:#9a3412;
          font-size:12px;
          line-height:1.65;
          font-weight:900;
        ">
          N. B. INTEREST SHOULD BE PAID After every (3) THREE MONTHS WITHOUT FAIL<br/>
          NOTE : Gold & silver Articles Time&nbsp;&nbsp; ${escapeHtml(periodText)}
        </div>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          height:84px;
          background:#ffffff;
        ">
          <div style="
            border-right:1px solid #cbd5e1;
            display:flex;
            align-items:flex-end;
            justify-content:center;
            padding-bottom:13px;
            font-size:13px;
            font-weight:900;
          ">
            Signature or L.H.T.I. of Pawner
          </div>

          <div style="
            display:flex;
            align-items:flex-end;
            justify-content:center;
            padding-bottom:13px;
            font-size:13px;
            font-weight:900;
          ">
            Signature of Pawnee / Broker / Agent
          </div>
        </div>
      </div>

      <div style="
        margin-top:22px;
        border:1.5px solid #334155;
        border-radius:12px;
        overflow:hidden;
        background:#ffffff;
        display:grid;
        grid-template-columns:1.35fr 1fr;
        min-height:120px;
        box-shadow:0 6px 16px rgba(15,23,42,0.08);
      ">
        <div style="
          padding:11px 13px;
          border-right:1px solid #cbd5e1;
          font-size:12px;
          font-weight:800;
          line-height:1.65;
          background:#f8fafc;
        ">
          <div style="display:grid; grid-template-columns:90px 1fr 80px 1fr;">
            <span>Date</span>
            <span>${escapeHtml(formatInvoiceDate(girviDate))}</span>

            <span>Due Date</span>
            <span>${escapeHtml(formatInvoiceDate(maturityDate))}</span>

            <span>B.No</span>
            <span>${escapeHtml(invoiceNumber)}</span>

            <span>Cell</span>
            <span>${escapeHtml(customerPhone)}</span>

            <span>Name</span>
            <span style="grid-column:span 3;">${escapeHtml(
              customerDisplayName
            )}</span>

            <span>Loan Amount</span>
            <span>${escapeHtml(formatPlainAmount(debtAmount))}</span>

            <span>No.Pc</span>
            <span>${escapeHtml(formatPlainAmount(totalItemCount))}</span>

            <span>Gross Wt</span>
            <span>${escapeHtml(formatWeight(totalGrossWeight))}</span>

            <span>Net Wt</span>
            <span>${escapeHtml(formatWeight(totalNetWeight))}</span>
          </div>
        </div>

        <div style="
          display:flex;
          align-items:flex-end;
          justify-content:center;
          padding-bottom:14px;
          font-size:13px;
          font-weight:900;
        ">
          Signature or L.H.T.I. of Pawner
        </div>
      </div>

      <div style="
        text-align:center;
        margin-top:18px;
        font-size:10px;
        color:#64748b;
        font-weight:800;
      ">
        Generated by PawnSecure • Secure digital pledge management receipt
      </div>
    </div>
  `;
}

function getDeclarationHtmlForPdf(input: InvoicePdfInput) {
  const {
    savedGirviData,
    customerName,
    customer,
    form,
  } = input;

  if (!savedGirviData) return "";

  const customerDisplayName =
    savedGirviData.customerName || customerName || "_________________________";

  const customerAddress =
    savedGirviData.customerAddress ||
    customer?.customerAddress ||
    customer?.address ||
    "_________________________";

  const customerPhone =
    savedGirviData.customerPhone ||
    savedGirviData.phoneNumber ||
    savedGirviData.customerPhoneNumber ||
    customer?.phoneNumber ||
    customer?.phone ||
    "_________________________";

  const aadhaarPan =
    savedGirviData.customerAadhaar ||
    customer?.aadhaarNumber ||
    savedGirviData.customerPan ||
    customer?.panNumber ||
    "_________________________";

  const girviDate = savedGirviData.girviDate || form.girviDate;

  const invoiceItems: InvoiceItem[] =
    Array.isArray(savedGirviData.items) && savedGirviData.items.length > 0
      ? savedGirviData.items
      : normalizeInvoiceItems({
          data: savedGirviData,
          savedGirvi: savedGirviData,
          form,
        });

  const totalItemCount = firstValue(
    savedGirviData.totalItemCount,
    sumInvoiceItems(invoiceItems, "itemCount")
  );

  const totalGrossWeight = firstValue(
    savedGirviData.totalGrossWeightGram,
    sumInvoiceItems(invoiceItems, "itemWeightGram")
  );

  const itemDescriptions = invoiceItems
    .map((item) => firstValue(item.itemName, "-"))
    .join(", ");

  return `
    <div
      id="frontend-declaration-pdf"
      style="
        width:794px;
        min-height:1123px;
        background:#ffffff;
        color:#111827;
        font-family:Arial, Helvetica, sans-serif;
        box-sizing:border-box;
        padding:18px 28px;
        overflow:hidden;
        position:relative;
      "
    >
      <div style="
        background:#ffffff;
        border:1.5px solid #334155;
        border-radius:14px;
        padding: 40px;
        box-sizing: border-box;
        height: 1087px;
        display: flex;
        flex-direction: column;
        box-shadow:0 8px 22px rgba(15,23,42,0.10);
      ">
        <div style="text-align:center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
          <h2 style="margin:0; font-size: 22px; font-weight: 900; text-transform: uppercase; color: #1e293b; letter-spacing: 0.5px;">Customer Declaration Form</h2>
          <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: 700; color: #475569;">(For Gold Loan / Pawn Broker Transactions)</p>
        </div>

        <div style="text-align: right; margin-bottom: 24px; font-size: 14px; font-weight: 700; color: #1e293b;">
          Date: ${escapeHtml(formatInvoiceDate(girviDate))}
        </div>

        <div style="font-size: 14px; line-height: 1.8; margin-bottom: 30px; text-align: justify; color: #1e293b;">
          I, Mr./Ms. <strong style="text-decoration: underline;">${escapeHtml(customerDisplayName)}</strong> S/o, D/o, W/o ______________________________________<br/>
          residing at <strong style="text-decoration: underline;">${escapeHtml(customerAddress)}</strong> hereby solemnly declare as follows:
        </div>

        <table style="width: 100%; font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 40px; border-collapse: collapse;">
          <tbody>
            <tr><td style="width: 28px; vertical-align: top; font-weight: bold;">1.</td><td style="vertical-align: top; padding-bottom: 12px; text-align: justify;">I am the lawful owner or authorized possessor of the gold articles presented by me.</td></tr>
            <tr><td style="width: 28px; vertical-align: top; font-weight: bold;">2.</td><td style="vertical-align: top; padding-bottom: 12px; text-align: justify;">The articles are not stolen, robbed, illegally obtained, or involved in any criminal case to the best of my knowledge.</td></tr>
            <tr><td style="width: 28px; vertical-align: top; font-weight: bold;">3.</td><td style="vertical-align: top; padding-bottom: 12px; text-align: justify;">I have full legal right and authority to pledge these articles.</td></tr>
            <tr><td style="width: 28px; vertical-align: top; font-weight: bold;">4.</td><td style="vertical-align: top; padding-bottom: 12px; text-align: justify;">I am voluntarily entering into this transaction without force, coercion, fraud, or undue influence.</td></tr>
            <tr><td style="width: 28px; vertical-align: top; font-weight: bold;">5.</td><td style="vertical-align: top; padding-bottom: 12px; text-align: justify;">I have submitted valid identity and address proof and authorize the Pawn Broker to retain copies for record purposes.</td></tr>
            <tr><td style="width: 28px; vertical-align: top; font-weight: bold;">6.</td><td style="vertical-align: top; padding-bottom: 12px; text-align: justify;">I understand that if any information provided by me is false, I shall be personally liable for all legal consequences.</td></tr>
            <tr><td style="width: 28px; vertical-align: top; font-weight: bold;">7.</td><td style="vertical-align: top; padding-bottom: 12px; text-align: justify;">I authorize the Pawn Broker to provide my details, identification records, transaction records, photographs, and CCTV footage to lawful authorities whenever legally required.</td></tr>
            <tr><td style="width: 28px; vertical-align: top; font-weight: bold;">8.</td><td style="vertical-align: top; padding-bottom: 12px; text-align: justify;">I consent to the maintenance of records including photographs, signatures, thumb impressions, identification documents, and CCTV footage for compliance purposes.</td></tr>
            <tr><td style="width: 28px; vertical-align: top; font-weight: bold;">9.</td><td style="vertical-align: top; padding-bottom: 12px; text-align: justify;">In the event of any ownership dispute, police investigation, claim, or legal proceeding relating to the pledged articles, I shall indemnify and hold harmless the Pawn Broker from losses, claims, damages, costs, and legal expenses.</td></tr>
            <tr><td style="width: 28px; vertical-align: top; font-weight: bold;">10.</td><td style="vertical-align: top; padding-bottom: 12px; text-align: justify;">Any dispute arising from this transaction shall be subject to the jurisdiction of the competent courts having jurisdiction over the Pawn Broker's business premises.</td></tr>
          </tbody>
        </table>

        <div style="display: flex; gap: 30px; margin-bottom: 50px;">
          <!-- Gold Article Details -->
          <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; overflow: hidden;">
            <div style="background: #eef2ff; color: #312e81; font-weight: 900; padding: 10px 14px; border-bottom: 1px solid #cbd5e1; font-size: 14px;">
              Gold Article Details
            </div>
            <div style="padding: 14px;">
              <table style="width: 100%; font-size: 13px; line-height: 2;">
                <tr><td style="font-weight: 700; width: 140px; color: #475569;">Description:</td><td style="font-weight: 800;">${escapeHtml(itemDescriptions)}</td></tr>
                <tr><td style="font-weight: 700; color: #475569;">Weight:</td><td style="font-weight: 800;">${escapeHtml(formatWeight(totalGrossWeight))} g</td></tr>
                <tr><td style="font-weight: 700; color: #475569;">Quantity:</td><td style="font-weight: 800;">${escapeHtml(formatPlainAmount(totalItemCount))}</td></tr>
                <tr><td style="font-weight: 700; color: #475569;">Identification Marks:</td><td style="font-weight: 800; border-bottom: 1px dashed #94a3b8; padding-top: 6px;"></td></tr>
              </table>
            </div>
          </div>

          <!-- Customer Details -->
          <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; overflow: hidden;">
            <div style="background: #eef2ff; color: #312e81; font-weight: 900; padding: 10px 14px; border-bottom: 1px solid #cbd5e1; font-size: 14px;">
              Customer Details
            </div>
            <div style="padding: 14px;">
              <table style="width: 100%; font-size: 13px; line-height: 2;">
                <tr><td style="font-weight: 700; width: 140px; color: #475569;">Name:</td><td style="font-weight: 800;">${escapeHtml(customerDisplayName)}</td></tr>
                <tr><td style="font-weight: 700; color: #475569;">Mobile No.:</td><td style="font-weight: 800;">${escapeHtml(customerPhone)}</td></tr>
                <tr><td style="font-weight: 700; color: #475569;">Aadhaar / PAN No.:</td><td style="font-weight: 800;">${escapeHtml(aadhaarPan)}</td></tr>
                <tr><td style="font-weight: 700; vertical-align: top; color: #475569;">Address:</td><td style="font-weight: 800; line-height: 1.4; padding-top: 5px;">${escapeHtml(customerAddress)}</td></tr>
              </table>
            </div>
          </div>
        </div>

        <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 40px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 800;">
                Generated by PawnSecure • Customer Declaration Record
            </div>
            <div style="text-align: center; width: 220px;">
              <div style="border-bottom: 1.5px solid #1e293b; height: 40px; margin-bottom: 8px;"></div>
              <div style="font-size: 14px; font-weight: 900; color: #1e293b;">Customer Signature</div>
            </div>
        </div>
      </div>
    </div>
  `;
}

export async function generateFrontendInvoicePdfFile(input: InvoicePdfInput) {
  const invoiceNumber =
    input.savedInvoiceNumber ||
    input.savedGirviData?.invoiceNumber ||
    `INV-${input.invoiceId}`;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.background = "#ffffff";
  
  // Inject both templates into the DOM container
  container.innerHTML = `
    ${getInvoiceHtmlForPdf(input)}
    ${getDeclarationHtmlForPdf(input)}
  `;

  document.body.appendChild(container);

  try {
    const invoiceElement = container.querySelector(
      "#frontend-invoice-pdf"
    ) as HTMLElement;
    const declarationElement = container.querySelector(
      "#frontend-declaration-pdf"
    ) as HTMLElement;

    if (!invoiceElement || !declarationElement) {
      throw new Error("PDF templates not found.");
    }

    await waitForImagesToLoad(container);

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Capture Invoice Page
    const invoiceCanvas = await html2canvas(invoiceElement, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
    });

    const invoiceImgData = invoiceCanvas.toDataURL("image/png");
    pdf.addImage(invoiceImgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Capture Declaration Page
    const declarationCanvas = await html2canvas(declarationElement, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
    });

    const declarationImgData = declarationCanvas.toDataURL("image/png");
    pdf.addPage();
    pdf.addImage(declarationImgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    const blob = pdf.output("blob");

    return new File([blob], `${invoiceNumber}.pdf`, {
      type: "application/pdf",
    });
  } finally {
    document.body.removeChild(container);
  }
}
