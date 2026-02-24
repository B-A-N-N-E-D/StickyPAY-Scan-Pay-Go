import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Html5QrcodeSupportedFormats } from "html5-qrcode";

formatsToSupport: [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
]
export default function BarcodeScanner({
  onScan,
  onClose,
  storeName,
  scanType = "barcode",
}) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          html5QrCode.stop().then(() => {
            onScan(decodedText);
          });
        },
        () => {}
      )
      .catch((err) => {
        console.error("Camera start error:", err);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {storeName && (
              <div className="text-left">
                <p className="text-gray-400 text-xs">Shopping at</p>
                <h2 className="text-yellow-400 font-bold text-lg">
                  {storeName}
                </h2>
              </div>
            )}
            {!storeName && scanType === "store" && (
              <h2 className="text-white font-semibold">
                Scan Store QR Code
              </h2>
            )}
            {!storeName && scanType !== "store" && (
              <h2 className="text-white font-semibold">
                Scan Product Barcode
              </h2>
            )}
          </div>

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

      {/* Scanner Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* This div is where html5-qrcode renders camera */}
          <div id="reader" className="w-64 h-64 overflow-hidden rounded-2xl" />

          {/* Overlay Frame */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-64 h-64 border-2 border-yellow-400 rounded-2xl relative">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl" />

              {/* Animated scan line */}
              <div
                className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
                style={{ animation: "scan 2s ease-in-out infinite" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-gray-400 text-center text-sm mb-4">
          {scanType === "store"
            ? "Position the store QR code within the frame"
            : "Point at product barcode to scan"}
        </p>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(230px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}