import { useState, useEffect, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import jsQR from 'jsqr';
import { Button } from './ui/button';

interface ScannerScreenProps {
  onScanSuccess: (data: string) => void;
}

export function ScannerScreen({ onScanSuccess }: ScannerScreenProps) {
  const [error, setError] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        setCameraPermission('granted');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          scanQRCode();
        }
      } catch (err) {
        // Camera permission denied - this is expected in preview environments
        setCameraPermission('denied');
        setError('Camera permission denied. Please enable camera access or use demo mode.');
      }
    };

    const scanQRCode = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          onScanSuccess(code.data);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    };

    startCamera();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onScanSuccess]);

  const handleDemoScan = () => {
    // Simulate scanning a QR code with demo data
    const demoData = JSON.stringify({
      name: 'John Doe',
      email: 'john.doe@email.com',
    });
    onScanSuccess(demoData);
  };

  return (
    <div className="relative h-screen w-full bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-6">
        <h1 className="text-white text-center">Scan Attendee QR Code</h1>
        <p className="text-white/80 text-center text-sm mt-2">
          {cameraPermission === 'granted' 
            ? 'Position the QR code within the frame'
            : 'Camera access required'}
        </p>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {cameraPermission === 'denied' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center px-6 max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
                <Camera className="w-10 h-10 text-white/60" />
              </div>
              <h2 className="text-white mb-3">Camera Access Required</h2>
              <p className="text-white/70 text-sm mb-8">
                This app needs camera permission to scan QR codes. Please enable camera access in your browser settings.
              </p>
              <Button 
                onClick={handleDemoScan}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Try Demo Mode
              </Button>
              <p className="text-white/50 text-xs mt-4">
                Demo mode uses sample attendee data
              </p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                {/* Corner borders */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && cameraPermission === 'granted' && (
        <div className="absolute bottom-20 left-4 right-4 bg-red-500 text-white p-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Instructions */}
      {cameraPermission === 'granted' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <p className="text-white/90 text-center text-sm">
            Hold your device steady and align the QR code
          </p>
        </div>
      )}
    </div>
  );
}
