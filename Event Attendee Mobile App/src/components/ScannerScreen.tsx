import { useEffect, useRef, useState } from "react";
import { Scan, Camera } from "lucide-react";
import { Button } from "./ui/button";

interface ScannerScreenProps {
  onQRCodeScanned?: (code: string) => void;
}

export function ScannerScreen({ onQRCodeScanned }: ScannerScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasPermission(false);
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        // Silently handle camera permission denial - this is expected in many contexts
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const simulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onQRCodeScanned?.("QR_MARKER_A1");
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="p-4 bg-gray-900 border-b border-gray-800">
        <h1 className="text-white">QR Scanner</h1>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {/* Camera View */}
        {hasPermission === true ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : hasPermission === false ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center px-6">
              <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-white mb-2">Camera access denied</p>
              <p className="text-gray-400 text-sm">
                Please enable camera permissions to scan QR codes
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-white">Loading camera...</div>
          </div>
        )}

        {/* Scanning Frame Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white rounded-br-lg"></div>
            
            {/* Scanning line animation */}
            {isScanning && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute top-1/2 left-0 right-0 mt-40 text-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm inline-block px-6 py-3 rounded-full">
            <div className="flex items-center gap-2 text-white">
              <Scan className="w-5 h-5" />
              <span>Scan QR Code</span>
            </div>
          </div>
        </div>

        {/* Demo Button (for testing without actual QR code) */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <Button
            size="lg"
            onClick={simulateScan}
            disabled={isScanning}
            className="pointer-events-auto"
          >
            {isScanning ? "Scanning..." : "Simulate QR Scan (Demo)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
