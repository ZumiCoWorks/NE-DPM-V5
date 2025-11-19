import React, { useState, useEffect, useRef } from 'react';
import { List, Map, Scan, Navigation, MapPin, Camera, WifiOff, ArrowRight, Trophy, CheckCircle } from 'lucide-react';
import jsQR from 'jsqr';
import FloorplanCanvas from '../../components/FloorplanCanvas.jsx';
import { findShortestNodePath, nearestNodeToPoint, nodePathToCoords, GraphNode, GraphSegment } from '../../lib/pathfinding';
import { mockFloorplans, mockNavigationPaths } from '../../services/mockData';

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
  
  type Tab = 'directory' | 'map' | 'scanner';
  type Screen = 'main' | 'ar-reward';
  
  const [activeTab, setActiveTab] = useState<Tab>('directory');
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
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
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphSegments, setGraphSegments] = useState<GraphSegment[]>([]);
  const [floorplanImageUrl, setFloorplanImageUrl] = useState<string | null>(null);
  const [highlightPath, setHighlightPath] = useState<Array<{ x: number; y: number }>>([]);
  const [selectedDestinationNodeId, setSelectedDestinationNodeId] = useState<string | null>(null);

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

  useEffect(() => {
    const url = (import.meta as any).env?.VITE_FLOORPLAN_GRAPH_URL as string | undefined;
    const load = async () => {
      try {
        if (url) {
          const r = await fetch(url);
          const j = await r.json();
          const nodes: GraphNode[] = (j?.nodes || []).map((n: any) => ({ id: n.id, x: n.x, y: n.y, name: n.name, type: n.type }));
          const segments: GraphSegment[] = (j?.segments || []).map((s: any) => ({ id: s.id, start_node_id: s.start_node_id, end_node_id: s.end_node_id }));
          setGraphNodes(nodes);
          setGraphSegments(segments);
          setFloorplanImageUrl(j?.image_url || null);
          const dest = nodes.find((n) => (n.type === 'stage') || /main stage/i.test(n.name || ''));
          setSelectedDestinationNodeId(dest?.id || null);
        } else {
          const fp = mockFloorplans[0];
          const nodes: GraphNode[] = (fp?.nodes || []).map((n: any) => ({ id: String(n.id), x: Number(n.x), y: Number(n.y), name: n.label, type: n.type }));
          setGraphNodes(nodes);
          setGraphSegments([]);
          setFloorplanImageUrl(fp?.image_url || null);
          const dest = nodes.find((n) => (n.type === 'stage') || /main stage/i.test(n.name || ''));
          setSelectedDestinationNodeId(dest?.id || null);
        }
      } catch {}
    };
    load();
  }, []);

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

  const handleGetDirections = (poi: any) => {
    const dest = graphNodes.find((n) => (n.type === 'stage') || /main stage/i.test(n.name || ''));
    setSelectedDestinationNodeId(dest?.id || null);
    setActiveTab('scanner');
  };

  const handleScanNow = () => {
    setActiveTab('scanner');
  };

  const handleQRCodeScanned = async (code: string) => {
    console.log("QR Code scanned:", code);
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
        const parsed = JSON.parse(code);
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
          qr_code_id: code,
          event_id: eventId, // Use actual event ID from URL params or localStorage
          floorplan_id: 'default',
          x: 0,
          y: 0
        };
      }

      setScannedData(qrCodeData);

      await fetchNavigationData(qrCodeData.qr_code_id, qrCodeData.event_id);

      const start = currentLocation && nearestNodeToPoint(graphNodes, currentLocation.x, currentLocation.y);
      const startId = start?.id || null;
      const endId = selectedDestinationNodeId;
      if (startId && endId && graphSegments.length > 0) {
        const nodePath = findShortestNodePath(graphNodes, graphSegments, startId, endId);
        const coords = nodePathToCoords(graphNodes, nodePath);
        setHighlightPath(coords);
      } else {
        const fallback = mockNavigationPaths[0]?.waypoints || [];
        const coords = fallback.map((w: any) => ({ x: Number(w.x), y: Number(w.y) }));
        setHighlightPath(coords);
      }

      // Switch to map tab and show AR reward after delay
      setActiveTab('map');
      setTimeout(() => setCurrentScreen('ar-reward'), 2000);

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

  const handleCloseReward = () => {
    setCurrentScreen('main');
    setActiveTab('directory');
    setScannedData(null);
    setNavigationSteps([]);
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

  const handleQRCodeDetected = (data: string) => {
    console.log('QR Code Detected:', data);
    // Handle the detected QR code data
  };

  // AR Reward Screen
  if (currentScreen === 'ar-reward') {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-green-500 to-emerald-600">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="animate-bounce mb-8">
            <CheckCircle className="w-32 h-32 text-white" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-white text-center mb-4 text-2xl font-bold">Badge Unlocked!</h1>
          
          <p className="text-white/90 text-center mb-8 max-w-md">
            Congratulations! You've successfully completed the navigation challenge.
          </p>

          <button 
            onClick={handleCloseReward}
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Directory Tab */}
        {activeTab === 'directory' && (
          <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-gray-900 text-lg font-semibold">Points of Interest</h1>
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
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Sample POI cards matching mobile app design */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-medium">BCom Project 1</h3>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                        Exhibit
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleGetDirections({ id: '1', name: 'BCom Project 1' })}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"
                  >
                    <MapPin className="w-4 h-4" />
                    Directions
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-medium">PGDI Project 2</h3>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                        Exhibit
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleGetDirections({ id: '2', name: 'PGDI Project 2' })}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"
                  >
                    <MapPin className="w-4 h-4" />
                    Directions
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-medium">Bathrooms</h3>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-700 px-2 py-0.5 text-xs font-medium">
                        Facility
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleGetDirections({ id: '3', name: 'Bathrooms' })}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"
                  >
                    <MapPin className="w-4 h-4" />
                    Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 bg-white border-b border-gray-200">
              <h1 className="text-gray-900 text-lg font-semibold">Event Map</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <FloorplanCanvas
                  floorplanImageUrl={floorplanImageUrl || ''}
                  nodes={[]}
                  segments={[]}
                  pois={[]}
                  highlightPath={highlightPath}
                />
              </div>
              {/* Navigation Results */}
              {scannedData && currentLocation && !isLoading && (
                <div className="space-y-4">
                  {/* Current Location */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center mb-2">
                      <MapPin className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Current Location</h3>
                    </div>
                    <p className="text-gray-600">QR Code: {scannedData.qr_code_id}</p>
                    <p className="text-gray-600">Coordinates: ({currentLocation.x}, {currentLocation.y})</p>
                  </div>

                  {/* Navigation Steps */}
                  {navigationSteps.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Use</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>1. Go to Directory tab</p>
                    <p>2. Tap "Directions" on any POI</p>
                    <p>3. Scan QR code to get location</p>
                    <p>4. Get instant navigation directions</p>
                    <p>5. Unlock special AR rewards</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scanner Tab */}
        {activeTab === 'scanner' && (
          <div className="flex flex-col h-full bg-black">
            <div className="p-4 bg-gray-900 border-b border-gray-800">
              <h1 className="text-white">QR Scanner</h1>
            </div>

            <div className="flex-1 relative overflow-hidden">
              {/* Camera View */}
              {isScanning ? (
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
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center px-6">
                    <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-white mb-2">Camera ready</p>
                    <p className="text-gray-400 text-sm">
                      Tap the camera button below to start scanning
                    </p>
                  </div>
                </div>
              )}

              {/* Scanning Frame Overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-64 h-64">
                    {/* Corner brackets matching mobile app */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {isScanning && (
                <div className="absolute top-1/2 left-0 right-0 mt-40 text-center pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-sm inline-block px-6 py-3 rounded-full">
                    <div className="flex items-center gap-2 text-white">
                      <Scan className="w-5 h-5" />
                      <span>Scan QR Code</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Camera Controls */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                {!isScanning ? (
                  <button
                    onClick={handleQRScan}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Start Scanning</span>
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700"
                  >
                    Stop Scanning
                  </button>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="absolute bottom-20 left-4 right-4 bg-red-500 text-white p-4 rounded-lg flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError('')} className="ml-4">
                  <span className="text-white">×</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Tab Navigator - Matching mobile app design */}
      <nav className="border-t border-gray-200 bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === 'directory'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List className="w-6 h-6 mb-1" />
            <span className="text-xs">Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === 'map'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Map className="w-6 h-6 mb-1" />
            <span className="text-xs">Map</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === 'scanner'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Scan className="w-6 h-6 mb-1" />
            <span className="text-xs">Scanner</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AttendeePWA;
