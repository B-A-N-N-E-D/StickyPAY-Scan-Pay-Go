// ==========================================================
// 📦 BarcodeScanner.jsx
// Fixed: camera reliably stops on mobile + desktop
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
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);
  const isStoppingRef = useRef(false); // prevent double-stop race
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(true);

  // ────────────────────────────────────────────────────────
  // killCamera: stop html5qrcode library, then forcefully
  // revoke every video-track on the page (belt + suspenders)
  // ────────────────────────────────────────────────────────
  const killCamera = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    // 1. Stop the html5qrcode scanner
    const scanner = scannerRef.current;
    if (scanner) {
      scannerRef.current = null;
      try {
        const state = scanner.getState();
        // state 2 = SCANNING, state 1 = PAUSED
        if (state === 2 || state === 1) {
          await scanner.stop();
        }
      } catch (_) {}
      try { await scanner.clear(); } catch (_) {}

      scannerRef.current = null;   // ✅ MOVE THIS LINE DOWN
    }

    // 2. Nuke every active MediaTrack on the page via enumerateDevices approach
    //    This catches any stream html5qrcode opened internally
    
    await new Promise(resolve => setTimeout(resolve, 100));

    document.querySelectorAll("video").forEach((v) => {
      try {
        v.pause();
        if (v.srcObject) {
          v.srcObject.getTracks().forEach((t) => {
            t.stop();
            t.enabled = false;
          });
          v.srcObject = null;
        }
        v.src = "";
        v.load();
        v.remove();
      } catch (_) {}
    });

    // 3. Clear the reader div so html5qrcode cannot re-attach
    const readerEl = document.getElementById("reader");
    if (readerEl) readerEl.innerHTML = "";
  };

  useEffect(() => {
    scannedRef.current = false;
    isStoppingRef.current = false;

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          aspectRatio: 1.777,
          qrbox:
            scanType === "store"
              ? { width: 260, height: 260 }
              : { width: 300, height: 120 },
          videoConstraints: { facingMode: "environment" },
          formatsToSupport:
            scanType === "store"
              ? [Html5QrcodeSupportedFormats.QR_CODE]
              : [
                  Html5QrcodeSupportedFormats.EAN_13,
                  Html5QrcodeSupportedFormats.EAN_8,
                  Html5QrcodeSupportedFormats.UPC_A,
                  Html5QrcodeSupportedFormats.CODE_128,
                ],
        },
        async (decodedText) => {
          if (scannedRef.current) return;
          if (isStoppingRef.current) return;

          // Reject garbage / partial reads
          const clean = decodedText.trim();
          if (!clean || clean.length < 4) return;
          if (/[^\x20-\x7E]/.test(clean)) return;
          if (clean.length > 50) return;

          scannedRef.current = true;
          await killCamera();
          onScan(clean);
        },
        () => {}
      )
      .catch((err) => {
        console.error("Camera start error:", err);
      });

    // Cleanup runs on unmount (navigation, close, or scan success)
    return () => {
      killCamera().catch(() =>{});;
    };
  }, [scanType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = async () => {
    scannedRef.current = true;  // ✅ prevent scan firing after close
    await killCamera();
    onClose();
  };

  const toggleFlash = async () => {
    if (!scannerRef.current) return;
    try {
      const newState = !flashOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState }],
      });
      setFlashOn(newState);
    } catch (_) {
      setHasFlash(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            {storeName ? (
              <>
                <p className="text-gray-400 text-xs">Shopping at</p>
                <h2 className="text-yellow-400 font-bold text-lg">{storeName}</h2>
              </>
            ) : (
              <h2 className="text-white font-semibold">
                {scanType === "store" ? "Scan Store QR Code" : "Scan Product Barcode"}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFlash && (
              <Button variant="ghost" size="icon" onClick={toggleFlash} className="text-white hover:bg-white/10">
                {flashOn
                  ? <Zap className="w-6 h-6 text-yellow-400" />
                  : <ZapOff className="w-6 h-6" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/10">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {scanType === "store" && (
          <div className="relative w-64 h-64">
            <div id="reader" className="w-full h-full rounded-2xl overflow-hidden" />
            <div className="absolute inset-0 border-2 border-yellow-400 rounded-2xl pointer-events-none" />
          </div>
        )}

        {scanType === "barcode" && (
          <div className="relative w-[90%] max-w-md h-40">
            <div
              id="reader"
              className="w-full h-full rounded-xl overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
            />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl pointer-events-none" />
            <div
              className="absolute top-4 bottom-4 w-[2px] bg-yellow-400 shadow-[0_0_8px_2px_rgba(250,204,21,0.5)] z-10 pointer-events-none"
              style={{ animation: "scan-horizontal 2s ease-in-out infinite alternate" }}
            />
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-gray-400 text-center text-sm">
          {scanType === "store"
            ? "Position the store QR code within the frame"
            : "Point at product barcode to scan"}
        </p>
      </div>

      <style>{`
        #qr-shaded-region { display: none !important; }
        @keyframes scan-horizontal {
          0%   { left: 5%;  opacity: 0.8; }
          100% { left: 95%; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
