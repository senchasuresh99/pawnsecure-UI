import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const LOGO_URL =
  "https://raw.githubusercontent.com/senchasuresh99/LearningScalare/main/logo1.png";

export type GirviInvoiceForm = {
  itemName: string;
  itemType: string;
  itemWeightGram: string;
  ratePerGram: string;
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

    customerPhoto: firstValue(data.customerPhoto, savedGirvi?.customerPhoto),
    customerPhotoContentType: firstValue(
      data.customerPhotoContentType,
      savedGirvi?.customerPhotoContentType
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

    itemPhoto: firstValue(data.itemPhoto, savedGirvi?.itemPhoto),
    itemPhotoContentType: firstValue(
      data.itemPhotoContentType,
      savedGirvi?.itemPhotoContentType
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

function td(
  value: any,
  style = "",
  options?: {
    colspan?: number;
  }
) {
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
    resolvedCustomerId,
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

  const itemName = savedGirviData.itemName || form.itemName || "-";
  const itemType = savedGirviData.itemType || form.itemType || "-";
  const weight = savedGirviData.itemWeightGram || form.itemWeightGram || 0;
  const ratePerGram = savedGirviData.ratePerGram || form.ratePerGram || 0;

  const loanAmount =
    savedGirviData.loanAmount ||
    Number(form.itemWeightGram || 0) * Number(form.ratePerGram || 0);

  const girviDate = savedGirviData.girviDate || form.girviDate;
  const maturityDate = savedGirviData.maturityDate || form.maturityDate;
  const remarks = savedGirviData.remarks || form.remarks || "-";

  const customerId = savedGirviData.customerId || resolvedCustomerId || "-";

  const customerPhoto = savedGirviData.customerPhoto || "";
  const itemPhoto = savedGirviData.itemPhoto || "";

  const grossWeight = toNumber(weight);
  const lessWeight = 0;
  const netWeight = grossWeight - lessWeight;
  const presentValue = grossWeight * toNumber(ratePerGram);
  const debtAmount = toNumber(loanAmount);

  const amountInWords = `${numberToWordsIndian(debtAmount)} ONLY`;
  const periodText = calculatePeriodText(girviDate, maturityDate);

  const logoHtml = invoiceLogoDataUrl
    ? `<img
        src="${escapeHtml(invoiceLogoDataUrl)}"
        alt="PawnSecure"
        style="
          width:44px;
          height:44px;
          object-fit:contain;
          display:block;
        "
      />`
    : `<span style="font-size:13px;font-weight:900;color:#312e81;">PS</span>`;

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
            <tr>
              ${td(`${itemName} ${itemType}`, "text-align:center;")}
              ${td("1.00", "text-align:center;")}
              ${td(formatWeight(grossWeight), "text-align:center;")}
              ${td(formatWeight(lessWeight), "text-align:center;")}
              ${td(formatWeight(netWeight), "text-align:center;")}
              ${td(formatPlainAmount(presentValue), "text-align:center;")}
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

            <span>Weight</span>
            <span>${escapeHtml(formatWeight(grossWeight))} / ${escapeHtml(
    formatWeight(netWeight)
  )}</span>
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
  container.innerHTML = getInvoiceHtmlForPdf(input);

  document.body.appendChild(container);

  try {
    const invoiceElement = container.querySelector(
      "#frontend-invoice-pdf"
    ) as HTMLElement;

    if (!invoiceElement) {
      throw new Error("Invoice template not found.");
    }

    await waitForImagesToLoad(invoiceElement);

    const canvas = await html2canvas(invoiceElement, {
      scale: 3,
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

    return new File([blob], `${invoiceNumber}.pdf`, {
      type: "application/pdf",
    });
  } finally {
    document.body.removeChild(container);
  }
}