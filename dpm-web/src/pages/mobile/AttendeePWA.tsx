import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Navigation, MapPin, Camera, WifiOff, ArrowRight, Trophy } from 'lucide-react';
import jsQR from 'jsqr';

interface QRCodeData {
  qr_code_id: string;
  x: number;
  y: number;
  event_id: string;
  floorplan_id: string;
}

interface LocationData {
  x: number;
  y: number;
  qr_code_id: string;
}

interface NavigationStep {
  instruction: string;
  distance: number;
  direction: string;
}

const AttendeePWA: React.FC = () => {
  // Get event ID from URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('event_id') || localStorage.getItem('currentEventId') || 'demo-event-001';
  const [scannedData, setScannedData] = useState<QRCodeData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [arReward, setArReward] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    // Check if we're offline
    const handleOffline = () => setOfflineMode(true);
    const handleOnline = () => setOfflineMode(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Check if app is installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (!isInstalled) {
      setShowInstallPrompt(true);
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      
      // Cleanup camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // PWA Install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Add manifest link for this specific PWA
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/attendee-manifest.json';
    document.head.appendChild(link);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      document.head.removeChild(link);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Start QR scanning
      scanForQRCode();
    } catch (error) {
      console.error('Camera access error:', error);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    const scanFrame = () => {
      if (!isScanning) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            // Found QR code!
            handleQRCodeDetected(code.data);
            return;
          }
        }
      }
      
      // Continue scanning
      requestAnimationFrame(scanFrame);
    };

    scanFrame();
  };

  const handleQRCodeDetected = async (qrData: string) => {
    try {
      // Stop scanning
      setIsScanning(false);
      
      // Stop camera
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }

      setIsLoading(true);
      setError('');

      // Parse QR data - expect format like: {"qr_code_id":"abc123","event_id":"event456"}
      let qrCodeData: QRCodeData;
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.qr_code_id && parsed.event_id) {
          qrCodeData = {
            qr_code_id: parsed.qr_code_id,
            event_id: parsed.event_id,
            floorplan_id: parsed.floorplan_id || 'default',
            x: parsed.x || 0,
            y: parsed.y || 0
          };
        } else {
          throw new Error('Invalid QR code format');
        }
      } catch (parseError) {
        // Fallback: treat entire QR data as qr_code_id
        qrCodeData = {
          qr_code_id: qrData,
          event_id: eventId, // Use actual event ID from URL params or localStorage
          floorplan_id: 'default',
          x: 0,
          y: 0
        };
      }

      setScannedData(qrCodeData);

      // Fetch navigation data from API
      await fetchNavigationData(qrCodeData.qr_code_id, qrCodeData.event_id);

    } catch (error) {
      console.error('QR processing error:', error);
      setError('Failed to process QR code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleQRScan = async () => {
    setIsScanning(true);
    setError('');
    await startCamera();
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const fetchNavigationData = async (qrCodeId: string, eventId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/editor/qr-nodes?event_id=${eventId}&qr_code_id=${qrCodeId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const node = data[0];
        setCurrentLocation({
          x: node.x,
          y: node.y,
          qr_code_id: node.qr_code_id
        });

        // Generate navigation steps based on location
        const steps = generateNavigationSteps(node);
        setNavigationSteps(steps);

        // Check for AR rewards
        if (node.ar_campaign_id) {
          await checkARReward(node.ar_campaign_id);
        }
      } else {
        setError('QR code not found in system. Please scan a valid event QR code.');
      }
    } catch (error) {
      console.error('Navigation data fetch error:', error);
      if (offlineMode) {
        setError('Offline mode: Navigation data not available. Please connect to internet.');
      } else {
        setError('Failed to fetch navigation data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateNavigationSteps = (node: any): NavigationStep[] => {
    // Simple navigation generation based on coordinates
    const steps: NavigationStep[] = [];
    
    if (node.x > 200) {
      steps.push({ instruction: 'Head west towards the main area', distance: 50, direction: 'west' });
    } else if (node.x < 100) {
      steps.push({ instruction: 'Head east towards the exhibition area', distance: 75, direction: 'east' });
    }
    
    if (node.y > 200) {
      steps.push({ instruction: 'Walk north to reach the booths', distance: 30, direction: 'north' });
    } else if (node.y < 100) {
      steps.push({ instruction: 'Head south towards the entrance', distance: 40, direction: 'south' });
    }

    // Add specific destination info if available
    if (node.poi_name) {
      steps.push({ instruction: `You have arrived at ${node.poi_name}`, distance: 0, direction: 'arrived' });
    } else if (node.booth_number) {
      steps.push({ instruction: `You have arrived at Booth ${node.booth_number}`, distance: 0, direction: 'arrived' });
    }

    return steps.length > 0 ? steps : [
      { instruction: 'You are here! Check the map for nearby attractions.', distance: 0, direction: 'here' }
    ];
  };

  const checkARReward = async (campaignId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ar-campaigns/${campaignId}/reward`);
      if (response.ok) {
        const reward = await response.json();
        setArReward(reward.message || 'Special offer unlocked!');
      }
    } catch (error) {
      console.error('AR reward check error:', error);
    }
  };

  const handleInstallApp = () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        (window as any).deferredPrompt = null;
      });
    } else {
      alert('To install: Tap the share button → Add to Home Screen (iOS) or use the install button in the address bar (Android)');
    }
    setShowInstallPrompt(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-800">NavEaze Attendee</h1>
          <div className="flex items-center space-x-2">
            {offlineMode ? (
              <WifiOff className="w-5 h-5 text-red-500" />
            ) : (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            <span className="text-sm text-gray-600">
              {offlineMode ? 'Offline' : 'Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">Install NavEaze</h3>
              <p className="text-sm text-blue-600">Install this app for better performance</p>
            </div>
            <button
              onClick={handleInstallApp}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* QR Scanner */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Scan QR Code</h2>
          {!isScanning ? (
            <button
              onClick={handleQRScan}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Scan QR</span>
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Stop Scanning
            </button>
          )}
        </div>

        {/* Camera Preview */}
        {isScanning && (
          <div className="relative mb-4">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover rounded-lg"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-blue-500 rounded-lg opacity-50"></div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              Point camera at QR code...
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading navigation data...</span>
          </div>
        )}
      </div>

      {/* Navigation Results */}
      {scannedData && currentLocation && !isLoading && (
        <div className="space-y-4">
          {/* Current Location */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center mb-2">
              <MapPin className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Current Location</h3>
            </div>
            <p className="text-gray-600">QR Code: {scannedData.qr_code_id}</p>
            <p className="text-gray-600">Coordinates: ({currentLocation.x}, {currentLocation.y})</p>
          </div>

          {/* Navigation Steps */}
          {navigationSteps.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center mb-3">
                <Navigation className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Navigation</h3>
              </div>
              <div className="space-y-3">
                {navigationSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800">{step.instruction}</p>
                      {step.distance > 0 && (
                        <p className="text-sm text-gray-500">{step.distance}m {step.direction}</p>
                      )}
                    </div>
                    {step.direction !== 'arrived' && step.direction !== 'here' && (
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AR Reward */}
          {arReward && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
              <div className="flex items-center mb-2">
                <Trophy className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-semibold">🎉 Reward Unlocked!</h3>
              </div>
              <p>{arReward}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions for first-time users */}
      {!scannedData && !isScanning && !isLoading && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Use</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. Tap "Scan QR" to open camera</p>
            <p>2. Point camera at event QR codes</p>
            <p>3. Get instant navigation directions</p>
            <p>4. Unlock special AR rewards</p>
            <p>5. Install as app for best experience</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendeePWA;