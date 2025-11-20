import React, { useState, useEffect, useRef } from 'react';
import { List, Map, Scan, Navigation, MapPin, Camera, WifiOff, ArrowRight, Trophy, CheckCircle, Satellite } from 'lucide-react';
import jsQR from 'jsqr';
import FloorplanCanvas from '../../components/FloorplanCanvas.jsx';
import { findShortestNodePath, nearestNodeToPoint, nodePathToCoords, GraphNode, GraphSegment } from '../../lib/pathfinding';
import { mockFloorplans, mockNavigationPaths } from '../../services/mockData';
import { 
  getCurrentGPSPosition, 
  watchGPSPosition, 
  stopWatchingGPS, 
  gpsToFloorplan,
  isWithinBounds,
  type GPSCoordinate,
  type GPSBounds,
  type FloorplanDimensions
} from '../../lib/gpsNavigation';

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
  qr_code_id?: string;
  source: 'qr' | 'gps';
  accuracy?: number;
}

interface EventData {
  id: string;
  name: string;
  navigation_mode: 'indoor' | 'outdoor' | 'hybrid';
  gps_center_lat?: number;
  gps_center_lng?: number;
  gps_bounds_ne_lat?: number;
  gps_bounds_ne_lng?: number;
  gps_bounds_sw_lat?: number;
  gps_bounds_sw_lng?: number;
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
  const [message, setMessage] = useState<string>('');
  const [showMessage, setShowMessage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphSegments, setGraphSegments] = useState<GraphSegment[]>([]);
  const [floorplanImageUrl, setFloorplanImageUrl] = useState<string | null>(null);
  const [highlightPath, setHighlightPath] = useState<Array<{ x: number; y: number }>>([]);
  const [selectedDestinationNodeId, setSelectedDestinationNodeId] = useState<string | null>(null);
  
