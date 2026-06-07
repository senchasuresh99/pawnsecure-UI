import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {Html5Qrcode,Html5QrcodeSupportedFormats,} from "html5-qrcode";

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
  FaSignOutAlt,
  FaTrash,
} from "react-icons/fa";

const API_BASE = "https://pawnsecure-1.onrender.com/api";

export default function CustomerReviews() {
  const navigate = useNavigate();

  const resultRef = useRef<HTMLDivElement | null>(null);

  const dealerName = localStorage.getItem("ps_dealer_name") || "Dealer";
  const dealerId = localStorage.getItem("ps_dealer_id") || "";

  const [aadhaar, setAadhaar] = useState("");
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);

  const [riskLevel, setRiskLevel] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [popup, setPopup] = useState<any>(null);

  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [deletingReviewId, setDeletingReviewId] = useState<
    number | string | null
  >(null);

const [itemPhoto, setItemPhoto] = useState<File | null>(null);
const [itemPhotoPreview, setItemPhotoPreview] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("ps_token");

    if (!token) {
      navigate("/", { replace: true });
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (customer && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    }
  }, [customer]);

  function getToken() {
    return localStorage.getItem("ps_token");
  }

function handleItemPhotoChange(file: File | null) {
  if (itemPhotoPreview) {
    URL.revokeObjectURL(itemPhotoPreview);
  }

  if (!file) {
    setItemPhoto(null);
    setItemPhotoPreview("");
    return;
  }

  if (!file.type.startsWith("image/")) {
    showPopup("error", "Only image files are allowed");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showPopup("error", "Item photo must be less than 5MB");
    return;
  }

  setItemPhoto(file);
  setItemPhotoPreview(URL.createObjectURL(file));
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
    setPopup(null);
  }

function extractAadhaarFromQR(text: string) {
  if (!text) return "";

  const raw = text.trim();

  try {
    // ✅ ONLY old Aadhaar XML QR
    if (raw.includes("PrintLetterBarcodeData") || raw.startsWith("<")) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(raw, "text/xml");

      const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
      if (parserError) return "";

      const node =
        xmlDoc.getElementsByTagName("PrintLetterBarcodeData")[0] ||
        xmlDoc.documentElement;

      const uid = node?.getAttribute("uid") || "";

      // ✅ Strict validation
      if (/^\d{12}$/.test(uid)) {
        return uid;
      }
    }

    // ✅ DO NOT guess Aadhaar from encrypted QR
    return "";
  } catch {
    return "";
  }
}

