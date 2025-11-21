import React, { useState, useEffect, useRef } from 'react';
import { List, Map, Scan, Navigation, MapPin, Camera, WifiOff, ArrowRight, Trophy, CheckCircle, Satellite, ChevronRight, Compass } from 'lucide-react';
import jsQR from 'jsqr';
import FloorplanCanvas from '../../components/FloorplanCanvas.jsx';
import { findShortestNodePath, nearestNodeToPoint, nodePathToCoords, GraphNode, GraphSegment } from '../../lib/pathfinding';
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
import {
  calculateDistance,
  calculateBearing,
  bearingToCardinal,
  bearingToArrow,
  formatDistance,
  watchHeading,
  triggerHaptic,
  calculateRelativeBearing
} from '../../lib/gpsUtils';

interface EventData {
  id: string;
  name: string;
  description?: string;
  navigation_mode: 'indoor' | 'outdoor' | 'hybrid';
  gps_center_lat?: number;
  gps_center_lng?: number;
  gps_bounds_ne_lat?: number;
  gps_bounds_ne_lng?: number;
  gps_bounds_sw_lat?: number;
  gps_bounds_sw_lng?: number;
  start_date?: string;
  end_date?: string;
}

interface POIData extends GraphNode {
  distance?: number;
  metadata?: {
    gps_lat?: number;
    gps_lng?: number;
    [key: string]: any;
  };
}

interface LocationData {
  x: number;
  y: number;
  source: 'qr' | 'gps';
  accuracy?: number;
}

type Screen = 'splash' | 'event-select' | 'main' | 'precision-finding';
type Tab = 'directory' | 'map' | 'scanner';

