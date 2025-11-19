import { useState, useEffect, useRef } from "react";
import { List, Map, Scan } from "lucide-react";
import { Button } from "../components/ui/button";
import jsQR from "jsqr";

interface ScannerScreenProps {
  onQRCodeScanned?: (code: string) => void;
}

export function ScannerScreen({ onQRCodeScanned }: ScannerScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scanInterval = useRef<number>();

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
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
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (scanInterval.current) window.clearInterval(scanInterval.current);
    };
  }, []);

  useEffect(() => {
    if (hasPermission !== true) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    scanInterval.current = window.setInterval(() => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        window.clearInterval(scanInterval.current!);
        setIsScanning(true);
        setTimeout(() => {
          setIsScanning(false);
          onQRCodeScanned?.(code.data);
        }, 500);
      }
    }, 200);
    return () => {
      if (scanInterval.current) window.clearInterval(scanInterval.current);
    };
  }, [hasPermission, onQRCodeScanned]);

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="p-4 bg-gray-900 border-b border-gray-800">
        <h1 className="text-white text-lg font-semibold">QR Scanner</h1>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {/* Camera View */}
        {hasPermission === true ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : hasPermission === false ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center px-6">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-white mb-2 font-medium">Camera access denied</p>
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
              <span className="text-sm">Scan QR Code</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}