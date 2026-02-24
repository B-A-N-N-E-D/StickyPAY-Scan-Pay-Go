import { useEffect, useRef } from "react";

export default function Scanner({ mode = "item", onScan }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250,
          },
          (decodedText) => {
            console.log("Scanned:", decodedText);
            if (onScan) onScan(decodedText);
          }
        );
      } catch (err) {
        console.error("Scanner Error:", err);
      }
    };

    setTimeout(startScanner, 500);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center">

      {/* Title */}
      <div className="absolute top-20 text-center">
        <h2 className="text-2xl font-bold text-yellow-400">
          {mode === "store" ? "Scan Store QR" : "Scan the Barcode"}
        </h2>
        <p className="text-gray-400 mt-2 text-sm">
          {mode === "store"
            ? "Align the store QR code inside the frame"
            : "Align the product barcode inside the frame"}
        </p>
      </div>

      {/* Scanner Box */}
      <div className="relative mt-20">
        <div
          id="reader"
          className="rounded-xl overflow-hidden border-4 border-yellow-400"
          style={{ width: 300 }}
        />

        {/* Animated Scan Line */}
        <div className="absolute inset-0 flex justify-center">
          <div className="w-full h-1 bg-yellow-400 animate-pulse opacity-80" />
        </div>
      </div>

    </div>
  );
}