const AttendeePWANew: React.FC = () => {
  // Screen flow state
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [activeTab, setActiveTab] = useState<Tab>('directory');
  
  // Precision finding state (AirTag-style navigation)
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [distanceToTarget, setDistanceToTarget] = useState<number>(0);
  const [bearingToTarget, setBearingToTarget] = useState<number>(0);
  const [relativeBearing, setRelativeBearing] = useState<number>(0);
  const [headingWatchCleanup, setHeadingWatchCleanup] = useState<(() => void) | null>(null);
  
  // Event state
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // Navigation state
  const [pois, setPois] = useState<POIData[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POIData | null>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphSegments, setGraphSegments] = useState<GraphSegment[]>([]);
  const [floorplanImageUrl, setFloorplanImageUrl] = useState<string | null>(null);
  const [highlightPath, setHighlightPath] = useState<Array<{ x: number; y: number }>>([]);
  const [navigationPath, setNavigationPath] = useState<GraphNode[]>([]); // Turn-by-turn waypoints
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState<number>(0);
  
  // Location state
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [currentGPS, setCurrentGPS] = useState<GPSCoordinate | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  
  // QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // UI state
  const [offlineMode, setOfflineMode] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showMessage, setShowMessage] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  // Cleanup GPS and heading watch on unmount
  useEffect(() => {
    return () => {
      if (gpsWatchId !== null) {
        stopWatchingGPS(gpsWatchId);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (headingWatchCleanup) {
        headingWatchCleanup();
      }
    };
  }, [gpsWatchId, cameraStream, headingWatchCleanup]);

  // Update relative bearing when device heading or target bearing changes
  useEffect(() => {
    if (currentScreen === 'precision-finding') {
      const relative = calculateRelativeBearing(deviceHeading, bearingToTarget);
      setRelativeBearing(relative);
      
      // Haptic feedback when pointing in right direction (±15°)
      if (Math.abs(relative) < 15 && distanceToTarget > 3) {
        triggerHaptic('light');
      }
    }
  }, [deviceHeading, bearingToTarget, currentScreen, distanceToTarget]);

  // Update distance/bearing continuously when GPS or target changes
  useEffect(() => {
    if (!currentGPS || !selectedPOI?.metadata?.gps_lat || !selectedPOI?.metadata?.gps_lng) {
      return;
    }

    const poiGPS = { lat: selectedPOI.metadata.gps_lat, lng: selectedPOI.metadata.gps_lng };
    const newDistance = calculateDistance(currentGPS, poiGPS);
    const newBearing = calculateBearing(currentGPS, poiGPS);
    
    console.log('🔄 Recalculating - Distance:', newDistance.toFixed(1) + 'm', 'Bearing:', newBearing.toFixed(0) + '°');
    
    setDistanceToTarget(newDistance);
    setBearingToTarget(newBearing);
    
    // Trigger arrival haptic when very close
    if (newDistance < 3 && distanceToTarget >= 3) {
      triggerHaptic('heavy');
      displayMessage('🎯 You have arrived!', 3000);
    }
  }, [currentGPS, selectedPOI, distanceToTarget]);

  // Check offline status
  useEffect(() => {
    const handleOffline = () => setOfflineMode(true);
    const handleOnline = () => setOfflineMode(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Fetch events from database
  const fetchEvents = async () => {
    setLoadingEvents(true);
    setError('');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      const { data, error: err } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('start_date', { ascending: false });
      
      if (err) throw err;
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please check your connection.');
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch navigation data for selected event
  const fetchNavigationData = async (eventId: string) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Fetch navigation points
      const { data: points, error: pointsErr } = await supabase
        .from('navigation_points')
        .select('*')
        .eq('event_id', eventId);
      
      if (pointsErr) throw pointsErr;

      // Fetch navigation segments
      const { data: segments, error: segmentsErr } = await supabase
        .from('navigation_segments')
        .select('*')
        .eq('event_id', eventId);
      
      if (segmentsErr) throw segmentsErr;

      // Fetch floorplan
      const { data: floorplan, error: floorplanErr } = await supabase
        .from('floorplans')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();
      
      if (floorplanErr) throw floorplanErr;

      // Convert to graph format
      const nodes: GraphNode[] = (points || []).map((p: any) => ({
        id: p.id,
        x: p.x_coord,
        y: p.y_coord,
        name: p.name,
        type: p.point_type as 'node' | 'poi' | 'entrance' | 'exit',
        metadata: {
          gps_lat: p.gps_lat,
          gps_lng: p.gps_lng,
          ...p.metadata
        }
      }));

      const segs: GraphSegment[] = (segments || []).map((s: any) => ({
        id: s.id,
        from_node_id: s.from_node_id,
        to_node_id: s.to_node_id,
        bidirectional: s.bidirectional,
        distance: s.distance_meters
      }));

      setGraphNodes(nodes);
      setGraphSegments(segs);
      
      // Extract POIs
      const poisList = nodes.filter(n => n.type === 'poi');
      console.log('🔍 All nodes:', nodes.map(n => ({ name: n.name, type: n.type })));
      console.log('📍 Filtered POIs:', poisList.map(p => ({ name: p.name, type: p.type, hasGPS: !!(p.metadata?.gps_lat && p.metadata?.gps_lng) })));
      setPois(poisList);

      // Set floorplan image
      if (floorplan?.image_url) {
        setFloorplanImageUrl(floorplan.image_url);
      }

      console.log('✅ Loaded:', nodes.length, 'nodes,', segs.length, 'segments,', poisList.length, 'POIs');
    } catch (err) {
      console.error('Failed to fetch navigation data:', err);
      setError('Failed to load map data.');
    }
  };

  // Enable GPS tracking
  const enableGPSTracking = (event: EventData) => {
    if (event.navigation_mode === 'indoor') {
      console.log('Indoor event - GPS not needed');
      return;
    }

    try {
      const watchId = watchGPSPosition(
        (gps, accuracy) => {
          console.log('📍 GPS Update:', gps.lat.toFixed(6), gps.lng.toFixed(6), 'accuracy:', accuracy.toFixed(1) + 'm');
          setCurrentGPS(gps);
          setGpsAccuracy(accuracy);
          setGpsEnabled(true);
          
          // Convert GPS to floorplan coordinates if we have event bounds
          if (event.gps_bounds_ne_lat && event.gps_bounds_sw_lat) {
            const gpsBounds: GPSBounds = {
              ne: { lat: event.gps_bounds_ne_lat, lng: event.gps_bounds_ne_lng! },
              sw: { lat: event.gps_bounds_sw_lat, lng: event.gps_bounds_sw_lng! }
            };
            
            if (isWithinBounds(gps, gpsBounds)) {
              const floorplanCoord = gpsToFloorplan(gps, gpsBounds, { width: 1000, height: 1000 });
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
          displayMessage('GPS positioning unavailable', 3000);
        }
      );
      
      setGpsWatchId(watchId);
    } catch (err) {
      console.error('Failed to enable GPS:', err);
    }
  };

  // Handle event selection
  const handleEventSelect = async (event: EventData) => {
    setSelectedEvent(event);
    localStorage.setItem('selectedEventId', event.id);
    
    // Fetch navigation data
    await fetchNavigationData(event.id);
    
    // Enable GPS if outdoor/hybrid
    if (event.navigation_mode === 'outdoor' || event.navigation_mode === 'hybrid') {
      enableGPSTracking(event);
    }
    
    setCurrentScreen('main');
  };

  // Calculate route to POI
  const handleGetDirections = async (poi: POIData) => {
    setSelectedPOI(poi);

    console.log('🧭 Get directions clicked:', { 
      poi: poi.name, 
      hasGPS: !!currentGPS, 
      poiHasGPS: !!(poi.metadata?.gps_lat && poi.metadata?.gps_lng),
      eventMode: selectedEvent?.navigation_mode 
    });

    // For outdoor events with GPS, use precision finding mode (AirTag style)
    if (poi.metadata?.gps_lat && poi.metadata?.gps_lng) {
      // Check if we have user's current GPS
      if (!currentGPS) {
        // Try to get GPS now
        displayMessage('Getting your location...', 2000);
        try {
          const gps = await getCurrentGPSPosition();
          setCurrentGPS(gps);
          console.log('✅ Got GPS:', gps);
        } catch (err) {
          displayMessage('Please enable location services', 3000);
          console.error('GPS error:', err);
          return;
        }
      }

      console.log('🎯 Starting precision finding mode with path-based navigation');
      
      // Calculate path-based route using navigation graph
      // Find all nodes with GPS coordinates (POIs and waypoints with GPS)
      const gpsNodes = graphNodes.filter(n => n.metadata?.gps_lat && n.metadata?.gps_lng);
      
      if (gpsNodes.length > 0) {
        // Find nearest GPS node to user's current position
        const userGPS = currentGPS || await getCurrentGPSPosition();
        let nearestNode = gpsNodes[0];
        let minDist = calculateDistance(userGPS, { 
          lat: nearestNode.metadata!.gps_lat!, 
          lng: nearestNode.metadata!.gps_lng! 
        });
        
        gpsNodes.forEach(node => {
          const dist = calculateDistance(userGPS, { 
            lat: node.metadata!.gps_lat!, 
            lng: node.metadata!.gps_lng! 
          });
          if (dist < minDist) {
            minDist = dist;
            nearestNode = node;
          }
        });
        
        // Calculate shortest path from nearest node to destination POI
        const nodePath = findShortestNodePath(graphNodes, graphSegments, nearestNode.id, poi.id);
        
        if (nodePath.length > 0) {
          // Filter to only nodes with GPS coordinates for turn-by-turn
          const waypointsWithGPS = nodePath.filter(nodeId => {
            const node = graphNodes.find(n => n.id === nodeId);
            return node?.metadata?.gps_lat && node?.metadata?.gps_lng;
          }).map(nodeId => graphNodes.find(n => n.id === nodeId)!);
          
          setNavigationPath(waypointsWithGPS);
          setCurrentWaypointIndex(0);
          
          console.log('📍 Path-based route:', waypointsWithGPS.length, 'GPS waypoints');
        } else {
          console.log('⚠️ No path found, using direct navigation');
          setNavigationPath([]);
        }
      }
      
      // Calculate initial distance and bearing to target
      const poiGPS = { lat: poi.metadata.gps_lat, lng: poi.metadata.gps_lng };
      const userGPS = currentGPS || await getCurrentGPSPosition();
      const distance = calculateDistance(userGPS, poiGPS);
      const bearing = calculateBearing(userGPS, poiGPS);
      
      console.log('📊 Initial - Distance:', distance.toFixed(1) + 'm', 'Bearing:', bearing.toFixed(0) + '°');
      
      setDistanceToTarget(distance);
      setBearingToTarget(bearing);
      
      // Start watching device compass heading
      // Note: bearing gets updated via watchGPSPosition callback above
      const cleanup = watchHeading(
        (heading) => {
          setDeviceHeading(heading);
          // Recalculate relative bearing using current target bearing from state
          // The actual bearing to target is updated by GPS watch callback
        },
        (error) => {
          console.warn('Compass error:', error);
        }
      );
      setHeadingWatchCleanup(() => cleanup);
      
      // Switch to precision finding screen
      setCurrentScreen('precision-finding');
      return;
    }

    // For indoor events or no GPS, use map-based pathfinding
    setActiveTab('map');

    if (!currentLocation) {
      displayMessage('Please enable location or scan a QR code first', 3000);
      return;
    }

    // Find nearest node to current position
    const startNode = nearestNodeToPoint(graphNodes, currentLocation.x, currentLocation.y);
    if (!startNode) {
      displayMessage('Cannot find your position on the map', 3000);
      return;
    }

    console.log('🧭 Calculating route from', startNode.name, 'to', poi.name);

    // Calculate shortest path
    const nodePath = findShortestNodePath(graphNodes, graphSegments, startNode.id, poi.id);
    
    if (nodePath.length === 0) {
      displayMessage('No route found to destination', 3000);
      setHighlightPath([]);
      return;
    }

    // Convert to coordinates
    const routeCoords = nodePathToCoords(graphNodes, nodePath);
    const fullRoute = [{ x: currentLocation.x, y: currentLocation.y }, ...routeCoords];
    setHighlightPath(fullRoute);
    
    console.log('✅ Route calculated:', nodePath.length, 'waypoints');
    displayMessage(`Route found! ${nodePath.length} waypoints`, 2000);
  };

  // QR Scanner functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanQRCode();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please enable camera permissions.');
      setIsScanning(false);
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code && code.data) {
      handleQRCodeDetected(code.data);
    } else {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleQRCodeDetected = async (qrData: string) => {
    console.log('QR Code detected:', qrData);
    
    // Stop scanning
    setIsScanning(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    try {
      // Parse QR data
      const parsed = JSON.parse(qrData);
      
      // Set location from QR code
      if (parsed.x !== undefined && parsed.y !== undefined) {
        setCurrentLocation({
          x: parsed.x,
          y: parsed.y,
          source: 'qr'
        });
        displayMessage('Location updated from QR code!', 2000);
        setActiveTab('map');
      }
    } catch (err) {
      console.error('QR parse error:', err);
      displayMessage('Invalid QR code format', 3000);
    }
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    setError('');
    startCamera();
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Display temporary message
  const displayMessage = (msg: string, duration: number = 3000) => {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), duration);
  };

  // ============ RENDER SCREENS ============

  // SPLASH SCREEN
  if (currentScreen === 'splash') {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-brand-black via-brand-gray-dark to-brand-black">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Logo */}
          <div className="mb-8">
            <img src="/nav-eaze-logo.svg" alt="NavEaze" className="h-24 w-auto" />
          </div>
          
          {/* Tagline */}
          <h1 className="text-white text-3xl font-bold text-center mb-3">
            Find Your Way
          </h1>
          <p className="text-gray-300 text-center mb-12 max-w-sm">
            Navigate events with ease. Discover points of interest and get turn-by-turn directions.
          </p>
          
          {/* Main CTA */}
          <button
            onClick={() => {
              fetchEvents();
              setCurrentScreen('event-select');
            }}
            className="bg-brand-red hover:bg-red-700 text-white px-12 py-4 rounded-full text-lg font-semibold shadow-lg transform transition hover:scale-105 flex items-center gap-3"
          >
            Find Your Way
            <ChevronRight className="w-6 h-6" />
          </button>
          
          {/* Feature badges */}
          <div className="mt-16 flex flex-wrap gap-4 justify-center max-w-md">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <MapPin className="w-4 h-4 text-brand-yellow" />
              <span className="text-white text-sm">GPS Navigation</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Scan className="w-4 h-4 text-brand-yellow" />
              <span className="text-white text-sm">QR Scanning</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Map className="w-4 h-4 text-brand-yellow" />
              <span className="text-white text-sm">Live Maps</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 text-center">
          <p className="text-gray-400 text-sm">Powered by NavEaze</p>
        </div>
      </div>
    );
  }

  // PRECISION FINDING SCREEN (AirTag-style navigation)
  if (currentScreen === 'precision-finding') {
    const isClose = distanceToTarget < 10;
    const isVeryClose = distanceToTarget < 3;
    const isPointingCorrect = Math.abs(relativeBearing) < 30;
    
    // Get current waypoint name for path-based navigation
    const currentWaypoint = navigationPath.length > 0 ? navigationPath[currentWaypointIndex] : null;
    const isLastWaypoint = currentWaypointIndex === navigationPath.length - 1;
    const waypointProgress = navigationPath.length > 0 ? `${currentWaypointIndex + 1}/${navigationPath.length}` : null;

    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-brand-black to-brand-gray-dark text-white">
        {/* Header */}
        <div className="p-6 bg-brand-black/50 backdrop-blur-sm">
          <button
            onClick={() => {
              setCurrentScreen('main');
              setActiveTab('directory');
              if (headingWatchCleanup) {
                headingWatchCleanup();
                setHeadingWatchCleanup(null);
              }
              setNavigationPath([]);
              setCurrentWaypointIndex(0);
            }}
            className="text-brand-yellow text-sm mb-2"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{selectedPOI?.name}</h1>
          {currentWaypoint && !isLastWaypoint ? (
            <p className="text-gray-400 text-sm mt-1">Via {currentWaypoint.name} • Step {waypointProgress}</p>
          ) : currentWaypoint && isLastWaypoint ? (
            <p className="text-gray-400 text-sm mt-1">Final destination • Step {waypointProgress}</p>
          ) : (
            <p className="text-gray-400 text-sm mt-1">Finding your way...</p>
          )}
          <p className="text-gray-400 text-sm mt-1">Finding your way...</p>
        </div>

        {/* Main compass/direction area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Distance indicator */}
          <div className="mb-12 text-center">
            <div className={`text-6xl font-bold mb-2 ${isVeryClose ? 'text-green-400 animate-pulse' : 'text-white'}`}>
              {formatDistance(distanceToTarget)}
            </div>
            <div className="text-gray-400">
              {isVeryClose ? '🎯 You\'re here!' : `${bearingToCardinal(bearingToTarget)} ${bearingToArrow(bearingToTarget)}`}
            </div>
          </div>

          {/* Directional arrow/compass */}
          <div className="relative w-64 h-64 mb-12">
            {/* Compass ring */}
            <div className="absolute inset-0 rounded-full border-4 border-brand-yellow/30"></div>
            
            {/* Direction indicator (rotates based on relative bearing) */}
            <div 
              className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
              style={{ transform: `rotate(${relativeBearing}deg)` }}
            >
              <div className={`w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[80px] ${
                isPointingCorrect ? 'border-b-green-400' : 'border-b-brand-red'
              } transition-colors duration-300`}>
              </div>
            </div>

            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-brand-yellow rounded-full"></div>
            
            {/* Cardinal directions */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">N</div>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">S</div>
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">W</div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">E</div>
          </div>

          {/* Instruction text */}
          <div className="text-center max-w-sm">
            {isVeryClose ? (
              <div>
                <p className="text-xl text-green-400 font-semibold">You have arrived!</p>
                {currentWaypoint && !isLastWaypoint && (
                  <p className="text-sm text-gray-400 mt-2">Next: {navigationPath[currentWaypointIndex + 1]?.name}</p>
                )}
              </div>
            ) : currentWaypoint ? (
              <div>
                <p className="text-lg font-semibold mb-1">
                  {isPointingCorrect ? (
                    <span className="text-green-400">Keep going straight</span>
                  ) : relativeBearing > 0 ? (
                    <span>Turn right</span>
                  ) : (
                    <span>Turn left</span>
                  )}
                </p>
                <p className="text-sm text-gray-400">
                  toward {currentWaypoint.name}
                </p>
                {!isLastWaypoint && navigationPath[currentWaypointIndex + 1] && (
                  <p className="text-xs text-gray-500 mt-2">
                    Then continue to {navigationPath[currentWaypointIndex + 1].name}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold mb-1">
                  {isPointingCorrect ? (
                    <span className="text-green-400">Keep going straight</span>
                  ) : relativeBearing > 0 ? (
                    <span>Turn right and walk forward</span>
                  ) : (
                    <span>Turn left and walk forward</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Direct path to destination
                </p>
              </div>
            )}
            
            {/* Path navigation note */}
            {!isVeryClose && navigationPath.length === 0 && (
              <p className="text-xs text-gray-500 mt-4 px-4">
                ℹ️ This shows the direct path. View the map below for pathways around buildings.
              </p>
            )}
          </div>

          {/* GPS accuracy indicator */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <Satellite className="w-4 h-4" />
              <span>GPS Accuracy: ±{gpsAccuracy.toFixed(0)}m</span>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-6 bg-brand-black/50 backdrop-blur-sm space-y-3">
          <button
            onClick={() => {
              setCurrentScreen('main');
              setActiveTab('map');
            }}
            className="w-full bg-brand-yellow text-brand-black py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Map className="w-5 h-5" />
            View Navigation on Map
          </button>
          
          {/* Debug/Testing button */}
          <button
            onClick={() => {
              // Simulate arrival
              setDistanceToTarget(0);
              triggerHaptic('heavy');
              displayMessage('🎯 Marked as arrived!', 3000);
              
              // Log for debugging
              console.log('🧪 DEBUG: Manually marked as arrived');
              console.log('Current GPS:', currentGPS);
              console.log('Target POI:', selectedPOI?.name, selectedPOI?.metadata);
              
              // Optional: Auto-return to directory after 2 seconds
              setTimeout(() => {
                setCurrentScreen('main');
                setActiveTab('directory');
              }, 2000);
            }}
            className="w-full bg-gray-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 border border-gray-600"
          >
            <CheckCircle className="w-5 h-5" />
            Mark as Arrived (Debug)
          </button>
        </div>
      </div>
    );
  }

  // EVENT SELECTION SCREEN
  if (currentScreen === 'event-select') {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-brand-black border-b-4 border-brand-yellow p-6">
          <h1 className="text-white text-2xl font-bold mb-2">Select an Event</h1>
          <p className="text-gray-300 text-sm">Choose which event you're attending</p>
        </div>
        
        {/* Events List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingEvents ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4"></div>
                <p className="text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchEvents}
                className="mt-3 text-red-600 underline text-sm"
              >
                Try Again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-gray-900 font-semibold mb-2">No Events Available</h3>
              <p className="text-gray-600 text-sm">There are no published events at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <div
                  key={event.id}
                  onClick={() => handleEventSelect(event)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-brand-red transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-semibold text-lg mb-1">{event.name}</h3>
                      {event.description && (
                        <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                      )}
                      
                      {/* Event metadata */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-yellow/20 text-brand-gray-dark border border-brand-yellow/30">
                          {event.navigation_mode === 'outdoor' && '📍 Outdoor GPS'}
                          {event.navigation_mode === 'indoor' && '🏢 Indoor QR'}
                          {event.navigation_mode === 'hybrid' && '🌐 Hybrid'}
                        </span>
                        {event.start_date && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {new Date(event.start_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAIN APP SCREEN (with tabs)
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl">
      {/* Message Toast */}
      {showMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-brand-black text-brand-yellow px-6 py-3 rounded-full shadow-lg border-2 border-brand-yellow animate-bounce">
          {message}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* DIRECTORY TAB */}
        {activeTab === 'directory' && (
          <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 bg-brand-black border-b-4 border-brand-yellow">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-white text-xl font-bold tracking-tight">NavEaze</h1>
                  <p className="text-gray-300 text-xs mt-0.5">{selectedEvent?.name || 'Event Navigation'}</p>
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
            
            {/* GPS Status Banner */}
            {selectedEvent && (selectedEvent.navigation_mode === 'outdoor' || selectedEvent.navigation_mode === 'hybrid') && (
              <div className={`px-4 py-2 ${gpsEnabled ? 'bg-green-50 border-b border-green-200' : 'bg-orange-50 border-b border-orange-200'}`}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Satellite className={`w-4 h-4 ${gpsEnabled ? 'text-green-600' : 'text-orange-600'}`} />
                    <span className={gpsEnabled ? 'text-green-700' : 'text-orange-700'}>
                      {gpsEnabled ? (
                        <>GPS Active • ±{gpsAccuracy.toFixed(0)}m</>
                      ) : (
                        <>Waiting for GPS...</>
                      )}
                    </span>
                  </div>
                  {currentGPS && (
                    <span className="text-xs text-gray-500">
                      {currentGPS.lat.toFixed(6)}, {currentGPS.lng.toFixed(6)}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pois.length > 0 ? (
                pois.map((poi) => (
                  <div key={poi.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-medium text-lg">{poi.name}</h3>
                        <div className="mt-2">
                          <span className="inline-flex items-center rounded-full bg-yellow-50 text-gray-900 px-2 py-0.5 text-xs font-medium border border-yellow-200">
                            Point of Interest
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleGetDirections(poi)}
                        className="bg-accent text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-red-700 transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        Directions
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-gray-900 font-medium mb-2">No Points of Interest</h3>
                  <p className="text-gray-500 text-sm">
                    POIs will appear here once they're added to the event map.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 bg-white border-b border-gray-200">
              <h1 className="text-gray-900 text-lg font-semibold mb-2">Event Map</h1>
              
              {/* GPS Status */}
              {selectedEvent && (selectedEvent.navigation_mode === 'outdoor' || selectedEvent.navigation_mode === 'hybrid') && (
                <div className={`flex items-center text-sm ${gpsEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                  <Satellite className="w-4 h-4 mr-1" />
                  {gpsEnabled ? (
                    <span>GPS Active • ±{gpsAccuracy.toFixed(0)}m</span>
                  ) : (
                    <span>GPS Searching...</span>
                  )}
                </div>
              )}

              {/* Selected POI */}
              {selectedPOI && (
                <div className="mt-2 bg-brand-yellow/20 border border-brand-yellow rounded-lg p-2">
                  <p className="text-sm font-medium text-brand-gray-dark">
                    Navigating to: <span className="font-bold">{selectedPOI.name}</span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-hidden p-4">
              {graphNodes.length > 0 ? (
                <FloorplanCanvas
                  floorplanImageUrl={floorplanImageUrl || ''}
                  nodes={graphNodes}
                  segments={graphSegments}
                  pois={pois}
                  highlightPath={highlightPath}
                  currentLocation={currentLocation ? { x: currentLocation.x, y: currentLocation.y } : undefined}
                  fitToContainer={true}
                  containerWidth={window.innerWidth - 32}
                  containerHeight={window.innerHeight * 0.7}
                  mode="pan"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}

              {/* Location info */}
              {currentLocation && (
                <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className={`w-4 h-4 ${currentLocation.source === 'gps' ? 'text-blue-600' : 'text-green-600'}`} />
                    <span className="font-medium text-sm">Current Location</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-100">
                      {currentLocation.source === 'gps' ? '📡 GPS' : '📷 QR'}
                    </span>
                  </div>
                  {currentLocation.accuracy && (
                    <p className="text-xs text-gray-600">Accuracy: ±{currentLocation.accuracy.toFixed(0)}m</p>
                  )}
                </div>
              )}

              {!currentLocation && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-orange-700">
                    {selectedEvent?.navigation_mode === 'outdoor' ? 
                      'Waiting for GPS signal...' : 
                      'Scan a QR code to set your location'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCANNER TAB */}
        {activeTab === 'scanner' && (
          <div className="flex flex-col h-full bg-brand-gray-dark">
            <div className="p-4 bg-brand-black">
              <h1 className="text-white text-lg font-semibold">QR Scanner</h1>
              <p className="text-gray-300 text-sm mt-1">Scan a location QR code</p>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              {isScanning ? (
                <div className="w-full max-w-sm">
                  <video ref={videoRef} className="w-full rounded-lg mb-4" playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    onClick={stopScanning}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold"
                  >
                    Stop Scanning
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-white text-xl font-semibold mb-2">Camera Ready</h3>
                  <p className="text-gray-400 mb-8">
                    Tap the button below to start scanning
                  </p>
                  <button
                    onClick={handleStartScanning}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto hover:bg-blue-700 transition"
                  >
                    <Camera className="w-5 h-5" />
                    Start Scanning
                  </button>
                </div>
              )}
              
              {error && (
                <div className="mt-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {currentScreen === 'main' && (
        <div className="border-t border-gray-200 bg-white">
          <div className="flex items-center justify-around p-2">
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg flex-1 ${
                activeTab === 'directory'
                  ? 'bg-yellow-50 border-2 border-brand-yellow'
                  : 'text-gray-600'
              }`}
            >
              <List className={`w-6 h-6 mb-1 ${activeTab === 'directory' ? 'text-brand-gray-dark' : ''}`} />
              <span className={`text-xs font-medium ${activeTab === 'directory' ? 'text-brand-gray-dark' : ''}`}>
                Directory
              </span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg flex-1 ${
                activeTab === 'map'
                  ? 'bg-yellow-50 border-2 border-brand-yellow'
                  : 'text-gray-600'
              }`}
            >
              <Map className={`w-6 h-6 mb-1 ${activeTab === 'map' ? 'text-brand-gray-dark' : ''}`} />
              <span className={`text-xs font-medium ${activeTab === 'map' ? 'text-brand-gray-dark' : ''}`}>
                Map
              </span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg flex-1 ${
                activeTab === 'scanner'
                  ? 'bg-yellow-50 border-2 border-brand-yellow'
                  : 'text-gray-600'
              }`}
            >
              <Scan className={`w-6 h-6 mb-1 ${activeTab === 'scanner' ? 'text-brand-gray-dark' : ''}`} />
              <span className={`text-xs font-medium ${activeTab === 'scanner' ? 'text-brand-gray-dark' : ''}`}>
                Scanner
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendeePWANew;