  // GPS Navigation state
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [currentGPS, setCurrentGPS] = useState<GPSCoordinate | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
  const [floorplanDimensions, setFloorplanDimensions] = useState<FloorplanDimensions>({ width: 1000, height: 1000 });
  const [floorplanCalibration, setFloorplanCalibration] = useState<any>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  // Helper function to show temporary messages
  const displayMessage = (msg: string, duration: number = 3000) => {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, duration);
  };

  // Calculate and display navigation route
  const calculateAndDisplayRoute = (currentPos: LocationData, destinationNodeId: string) => {
    if (!graphNodes.length || !graphSegments.length) {
      console.warn('⚠️ No navigation graph data available');
      return;
    }

    // Find nearest node to current position
    const startNode = nearestNodeToPoint(graphNodes, currentPos.x, currentPos.y);
    if (!startNode) {
      console.warn('⚠️ No start node found near current position');
      return;
    }

    console.log('🧭 Calculating route from', startNode.name || startNode.id, 'to', destinationNodeId);

    // Calculate shortest path
    const nodePath = findShortestNodePath(graphNodes, graphSegments, startNode.id, destinationNodeId);
    
    if (nodePath.length === 0) {
      console.warn('⚠️ No path found to destination');
      displayMessage('No route found to destination', 3000);
      setHighlightPath([]);
      return;
    }

    // Convert node IDs to coordinates for visualization
    const routeCoords = nodePathToCoords(graphNodes, nodePath);
    
    // Add current GPS position as first point
    const fullRoute = [{ x: currentPos.x, y: currentPos.y }, ...routeCoords];
    
    setHighlightPath(fullRoute);
    
    console.log('✅ Route calculated:', nodePath.length, 'nodes,', routeCoords.length, 'waypoints');
    console.log('📍 Route:', nodePath.map(id => {
      const node = graphNodes.find(n => n.id === id);
      return node?.name || id.substring(0, 8);
    }).join(' → '));
  };

  // Fetch event data to determine navigation mode
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // Try API first (requires auth)
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        if (response.ok) {
          const data = await response.json();
          setEventData(data);
          
          // Auto-enable GPS for outdoor or hybrid events
          if (data.navigation_mode === 'outdoor' || data.navigation_mode === 'hybrid') {
            enableGPSTracking();
          }
        } else {
          // Fallback: fetch directly from Supabase (public access)
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY
          );
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
          
          if (!error && data) {
            setEventData(data);
            if (data.navigation_mode === 'outdoor' || data.navigation_mode === 'hybrid') {
              enableGPSTracking();
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch event data:', err);
      }
    };
    
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  // Cleanup GPS watch on unmount
  useEffect(() => {
    return () => {
      if (gpsWatchId !== null) {
        stopWatchingGPS(gpsWatchId);
      }
    };
  }, [gpsWatchId]);

  const enableGPSTracking = () => {
    try {
      const watchId = watchGPSPosition(
        (gps, accuracy) => {
          setCurrentGPS(gps);
          setGpsAccuracy(accuracy);
          setGpsEnabled(true);
          
          // Convert GPS to floorplan coordinates if we have event bounds
          if (eventData && eventData.gps_bounds_ne_lat && eventData.gps_bounds_sw_lat) {
            const gpsBounds: GPSBounds = {
              ne: { lat: eventData.gps_bounds_ne_lat, lng: eventData.gps_bounds_ne_lng! },
              sw: { lat: eventData.gps_bounds_sw_lat, lng: eventData.gps_bounds_sw_lng! }
            };
            
            if (isWithinBounds(gps, gpsBounds)) {
              const floorplanCoord = gpsToFloorplan(gps, gpsBounds, floorplanDimensions);
              setCurrentLocation({
                x: floorplanCoord.x,
                y: floorplanCoord.y,
                source: 'gps',
                accuracy
              });
            }
          }
        },
        (error) => {
          console.error('GPS error:', error);
          setError('GPS positioning unavailable. Please enable location services.');
        }
      );
      
      setGpsWatchId(watchId);
    } catch (err) {
      console.error('Failed to enable GPS:', err);
      setError('GPS not supported on this device');
    }
  };

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

  // Load navigation data from Supabase database
  useEffect(() => {
    const loadNavigationData = async () => {
      console.log('🔍 Loading navigation data for event:', eventId);
      
      if (!eventId) {
        console.warn('⚠️ No eventId - skipping navigation data load');
        return;
      }
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        console.log('📡 Fetching navigation points from database...');
        // Fetch navigation points (nodes and POIs)
        const { data: points, error: pointsError } = await supabase
          .from('navigation_points')
          .select('*')
          .eq('event_id', eventId);

        if (pointsError) {
          console.error('❌ Error loading navigation points:', pointsError);
          return;
        }

        console.log('✅ Raw navigation points:', points);

        console.log('📡 Fetching navigation segments from database...');
        // Fetch navigation segments
        const { data: segments, error: segmentsError } = await supabase
          .from('navigation_segments')
          .select('*')
          .eq('event_id', eventId);

        if (segmentsError) {
          console.error('❌ Error loading navigation segments:', segmentsError);
          return;
        }

        console.log('✅ Raw navigation segments:', segments);

        // Convert database points to GraphNode format
        const nodes: GraphNode[] = (points || [])
          .filter((p: any) => p.point_type === 'node' || p.point_type === 'poi')
          .map((p: any) => ({
            id: p.id,
            x: Number(p.x_coord),
            y: Number(p.y_coord),
            name: p.name || `Node ${p.id.substring(0, 8)}`,
            type: p.point_type === 'poi' ? 'poi' : 'node'
          }));

        // Convert database segments to GraphSegment format
        const graphSegs: GraphSegment[] = (segments || []).map((s: any) => ({
          id: s.id,
          start_node_id: s.start_node_id,
          end_node_id: s.end_node_id
        }));

        console.log('📍 Loaded navigation data:', {
          rawPoints: points?.length || 0,
          rawSegments: segments?.length || 0,
          convertedNodes: nodes.length,
          convertedSegments: graphSegs.length,
          nodes,
          segments: graphSegs
        });

        setGraphNodes(nodes);
        setGraphSegments(graphSegs);

        // Find a destination POI or node
        const dest = nodes.find((n) => n.type === 'poi') || nodes[0];
        setSelectedDestinationNodeId(dest?.id || null);
        
        console.log('🎯 Selected destination:', dest?.name || dest?.id);

        // Load floorplan image
        console.log('🖼️ Fetching floorplan image for event...');
        const { data: floorplan, error: floorplanError } = await supabase
          .from('floorplans')
          .select('image_url, image_width, image_height, gps_top_left_lat, gps_top_left_lng, gps_bottom_right_lat, gps_bottom_right_lng')
          .eq('event_id', eventId)
          .maybeSingle();

        if (floorplanError) {
          console.error('❌ Error loading floorplan:', floorplanError);
        } else if (floorplan?.image_url) {
          console.log('✅ Floorplan image loaded:', floorplan.image_url);
          setFloorplanImageUrl(floorplan.image_url);
          
          // Set dimensions if available
          if (floorplan.image_width && floorplan.image_height) {
            setFloorplanDimensions({
              width: floorplan.image_width,
              height: floorplan.image_height
            });
          }
          
          // Store GPS calibration if available
          if (floorplan.gps_top_left_lat && floorplan.gps_bottom_right_lat) {
            setFloorplanCalibration({
              topLeft: { lat: floorplan.gps_top_left_lat, lng: floorplan.gps_top_left_lng },
              bottomRight: { lat: floorplan.gps_bottom_right_lat, lng: floorplan.gps_bottom_right_lng }
            });
          }
        } else {
          console.warn('⚠️ No floorplan image found for event');
        }

      } catch (error) {
        console.error('💥 Failed to load navigation data:', error);
      }
    };

    loadNavigationData();
  }, [eventId]);

  // Auto-recalculate route when GPS position updates or destination changes
  useEffect(() => {
    if (currentLocation && selectedDestinationNodeId && graphNodes.length > 0 && graphSegments.length > 0) {
      console.log('🔄 Recalculating route due to position/destination change');
      calculateAndDisplayRoute(currentLocation, selectedDestinationNodeId);
    }
  }, [currentLocation, selectedDestinationNodeId, graphNodes, graphSegments]);

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
    setSelectedDestinationNodeId(poi.id);
    
    // For GPS-enabled events (outdoor/hybrid), switch to map and use GPS
    // For indoor-only events, switch to scanner for QR positioning
    if (eventData?.navigation_mode === 'outdoor' || eventData?.navigation_mode === 'hybrid') {
      setActiveTab('map');
      
      // Calculate route immediately if we have GPS position
      if (gpsEnabled && currentLocation) {
        calculateAndDisplayRoute(currentLocation, poi.id);
        displayMessage('GPS navigation active - follow the route on map', 3000);
      } else {
        displayMessage('Enable GPS location to start navigation', 3000);
      }
    } else {
      // Indoor mode: need QR scan for positioning
      setActiveTab('scanner');
    }
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
          qr_code_id: node.qr_code_id,
          source: 'qr'
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
            <div className="p-4 bg-brand-black border-b-4 border-brand-yellow">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-white text-xl font-bold tracking-tight">NavEaze</h1>
                  <p className="text-gray-300 text-xs mt-0.5">Points of Interest</p>
                </div>
                <div className="flex items-center space-x-2">
                  {offlineMode ? (
                    <WifiOff className="w-5 h-5 text-brand-red" />
                  ) : (
                    <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                  )}
                  <span className="text-sm text-gray-300">
                    {offlineMode ? 'Offline' : 'Online'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Dynamic POI cards from database */}
              {graphNodes.filter(n => n.type === 'poi').length > 0 ? (
                graphNodes.filter(n => n.type === 'poi').map((poi) => (
                  <div key={poi.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-medium">{poi.name}</h3>
                        <div className="mt-2">
                          <span className="inline-flex items-center rounded-full bg-yellow-50 text-gray-900 px-2 py-0.5 text-xs font-medium border border-yellow-200">
                            Point of Interest
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleGetDirections(poi)}
                        className="bg-accent text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-red-700 transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        Directions
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-gray-900 font-medium mb-1">No Points of Interest Yet</h3>
                  <p className="text-gray-500 text-sm">
                    POIs will appear here once they're added to the event map.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 bg-white border-b border-gray-200">
              <h1 className="text-gray-900 text-lg font-semibold">Event Map</h1>
              
              {/* GPS Status Indicator */}
              {eventData && (eventData.navigation_mode === 'outdoor' || eventData.navigation_mode === 'hybrid') && (
                <div className={`mt-2 flex items-center text-sm ${gpsEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                  <Satellite className="w-4 h-4 mr-1" />
                  {gpsEnabled ? (
                    <span>GPS Active • Accuracy: {gpsAccuracy.toFixed(0)}m</span>
                  ) : (
                    <span>GPS Searching...</span>
                  )}
                  {currentGPS && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({currentGPS.lat.toFixed(6)}, {currentGPS.lng.toFixed(6)})
                    </span>
                  )}
                </div>
              )}
              
              {/* Navigation Mode Badge */}
              {eventData && (
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-brand-gray-light text-brand-gray-dark border border-gray-300">
                    {eventData.navigation_mode === 'outdoor' && '📍 Outdoor GPS Navigation'}
                    {eventData.navigation_mode === 'indoor' && '🏢 Indoor QR Navigation'}
                    {eventData.navigation_mode === 'hybrid' && '🌐 Hybrid GPS + QR Navigation'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4 w-full">
                <FloorplanCanvas
                  floorplanImageUrl={floorplanImageUrl || ''}
                  nodes={graphNodes}
                  segments={graphSegments}
                  pois={graphNodes.filter(n => n.type === 'poi')}
                  highlightPath={highlightPath}
                  currentLocation={currentLocation ? { x: currentLocation.x, y: currentLocation.y } : undefined}
                  fitToContainer={true}
                  containerWidth={window.innerWidth - 32}
                  containerHeight={window.innerHeight * 0.5}
                  mode="pan"
                />
              </div>
              {/* Navigation Results */}
              {currentLocation && !isLoading && (
                <div className="space-y-4">
                  {/* Current Location */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center mb-2">
                      <MapPin className={`w-5 h-5 mr-2 ${currentLocation.source === 'gps' ? 'text-blue-600' : 'text-green-600'}`} />
                      <h3 className="text-lg font-semibold text-gray-800">Current Location</h3>
                      <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gray-100">
                        {currentLocation.source === 'gps' ? '📡 GPS' : '📷 QR Scanned'}
                      </span>
                    </div>
                    {currentLocation.source === 'qr' && currentLocation.qr_code_id && (
                      <p className="text-gray-600">QR Code: {currentLocation.qr_code_id}</p>
                    )}
                    {currentLocation.source === 'gps' && currentLocation.accuracy && (
                      <p className="text-gray-600">GPS Accuracy: ±{currentLocation.accuracy.toFixed(0)}m</p>
                    )}
                    <p className="text-gray-600 text-sm">Coordinates: ({currentLocation.x.toFixed(0)}, {currentLocation.y.toFixed(0)})</p>
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
              {!currentLocation && !isScanning && !isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Use</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {eventData?.navigation_mode === 'outdoor' ? (
                      <>
                        <p>1. Your location is tracked automatically using GPS</p>
                        <p>2. Go to Directory tab to see nearby points of interest</p>
                        <p>3. Tap "Directions" to navigate to any location</p>
                        <p>4. Follow the map to your destination</p>
                      </>
                    ) : eventData?.navigation_mode === 'hybrid' ? (
                      <>
                        <p>1. GPS tracking is active for outdoor navigation</p>
                        <p>2. Scan QR codes at indoor locations for better accuracy</p>
                        <p>3. Tap "Directions" on any POI to navigate</p>
                        <p>4. Unlock special AR rewards at key locations</p>
                      </>
                    ) : (
                      <>
                        <p>1. Go to Directory tab</p>
                        <p>2. Tap "Directions" on any POI</p>
                        <p>3. Scan QR code to get your location</p>
                        <p>4. Get instant navigation directions</p>
                        <p>5. Unlock special AR rewards</p>
                      </>
                    )}
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
              <h1 className="text-white text-lg font-semibold">QR Scanner</h1>
              {eventData?.navigation_mode === 'hybrid' && (
                <p className="text-gray-400 text-sm mt-1">
                  Optional: Scan QR codes indoors for improved accuracy
                </p>
              )}
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
                ? 'text-brand-black bg-yellow-50 border-t-2 border-brand-yellow'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === 'map'
                ? 'text-brand-black bg-yellow-50 border-t-2 border-brand-yellow'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Map className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Map</span>
          </button>

          {/* Hide Scanner tab for outdoor-only events (GPS-only navigation) */}
          {eventData?.navigation_mode !== 'outdoor' && (
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                activeTab === 'scanner'
                  ? 'text-brand-black bg-yellow-50 border-t-2 border-brand-yellow'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Scan className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Scanner</span>
            </button>
          )}
        </div>
      </nav>

      {/* Temporary message display */}
      {showMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-brand-black text-white px-6 py-3 rounded-lg shadow-lg max-w-md text-center animate-fade-in border-2 border-brand-yellow">
          {message}
        </div>
      )}
    </div>
  );
};

export { AttendeePWA };
export default AttendeePWA;