useEffect(() => {
  if (!showScanner) return;

  let scanner: Html5Qrcode | null = null;
  let isScannerRunning = false;
  let hasScanned = false;
  let isUnmounted = false;

  const scanConfig = {
    fps: 15,

    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = Math.floor(minEdge * 0.9);

      return {
        width: size,
        height: size,
      };
    },

    aspectRatio: 1.0,
    disableFlip: true,
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
      // ignore scanner stop/clear error
    }
  }

  async function onScanSuccess(decodedText: string) {
    if (hasScanned) return;

    if (!decodedText) {
      setScannerError("QR scanned, but data was not readable. Please try again.");
      return;
    }

    const extractedAadhaar = extractAadhaarFromQR(decodedText);

    if (!extractedAadhaar) {
      setScannerError(
        "QR scanned, but full Aadhaar number was not found. Secure Aadhaar QR may not contain full Aadhaar. Please enter Aadhaar manually."
      );
      return;
    }

    hasScanned = true;

    setAadhaar(extractedAadhaar);
    setScannerError("");

    await stopScanner();

    setShowScanner(false);

    showPopup(
      "success",
      "Aadhaar number scanned. Please click Check Customer Review."
    );
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
        await scanner.start(
          backCamera.id,
          scanConfig,
          onScanSuccess,
          () => {
            // ignore frame decode errors
          }
        );

        isScannerRunning = true;
        setScannerError("");
        return;
      } catch {
        // fallback below
      }

      try {
        await scanner.start(
          { facingMode: "environment" },
          scanConfig,
          onScanSuccess,
          () => {
            // ignore frame decode errors
          }
        );

        isScannerRunning = true;
        setScannerError("");
        return;
      } catch {
        // fallback below
      }

      await scanner.start(
        cameras[cameras.length - 1].id,
        scanConfig,
        onScanSuccess,
        () => {
          // ignore frame decode errors
        }
      );

      isScannerRunning = true;
      setScannerError("");
    } catch (err: any) {
      const message =
        err?.message ||
        err?.name ||
        "Camera permission denied or camera not available";

      setScannerError(
        `Camera start failed: ${message}. Please allow camera permission and try again.`
      );
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
          } catch {
            // ignore clear error
          }
        })
        .catch(() => {
          // ignore stop error
        });
    } else if (scanner) {
      try {
        scanner.clear();
      } catch {
        // ignore clear error
      }
    }
  };
}, [showScanner]);

  async function searchCustomer() {
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
    setCustomer(null);

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
        showPopup("error", "Customer not found. Please register customer first.");
        return;
      }

      if (!res.ok) {
        let message = "Something went wrong";

        try {
          const data = await res.json();
          message = data.message || message;
        } catch {
          message = await res.text();
        }

        showPopup("error", message || "Something went wrong");
        return;
      }

      const data = await res.json();
      setCustomer(data);
    } catch {
      showPopup("error", "Server error");
    } finally {
      setLoading(false);
    }
  }

 async function submitReview() {
  if (!customer?.id) {
    showPopup("error", "Please search customer first");
    return;
  }

  if (!riskLevel) {
    showPopup("error", "Please select a review risk level");
    return;
  }

  if (!comment.trim()) {
    showPopup("error", "Please enter review details");
    return;
  }

  const token = getToken();
  if (!token) {
    handleUnauthorized();
    return;
  }

  setSubmitting(true);

  try {
    const formData = new FormData();

    // ✅ JSON part
    formData.append(
      "review",
      new Blob(
        [
          JSON.stringify({
            customerId: customer.id,
            type: riskLevel,
            comment: comment,
          }),
        ],
        { type: "application/json" }
      )
    );

    // ✅ Image part
    if (itemPhoto) {
      formData.append("itemPhoto", itemPhoto);
    }

    const res = await fetch(`${API_BASE}/reviews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // ❌ DO NOT set Content-Type
      },
      body: formData,
    });

    if (res.status === 401 || res.status === 403) {
      handleUnauthorized();
      return;
    }

    // Inside submitReview function
if (!res.ok) {
  let errorMessage = "Failed to submit review";
  
  try {
    // Attempt to parse the error as JSON
    const errorData = await res.json();
    errorMessage = errorData.message || errorMessage;
  } catch {
    // Fallback if the response is not JSON
    errorMessage = await res.text() || errorMessage;
  }
  
  showPopup("error", errorMessage);
  return;
}

    showPopup("success", "Review submitted successfully");

    // ✅ Reset
    setRiskLevel("");
    setComment("");
    setItemPhoto(null);
    setItemPhotoPreview("");

    searchCustomer();
  } catch {
    showPopup("error", "Server error while submitting review");
  } finally {
    setSubmitting(false);
  }
}

  async function deleteReview(reviewId: number | string) {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    const ok = window.confirm("Are you sure you want to delete this review?");
    if (!ok) return;

    setDeletingReviewId(reviewId);

    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        let message = "Could not delete review";

        try {
          const data = await res.json();
          message = data.message || message;
        } catch {
          message = await res.text();
        }

        showPopup("error", message || "Could not delete review");
        return;
      }

      showPopup("success", "Review deleted successfully");
      searchCustomer();
    } catch {
      showPopup("error", "Server error while deleting review");
    } finally {
      setDeletingReviewId(null);
    }
  }

  function maskAadhaar(a: string) {
    if (!a || a.length !== 12) return a;
    return `XXXX-XXXX-${a.slice(8)}`;
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
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
              onClick={() => navigate("/dealer/customer-search")}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl flex items-center gap-3 font-semibold"
            >
              <FaUserFriends />
              Customers Review
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
                Check Customer Review
              </h2>

              <p className="text-xs text-gray-500">
                Search customer history and review dealer feedback
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
                  Check Customer Review
                </h1>

                <p className="text-sm opacity-80 mt-3 max-w-2xl">
                  Search existing customer records, review previous dealer
                  feedback, and check customer risk history.
                </p>

                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-xs opacity-80">Search Type</p>
                    <h3 className="font-bold mt-1">Aadhaar</h3>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-xs opacity-80">Review</p>
                    <h3 className="font-bold mt-1">Dealer Notes</h3>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-xs opacity-80">Status</p>
                    <h3 className="font-bold mt-1">Secure</h3>
                  </div>
                </div>
              </div>

              <div className="col-span-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Quick Verification
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Enter Aadhaar manually or scan live QR to check customer
                  review history.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="bg-purple-50 text-purple-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                    1. Enter or scan Aadhaar
                  </div>

                  <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                    2. Search customer record
                  </div>

                  <div className="bg-green-50 text-green-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                    3. Submit dealer review
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Customer Review Search
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Enter Aadhaar number to check customer review history.
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

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-9 flex items-center border border-gray-200 rounded-2xl px-4 py-4 bg-gray-50 focus-within:ring-2 focus-within:ring-purple-500">
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
                      setScannerError("");
                      setShowScanner(true);
                    }}
                    className="col-span-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <FaQrcode />
                    Scan QR
                  </button>
                </div>

                <button
                  type="button"
                  onClick={searchCustomer}
                  disabled={loading}
                  className="mt-5 w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold"
                >
                  {loading ? "Checking..." : "Check Customer Review"}
                </button>
              </div>

              <div className="col-span-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900">
                  Safety Review Guide
                </h2>

                <div className="mt-5 space-y-4">
                  <GuideBox
                    color="green"
                    title="Safe"
                    text="Customer has good repayment or transaction history."
                  />
                  <GuideBox
                    color="yellow"
                    title="Low Risk"
                    text="Some caution needed based on previous dealer notes."
                  />
                  <GuideBox
                    color="red"
                    title="High Risk"
                    text="Serious issue reported by one or more dealers."
                  />
                </div>
              </div>
            </div>

            {customer && (
              <div className="mt-6 max-w-3xl">
                <CustomerResult
                  customer={customer}
                  aadhaar={aadhaar}
                  maskAadhaar={maskAadhaar}
                  riskLevel={riskLevel}
                  setRiskLevel={setRiskLevel}
                  comment={comment}
                  setComment={setComment}
                  submitReview={submitReview}
                  submitting={submitting}
                  currentDealerId={dealerId}
                  currentDealerName={dealerName}
                  deleteReview={deleteReview}
                  deletingReviewId={deletingReviewId}
                  itemPhotoPreview={itemPhotoPreview}
                  onItemPhotoChange={handleItemPhotoChange}
                />
              </div>
            )}
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
                <h1 className="font-bold text-lg">Check Review</h1>
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

            <h2 className="text-2xl font-bold">Check Customer</h2>
            <p className="text-sm opacity-80 mt-1">
              Search Aadhaar and view customer reviews
            </p>
          </div>

          <div className="px-4 -mt-5 relative z-10">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-sm">Customer Aadhaar</h2>

                <a
                  href="https://myaadhaar.uidai.gov.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-700 text-xs font-semibold"
                >
                  Verify ↗
                </a>
              </div>

              <div className="flex items-center border rounded-xl px-4 py-3 bg-gray-50">
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

              <button
                type="button"
                onClick={() => {
                  setScannerError("");
                  setShowScanner(true);
                }}
                className="mt-3 w-full bg-purple-100 text-purple-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
              >
                <FaQrcode />
                Scan QR
              </button>

              <button
                type="button"
                onClick={searchCustomer}
                disabled={loading}
                className="mt-3 w-full bg-purple-600 text-white py-3 rounded-xl font-bold"
              >
                {loading ? "Checking..." : "Check Review"}
              </button>
            </div>
          </div>

          {customer && (
            <div ref={resultRef} className="px-4 mt-5">
              <CustomerResult
                customer={customer}
                aadhaar={aadhaar}
                maskAadhaar={maskAadhaar}
                riskLevel={riskLevel}
                setRiskLevel={setRiskLevel}
                comment={comment}
                setComment={setComment}
                submitReview={submitReview}
                submitting={submitting}
                currentDealerId={dealerId}
                currentDealerName={dealerName}
                deleteReview={deleteReview}
                deletingReviewId={deletingReviewId}
                itemPhotoPreview={itemPhotoPreview}
                onItemPhotoChange={handleItemPhotoChange}
              />
            </div>
          )}

          <div className="px-4 mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-900">
                Safety Review Guide
              </h2>

              <div className="mt-5 space-y-4">
                <GuideBox
                  color="green"
                  title="Safe"
                  text="Customer has good repayment or transaction history."
                />
                <GuideBox
                  color="yellow"
                  title="Low Risk"
                  text="Some caution needed based on previous dealer notes."
                />
                <GuideBox
                  color="red"
                  title="High Risk"
                  text="Serious issue reported by one or more dealers."
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
            onClick={() => navigate("/dealer/customer-search")}
            className="text-purple-700 flex flex-col items-center text-xs font-semibold"
          >
            <FaUserFriends className="text-xl mb-1" />
            Customers Review
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
          <div className="bg-white rounded-2xl p-4 w-full max-w-[360px] shadow-2xl">
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

            <div id="aadhaar-qr-reader"
              className="w-full min-h-[420px] overflow-hidden rounded-xl border bg-black"
            />

            {scannerError && (
              <p className="text-sm text-red-600 mt-3">{scannerError}</p>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Live scan fills Aadhaar number only. Then click Check Review.
            </p>
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

function CustomerResult({
  customer,
  aadhaar,
  maskAadhaar,
  riskLevel,
  setRiskLevel,
  comment,
  setComment,
  submitReview,
  submitting,
  currentDealerId,
  currentDealerName,
  deleteReview,
  deletingReviewId,
  itemPhotoPreview,
  onItemPhotoChange,

}: any) {
  function getReviewType(r: any) {
    return r.riskLevel || r.type || "REVIEW";
  }

  function getReviewBadgeClass(type: string) {
    if (type === "SAFE") {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (type === "MEDIUM_RISK") {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }

    if (type === "HIGH_RISK") {
      return "bg-red-100 text-red-700 border-red-200";
    }

    return "bg-gray-100 text-gray-700 border-gray-200";
  }

  function getReviewLabel(type: string) {
    if (type === "SAFE") return "Safe";
    if (type === "MEDIUM_RISK") return "Low Risk";
    if (type === "HIGH_RISK") return "High Risk";
    return type;
  }

  function isOwnReview(r: any) {
    const reviewDealerId =
      r.dealerId || r.dealer?.id || r.createdByDealerId || "";

    const reviewDealerName = (r.dealerName || "").trim().toLowerCase();
    const loggedDealerName = (currentDealerName || "").trim().toLowerCase();

    if (reviewDealerId && currentDealerId) {
      return String(reviewDealerId) === String(currentDealerId);
    }

    return reviewDealerName && reviewDealerName === loggedDealerName;
  }

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
  {/* ✅ Customer Photo Avatar */}
  {customer.customerPhotoBase64 ? (
    <img
      src={`data:${customer.customerPhotoContentType};base64,${customer.customerPhotoBase64}`}
      alt="Customer"
      className="w-10 h-10 rounded-full object-cover border shrink-0"
    />
  ) : (
    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
      {(customer.fullName || customer.name || customer.customerName || "?")
        .charAt(0)
        .toUpperCase()}
    </div>
  )}

  {/* ✅ Name + Aadhaar */}
  <div className="min-w-0">
    <h3 className="font-bold text-xl text-gray-900 truncate">
      {customer.fullName || customer.name || customer.customerName}
    </h3>
    <p className="text-gray-500 text-sm">
      {maskAadhaar(aadhaar)}
    </p>
  </div>
</div>

        <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold shrink-0">
          Reviews: {customer.reviews?.length || 0}
        </span>
      </div>

      <div className="mt-5">
        <h4 className="font-bold text-gray-900 mb-3">Dealer Reviews</h4>

        {!customer.reviews || customer.reviews.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-500">
            No reviews available for this customer.
          </div>
        ) : (
          <div className="space-y-3">
            {customer.reviews.map((r: any, i: number) => {
              const type = getReviewType(r);
              const ownReview = isOwnReview(r);
              const reviewId = r.id || r.reviewId;
              const deleting = deletingReviewId === reviewId;

              return (
                <div
                  key={reviewId || i}
                  className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full border text-xs font-bold ${getReviewBadgeClass(
                            type
                          )}`}
                        >
                          {getReviewLabel(type)}
                        </span>

                        {ownReview && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold">
                            Your Review
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-3 break-words">
                        Dealer:{" "}
                        <span className="font-semibold text-gray-700">
                          {r.dealerName || "Unknown Dealer"}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteReview(reviewId)}
                      disabled={!ownReview || !reviewId || deleting}
                      title={
                        ownReview
                          ? "Delete your review"
                          : "You can delete only your own review"
                      }
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                        ownReview && reviewId
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <FaTrash />
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>

                  <div className="mt-3 bg-gray-50 rounded-2xl p-3 space-y-3">
  {/* ✅ Review Comment */}
  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
    {r.comment || "No comment provided"}
  </p>

  {/* ✅ Item Photo (from DB, Base64) */}
  {r.itemPhotoBase64 && r.itemPhotoContentType && (
    <div className="pt-2 border-t border-gray-200">
      <img
        src={`data:${r.itemPhotoContentType};base64,${r.itemPhotoBase64}`}
        alt="Item"
        className="w-full max-h-60 object-contain rounded-xl border bg-white"
      />
    </div>
  )}
</div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h4 className="font-bold text-gray-900 mb-3">Add Dealer Review</h4>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRiskLevel("SAFE")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              riskLevel === "SAFE"
                ? "bg-green-500 text-white"
                : "bg-green-100 text-green-700"
            }`}
          >
            ✅ Safe
          </button>

          <button
            type="button"
            onClick={() => setRiskLevel("MEDIUM_RISK")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              riskLevel === "MEDIUM_RISK"
                ? "bg-yellow-500 text-white"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            ⚠ Low Risk
          </button>

          <button
            type="button"
            onClick={() => setRiskLevel("HIGH_RISK")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              riskLevel === "HIGH_RISK"
                ? "bg-red-500 text-white"
                : "bg-red-100 text-red-700"
            }`}
          >
            🚫 High Risk
          </button>
        </div>

{/* ✅ Item Photo Upload */}
<div className="mt-4">
  <label className="block text-xs font-semibold text-gray-600 mb-2">
    Item Photo (optional)
  </label>

  {!itemPhotoPreview ? (
    <label className="cursor-pointer flex items-center justify-center border-2 border-dashed rounded-xl p-4 text-sm text-gray-500 hover:bg-gray-50">
      Click to upload item photo
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) =>
          onItemPhotoChange(e.target.files?.[0] || null)
        }
      />
    </label>
  ) : (
    <div className="flex items-center gap-3">
      <img
        src={itemPhotoPreview}
        alt="Item preview"
        className="w-24 h-24 rounded-xl object-cover border"
      />

      <button
        type="button"
        onClick={() => onItemPhotoChange(null)}
        className="text-xs text-red-600 font-bold"
      >
        Remove
      </button>
    </div>
  )}
</div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border mt-4 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Provide details for this review..."
        />

        <button
          type="button"
          onClick={submitReview}
          disabled={submitting}
          className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}
