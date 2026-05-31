import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useGirvi } from "../girvi/GirviContext";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

import {
  FaHome,
  FaUserFriends,
  FaRupeeSign,
  FaCoins,
  FaChartBar,
  FaEllipsisH,
  FaArrowLeft,
  FaSearch,
  FaQrcode,
  FaUpload,
  FaSignOutAlt,
  FaPhoneAlt,
} from "react-icons/fa";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

type ParsedAadhaarQR = {
  fullName?: string;
  name?: string;
  aadhaar?: string;
  maskedAadhaar?: string;
  uid?: string;
  gender?: string;
  dob?: string;
  address?: string;
  co?: string;
  house?: string;
  street?: string;
  lm?: string;
  loc?: string;
  vtc?: string;
  po?: string;
  subdist?: string;
  dist?: string;
  state?: string;
  pc?: string;
};

type QrStep = "idle" | "uploading" | "verifying" | "success" | "error";

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { setCustomer, loanDetails, setLoanDetails } = useGirvi();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const autoNavigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const dealerName = localStorage.getItem("ps_dealer_name") || "Dealer";

  const [aadhaar, setAadhaar] = useState("");
  const [qrPhoneNumber, setQrPhoneNumber] = useState("");

  const [customerPhoto, setCustomerPhoto] = useState<File | null>(null);
  const [customerPhotoPreview, setCustomerPhotoPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<any>(null);

  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [uploadingQR, setUploadingQR] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [qrStep, setQrStep] = useState<QrStep>("idle");

  const [goToGirviAfterSuccess, setGoToGirviAfterSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ps_token");

    if (!token) {
      navigate("/", { replace: true });
      return;
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (customerPhotoPreview) {
        URL.revokeObjectURL(customerPhotoPreview);
      }
    };
  }, [customerPhotoPreview]);

  useEffect(() => {
    return () => {
      if (autoNavigateTimerRef.current) {
        clearTimeout(autoNavigateTimerRef.current);
      }
    };
  }, []);

  function getToken() {
    return localStorage.getItem("ps_token");
  }

  function handleUnauthorized() {
    showPopup("error", "Session expired or unauthorized. Please login again.");

    localStorage.removeItem("ps_token");
    localStorage.removeItem("ps_role");
    localStorage.removeItem("ps_dealer_id");
    localStorage.removeItem("ps_dealer_name");

    setTimeout(() => {
      navigate("/", { replace: true });
    }, 1200);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function handleLogout() {
    localStorage.removeItem("ps_token");
    localStorage.removeItem("ps_role");
    localStorage.removeItem("ps_dealer_id");
    localStorage.removeItem("ps_dealer_name");

    navigate("/", { replace: true });
  }

  function showPopup(type: "success" | "error", message: string) {
    setPopup({ type, message });
  }

  function closePopup() {
    const shouldGoToGirvi =
      popup?.type === "success" && goToGirviAfterSuccess;

    setPopup(null);

    if (shouldGoToGirvi) {
      setGoToGirviAfterSuccess(false);

      if (autoNavigateTimerRef.current) {
        clearTimeout(autoNavigateTimerRef.current);
        autoNavigateTimerRef.current = null;
      }

      navigate("/dealer/details");
    }
  }

  function extractAadhaarFromQR(text: string) {
    const digits = text.replace(/\D/g, "");
    const match = digits.match(/\d{12}/);
    return match ? match[0] : "";
  }

  function normalizeGenderFromQR(gender?: string) {
    if (!gender) return "";

    const g = gender.trim().toUpperCase();

    if (g === "M" || g === "MALE") return "M";
    if (g === "F" || g === "FEMALE") return "F";
    if (g === "O" || g === "OTHER") return "O";

    return gender;
  }

  function buildAddressFromQR(data: ParsedAadhaarQR) {
    return [
      data.co,
      data.house,
      data.street,
      data.lm,
      data.loc,
      data.vtc,
      data.po,
      data.subdist,
      data.dist,
      data.state,
      data.pc,
    ]
      .filter(Boolean)
      .join(", ");
  }

  function parseAadhaarQRText(decodedText: string): ParsedAadhaarQR | null {
    if (!decodedText) return null;

    try {
      const text = decodedText.trim();

      // ✅ Old Aadhaar QR XML format
      if (text.includes("PrintLetterBarcodeData") || text.startsWith("<")) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
        if (parserError) return null;

        const node =
          xmlDoc.getElementsByTagName("PrintLetterBarcodeData")[0] ||
          xmlDoc.documentElement;

        if (!node) return null;

        const getAttr = (key: string) => node.getAttribute(key) || "";

        const uid = getAttr("uid");
        const name = getAttr("name");
        const gender = getAttr("gender");
        const dob = getAttr("dob") || getAttr("yob");

        const addressData: ParsedAadhaarQR = {
          co: getAttr("co"),
          house: getAttr("house"),
          street: getAttr("street"),
          lm: getAttr("lm"),
          loc: getAttr("loc"),
          vtc: getAttr("vtc"),
          po: getAttr("po"),
          subdist: getAttr("subdist"),
          dist: getAttr("dist"),
          state: getAttr("state"),
          pc: getAttr("pc"),
        };

        return {
          fullName: name,
          name,
          aadhaar: uid,
          uid,
          maskedAadhaar:
            uid && uid.length === 12 ? `XXXX-XXXX-${uid.slice(8)}` : "",
          gender: normalizeGenderFromQR(gender),
          dob,
          address: buildAddressFromQR(addressData),
          ...addressData,
        };
      }

      // ✅ JSON QR support
      if (text.startsWith("{")) {
        const data = JSON.parse(text);
        const uid = data.aadhaar || data.uid || "";

        return {
          fullName: data.fullName || data.name || data.customerName || "",
          name: data.fullName || data.name || data.customerName || "",
          aadhaar: uid,
          uid,
          maskedAadhaar:
            data.maskedAadhaar ||
            (uid && uid.length === 12 ? `XXXX-XXXX-${uid.slice(8)}` : ""),
          gender: normalizeGenderFromQR(data.gender || data.sex || ""),
          dob: data.dob || data.dateOfBirth || data.birthDate || "",
          address: data.address || data.fullAddress || "",
        };
      }

      // ✅ Fallback Aadhaar number only
      const extractedAadhaar = extractAadhaarFromQR(text);

      if (extractedAadhaar) {
        return {
          aadhaar: extractedAadhaar,
          uid: extractedAadhaar,
          maskedAadhaar: `XXXX-XXXX-${extractedAadhaar.slice(8)}`,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  function maskAadhaar(a: string) {
    if (!a || a.length !== 12) return a;
    return `XXXX-XXXX-${a.slice(8)}`;
  }

  function validateQrScanBeforeOpen() {
    if (!qrPhoneNumber || !/^[6-9]\d{9}$/.test(qrPhoneNumber)) {
      showPopup(
        "error",
        "Please enter a valid 10-digit phone number before scanning Aadhaar QR"
      );
      return false;
    }

    if (!customerPhoto) {
      showPopup(
        "error",
        "Please upload customer photo before scanning Aadhaar QR"
      );
      return false;
    }

    return true;
  }

  function goToAddCustomer(prefill: any = {}) {
    navigate("/dealer/add-customer", {
      state: {
        fullName: prefill.fullName || prefill.name || prefill.customerName || "",
        name: prefill.fullName || prefill.name || prefill.customerName || "",

        maskedAadhaar: prefill.maskedAadhaar || prefill.masked_aadhaar || "",

        aadhaar:
          prefill.aadhaarNumber ||
          prefill.aadhaar ||
          prefill.uid ||
          aadhaar ||
          "",

        gender: prefill.gender || prefill.sex || "",
        dob: prefill.dob || prefill.dateOfBirth || prefill.birthDate || "",

        address:
          prefill.address ||
          prefill.fullAddress ||
          [
            prefill.house,
            prefill.street,
            prefill.loc,
            prefill.vtc,
            prefill.dist,
            prefill.state,
            prefill.pc,
          ]
            .filter(Boolean)
            .join(", "),

        phoneNumber: "",
        mobile: "",
        phone: "",
      },
    });
  }

  async function handleManualRegister() {
    if (aadhaar.length !== 12) {
      showPopup("error", "Enter valid 12-digit Aadhaar");
      return;
    }

    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/customers/search?aadhaar=${aadhaar}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }

      if (res.status === 404) {
        goToAddCustomer({ aadhaar });
        return;
      }

      if (res.ok) {
        showPopup("error", "Customer already registered");
        return;
      }

      let message = "Something went wrong while checking customer";

      try {
        const data = await res.json();
        message = data.message || message;
      } catch {
        message = await res.text();
      }

      showPopup(
        "error",
        message || "Something went wrong while checking customer"
      );
    } catch {
      showPopup("error", "Server error while checking customer");
    } finally {
      setLoading(false);
    }
  }

  function handleCustomerPhotoChange(file: File | null) {
    if (customerPhotoPreview) {
      URL.revokeObjectURL(customerPhotoPreview);
    }

    if (!file) {
      setCustomerPhoto(null);
      setCustomerPhotoPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showPopup("error", "Only image files are allowed for customer photo");
      setCustomerPhoto(null);
      setCustomerPhotoPreview("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showPopup("error", "Customer photo size must be less than 5MB");
      setCustomerPhoto(null);
      setCustomerPhotoPreview("");
      return;
    }

    setCustomerPhoto(file);
    setCustomerPhotoPreview(URL.createObjectURL(file));
  }

  function handleQrUploadClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!qrPhoneNumber || !/^[6-9]\d{9}$/.test(qrPhoneNumber)) {
      showPopup(
        "error",
        "Please enter a valid 10-digit phone number before uploading Aadhaar QR"
      );
      return;
    }

    if (!customerPhoto) {
      showPopup(
        "error",
        "Please upload customer photo before uploading Aadhaar QR"
      );
      return;
    }

    fileInputRef.current?.click();
  }

  async function handleCustomerRegisteredSuccess(data: any) {
    setQrStep("success");

    setCustomer(data);

    setLoanDetails({
      ...(loanDetails as any),
      customerId: data.id || data.customerId || data.customer_id || "",
    } as any);

    setGoToGirviAfterSuccess(true);

    showPopup(
      "success",
      `Customer registered successfully: ${
        data.fullName || data.name || "Customer"
      }`
    );

    autoNavigateTimerRef.current = setTimeout(() => {
      setPopup(null);
      setGoToGirviAfterSuccess(false);
      autoNavigateTimerRef.current = null;
      navigate("/dealer/details");
    }, 1200);

    setQrPhoneNumber("");
    setAadhaar("");
    setCustomerPhoto(null);

    if (customerPhotoPreview) {
      URL.revokeObjectURL(customerPhotoPreview);
    }

    setCustomerPhotoPreview("");
  }

  async function verifyAadhaarQRWithBackend(file: File) {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    if (!qrPhoneNumber || !/^[6-9]\d{9}$/.test(qrPhoneNumber)) {
      showPopup(
        "error",
        "Please enter a valid 10-digit phone number before uploading Aadhaar QR"
      );
      return;
    }

    if (!customerPhoto) {
      showPopup(
        "error",
        "Please upload customer photo before uploading Aadhaar QR"
      );
      return;
    }

    setUploadingQR(true);
    setQrStep("uploading");
    setScannerError("");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("phoneNumber", qrPhoneNumber);
      formData.append("customerPhoto", customerPhoto);

      const res = await fetch(`${API_BASE}/customers/verify/aadhaar-qr`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      setQrStep("verifying");

      if (res.status === 401 || res.status === 403) {
        setQrStep("error");
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        setQrStep("error");

        let message = "QR verification failed";

        try {
          const data = await res.json();
          message = data.message || message;
        } catch {
          message = await res.text();
        }

        showPopup("error", message || "QR verification failed");
        return;
      }

      const data = await res.json();

      await handleCustomerRegisteredSuccess(data);
    } catch {
      setQrStep("error");
      showPopup("error", "Server error while verifying Aadhaar QR");
    } finally {
      setUploadingQR(false);

      setTimeout(() => {
        setQrStep("idle");
      }, 2000);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleQRFileUpload(file: File) {
    await verifyAadhaarQRWithBackend(file);
  }

  // ✅ Capture current camera frame as image file for Scan QR flow
  async function captureScannerFrameAsFile(): Promise<File | null> {
    const video = document.querySelector(
      "#aadhaar-qr-reader video"
    ) as HTMLVideoElement | null;

    if (!video || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          const file = new File([blob], "scanned-aadhaar-qr.png", {
            type: "image/png",
          });

          resolve(file);
        },
        "image/png",
        0.95
      );
    });
  }

  // ✅ Manual capture fallback when browser decoder cannot read dense Aadhaar QR
  async function captureAndVerifyFromCamera() {
    if (uploadingQR) return;

    const scannedQrImageFile = await captureScannerFrameAsFile();

    if (!scannedQrImageFile) {
      showPopup(
        "error",
        "Could not capture QR image from camera. Please try again or upload Aadhaar QR image."
      );
      return;
    }

    setShowScanner(false);
    setScannerError("");

    await verifyAadhaarQRWithBackend(scannedQrImageFile);
  }

  // ✅ Back camera scanner
  useEffect(() => {
    if (!showScanner) return;

    const scanner = new Html5Qrcode("aadhaar-qr-reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });

    let isScannerRunning = false;
    let hasScanned = false;

    scanner
      .start(
        {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        {
          fps: 15,

          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.85);

            return {
              width: size,
              height: size,
            };
          },

          aspectRatio: 1.0,
          disableFlip: false,
        },
        async (decodedText) => {
          if (hasScanned) return;

          if (!decodedText) {
            setScannerError(
              "QR scanned, but data was not readable. Please try again."
            );
            return;
          }

          hasScanned = true;
          setScannerError("");

          // ✅ Capture current frame BEFORE stopping camera
          const scannedQrImageFile = await captureScannerFrameAsFile();

          try {
            if (isScannerRunning) {
              await scanner.stop();
              scanner.clear();
              isScannerRunning = false;
            }
          } catch {
            // ignore scanner stop/clear error
          }

          setShowScanner(false);

          if (!scannedQrImageFile) {
            setQrStep("error");
            showPopup(
              "error",
              "Could not capture QR image from camera. Please try again or upload Aadhaar QR image."
            );
            return;
          }

          // ✅ Same backend flow as Upload QR
          await verifyAadhaarQRWithBackend(scannedQrImageFile);
        },
        () => {
          // ignore frame scan errors
        }
      )
      .then(() => {
        isScannerRunning = true;
      })
      .catch((err) => {
        console.error("Back camera start failed:", err);

        setScannerError(
          "Back camera not available or permission denied. Please allow camera permission and try on mobile device."
        );
      });

    return () => {
      if (isScannerRunning) {
        scanner
          .stop()
          .then(() => {
            try {
              scanner.clear();
            } catch {
              // ignore clear error
            }
          })
          .catch(() => {
            // ignore stop error
          });
      } else {
        try {
          scanner.clear();
        } catch {
          // ignore clear error
        }
      }
    };
  }, [showScanner]);

  function CustomerPhotoUploadCard() {
    return (
      <div>
        <label className="block text-xs text-gray-500 font-semibold mb-2">
          Customer Photo <span className="text-red-500">*</span>
        </label>

        <div className="border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/50 p-4">
          {!customerPhotoPreview ? (
            <label className="cursor-pointer flex flex-col items-center justify-center text-center py-5">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                <FaUpload />
              </div>

              <p className="text-sm font-bold text-gray-800">
                Upload Customer Photo
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Required for QR registration. JPG, PNG or WEBP. Max 5MB.
              </p>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleCustomerPhotoChange(file);
                }}
              />
            </label>
          ) : (
            <div className="flex items-center gap-4">
              <img
                src={customerPhotoPreview}
                alt="Customer preview"
                className="w-24 h-24 rounded-2xl object-cover border border-purple-200 bg-white"
              />

              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">
                  Customer photo selected
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  This photo will be saved with QR registration.
                </p>

                <div className="flex gap-2 mt-3">
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">
                    Change
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleCustomerPhotoChange(file);
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleCustomerPhotoChange(null)}
                    className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function QrUploadProgress() {
    if (qrStep === "idle") return null;

    return (
      <div className="mt-3 text-sm space-y-1">
        <QrStatus done={!!customerPhoto} text="Customer photo added" />

        <QrStatus
          done={/^[6-9]\d{9}$/.test(qrPhoneNumber)}
          text="Phone number added"
        />

        <QrStatus
          active={qrStep === "uploading"}
          done={
            qrStep === "verifying" ||
            qrStep === "success" ||
            qrStep === "error"
          }
          text="Uploading Aadhaar QR"
        />

        <QrStatus
          active={qrStep === "verifying"}
          done={qrStep === "success"}
          error={qrStep === "error"}
          text="Verifying Aadhaar details"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) {
            handleQRFileUpload(file);
          }
        }}
      />

      {/* ================= DESKTOP VIEW ================= */}
      <div className="hidden xl:flex min-h-screen">
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
              <h1 className="text-xl font-bold text-purple-700">PawnSecure</h1>
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
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl flex items-center gap-3 font-semibold"
            >
              <FaUserFriends />
              Customers
            </button>

            <button
              onClick={() => navigate("/dealer/customer")}
              className="w-full text-gray-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-100"
            >
              <FaRupeeSign />
              Girvi
            </button>

            <button
              onClick={() => navigate("/dealer/collections")}
              className="w-full text-gray-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-100"
            >
              <FaCoins />
              Collections
            </button>

            <button
              onClick={() => navigate("/dealer/reports")}
              className="w-full text-gray-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-100"
            >
              <FaChartBar />
              Reports
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-red-50 font-semibold mt-8"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </nav>
        </aside>

        <main className="ml-64 flex-1">
          <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Customer Register
              </h2>

              <p className="text-xs text-gray-500">
                Register customer using Aadhaar QR scan, QR upload, or manual
                Aadhaar entry
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold"
              >
                {getInitials(dealerName)}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-bold text-gray-800">
                      {dealerName}
                    </p>
                    <p className="text-xs text-gray-500">Dealer</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-8 bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl p-8">
                <p className="text-sm opacity-90">Dealer Portal</p>

                <h1 className="text-3xl font-bold mt-2">
                  Customer Register
                </h1>

                <p className="text-sm opacity-80 mt-3 max-w-2xl">
                  Register customer securely by scanning Aadhaar QR, uploading
                  Aadhaar QR image, or entering Aadhaar manually.
                </p>

                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-xs opacity-80">Method 1</p>
                    <h3 className="font-bold mt-1">Scan QR</h3>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-xs opacity-80">Method 2</p>
                    <h3 className="font-bold mt-1">Upload QR</h3>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-xs opacity-80">Method 3</p>
                    <h3 className="font-bold mt-1">Manual Entry</h3>
                  </div>
                </div>
              </div>

              <div className="col-span-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Customer Register Options
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Register a customer using Aadhaar QR scan, QR image upload,
                  or manual Aadhaar entry.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="bg-purple-50 text-purple-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                    1. Scan Aadhaar QR
                  </div>

                  <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                    2. Upload QR from gallery
                  </div>

                  <div className="bg-green-50 text-green-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                    3. Manual register if needed
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Customer Register
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Scan Aadhaar QR, upload Aadhaar QR image, or enter Aadhaar
                      manually to register customer.
                    </p>
                  </div>

                  <a
                    href="https://myaadhaar.uidai.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-700 text-sm font-semibold hover:underline"
                  >
                    Verify Portal ↗
                  </a>
                </div>

                <CustomerStepIndicator />

                <div className="grid grid-cols-12 gap-4 mt-4">
                  <div className="col-span-7 flex items-center border border-gray-200 rounded-2xl px-4 py-4 bg-gray-50 focus-within:ring-2 focus-within:ring-purple-500">
                    <FaSearch className="text-gray-400 mr-3" />

                    <input
                      value={maskAadhaar(aadhaar)}
                      onChange={(e) =>
                        setAadhaar(e.target.value.replace(/\D/g, ""))
                      }
                      maxLength={14}
                      className="w-full outline-none text-sm bg-transparent"
                      placeholder="Enter Aadhaar number"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!validateQrScanBeforeOpen()) return;

                      setScannerError("");
                      setShowScanner(true);
                    }}
                    disabled={uploadingQR}
                    className="col-span-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FaQrcode />
                    Scan QR
                  </button>

                  <button
                    type="button"
                    onClick={handleQrUploadClick}
                    disabled={uploadingQR}
                    className="col-span-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FaUpload />
                    {uploadingQR ? "Saving..." : "Upload QR"}
                  </button>

                  <div className="col-span-12">
                    <QrUploadProgress />
                  </div>

                  <div className="col-span-12 flex items-center border border-gray-200 rounded-2xl px-4 py-4 bg-gray-50 focus-within:ring-2 focus-within:ring-purple-500">
                    <FaPhoneAlt className="text-gray-400 mr-3" />

                    <input
                      value={qrPhoneNumber}
                      onChange={(e) =>
                        setQrPhoneNumber(
                          e.target.value.replace(/\D/g, "").slice(0, 10)
                        )
                      }
                      maxLength={10}
                      className="w-full outline-none text-sm bg-transparent"
                      placeholder="Phone number for QR registration"
                    />
                  </div>

                  <div className="col-span-12">
                    <CustomerPhotoUploadCard />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualRegister}
                  disabled={loading}
                  className="mt-5 w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold disabled:bg-gray-400"
                >
                  {loading ? "Checking..." : "Continue Customer Register"}
                </button>
              </div>

              <div className="col-span-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900">
                  Customer Register Methods
                </h2>

                <div className="mt-5 space-y-4">
                  <GuideBox
                    color="green"
                    title="Scan Aadhaar QR"
                    text="Use camera to scan Aadhaar QR and fill registration details."
                  />

                  <GuideBox
                    color="yellow"
                    title="Upload Aadhaar QR"
                    text="Upload Aadhaar QR image from phone/gallery and create customer securely."
                  />

                  <GuideBox
                    color="red"
                    title="Manual Register"
                    text="Enter Aadhaar manually when QR scan or upload is not available."
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================= MOBILE / TABLET VIEW ================= */}
      <div className="xl:hidden pb-32 bg-[#f4f5f7] min-h-screen">
        <div className="max-w-md mx-auto bg-[#f4f5f7] min-h-screen">
          <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] px-5 py-6">
            <div className="flex justify-between items-center mb-6">
              <button type="button" onClick={() => navigate("/dealer/dashboard")}>
                <FaArrowLeft className="text-xl" />
              </button>

              <div className="text-center">
                <h1 className="font-bold text-lg">Customer Register</h1>
                <p className="text-xs opacity-80">PawnSecure</p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold"
                >
                  {getInitials(dealerName)}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border z-50 overflow-hidden text-left">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2"
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold">Customer Register</h2>
            <p className="text-sm opacity-80 mt-1">
              Scan QR, upload QR, or enter Aadhaar manually
            </p>
          </div>

          <div className="px-4 -mt-5 relative z-10">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-sm">Customer Register</h2>

                <a
                  href="https://myaadhaar.uidai.gov.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-700 text-xs font-semibold"
                >
                  Verify ↗
                </a>
              </div>

              <CustomerStepIndicator />

              <div className="flex items-center border rounded-xl px-4 py-3 bg-gray-50 mt-4">
                <FaSearch className="text-gray-400 mr-3" />

                <input
                  value={maskAadhaar(aadhaar)}
                  onChange={(e) =>
                    setAadhaar(e.target.value.replace(/\D/g, ""))
                  }
                  maxLength={14}
                  className="w-full outline-none text-sm bg-transparent"
                  placeholder="Enter Aadhaar"
                />
              </div>

              <div className="flex items-center border rounded-xl px-4 py-3 bg-gray-50 mt-3">
                <FaPhoneAlt className="text-gray-400 mr-3" />

                <input
                  value={qrPhoneNumber}
                  onChange={(e) =>
                    setQrPhoneNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  maxLength={10}
                  className="w-full outline-none text-sm bg-transparent"
                  placeholder="Phone number for QR registration"
                />
              </div>

              <div className="mt-3">
                <CustomerPhotoUploadCard />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!validateQrScanBeforeOpen()) return;

                    setScannerError("");
                    setShowScanner(true);
                  }}
                  disabled={uploadingQR}
                  className="bg-purple-100 text-purple-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaQrcode />
                  Scan QR
                </button>

                <button
                  type="button"
                  onClick={handleQrUploadClick}
                  disabled={uploadingQR}
                  className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaUpload />
                  {uploadingQR ? "Saving..." : "Upload QR"}
                </button>
              </div>

              <QrUploadProgress />

              <button
                type="button"
                onClick={handleManualRegister}
                disabled={loading}
                className="mt-3 w-full bg-purple-600 text-white py-3 rounded-xl font-bold disabled:bg-gray-400"
              >
                {loading ? "Checking..." : "Manual Customer Register"}
              </button>
            </div>
          </div>

          <div className="px-4 mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-900">
                Customer Register Methods
              </h2>

              <div className="mt-5 space-y-4">
                <GuideBox
                  color="green"
                  title="Scan Aadhaar QR"
                  text="Use camera to scan Aadhaar QR."
                />

                <GuideBox
                  color="yellow"
                  title="Upload Aadhaar QR"
                  text="Upload QR image from phone/gallery."
                />

                <GuideBox
                  color="red"
                  title="Manual Customer Register"
                  text="Enter Aadhaar manually when QR is unavailable."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-3 z-50">
          <button
            type="button"
            onClick={() => navigate("/dealer/dashboard")}
            className="text-gray-500 flex flex-col items-center text-xs"
          >
            <FaHome className="text-xl mb-1" />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/dealer/customer-register")}
            className="text-purple-700 flex flex-col items-center text-xs font-semibold"
          >
            <FaUserFriends className="text-xl mb-1" />
            Customers
          </button>

          <button
            type="button"
            onClick={() => navigate("/dealer/customer")}
            className="text-gray-500 flex flex-col items-center text-xs"
          >
            <FaRupeeSign className="text-xl mb-1" />
            Girvi
          </button>

          <button
            type="button"
            onClick={() => navigate("/dealer/collections")}
            className="text-gray-500 flex flex-col items-center text-xs"
          >
            <FaCoins className="text-xl mb-1" />
            Collections
          </button>

          <button
            type="button"
            onClick={() => navigate("/dealer/more")}
            className="text-gray-500 flex flex-col items-center text-xs"
          >
            <FaEllipsisH className="text-xl mb-1" />
            More
          </button>
        </div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-[420px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Scan Aadhaar QR</h2>

              <button
                type="button"
                onClick={() => {
                  setShowScanner(false);
                  setScannerError("");
                }}
                className="text-red-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div
              id="aadhaar-qr-reader"
              className="w-full min-h-[360px] overflow-hidden rounded-xl border"
            />

            {scannerError && (
              <p className="text-sm text-red-600 mt-3">{scannerError}</p>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Back camera only. If Aadhaar QR does not scan automatically, tap
              Capture & Verify QR.
            </p>

            <button
              type="button"
              onClick={captureAndVerifyFromCamera}
              disabled={uploadingQR}
              className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold disabled:bg-gray-400"
            >
              {uploadingQR ? "Verifying..." : "Capture & Verify QR"}
            </button>
          </div>
        </div>
      )}

      {popup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div
              className={`text-5xl mb-3 ${
                popup.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {popup.type === "success" ? "✔" : "✖"}
            </div>

            <h2 className="text-xl font-bold mb-2">
              {popup.type === "success" ? "Success" : "Error"}
            </h2>

            <p className="text-gray-600 text-sm mb-5">{popup.message}</p>

            <button
              type="button"
              onClick={closePopup}
              className={`px-5 py-2 rounded-lg text-white font-semibold ${
                popup.type === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerStepIndicator() {
  return (
    <div className="flex items-center justify-between text-sm font-semibold">
      <span className="text-purple-600">Customer</span>
      <div className="flex-1 h-[2px] bg-purple-600 mx-2" />

      <span className="text-gray-400">Girvi</span>
      <div className="flex-1 h-[2px] bg-gray-300 mx-2" />

      <span className="text-gray-400">Items</span>
      <div className="flex-1 h-[2px] bg-gray-300 mx-2" />

      <span className="text-gray-400">Review</span>
    </div>
  );
}

function QrStatus({
  text,
  done,
  active,
  error,
}: {
  text: string;
  done?: boolean;
  active?: boolean;
  error?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-bold ${
          done
            ? "text-green-600"
            : error
            ? "text-red-600"
            : active
            ? "text-purple-600"
            : "text-gray-400"
        }`}
      >
        {done ? "✓" : error ? "✕" : active ? "…" : "•"}
      </span>

      <span
        className={`${
          done
            ? "text-green-700"
            : error
            ? "text-red-700"
            : active
            ? "text-purple-700"
            : "text-gray-600"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function GuideBox({
  color,
  title,
  text,
}: {
  color: "green" | "yellow" | "red";
  title: string;
  text: string;
}) {
  const cls =
    color === "green"
      ? "bg-green-50 border-green-100 text-green-700"
      : color === "yellow"
      ? "bg-yellow-50 border-yellow-100 text-yellow-700"
      : "bg-red-50 border-red-100 text-red-700";

  return (
    <div className={`${cls} border rounded-2xl p-4`}>
      <p className="font-bold">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{text}</p>
    </div>
  );
}
