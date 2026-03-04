import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { List, Map, Scan, Navigation, MapPin, Camera, WifiOff, ArrowRight, Trophy, CheckCircle, Satellite, ChevronRight, Compass, AlertTriangle } from 'lucide-react';
import jsQR from 'jsqr';
import FloorplanCanvas from '../../components/FloorplanCanvas.jsx';
import { findShortestNodePath, nearestNodeToPoint, nodePathToCoords, generateTurnByTurnDirections, GraphNode, GraphSegment } from '../../lib/pathfinding';
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
import {
  cacheEventData,
  getCachedEventData,
  cachePOIs,
  getCachedPOIs,
  cacheGraphData,
  getCachedGraphData,
  isOnline
} from '../../lib/offlineStorage';
import {
  snapToNearestPathSegment,
  isGPSAccuracyGood,
  getNearestLandmark
} from '../../lib/gpsSnapping';

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

type Screen = 'splash' | 'event-select' | 'main' | 'precision-finding' | 'ar-preview';
type Tab = 'directory' | 'map' | 'scanner';

const AttendeePWANew: React.FC = () => {
  // Arrival modal state
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [attendeeId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('attendee_id') || localStorage.getItem('naveaze_attendee_id') || `anon_${crypto.randomUUID()}`;
  });
  const [lastLocationPing, setLastLocationPing] = useState(0);

  // SOS & Consent State
  const [sosLoading, setSosLoading] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [hasConsented, setHasConsented] = useState(() => localStorage.getItem('naveaze_consent') === 'true');

  // Initialize random anonymous user ID for live tracking
  useEffect(() => {
    if (hasConsented) {
      localStorage.setItem('naveaze_attendee_id', attendeeId);
    }
  }, [attendeeId, hasConsented]);
  // Debug mode for testing
  const [debugMode, setDebugMode] = useState(false);
  // Screen flow state
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [activeTab, setActiveTab] = useState<Tab>('directory');

  // Precision finding state (AirTag-style navigation)
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [distanceToTarget, setDistanceToTarget] = useState<number>(0);
  const [bearingToTarget, setBearingToTarget] = useState<number>(0);
  const [relativeBearing, setRelativeBearing] = useState<number>(0);
  const [headingWatchCleanup, setHeadingWatchCleanup] = useState<(() => void) | null>(null);

  // AR Preview state (Phase 3 demo)
  const [arCameraStream, setArCameraStream] = useState<MediaStream | null>(null);
  const arVideoRef = useRef<HTMLVideoElement>(null);

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
  const [floorplanGpsBounds, setFloorplanGpsBounds] = useState<any | null>(null);
  const [highlightPath, setHighlightPath] = useState<Array<{ x: number; y: number }>>([]);
  const [navigationPath, setNavigationPath] = useState<GraphNode[]>([]); // Turn-by-turn waypoints
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState<number>(0);
  const [turnByTurnDirections, setTurnByTurnDirections] = useState<string[]>([]); // NEW: Text directions
  const [currentFloorplanId, setCurrentFloorplanId] = useState<string | null>(null);

  // Phase 1: Off-path detection and auto re-routing
  const [isOffPath, setIsOffPath] = useState(false);
  const [nearestLandmark, setNearestLandmark] = useState<GraphNode | null>(null);
  const [shouldReroute, setShouldReroute] = useState(false);

  // Location state
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [currentGPS, setCurrentGPS] = useState<GPSCoordinate | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);

  // QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Live Location Tracking Refs
  const lastLocationPingRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapContainerWidth, setMapContainerWidth] = useState(0);
  const [mapContainerHeight, setMapContainerHeight] = useState(0);

  // Measure map container when map tab is active
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current) return;
    const measure = () => {
      const el = mapContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setMapContainerWidth(Math.floor(rect.width));
      if (rect.height > 0) setMapContainerHeight(Math.floor(rect.height));
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(mapContainerRef.current);
    return () => obs.disconnect();
  }, [activeTab]);

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
      if (arCameraStream) {
        arCameraStream.getTracks().forEach(track => track.stop());
      }
      if (headingWatchCleanup) {
        headingWatchCleanup();
      }
    };
  }, [gpsWatchId, cameraStream, arCameraStream, headingWatchCleanup]);

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
    if (!currentGPS) return;

    // Determine target: current waypoint OR final destination
    let targetGPS: { lat: number; lng: number } | null = null;
    let targetName = '';

    if (navigationPath.length > 0 && currentWaypointIndex < navigationPath.length) {
      const currentWaypoint = navigationPath[currentWaypointIndex];
      if (currentWaypoint?.metadata?.gps_lat && currentWaypoint?.metadata?.gps_lng) {
        targetGPS = {
          lat: currentWaypoint.metadata.gps_lat,
          lng: currentWaypoint.metadata.gps_lng
        };
        targetName = currentWaypoint.name || 'Waypoint';
      }
    }

    if (!targetGPS && selectedPOI?.metadata?.gps_lat && selectedPOI?.metadata?.gps_lng) {
      targetGPS = { lat: selectedPOI.metadata.gps_lat, lng: selectedPOI.metadata.gps_lng };
      targetName = selectedPOI.name || 'Destination';
    }

    if (!targetGPS) return;

    const newDistance = calculateDistance(currentGPS, targetGPS);
    const newBearing = calculateBearing(currentGPS, targetGPS);

    if (Math.abs(newDistance - distanceToTarget) > 0.5) {
      setDistanceToTarget(newDistance);
      console.log('📍 Distance to', targetName + ':', newDistance.toFixed(1) + 'm');
    }

    const bearingDiff = Math.abs(newBearing - bearingToTarget);
    if (bearingDiff > 5) {
      setBearingToTarget(newBearing);
      console.log('🧭 Bearing to', targetName + ':', newBearing.toFixed(0) + '°');
    }

    // 15 meters is a reasonable radius for consumer GPS to register hitting a waypoint
    if (newDistance < 15 && navigationPath.length > 0 && currentWaypointIndex < navigationPath.length - 1) {
      const nextIndex = currentWaypointIndex + 1;
      setCurrentWaypointIndex(nextIndex);
      triggerHaptic('medium');
      console.log('✅ Reached waypoint! Moving to:', navigationPath[nextIndex].name);
    }

    // 12 meters to trigger arrival modal at final destination
    if (newDistance < 12 && distanceToTarget >= 12 && currentWaypointIndex === navigationPath.length - 1) {
      triggerHaptic('heavy');
      setShowArrivalModal(true);
    }
  }, [currentGPS, selectedPOI, navigationPath, currentWaypointIndex, distanceToTarget, bearingToTarget]);

  // Phase 1: Off-path detection and auto re-routing
  useEffect(() => {
    if (!currentLocation || navigationPath.length === 0 || currentWaypointIndex >= navigationPath.length) {
      setIsOffPath(false);
      return;
    }

    const currentWaypoint = navigationPath[currentWaypointIndex];
    const nextWaypoint = navigationPath[currentWaypointIndex + 1];

    if (!currentWaypoint || !nextWaypoint) {
      setIsOffPath(false);
      return;
    }

    // Calculate distance from current location to path segment
    const dx = nextWaypoint.x - currentWaypoint.x;
    const dy = nextWaypoint.y - currentWaypoint.y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (segmentLength === 0) {
      setIsOffPath(false);
      return;
    }

    // Project current location onto segment
    const t = Math.max(0, Math.min(1,
      ((currentLocation.x - currentWaypoint.x) * dx + (currentLocation.y - currentWaypoint.y) * dy) / (segmentLength * segmentLength)
    ));

    const projX = currentWaypoint.x + t * dx;
    const projY = currentWaypoint.y + t * dy;

    const distanceFromPath = Math.sqrt(
      Math.pow(currentLocation.x - projX, 2) + Math.pow(currentLocation.y - projY, 2)
    );

    // 100px ≈ 10m at typical scale
    const OFF_PATH_THRESHOLD = 100;

    if (distanceFromPath > OFF_PATH_THRESHOLD) {
      if (!isOffPath) {
        console.log('⚠️ User is off path! Distance:', distanceFromPath.toFixed(1), 'px');
        setIsOffPath(true);
        setShouldReroute(true);
      }
    } else {
      if (isOffPath) {
        console.log('✅ Back on path');
        setIsOffPath(false);
      }
    }

    // Update nearest landmark for bad signal UI
    if (graphNodes.length > 0) {
      const nearest = getNearestLandmark(currentLocation, graphNodes, 200); // 200px ≈ 20m
      setNearestLandmark(nearest);
    }
  }, [currentLocation, navigationPath, currentWaypointIndex, isOffPath, graphNodes]);

  // Phase 1: Auto re-routing when off path
  useEffect(() => {
    if (shouldReroute && selectedPOI && currentLocation) {
      console.log('🔄 Auto re-routing...');
      setShouldReroute(false);

      // Recalculate route from current location
      const nearestNode = nearestNodeToPoint(graphNodes, currentLocation.x, currentLocation.y);
      if (nearestNode) {
        const nodePath = findShortestNodePath(graphNodes, graphSegments, nearestNode.id, selectedPOI.id);
        if (nodePath.length > 0) {
          const pathNodes = nodePath.map(nodeId => graphNodes.find(n => n.id === nodeId)!).filter(Boolean);
          setNavigationPath(pathNodes);
          setCurrentWaypointIndex(0);

          const routeCoords = nodePathToCoords(graphNodes, nodePath);
          const fullRoute = [{ x: currentLocation.x, y: currentLocation.y }, ...routeCoords];
          setHighlightPath(fullRoute);

          displayMessage('Route updated', 2000);
          console.log('✅ Re-routed successfully');
        }
      }
    }
  }, [shouldReroute, selectedPOI, currentLocation, graphNodes, graphSegments]);

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

    // Try to load from cache first if offline
    if (!isOnline()) {
      console.log('📴 Offline mode - loading events from cache');
      const cachedEventId = localStorage.getItem('selectedEventId');
      if (cachedEventId) {
        const cachedEvent = await getCachedEventData(cachedEventId);
        if (cachedEvent) {
          setEvents([cachedEvent]);
          setLoadingEvents(false);
          return;
        }
      }
      setError('No cached events available. Please connect to internet.');
      setLoadingEvents(false);
      return;
    }

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

      // Cache events for offline access (non-blocking)
      if (data && data.length > 0) {
        Promise.all(data.map((event: any) => cacheEventData(event.id, event)))
          .then(() => console.log('📦 Cached', data.length, 'events for offline access'))
          .catch((err: any) => console.warn('⚠️ Event cache failed:', err));
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please check your connection.');
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch navigation data for selected event
  const fetchNavigationData = async (eventId: string, targetFloorplanId?: string) => {
    // Determine which floorplan to load
    const activeFloorplanId = targetFloorplanId || currentFloorplanId;

    // Try cache first if offline
    if (!isOnline()) {
      console.log('📴 Offline mode - loading navigation data from cache');
      const [cachedPOIs, cachedGraph] = await Promise.all([
        getCachedPOIs(eventId),
        getCachedGraphData(eventId)
      ]);

      if (cachedPOIs && cachedGraph) {
        setPois(cachedPOIs);
        setGraphNodes(cachedGraph.nodes);
        setGraphSegments(cachedGraph.segments);
        console.log('✅ Loaded from cache:', cachedGraph.nodes.length, 'nodes,', cachedGraph.segments.length, 'segments,', cachedPOIs.length, 'POIs');
        return;
      }

      setError('No cached map data. Please connect to internet.');
      return;
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Fetch Floorplan details
      const floorplanQuery = supabase
        .from('floorplans')
        .select('*');

      if (activeFloorplanId) {
        floorplanQuery.eq('id', activeFloorplanId);
      } else {
        floorplanQuery.eq('event_id', eventId).order('created_at', { ascending: true });
      }

      const { data: floorplanResults, error: floorplanErr } = await floorplanQuery.maybeSingle();

      const floorplan = floorplanResults;
      if (floorplanErr) throw floorplanErr;

      if (floorplan) {
        setCurrentFloorplanId(floorplan.id);
      }

      // Fetch navigation points for THIS floorplan only
      const { data: points, error: pointsErr } = await supabase
        .from('navigation_points')
        .select('*')
        .eq('event_id', eventId)
        .eq('floorplan_id', floorplan?.id);

      if (pointsErr) throw pointsErr;

      // Fetch navigation segments for THIS floorplan only
      const { data: segments, error: segmentsErr } = await supabase
        .from('navigation_segments')
        .select('*')
        .eq('event_id', eventId)
        .eq('floorplan_id', floorplan?.id);

      if (segmentsErr) throw segmentsErr;

      // Extract GPS bounds if available
      let bounds = null;
      if (floorplan?.is_calibrated) {
        const lats = [
          floorplan.gps_top_left_lat,
          floorplan.gps_top_right_lat,
          floorplan.gps_bottom_left_lat,
          floorplan.gps_bottom_right_lat
        ];
        const lngs = [
          floorplan.gps_top_left_lng,
          floorplan.gps_top_right_lng,
          floorplan.gps_bottom_left_lng,
          floorplan.gps_bottom_right_lng
        ];
        bounds = {
          ne: { lat: Math.max(...lats), lng: Math.max(...lngs) },
          sw: { lat: Math.min(...lats), lng: Math.min(...lngs) }
        };
        setFloorplanGpsBounds(bounds);
      }

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
        start_node_id: s.start_node_id,
        end_node_id: s.end_node_id,
        bidirectional: s.is_bidirectional,
        distance: s.distance_meters
      }));

      setGraphNodes(nodes);
      setGraphSegments(segs);
      if (nodes.length > 0) {
        console.log('🔍 First node coordinates:', nodes[0].id, nodes[0].x, nodes[0].y, 'Image size:', floorplan?.image_url);
      }

      // Extract POIs
      const poisList = nodes.filter(n => n.type === 'poi');
      setPois(poisList);

      // Set floorplan image
      if (floorplan?.image_url) {
        setFloorplanImageUrl(floorplan.image_url);
      }

      // Cache for offline access (non-blocking)
      Promise.all([
        cachePOIs(eventId, poisList),
        cacheGraphData(eventId, nodes, segs)
      ]).then(() => console.log('📦 Cached navigation data for offline access'))
        .catch(err => console.warn('⚠️ Navigation cache failed:', err));

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

          // Broadcast location to backend based on throttling
          const now = Date.now();
          if (now - lastLocationPingRef.current > 3000 && supabase && event.id) {
            lastLocationPingRef.current = now;
            const locationData = {
              attendee_id: attendeeId,
              event_id: event.id,
              lat: gps.lat,
              lng: gps.lng,
              accuracy: accuracy,
              last_ping_at: new Date().toISOString()
            };
            void (supabase.from('attendee_locations') as any).upsert(locationData, { onConflict: 'attendee_id, event_id' })
              .then(({ error }: { error: any }) => {
                if (error) console.error('[GPS] Failed to broadcast location:', error.message);
              });
          }

          if (event.gps_bounds_ne_lat && event.gps_bounds_sw_lat) {
            const gpsBounds: GPSBounds = {
              ne: { lat: event.gps_bounds_ne_lat, lng: event.gps_bounds_ne_lng! },
              sw: { lat: event.gps_bounds_sw_lat, lng: event.gps_bounds_sw_lng! }
            };

            let floorplanCoord = gpsToFloorplan(gps, gpsBounds, { width: 1000, height: 1000 });

            // Apply GPS snapping if accuracy is good and we have graph data
            if (isGPSAccuracyGood(accuracy) && graphSegments.length > 0) {
              // Only snap if we are reasonably close to the venue or path
              const snapped = snapToNearestPathSegment(
                floorplanCoord,
                graphSegments,
                graphNodes,
                50 // max 50px (~5m) snap distance
              );
              floorplanCoord = snapped;
              console.log('📍 GPS snapped to path');
            }

            setCurrentLocation({
              x: floorplanCoord.x,
              y: floorplanCoord.y,
              source: 'gps',
              accuracy
            });
          }
        },
        (error: any) => {
          console.error('GPS error:', error);
          displayMessage('GPS positioning unavailable', 3000);
        }
      );

      setGpsWatchId(watchId);
    } catch (err) {
      console.error('Failed to enable GPS:', err);
    }
  };

  const confirmSOS = async () => {
    if (!selectedEvent?.id || !supabase) return;
    setSosLoading(true);
    try {
      const { error } = await (supabase.from('safety_alerts') as any).insert({
        event_id: selectedEvent.id,
        user_id: attendeeId,
        type: 'sos',
        status: 'new',
        gps_lat: null,
        gps_lng: null
      });

      if (error) throw error;

      setShowSosModal(false);
      alert('Emergency alert sent to onsite security.');
    } catch (e) {
      console.error('Failed to send SOS', e);
    } finally {
      setSosLoading(false);
    }
  };

  // Handle event selection
  const handleEventSelect = async (event: EventData) => {
    setSelectedEvent(event);
    setLoadingEvents(true);
    setError('');

    // Clear floorplan state to avoid flashes
    setFloorplanImageUrl(null);
    setCurrentFloorplanId(null);
    setCurrentLocation(null);

    await fetchNavigationData(event.id);

    // Enable GPS if outdoor/hybrid
    if (event.navigation_mode === 'outdoor' || event.navigation_mode === 'hybrid') {
      console.log('🌍 Enabling GPS tracking for', event.navigation_mode, 'event');
      enableGPSTracking(event);
    }

    setLoadingEvents(false);
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

    // CRITICAL FIX: Store the path for turn-by-turn navigation
    const pathNodes = nodePath.map(nodeId => graphNodes.find(n => n.id === nodeId)!).filter(Boolean);
    setNavigationPath(pathNodes);
    setCurrentWaypointIndex(0);

    // Generate turn-by-turn text directions
    const directions = generateTurnByTurnDirections(graphNodes, nodePath);
    setTurnByTurnDirections(directions);

    console.log('✅ Route calculated:', nodePath.length, 'waypoints');
    console.log('📍 Waypoints:', pathNodes.map(n => n.name).join(' → '));
    console.log('🧭 Directions:', directions);

    // Switch to precision finding with path-based navigation
    setCurrentScreen('precision-finding');
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

      // NEW: Support anchor_id format from qrGenerator.ts
      if (parsed.anchor_id && parsed.event_id) {
        console.log('🔍 Looking up navigation point:', parsed.anchor_id);

        // Query navigation_points table
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        const { data: point, error } = await supabase
          .from('navigation_points')
          .select('x_coord, y_coord, name, floorplan_id')
          .eq('id', parsed.anchor_id)
          .eq('event_id', parsed.event_id)
          .single();

        if (error || !point) {
          console.error('Navigation point not found:', error);
          displayMessage('QR code location not found', 3000);
          return;
        }

        console.log('✅ Found navigation point:', point.name);

        // Check if we need to switch maps
        if (point.floorplan_id && point.floorplan_id !== currentFloorplanId) {
          console.log('🔄 Switching map to floorplan:', point.floorplan_id);
          displayMessage(`Switching map: ${point.name}...`, 2000);
          await fetchNavigationData(parsed.event_id, point.floorplan_id);
        }

        setCurrentLocation({
          x: point.x_coord,
          y: point.y_coord,
          source: 'qr'
        });
        displayMessage(`Location set: ${point.name}`, 2000);
        setActiveTab('map');
        return;
      }

      // LEGACY: Support direct x/y format (for backward compatibility)
      if (parsed.x !== undefined && parsed.y !== undefined) {
        setCurrentLocation({
          x: parsed.x,
          y: parsed.y,
          source: 'qr'
        });
        displayMessage('Location updated from QR code!', 2000);
        setActiveTab('map');
        return;
      }

      // Invalid format
      displayMessage('Invalid QR code format', 3000);
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

  // E2E test hook — Playwright injects QR payloads without needing a real camera.
  // Dispatching: window.dispatchEvent(new CustomEvent('e2e:qr-inject', { detail: '{"x":400,"y":300}' }))
  const qrHandlerRef = useRef(handleQRCodeDetected);
  useEffect(() => { qrHandlerRef.current = handleQRCodeDetected; });
  useEffect(() => {
    const handler = (e: Event) => qrHandlerRef.current((e as CustomEvent<string>).detail);
    window.addEventListener('e2e:qr-inject', handler);
    return () => window.removeEventListener('e2e:qr-inject', handler);
  }, []);

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
            <img src="/nav-eaze-logo-dark.svg" alt="NavEaze" className="h-24 w-auto" />
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

  // AR PREVIEW SCREEN (Phase 3 Demo)
  if (currentScreen === 'ar-preview') {
    // Calculate real distance and bearing if we have GPS and a selected POI
    let arDistance = 45; // fallback
    let arBearing = 0;
    let arRelativeBearing = 0;
    let arDirection = "Walk forward";

    if (currentGPS && selectedPOI?.metadata?.gps_lat && selectedPOI?.metadata?.gps_lng) {
      const poiGPS = { lat: selectedPOI.metadata.gps_lat, lng: selectedPOI.metadata.gps_lng };
      arDistance = calculateDistance(currentGPS, poiGPS);
      arBearing = calculateBearing(currentGPS, poiGPS);
      arRelativeBearing = calculateRelativeBearing(deviceHeading, arBearing);

      if (Math.abs(arRelativeBearing) < 20) {
        arDirection = "Keep going straight";
      } else if (arRelativeBearing > 0) {
        arDirection = "Turn right";
      } else {
        arDirection = "Turn left";
      }
    }

    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        {/* Header */}
        <div className="p-6 bg-black/50 backdrop-blur-sm border-b border-white/10">
          <button
            onClick={() => {
              // Stop AR camera
              if (arCameraStream) {
                arCameraStream.getTracks().forEach(track => track.stop());
                setArCameraStream(null);
              }
              setCurrentScreen('main');
            }}
            className="text-white text-sm mb-2 flex items-center gap-2"
          >
            ← Exit AR Mode
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">AR Navigation</h1>
            <span className="px-3 py-1 text-xs font-semibold bg-purple-600 rounded-full animate-pulse">
              PHASE 3 PREVIEW
            </span>
          </div>
        </div>

        {/* Main AR Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {/* Centered AR Directional Arrow - Rotates with real bearing */}
          <div className="relative mb-8">
            <div
              className="w-32 h-32 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-full flex items-center justify-center border-4 border-yellow-400/60 animate-pulse transition-transform duration-500"
              style={{ transform: `rotate(${arRelativeBearing}deg)` }}
            >
              <svg className="w-20 h-20 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4 12h5v8h6v-8h5z" />
              </svg>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl -z-10"></div>
          </div>

          {/* Distance Indicator - Shows real distance */}
          <div className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-yellow-400/50 mb-4">
            <div className="text-3xl font-bold text-yellow-400">{formatDistance(arDistance)}</div>
          </div>

          {/* Direction Text - Shows real direction */}
          <div className="text-center mb-8">
            <div className="text-xl font-semibold mb-1">{arDirection}</div>
            <div className="text-gray-300 text-sm">to {selectedPOI?.name || 'destination'}</div>
            {currentGPS && selectedPOI?.metadata?.gps_lat && (
              <div className="text-xs text-gray-400 mt-1">
                {bearingToCardinal(arBearing)} {bearingToArrow(arBearing)}
              </div>
            )}
          </div>

          {/* AR Markers - Simulated POIs in view */}
          <div className="absolute top-1/3 left-1/4">
            <div className="bg-blue-500/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-blue-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Food Court</span>
              <span className="text-xs opacity-75">120m →</span>
            </div>
          </div>

          <div className="absolute top-1/2 right-1/4">
            <div className="bg-purple-500/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-purple-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Restrooms</span>
              <span className="text-xs opacity-75">85m ↗</span>
            </div>
          </div>

          {/* Compass indicator */}
          <div className="absolute top-8 right-8 w-16 h-16 bg-black/70 rounded-full border-2 border-white/30 flex items-center justify-center">
            <Compass className="w-8 h-8 text-white" style={{ transform: `rotate(${deviceHeading}deg)` }} />
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-xs font-bold">N</div>
          </div>

          {/* GPS Status indicator */}
          {currentGPS && (
            <div className="absolute bottom-8 left-8 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-400/50">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">GPS Active • ±{gpsAccuracy.toFixed(0)}m</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Info Panel */}
        <div className="p-6 bg-gradient-to-t from-black/90 to-transparent">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Navigation className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold mb-1">Phase 3: AR Wayfinding</div>
                <div className="text-xs text-gray-300">
                  Point your camera and see real-time AR arrows guiding you to any booth or stage. No GPS needed indoors.
                </div>
              </div>
            </div>
            <button
              onClick={() => setCurrentScreen('precision-finding')}
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              Switch to GPS Mode
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PRECISION FINDING SCREEN (AirTag-style navigation)
  if (currentScreen === 'precision-finding') {
    const isClose = distanceToTarget < 20;
    const isVeryClose = distanceToTarget < 12;
    const isPointingCorrect = Math.abs(relativeBearing) < 30;

    // Get current waypoint name for path-based navigation
    const currentWaypoint = navigationPath.length > 0 ? navigationPath[currentWaypointIndex] : null;
    const isLastWaypoint = currentWaypointIndex === navigationPath.length - 1;
    const waypointProgress = navigationPath.length > 0 ? `${currentWaypointIndex + 1}/${navigationPath.length}` : null;

    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-brand-black to-brand-gray-dark text-white">
        {/* Enhanced Arrival Modal */}
        {showArrivalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-2xl p-8 max-w-sm mx-4 flex flex-col items-center animate-bounceIn relative overflow-hidden">
              {/* Celebration background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-yellow-400/20 animate-pulse"></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Success Icon with glow */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <CheckCircle className="w-20 h-20 text-green-500 relative animate-bounce" />
                </div>

                {/* Trophy Icon */}
                <Trophy className="w-12 h-12 text-yellow-500 mb-3 animate-pulse" />

                <h2 className="text-3xl font-bold text-green-700 mb-2">You've Arrived! 🎉</h2>
                <p className="text-lg text-gray-700 mb-1 text-center">
                  Welcome to
                </p>
                <p className="text-xl font-bold text-brand-black mb-6 text-center">
                  {selectedPOI?.name}
                </p>

                {/* Action Buttons */}
                <div className="w-full space-y-3">
                  <button
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2"
                    onClick={() => {
                      setShowArrivalModal(false);
                      setCurrentScreen('main');
                      setActiveTab('directory');
                    }}
                  >
                    <MapPin className="w-5 h-5" />
                    Find Another POI
                  </button>

                  <button
                    className="w-full px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold shadow border-2 border-gray-200 transform transition hover:scale-105 flex items-center justify-center gap-2"
                    onClick={() => {
                      setShowArrivalModal(false);
                      setCurrentScreen('main');
                      setActiveTab('map');
                    }}
                  >
                    <Map className="w-5 h-5" />
                    View on Map
                  </button>

                  <button
                    className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 rounded-lg font-medium transition"
                    onClick={() => setShowArrivalModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="p-6 bg-brand-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
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
              className="text-brand-yellow text-sm"
            >
              ← Back
            </button>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="text-xs text-gray-500 px-2 py-1 border border-gray-600 rounded"
            >
              {debugMode ? '🔧 Debug ON' : 'Debug'}
            </button>
          </div>
          <h1 className="text-2xl font-bold">{selectedPOI?.name}</h1>
          {currentWaypoint && !isLastWaypoint ? (
            <p className="text-gray-400 text-sm mt-1">Via {currentWaypoint.name} • Step {waypointProgress}</p>
          ) : currentWaypoint && isLastWaypoint ? (
            <p className="text-gray-400 text-sm mt-1">Final destination • Step {waypointProgress}</p>
          ) : (
            <p className="text-gray-400 text-sm mt-1">Finding your way...</p>
          )}
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

          {/* Brand arrow — flowing animated chevron */}
          {(() => {
            // Priority 1: If following a path, lock the chevron to the turn direction
            let chevronRotation = 0; // Default: Straight Up

            if (currentWaypoint) {
              // Path-based rotation overlay
              if (!isPointingCorrect) {
                if (relativeBearing > 0 && relativeBearing < 150) {
                  chevronRotation = 90; // Turn Right
                } else if (relativeBearing < 0 && relativeBearing > -150) {
                  chevronRotation = -90; // Turn Left
                } else if (Math.abs(relativeBearing) >= 150) {
                  chevronRotation = 180; // Turn Around
                }
              }
            } else {
              // Priority 2: Direct compass direction if no path
              let normBearing = relativeBearing % 360;
              if (normBearing > 180) normBearing -= 360;
              if (normBearing < -180) normBearing += 360;

              if (Math.abs(normBearing) < 30) {
                chevronRotation = 0;
              } else if (normBearing > 30 && normBearing <= 150) {
                chevronRotation = 90;
              } else if (normBearing < -30 && normBearing >= -150) {
                chevronRotation = -90;
              } else {
                chevronRotation = 180;
              }
            }

            return (
              <div className="relative flex flex-col items-center mb-8">
                <style>{`
                  @keyframes chevron-flow {
                    0%   { opacity: 0; transform: translateY(40px); }
                    50%  { opacity: 1; transform: translateY(0px); }
                    100% { opacity: 0; transform: translateY(-40px); }
                  }
                `}</style>
                <div
                  className="transition-transform duration-700 ease-in-out"
                  style={{ transform: `rotate(${chevronRotation}deg)`, willChange: 'transform' }}
                >
                  {/* Exact polygon paths from AD-Instagram-2025 brand SVGs, scaled to 160×210px viewBox */}
                  <svg width="160" height="210" viewBox="0 0 402 620" fill="none">
                    {/* Chevron 1 — largest, topmost (leads the wave) */}
                    <path
                      d="M201 53L127 112L128.5 161.5L199.5 97L275 161.5V107L201 53Z"
                      style={{
                        ['--arrow-color' as string]: isVeryClose ? '#4ade80' : isPointingCorrect ? '#4ade80' : '#FF0003',
                        fill: isVeryClose ? '#4ade80' : isPointingCorrect ? '#4ade80' : '#FF0003',
                        stroke: isVeryClose ? '#4ade80' : isPointingCorrect ? '#4ade80' : '#FF0003',
                        strokeWidth: 2,
                        opacity: 0,
                        animation: isVeryClose ? 'none' : 'chevron-flow 1.5s ease-in-out infinite',
                        animationDelay: '0s',
                      }}
                    />
                    {/* Chevron 2 — medium */}
                    <path
                      d="M200.5 133L151 171.065L152.003 203L199.497 161.387L250 203V167.839L200.5 133Z"
                      style={{
                        ['--arrow-color' as string]: isVeryClose ? '#4ade80' : isPointingCorrect ? '#4ade80' : '#FF0003',
                        fill: isVeryClose ? '#4ade80' : isPointingCorrect ? '#4ade80' : '#FF0003',
                        stroke: isVeryClose ? '#4ade80' : isPointingCorrect ? '#4ade80' : '#FF0003',
                        strokeWidth: 2,
                        opacity: 0,
                        animation: isVeryClose ? 'none' : 'chevron-flow 1.5s ease-in-out infinite',
                        animationDelay: '0.2s',
                      }}
                    />
                    {/* Chevron 3 — smallest, bottommost (wave starts here) */}
                    <path
                      d="M200.5 191L184 203.507L184.334 214L200.166 200.327L217 214V202.447L200.5 191Z"
                      style={{
                        ['--arrow-color' as string]: isVeryClose ? '#4ade80' : isPointingCorrect ? '#4ade80' : '#FF0003',
                        fill: isVeryClose ? '#4ade80' : isPointingCorrect ? '#4ade80' : '#FF0003',
                        stroke: isVeryClose ? '#4ade80' : isPointingCorrect ? '#4ade80' : '#FF0003',
                        strokeWidth: 2,
                        opacity: 0,
                        animation: isVeryClose ? 'none' : 'chevron-flow 1.5s ease-in-out infinite',
                        animationDelay: '0.4s',
                      }}
                    />
                  </svg>
                </div>
                {/* Arrival pulse */}
                {isVeryClose && (
                  <div className="w-16 h-16 bg-green-400 rounded-full animate-ping opacity-60 mt-2" />
                )}
              </div>
            );
          })()}


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

            {/* Debug Controls */}
            {debugMode && (
              <div className="mt-6 p-4 bg-black/50 rounded-lg border border-brand-yellow">
                <p className="text-xs text-brand-yellow mb-2">🔧 Debug Mode</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (currentGPS && selectedPOI?.metadata?.gps_lat && selectedPOI?.metadata?.gps_lng) {
                        const poiGPS = { lat: selectedPOI.metadata.gps_lat, lng: selectedPOI.metadata.gps_lng };
                        const bearing = calculateBearing(currentGPS, poiGPS);
                        const distance = Math.max(0, distanceToTarget - 10);

                        // Move 10m closer
                        const newLat = currentGPS.lat + (10 / 111320) * Math.cos(bearing * Math.PI / 180);
                        const newLng = currentGPS.lng + (10 / (111320 * Math.cos(currentGPS.lat * Math.PI / 180))) * Math.sin(bearing * Math.PI / 180);

                        setCurrentGPS({ lat: newLat, lng: newLng });
                      }
                    }}
                    className="px-3 py-1 bg-green-500 text-white text-xs rounded"
                  >
                    Walk 10m Closer
                  </button>
                  <button
                    onClick={() => {
                      if (currentGPS && selectedPOI?.metadata?.gps_lat) {
                        setDistanceToTarget(2);
                        setShowArrivalModal(true);
                      }
                    }}
                    className="px-3 py-1 bg-brand-red text-white text-xs rounded"
                  >
                    Trigger Arrival
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Distance: {distanceToTarget.toFixed(1)}m</p>
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
      <div className="min-h-screen bg-brand-black text-white font-inter flex flex-col items-center p-8">
        <div className="w-full max-w-sm mt-12 mb-12 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
          <h1 className="text-4xl font-black tracking-tighter uppercase italic relative z-10">
            NAV<span className="text-brand-yellow">EAZE</span>
          </h1>
          <p className="text-[10px] font-black tracking-[0.4em] uppercase text-white/40 mt-2">Mission Intelligence</p>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-brand-yellow rounded-full"></div>
            <h2 className="text-lg font-black uppercase tracking-widest italic">Active Sectors</h2>
          </div>

          {events.length === 0 && loadingEvents ? (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">Syncing with HQ...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-10 border border-white/10 text-center">
              <MapPin className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">No Sectors Detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <div
                  key={event.id}
                  onClick={() => handleEventSelect(event)}
                  className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 cursor-pointer hover:border-brand-yellow/30 hover:bg-white/10 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-yellow/5 rounded-full blur-2xl -translate-y-12 translate-x-12 group-hover:bg-brand-yellow/10 transition-colors" />

                  <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex-1">
                      <h3 className="text-white font-black text-lg uppercase tracking-tight italic mb-1 group-hover:text-brand-yellow transition-colors">{event.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20">
                          {event.navigation_mode}
                        </span>
                        {event.start_date && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 text-white/40 border border-white/10">
                            {new Date(event.start_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-yellow group-hover:border-brand-yellow transition-all">
                      <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-brand-black transition-colors" />
                    </div>
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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-brand-black text-white relative shadow-2xl overflow-hidden font-inter">
      {/* Message Toast */}
      {showMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] bg-brand-yellow/90 backdrop-blur-md text-brand-black px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(255,215,0,0.3)] border border-white/20 animate-in fade-in zoom-in duration-300 font-bold uppercase tracking-widest text-xs">
          {message}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* DIRECTORY TAB */}
        {activeTab === 'directory' && (
          <div className="flex flex-col h-full bg-brand-black">
            <div className="p-6 bg-brand-black/40 backdrop-blur-xl border-b border-white/10 relative overflow-hidden">
              {/* Decorative Gradient Flare */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h1 className="text-white text-2xl font-black tracking-tighter uppercase italic">
                    NAV<span className="text-brand-yellow">EAZE</span>
                  </h1>
                  <p className="text-white/40 text-xs mt-0.5 font-medium uppercase tracking-widest">{selectedEvent?.name || 'Event Navigation'}</p>
                </div>
                <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  {offlineMode ? (
                    <WifiOff className="w-3.5 h-3.5 text-brand-red" />
                  ) : (
                    <div className="relative">
                      <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-brand-yellow rounded-full animate-ping opacity-50"></div>
                    </div>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                    {offlineMode ? 'Offline' : 'Live'}
                  </span>
                </div>
              </div>
            </div>

            {/* GPS Status Banner */}
            {selectedEvent && (selectedEvent.navigation_mode === 'outdoor' || selectedEvent.navigation_mode === 'hybrid') && (
              <div className={`px-6 py-2.5 ${gpsEnabled && isGPSAccuracyGood(gpsAccuracy)
                ? 'bg-green-500/10 border-b border-green-500/20'
                : 'bg-orange-500/10 border-b border-orange-500/20'
                }`}>
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest">
                  <div className="flex items-center gap-2">
                    <Satellite className={`w-3.5 h-3.5 ${gpsEnabled && isGPSAccuracyGood(gpsAccuracy)
                      ? 'text-green-400'
                      : 'text-orange-400'
                      }`} />
                    <span className={gpsEnabled && isGPSAccuracyGood(gpsAccuracy) ? 'text-green-400' : 'text-orange-400'}>
                      {gpsEnabled && isGPSAccuracyGood(gpsAccuracy) ? (
                        <>GPS LOCK • ±{gpsAccuracy.toFixed(0)}m</>
                      ) : gpsEnabled ? (
                        <>SIGNAL WEAK • ±{gpsAccuracy.toFixed(0)}m</>
                      ) : (
                        <>ACQUIRING SIGNAL...</>
                      )}
                    </span>
                  </div>
                  {!isGPSAccuracyGood(gpsAccuracy) && gpsEnabled && nearestLandmark && (
                    <span className="text-orange-400 animate-pulse">
                      APPROACH {nearestLandmark.name}
                    </span>
                  )}
                  {currentGPS && (
                    <span className="text-white/20">
                      {currentGPS.lat.toFixed(6)}, {currentGPS.lng.toFixed(6)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* AR Preview Promo Banner (Phase 3 Demo) */}
              <div className="p-4">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm">Phase 3: AR Navigation</div>
                      <div className="text-white/80 text-xs">See the future of event wayfinding</div>
                    </div>
                    <span className="px-2 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full">
                      NEW
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (pois.length > 0) {
                        setSelectedPOI(pois[0]);
                        setCurrentScreen('ar-preview');
                      }
                    }}
                    className="w-full bg-white text-purple-600 font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2 mt-3"
                  >
                    <Camera className="w-4 h-4" />
                    Try AR Mode
                  </button>
                </div>
              </div>

              {pois.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 pb-20">
                  {pois.map((poi) => (
                    <div key={poi.id} className="group bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 hover:border-brand-yellow/30 transition-all duration-300 relative overflow-hidden">
                      {/* Interactive Glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-brand-yellow/0 via-brand-yellow/5 to-brand-yellow/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex items-center justify-between gap-4 relative z-10">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-lg tracking-tight truncate">{poi.name}</h3>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-lg bg-brand-yellow/10 text-brand-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border border-brand-yellow/20">
                              POI
                            </span>
                            {poi.isLandmark && (
                              <span className="inline-flex items-center rounded-lg bg-purple-500/10 text-purple-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border border-purple-500/20">
                                Landmark
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleGetDirections(poi)}
                          className="bg-brand-yellow text-brand-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                        >
                          <Navigation className="w-3.5 h-3.5 fill-current" />
                          Go
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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

        {/* MAP TAB — full-screen canvas, UI overlaid */}
        {activeTab === 'map' && (
          <div
            ref={mapContainerRef}
            className="absolute inset-0 bg-gray-900"
          >
            {/* Canvas fills the entire tab area */}
            {graphNodes.length > 0 ? (
              <FloorplanCanvas
                floorplanImageUrl={floorplanImageUrl || ''}
                nodes={graphNodes}
                segments={graphSegments}
                pois={pois}
                highlightPath={highlightPath}
                currentLocation={
                  currentLocation && (currentLocation.source === 'qr' || isGPSAccuracyGood(gpsAccuracy))
                    ? { x: currentLocation.x, y: currentLocation.y }
                    : undefined
                }
                fitToContainer={true}
                containerWidth={mapContainerWidth > 0 ? mapContainerWidth : window.innerWidth}
                containerHeight={mapContainerHeight > 0 ? mapContainerHeight : window.innerHeight - 64}
                gpsBounds={floorplanGpsBounds}
                mode="pan"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white/70 text-sm">Loading map…</p>
                </div>
              </div>
            )}

            {/* Top overlay: GPS pill + destination */}
            <div className="absolute top-0 left-0 right-0 z-10 flex flex-col gap-2 p-4 pointer-events-none">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg pointer-events-auto border transition-colors ${gpsEnabled ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                  }`}>
                  <Satellite className="w-3 h-3" />
                  {gpsEnabled ? `GPS LOCK ±${gpsAccuracy.toFixed(0)}m` : 'SIGNAL SEARCH...'}
                </div>
                {selectedPOI && (
                  <div className="flex-1 min-w-0 flex items-center gap-2 bg-brand-black/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xl pointer-events-auto border border-white/10">
                    <Navigation className="w-3 h-3 text-brand-yellow shrink-0 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/90 truncate uppercase tracking-widest leading-none mt-0.5">→ {selectedPOI.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom sheet */}
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-brand-black/80 backdrop-blur-2xl rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
              </div>

              {selectedPOI ? (
                <div className="p-5 pt-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-yellow flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                      <Navigation className="w-6 h-6 text-brand-black fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Navigating Destination</p>
                      <p className="text-lg font-black text-white truncate leading-tight uppercase italic">{selectedPOI.name}</p>
                    </div>
                  </div>
                  {turnByTurnDirections.length > 0 && (
                    <div className="bg-white/5 rounded-2xl p-4 mb-4 flex items-center gap-4 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-brand-yellow/10 flex items-center justify-center shrink-0">
                        <Compass className="w-4 h-4 text-brand-yellow shrink-0" />
                      </div>
                      <p className="text-sm text-white/90 font-medium leading-relaxed">
                        {turnByTurnDirections[currentWaypointIndex] || turnByTurnDirections[0]}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPOI(null);
                      setHighlightPath([]);
                      setNavigationPath([]);
                      setTurnByTurnDirections([]);
                    }}
                    className="w-full py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
                  >
                    Terminate Mission
                  </button>
                </div>
              ) : (
                <div className="p-5 pt-1">
                  <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Tactical Intelligence</h2>
                  {pois.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {pois.map(poi => (
                        <button
                          key={poi.id}
                          onClick={() => handleGetDirections(poi)}
                          className="w-full flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all rounded-2xl text-left border border-white/5 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 flex items-center justify-center shrink-0 border border-brand-yellow/20 group-hover:bg-brand-yellow transition-colors">
                            <MapPin className="w-4 h-4 text-brand-yellow group-hover:text-brand-black transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate uppercase tracking-tight">{poi.name}</p>
                            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5">Initiate Pathfinding</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/20 shrink-0 group-hover:text-brand-yellow transition-colors" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest text-center py-6">No Tactical Targets Detected</p>
                  )}
                  {!currentLocation && (
                    <div className="mt-4 flex items-center gap-3 bg-brand-yellow/10 border border-brand-yellow/20 rounded-xl px-4 py-3">
                      <Satellite className="w-4 h-4 text-brand-yellow animate-pulse" />
                      <p className="text-[10px] text-brand-yellow font-black uppercase tracking-widest leading-relaxed">
                        {selectedEvent?.navigation_mode === 'outdoor'
                          ? 'Synchronizing GPS Satellite Data...'
                          : 'Scan Anchor QR to Initialize Position'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCANNER TAB */}
        {activeTab === 'scanner' && (
          <div className="flex flex-col h-full bg-brand-black">
            <div className="p-6 bg-brand-black/40 backdrop-blur-xl border-b border-white/10 relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-white text-2xl font-black tracking-tighter uppercase italic">QR <span className="text-brand-yellow">SCANNER</span></h2>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Acquire Tactical Anchor Position</p>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* Scanner overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-64 border border-white/20 rounded-3xl backdrop-blur-[2px]" />
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-brand-yellow rounded-tl-3xl shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-brand-yellow rounded-tr-3xl shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-brand-yellow rounded-bl-3xl shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-brand-yellow rounded-br-3xl shadow-[0_0_15px_rgba(255,215,0,0.5)]" />

                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-yellow/50 shadow-[0_0_10px_brand-yellow] animate-[scan_2s_ease-in-out_infinite]" />

                  <p className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-brand-yellow text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap animate-pulse">Align with NavEaze Anchor</p>
                </div>
              </div>
            </div>
            {!cameraStream && (
              <div className="p-8 absolute inset-0 flex items-center justify-center bg-brand-black/80 backdrop-blur-md z-30">
                <button
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                      setCameraStream(stream);
                      if (videoRef.current) videoRef.current.srcObject = stream;
                    } catch (e) { displayMessage('Camera Access Denied', 3000); }
                  }}
                  className="w-full max-w-xs py-4 bg-brand-yellow text-brand-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(255,215,0,0.3)] animate-bounce"
                >
                  Enable Optics
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* POPIA Consent Overlay */}
      {!hasConsented && (
        <div className="fixed inset-0 bg-brand-black/95 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-brand-yellow/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShieldCheck className="w-12 h-12 text-brand-yellow relative z-10" />
          </div>
          <h2 className="text-3xl font-black text-white mb-6 uppercase italic tracking-tighter">DATA <span className="text-brand-yellow">PROTECTION</span></h2>
          <p className="text-white/40 mb-10 max-w-sm text-sm font-medium leading-relaxed tracking-wide">
            NavEaze requires local storage to synchronize tactical movement data and maintain encrypted session identity for security protocols.
          </p>
          <button
            onClick={() => {
              localStorage.setItem('naveaze_consent', 'true');
              setHasConsented(true);
            }}
            className="w-full max-w-xs py-5 bg-brand-yellow hover:bg-yellow-400 text-brand-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_0_40px_rgba(255,215,0,0.2)] active:scale-95"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Floating SOS Button */}
      {activeTab !== 'scanner' && (
        <button
          onClick={() => setShowSosModal(true)}
          disabled={sosLoading}
          className="absolute bottom-24 right-6 w-14 h-14 bg-brand-red rounded-full shadow-[0_0_30px_rgba(237,28,36,0.5)] flex items-center justify-center text-white z-50 transition-all active:scale-90 border-4 border-brand-black group"
        >
          {sosLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <AlertTriangle className="w-6 h-6 fill-white text-brand-red group-hover:scale-110 transition-transform" />
          )}
        </button>
      )}

      {/* SOS Confirmation Modal */}
      {showSosModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1C1C1F] border border-[#2A2A2A] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Emergency Assistance</h3>
              <p className="text-white/60 text-sm">
                This will send an immediate alert with your current location to onsite security staff. Are you sure you need assistance?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSosModal(false)}
                disabled={sosLoading}
                className="flex-1 py-3 px-4 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSOS}
                disabled={sosLoading}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center"
              >
                {sosLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Send Alert'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="shrink-0 bg-brand-black/90 backdrop-blur-2xl border-t border-white/5 relative z-40 pb-safe">
        <div className="flex px-4 py-2 gap-2">
          {([
            { id: 'directory', label: 'Directory', Icon: List },
            { id: 'map', label: 'Tactical', Icon: Map },
            { id: 'scanner', label: 'Optics', Icon: Scan },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center py-2 gap-1 rounded-2xl transition-all duration-300 ${activeTab === id
                ? 'bg-brand-yellow shadow-[0_0_20px_rgba(255,215,0,0.2)] text-brand-black'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
            >
              <Icon className={`w-5 h-5 ${activeTab === id ? 'fill-current' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AttendeePWANew;
