import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useGirvi } from "../girvi/GirviContext";
import DealerSidebar from "../dealer/DealerSidebar";
import MobileDealerSidebar from "../dealer/MobileDealerSidebar";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

import {
  FaHome,
  FaUserFriends,
  FaRupeeSign,
  FaCoins,
  FaEllipsisH,
  FaArrowLeft,
  FaSearch,
  FaQrcode,
  FaUpload,
  FaSignOutAlt,
  FaPhoneAlt,
} from "react-icons/fa";

const API_BASE = "https://pawnsecure.onrender.com/api";

type QrStep = "idle" | "uploading" | "verifying" | "success" | "error";

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { setCustomer } = useGirvi();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoNavigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const query = new URLSearchParams(window.location.search);
  const isAdminView = query.get("adminView") === "true";

  const dealerName =
    query.get("dealerName") ||
    localStorage.getItem("ps_dealer_name") ||
    "Dealer";

  const dealerIdForSidebar =
    query.get("dealerId") ||
    localStorage.getItem("ps_dealer_id") ||
    "-";

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const todayDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const todayDay = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
  });

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
  const [qrPreviewData, setQrPreviewData] = useState<any | null>(null);

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

      showPopup("error", message);
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

    const customerId =
      data.id ||
      data.customerId ||
      data.customer_id ||
      data.customer?.id ||
      data.customer?.customerId ||
      "";

    if (!customerId) {
      setQrStep("error");
      showPopup(
        "error",
        "Customer registered, but customer ID was not returned by backend."
      );
      return;
    }

    const normalizedCustomer = {
      ...data,
      id: customerId,
      customerId: customerId,
    };

    setCustomer(normalizedCustomer);

    localStorage.setItem("ps_customer_id", String(customerId));
    localStorage.setItem(
      "ps_selected_customer",
      JSON.stringify(normalizedCustomer)
    );

    setGoToGirviAfterSuccess(true);

    showPopup(
      "success",
      `Customer registered successfully: ${
        normalizedCustomer.fullName ||
        normalizedCustomer.name ||
        normalizedCustomer.customerName ||
        "Customer"
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

  async function verifyAadhaarQRWithBackend(file?: File | null, qrText?: string) {
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

    if (!file && !qrText) {
      showPopup("error", "QR image or QR data is required");
      return;
    }

    setUploadingQR(true);
    setQrStep("uploading");
    setScannerError("");

    try {
      const formData = new FormData();

      if (file) {
        formData.append("file", file);
      }

      formData.append("phoneNumber", qrPhoneNumber);
      formData.append("customerPhoto", customerPhoto);

      if (qrText && qrText.trim()) {
        console.log("SENDING QR TEXT TO BACKEND:", qrText.substring(0, 80));
        formData.append("qrText", qrText.trim());
      }

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
        showPopup("error", message);
        return;
      }

      const data = await res.json();

      setQrStep("success");
      setQrPreviewData({
        ...data,
        phoneNumber: qrPhoneNumber,
        customerPhotoPreview,
      });

      showPopup(
        "success",
        "Aadhaar QR verified successfully. Please confirm customer details."
      );
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
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          const file = new File([blob], "scanned-aadhaar-qr.jpg", {
            type: "image/jpeg",
          });

          resolve(file);
        },
        "image/jpeg",
        0.90
      );
    });
  }

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

  useEffect(() => {
    if (!showScanner) return;

    let scanner: Html5Qrcode | null = null;
    let isScannerRunning = false;
    let hasScanned = false;
    let isUnmounted = false;

    // Added `any` type assertion to bypass TypeScript DOM constraint strictness
    const scanConfig: any = {
      fps: 15,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.floor(minEdge * 0.9);
        return { width: size, height: size };
      },
      aspectRatio: 1.0,
      disableFlip: true,
      videoConstraints: {
        facingMode: "environment",
        advanced: [{ focusMode: "continuous" }, { zoom: 2.0 }]
      }
    };

    async function stopScanner() {
      try {
        if (scanner && isScannerRunning) {
          await scanner.stop();
          scanner.clear();
          isScannerRunning = false;
        } else if (scanner) {
          scanner.clear();
        }
      } catch {
        // ignore errors
      }
    }

    async function onScanSuccess(decodedText: string) {
      if (hasScanned) return;

      if (!decodedText) {
        setScannerError("QR scanned, but data was not readable. Please try again.");
        return;
      }

      hasScanned = true;
      setScannerError("");

      console.log("QR DECODED TEXT:", decodedText.substring(0, 80));

      await stopScanner();
      setShowScanner(false);
      await verifyAadhaarQRWithBackend(null, decodedText);
    }

    async function startAndroidBackCamera() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (isUnmounted) return;

        scanner = new Html5Qrcode("aadhaar-qr-reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
          throw new Error("No camera found on this device");
        }

        const backCamera =
          cameras.find((camera) =>
            /back|rear|environment|facing back/i.test(camera.label || "")
          ) || cameras[cameras.length - 1];

        try {
          await scanner.start(backCamera.id, scanConfig, onScanSuccess, () => {});
          isScannerRunning = true;
          setScannerError("");
          return;
        } catch (deviceIdError) {
          console.warn("Back camera by deviceId failed:", deviceIdError);
        }

        try {
          await scanner.start(
            { facingMode: "environment" },
            scanConfig,
            onScanSuccess,
            () => {}
          );
          isScannerRunning = true;
          setScannerError("");
          return;
        } catch (environmentError) {
          console.warn("Environment camera failed:", environmentError);
        }

        await scanner.start(cameras[0].id, scanConfig, onScanSuccess, () => {});
        isScannerRunning = true;
        setScannerError("");
      } catch (err: any) {
        console.error("Camera start failed:", err);
        const message = err?.message || err?.name || "Camera permission denied";
        setScannerError(`Camera start failed: ${message}.`);
      }
    }

    startAndroidBackCamera();

    return () => {
      isUnmounted = true;

      if (scanner && isScannerRunning) {
        scanner
          .stop()
          .then(() => {
            try {
              scanner?.clear();
            } catch {}
          })
          .catch(() => {});
      } else if (scanner) {
        try {
          scanner.clear();
        } catch {}
      }
    };
  }, [showScanner]);

  function QrCustomerPreviewCard() {
    if (!qrPreviewData) return null;

    const customerName =
      qrPreviewData.fullName ||
      qrPreviewData.name ||
      qrPreviewData.customerName ||
      "Not available";

    const customerId =
      qrPreviewData.id ||
      qrPreviewData.customerId ||
      qrPreviewData.customer_id ||
      qrPreviewData.customer?.id ||
      qrPreviewData.customer?.customerId ||
      "";

    const masked =
      qrPreviewData.maskedAadhaar ||
      qrPreviewData.masked_aadhaar ||
      "Not shared via QR";

    const address =
      qrPreviewData.address ||
      qrPreviewData.fullAddress ||
      [
        qrPreviewData.house,
        qrPreviewData.street,
        qrPreviewData.loc,
        qrPreviewData.vtc,
        qrPreviewData.dist,
        qrPreviewData.state,
        qrPreviewData.pc,
      ]
        .filter(Boolean)
        .join(", ") ||
      "Not available";

    return (
      <div className="mt-6 border border-purple-200 bg-purple-50 rounded-3xl p-4 sm:p-5">
        <h3 className="text-lg font-bold text-purple-800 mb-4">
          Confirm Customer Details
        </h3>

        <div className="flex flex-col sm:flex-row gap-4">
          {customerPhotoPreview ? (
            <img
              src={customerPhotoPreview}
              alt="Customer"
              className="w-24 h-24 rounded-2xl object-cover border bg-white shrink-0 mx-auto sm:mx-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0 mx-auto sm:mx-0">
              {customerName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 text-sm space-y-1 min-w-0 text-left">
            <p>
              <span className="font-semibold text-gray-700">Customer ID:</span>{" "}
              {customerId || "Not returned"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Name:</span>{" "}
              {customerName}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Aadhaar:</span>{" "}
              {masked}
            </p>
            <p>
              <span className="font-semibold text-gray-700">DOB:</span>{" "}
              {qrPreviewData.dob ||
                qrPreviewData.dateOfBirth ||
                qrPreviewData.birthDate ||
                "Not available"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Gender:</span>{" "}
              {qrPreviewData.gender || qrPreviewData.sex || "Not available"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Phone:</span>{" "}
              {qrPreviewData.phoneNumber || qrPhoneNumber}
            </p>
            <p className="text-xs text-gray-600 mt-2 break-words">
              <span className="font-semibold">Address:</span> {address}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <button
            type="button"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-sm"
            onClick={async () => {
              await handleCustomerRegisteredSuccess(qrPreviewData);
              setQrPreviewData(null);
            }}
          >
            Confirm & Continue
          </button>

          <button
            type="button"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm"
            onClick={() => {
              setQrPreviewData(null);
              setQrStep("idle");
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

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
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
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
                <div className="flex justify-center sm:justify-start gap-2 mt-3">
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
      <div className="mt-3 text-sm space-y-1 text-left">
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
          if (file) handleQRFileUpload(file);
        }}
      />

      {/* ================= DESKTOP VIEW WITH GLOBAL SIDEBAR ================= */}
      <div className="hidden lg:flex min-h-screen">
        <DealerSidebar isAdminView={isAdminView} />

        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Customer Register
              </h2>
              <p className="text-xs text-gray-500">
                Register customer using Aadhaar QR scan, QR upload, or manual
                Aadhaar entry
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-gray-800">
                  {todayDate}
                </p>
                <p className="text-xs text-gray-400">{todayDay}</p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold"
                >
                  {getInitials(dealerName)}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-bold text-gray-800">
                        {dealerName}
                      </p>
                      <p className="text-xs text-gray-500">Dealer</p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition"
                    >
                      <FaSignOutAlt className="text-base" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="p-5 xl:p-6 max-w-[1400px] w-full mx-auto flex-1">
            {/* Compact Banner */}
            <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-8 py-5 mb-6">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm opacity-90">Dealer Portal</p>
                  <h1 className="text-2xl font-bold mt-1">
                    Customer Register
                  </h1>
                  <p className="text-sm opacity-80 mt-1">
                    Scan QR, upload QR, or enter Aadhaar manually
                  </p>
                </div>

                <div className="hidden xl:grid grid-cols-3 gap-3 min-w-[420px]">
                  <div className="bg-white/10 rounded-2xl px-4 py-3">
                    <p className="text-[11px] opacity-80">Method 1</p>
                    <h3 className="font-bold text-sm mt-0.5">Scan QR</h3>
                  </div>
                  <div className="bg-white/10 rounded-2xl px-4 py-3">
                    <p className="text-[11px] opacity-80">Method 2</p>
                    <h3 className="font-bold text-sm mt-0.5">Upload QR</h3>
                  </div>
                  <div className="bg-white/10 rounded-2xl px-4 py-3">
                    <p className="text-[11px] opacity-80">Method 3</p>
                    <h3 className="font-bold text-sm mt-0.5">Manual</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Customer Register
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Scan Aadhaar QR, upload Aadhaar QR image, or enter Aadhaar
                      manually.
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

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
                  <div className="col-span-1 md:col-span-7 flex items-center border border-gray-200 rounded-2xl px-4 py-4 bg-gray-50 focus-within:ring-2 focus-within:ring-purple-500">
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
                    className="col-span-1 md:col-span-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl font-bold flex items-center justify-center gap-2 py-4 md:py-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FaQrcode />
                    Scan QR
                  </button>

                  <button
                    type="button"
                    onClick={handleQrUploadClick}
                    disabled={uploadingQR}
                    className="col-span-1 md:col-span-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold flex items-center justify-center gap-2 py-4 md:py-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FaUpload />
                    {uploadingQR ? "Saving..." : "Upload QR"}
                  </button>

                  <div className="col-span-1 md:col-span-12">
                    <QrUploadProgress />
                  </div>

                  <div className="col-span-1 md:col-span-12 flex items-center border border-gray-200 rounded-2xl px-4 py-4 bg-gray-50 focus-within:ring-2 focus-within:ring-purple-500">
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

                  <div className="col-span-1 md:col-span-12">
                    <CustomerPhotoUploadCard />
                  </div>

                  <div className="col-span-1 md:col-span-12">
                    <QrCustomerPreviewCard />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualRegister}
                  disabled={loading || !!qrPreviewData}
                  className="mt-5 w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold disabled:bg-gray-400"
                >
                  {loading ? "Checking..." : "Continue Customer Register"}
                </button>
              </div>

              <div className="col-span-12 xl:col-span-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
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
                    text="Upload Aadhaar QR image from phone/gallery."
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
<div className="lg:hidden pb-32 bg-[#f4f5f7] min-h-screen">
  <MobileDealerSidebar
    open={showMobileSidebar}
    onClose={() => setShowMobileSidebar(false)}
    isAdminView={isAdminView}
    dealerName={dealerName}
    dealerId={dealerIdForSidebar}
  />

  <div className="max-w-md mx-auto bg-[#f4f5f7] min-h-screen">
    {/* Mobile Header */}
    <header className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (isAdminView) {
              navigate("/admin/dashboard", { replace: true });
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
            Customer Register
          </h2>
          <p className="text-[11px] text-gray-500">
            Aadhaar QR or manual register
          </p>
        </div>
      </div>

      <div className="text-right leading-tight">
        <p className="text-xs font-semibold text-gray-800">{todayDate}</p>
        <p className="text-[10px] text-gray-400">{todayDay}</p>
      </div>
    </header>

    {/* Purple Banner */}
    <div className="px-4 pt-4">
      <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-3xl px-5 py-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs opacity-80">Dealer Portal</p>
            <h1 className="text-2xl font-bold mt-1">Customer Register</h1>
            <p className="text-sm opacity-80 mt-1">
              Scan QR, upload QR, or enter Aadhaar manually
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dealer/dashboard")}
            className="w-11 h-11 bg-white/20 active:bg-white/30 rounded-2xl flex items-center justify-center transition shrink-0"
            title="Back"
          >
            <FaArrowLeft />
          </button>
        </div>
      </div>
    </div>

    <div className="px-4 relative z-10">
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
        <QrCustomerPreviewCard />

        <button
          type="button"
          onClick={handleManualRegister}
          disabled={loading || !!qrPreviewData}
          className="mt-3 w-full bg-purple-600 text-white py-3 rounded-xl font-bold disabled:bg-gray-400"
        >
          {loading ? "Checking..." : "Manual Customer Register"}
        </button>
      </div>
    </div>

    <div className="px-4 mt-4">
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

  {/* Mobile Bottom Fixed Menu */}
  {!isAdminView && (
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
        disabled
        className="text-gray-300 flex flex-col items-center text-xs cursor-not-allowed"
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
  )}

  {isAdminView && (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t p-3 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <button
        type="button"
        onClick={() => navigate("/admin/dashboard", { replace: true })}
        className="w-full bg-purple-600 active:bg-purple-700 text-white py-3 rounded-xl font-bold transition"
      >
        Back to Admin Dashboard
      </button>
    </div>
  )}
</div>

      {/* ================= SCANNER MODAL CONTAINER (WITH EXPOSURE MASK) ================= */}
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

            <div className="relative w-full min-h-[320px] sm:min-h-[420px] overflow-hidden rounded-xl border bg-black">
              {/* html5-qrcode video injects here */}
              <div id="aadhaar-qr-reader" className="w-full h-full" />
              
              {/* Targeting Reticle Overlay (Exposure mask) */}
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <div className="w-[250px] h-[250px] border-4 border-purple-500 rounded-lg shadow-[0_0_0_4000px_rgba(0,0,0,0.6)]"></div>
              </div>
            </div>

            {scannerError && (
              <p className="text-sm text-red-600 mt-3">{scannerError}</p>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Align the QR code inside the purple box. If it does not scan automatically, tap Capture & Verify QR.
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

      {/* ================= POPUP ALERTS ================= */}
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
    <div className={`${cls} border rounded-2xl p-4 text-left`}>
      <p className="font-bold">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{text}</p>
    </div>
  );
}
