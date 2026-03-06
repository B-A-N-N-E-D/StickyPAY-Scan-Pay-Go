// ==========================================================
// 📦 BarcodeScanner.jsx
// Stable version - No double stop() crash
// ==========================================================

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BarcodeScanner({
  onScan,
  onClose,
  storeName,
  scanType = "barcode",
}) {
  // ==================================================
  // 🔹 Refs & State
  // ==================================================

  const scannerRef = useRef(null);
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(true);

  // ==================================================
  // 🔹 Start Scanner
  // ==================================================

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          aspectRatio: 1.777,
          qrbox: scanType === "store"
            ? { width: 250, height: 250 }
            : { width: 300, height: 120 },
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          formatsToSupport: scanType === "store"
            ? [Html5QrcodeSupportedFormats.QR_CODE]
            : [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.CODE_128
              ]
        },
        (decodedText) => {
          if (scanned) return;

          setScanned(true);

          const cleanCode = decodedText.trim();

          scannerRef.current.stop().then(() => {
            onScan(cleanCode);
          });
        },
        () => { }
      )
      .catch((err) => {
        console.error("Camera start error:", err);
      });

    return () => {
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();

          // Only stop if actively scanning
          if (state === 2) {
            scannerRef.current.stop().then(() => {
              scannerRef.current.clear();
            });
          }
        } catch (err) {
          console.log("Scanner already cleaned");
        }
      }
    };
  }, [onScan]);

  // ======================================================
  // 🔦 Toggle Flash
  // ======================================================

  const toggleFlash = async () => {
    if (!scannerRef.current) return;

    try {
      const newState = !flashOn;

      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState }],
      });

      setFlashOn(newState);
    } catch (err) {
      console.log("Flash not supported");
    }
  };

  // ==================================================
  // 🎨 UI
  // ==================================================

  return (
    <div className="fixed inset-0 z-50 bg-black">

      {/* ================= Header ================= */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            {storeName ? (
              <>
                <p className="text-gray-400 text-xs">Shopping at</p>
                <h2 className="text-yellow-400 font-bold text-lg">
                  {storeName}
                </h2>
              </>
            ) : (
              <h2 className="text-white font-semibold">
                {scanType === "store"
                  ? "Scan Store QR Code"
                  : "Scan Product Barcode"}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasFlash && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFlash}
                className="text-white hover:bg-white/10"
              >
                {flashOn ? (
                  <Zap className="w-6 h-6 text-yellow-400" />
                ) : (
                  <ZapOff className="w-6 h-6" />
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* ================= Scanner Area ================= */}
      <div className="absolute inset-0 flex items-center justify-center">

        {/* ===== STORE QR SCANNER (Full Square) ===== */}
        {scanType === "store" && (
          <div className="relative w-64 h-64">
            <div id="reader" className="w-full h-full rounded-2xl overflow-hidden" />

            <div className="absolute inset-0 border-2 border-yellow-400 rounded-2xl" />
          </div>
        )}

        {/* ===== BARCODE SCANNER (Small Rectangle) ===== */}
        {scanType === "barcode" && (
          <div className="relative w-[90%] max-w-md h-40">

            <div
              id="reader"
              className="w-full h-full rounded-xl overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
            />

            {/* Border removed as it overlapped with corners */}

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl" />

            {/* Vertical Scan Line (moving horizontally) */}
            <div
              className="absolute top-4 bottom-4 w-[2px] bg-yellow-400 shadow-[0_0_8px_2px_rgba(250,204,21,0.5)] z-10"
              style={{ animation: "scan-horizontal 2s ease-in-out infinite alternate" }}
            />

          </div>
        )}

      </div>

      {/* ================= Bottom Info ================= */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-gray-400 text-center text-sm">
          {scanType === "store"
            ? "Position the store QR code within the frame"
            : "Point at product barcode to scan"}
        </p>
      </div>

      {/* Animation & Overrides */}
      <style>{`
        #qr-shaded-region {
          display: none !important;
        }
        @keyframes scan-horizontal {
          0% { left: 5%; opacity: 0.8; }
          100% { left: 95%; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}