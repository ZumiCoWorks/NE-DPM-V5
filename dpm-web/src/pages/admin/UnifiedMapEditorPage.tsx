import React, { Suspense, useEffect, useState } from 'react'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { validateGraphConnectivity, ValidationResult } from '../../lib/graphValidation'
import { GraphNode, GraphSegment } from '../../lib/pathfinding'
import LeafletMapEditor from '../../components/LeafletMapEditor'
import { GPSCalibrationWizard } from '../../components/GPSCalibrationWizard'

// Type definition for the FloorplanEditor component
interface FloorplanEditorProps {
  initialFloorplan?: string | null
  initialEventId?: string | null
  onEventChange?: (eventId: string | null) => void
  hideToolbar?: boolean
}

// Lazy-load the unified FloorplanEditor merged into src/components
// @ts-ignore - JSX module type declaration
const FloorplanEditor = React.lazy(() => import('../../components/FloorplanEditor')) as unknown as React.FC<FloorplanEditorProps>

export const UnifiedMapEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const floorplanIdParam = searchParams.get('floorplanId')
  const initialEventId = searchParams.get('eventId')
  const [eventId, setEventId] = useState<string | null>(initialEventId)
  const [floorplanId, setFloorplanId] = useState<string | null>(floorplanIdParam)
  const [initialFloorplanUrl, setInitialFloorplanUrl] = useState<string | undefined>(undefined)
  const [floorplanDimensions, setFloorplanDimensions] = useState<{ width: number; height: number } | null>(null)
  const [gpsFallbackInstruction, setGpsFallbackInstruction] = useState<string>('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [useLeafletEditor, setUseLeafletEditor] = useState(true) // Default to Leaflet Editor (Classic Editor disabled)
  const [gpsBounds, setGpsBounds] = useState<any>(null)
  const [showCalibrationWizard, setShowCalibrationWizard] = useState(false)
  const [calibrationStatus, setCalibrationStatus] = useState<{ scale: number; rotation: number } | null>(null)

  // Load floorplan by event_id (same as Classic Editor)
  useEffect(() => {
    if (!eventId || !supabase) return;

    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('floorplans')
          .select('id, image_url, image_width, image_height, scale_meters_per_pixel, rotation_degrees, is_calibrated')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.warn('Could not fetch floorplan for event:', error);
          return;
        }

        if (mounted && data) {
          const floorplanData = data as {
            id: string;
            image_url: string;
            image_width?: number | null;
            image_height?: number | null;
            scale_meters_per_pixel?: number | null;
            rotation_degrees?: number | null;
            is_calibrated?: boolean | null;
          };

          if (!floorplanData.image_url) return;

          setFloorplanId(floorplanData.id);
          setInitialFloorplanUrl(floorplanData.image_url);

          // Set dimensions if available
          if (floorplanData.image_width && floorplanData.image_height) {
            setFloorplanDimensions({
              width: floorplanData.image_width,
              height: floorplanData.image_height
            });
          } else {
            // Load image to get dimensions
            const img = new Image();
            img.onload = () => {
              setFloorplanDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = floorplanData.image_url;
          }

          // Set calibration status if available
          if (floorplanData.is_calibrated && floorplanData.scale_meters_per_pixel !== null && floorplanData.rotation_degrees !== null) {
            setCalibrationStatus({
              scale: floorplanData.scale_meters_per_pixel as number,
              rotation: floorplanData.rotation_degrees as number
            });
          }

          console.log('✅ Loaded floorplan for event:', eventId);
        }
      } catch (err) {
        console.warn('Floorplan fetch failed:', err);
      }
    })();

    return () => { mounted = false };
  }, [eventId]);


  // Fetch GPS bounds for Leaflet editor - use calibrated bounds from floorplan
  useEffect(() => {
    if (!eventId || !supabase) return

    (async () => {
      // First, try to get calibrated bounds from floorplans table
      const { data: floorplanData, error: floorplanError } = await supabase
        .from('floorplans')
        .select('is_calibrated, gps_top_left_lat, gps_top_left_lng, gps_top_right_lat, gps_top_right_lng, gps_bottom_left_lat, gps_bottom_left_lng, gps_bottom_right_lat, gps_bottom_right_lng')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!floorplanError && floorplanData) {
        const data = floorplanData as Record<string, any>;
        if (data.is_calibrated) {
          // Use calibrated 4-corner bounds for accurate alignment
          // Calculate the bounding box from the 4 corners
          const calibratedData = data as {
            is_calibrated: boolean;
            gps_top_left_lat: number;
            gps_top_left_lng: number;
            gps_top_right_lat: number;
            gps_top_right_lng: number;
            gps_bottom_left_lat: number;
            gps_bottom_left_lng: number;
            gps_bottom_right_lat: number;
            gps_bottom_right_lng: number;
          };

          const lats = [
            calibratedData.gps_top_left_lat,
            calibratedData.gps_top_right_lat,
            calibratedData.gps_bottom_left_lat,
            calibratedData.gps_bottom_right_lat
          ];
          const lngs = [
            calibratedData.gps_top_left_lng,
            calibratedData.gps_top_right_lng,
            calibratedData.gps_bottom_left_lng,
            calibratedData.gps_bottom_right_lng
          ];

          setGpsBounds({
            ne: { lat: Math.max(...lats), lng: Math.max(...lngs) },
            sw: { lat: Math.min(...lats), lng: Math.min(...lngs) }
          });

          console.log('✅ Using calibrated GPS bounds from floorplan');
        }
      } else {
        // Fallback to event-level bounds if no calibration exists
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('gps_bounds_ne_lat, gps_bounds_ne_lng, gps_bounds_sw_lat, gps_bounds_sw_lng')
          .eq('id', eventId)
          .single()

        if (!eventError && eventData) {
          const bounds = eventData as {
            gps_bounds_ne_lat: number;
            gps_bounds_ne_lng: number;
            gps_bounds_sw_lat: number;
            gps_bounds_sw_lng: number;
          };

          setGpsBounds({
            ne: { lat: bounds.gps_bounds_ne_lat, lng: bounds.gps_bounds_ne_lng },
            sw: { lat: bounds.gps_bounds_sw_lat, lng: bounds.gps_bounds_sw_lng }
          });

          console.log('⚠️ Using event-level GPS bounds (no calibration found)');
        } else {
          // No bounds found - use default so editor can load
          console.log('🌍 No GPS bounds found. Using default bounds.');
          setGpsBounds({
            ne: { lat: -25.746, lng: 28.188 },
            sw: { lat: -25.748, lng: 28.186 }
          });
        }
      }
    })()
  }, [eventId])

  const handleTestConnectivity = async () => {
    if (!eventId) {
      alert('No Event ID found. Cannot validate.');
      return;
    }

    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    setIsValidating(true);
    try {
      // Fetch navigation data
      const { data: points } = await supabase.from('navigation_points').select('*').eq('event_id', eventId);
      const { data: segments } = await supabase.from('navigation_segments').select('*').eq('event_id', eventId);

      const nodes: GraphNode[] = ((points as any[]) || []).map((p: any) => ({
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

      const segs: GraphSegment[] = ((segments as any[]) || []).map((s: any) => ({
        id: s.id,
        start_node_id: s.from_node_id,
        end_node_id: s.to_node_id
      }));


      const result = validateGraphConnectivity(nodes, segs);
      setValidationResult(result);

      if (result.isValid) {
        alert(`✅ Graph is valid!\n\nAll ${result.totalNodes} nodes are connected.`);
      } else {
        alert(`❌ Graph has issues!\n\nFound ${result.orphanNodes.length} orphan nodes.\n\nCheck the validation panel below.`);
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      alert(`Failed to validate: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePublish = async () => {
    if (!eventId) {
      alert('No Event ID found. Cannot publish.');
      return;
    }

    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    try {
      // Fetch all necessary data for the "Download-Once" model
      const { data: nodes } = await supabase.from('navigation_points').select('*').eq('event_id', eventId);
      const { data: segments } = await supabase.from('navigation_segments').select('*').eq('event_id', eventId);
      const { data: floorplan } = await supabase.from('floorplans').select('*').eq('event_id', eventId).single();

      const floorplanData = floorplan as { image_url?: string; calibration_method?: string; pixels_per_meter?: number } | null;
      const nodesData = (nodes || []) as any[];
      const segmentsData = (segments || []) as any[];

      // Construct the Manifest JSON
      const manifest = {
        eventId: eventId,
        generatedAt: new Date().toISOString(),
        floorplanUrl: floorplanData?.image_url || '',
        gpsFallbackInstruction: gpsFallbackInstruction || 'Look for physical landmarks to orient yourself.',
        config: {
          pixelsPerMeter: floorplanData?.pixels_per_meter || 15.5, // Default or fetched
          calibrationMethod: floorplanData?.calibration_method || 'manual'
        },
        nodes: nodesData.map(n => ({
          id: n.id,
          x: n.x_coord,
          y: n.y_coord,
          name: n.name,
          type: n.point_type,
          isDestination: n.is_destination,
          neighbors: segmentsData
            .filter(s => s.start_node_id === n.id || s.end_node_id === n.id)
            .map(s => {
              const neighborId = s.start_node_id === n.id ? s.end_node_id : s.start_node_id;
              // Calculate distance (weight)
              const neighborNode = nodesData.find(nd => nd.id === neighborId);
              let weight = 1;
              if (neighborNode) {
                const dx = n.x_coord - neighborNode.x_coord;
                const dy = n.y_coord - neighborNode.y_coord;
                weight = Math.sqrt(dx * dx + dy * dy);
              }
              return { id: neighborId, weight };
            })
        })),
        pois: nodesData.filter((n: any) => n.point_type === 'poi').map(p => ({
          id: p.id,
          name: p.name,
          x: p.x_coord,
          y: p.y_coord
        }))
      };

      console.log('🚀 Generated Manifest:', manifest);

      // NOTE: Manifest upload disabled for Phase 1 - not needed for PWA functionality
      // The PWA loads data directly from database tables, not from manifest files
      /*
      // Convert to Blob
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const fileName = `manifest_${eventId}.json`;

      // Upload to Supabase Storage
      // Try 'events' bucket first, fallback to 'floorplans' if needed
      let { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) {
        console.warn('Failed to upload to events bucket, trying floorplans bucket...', uploadError);
        const { error: fallbackError } = await supabase.storage
          .from('floorplans')
          .upload(fileName, blob, { upsert: true });

        if (fallbackError) {
          throw fallbackError;
        }
      }

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('events')
        .getPublicUrl(fileName);

      console.log('📦 Manifest uploaded:', publicUrlData?.publicUrl);
      */

      alert('✅ Map published successfully!');

    } catch (error: any) {
      console.error('Error publishing map:', error);
      alert(`Failed to publish map: ${error.message || error}`);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900">Unified Map Editor</h1>
          {eventId && <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">Event: {eventId}</span>}
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Bad Signal Instruction (e.g. Look for Red Banners)"
            className="text-sm border border-gray-300 rounded px-3 py-1.5 w-64 focus:ring-2 focus:ring-brand-red focus:border-transparent"
            value={gpsFallbackInstruction}
            onChange={(e) => setGpsFallbackInstruction(e.target.value)}
          />
          {/* Classic Editor toggle disabled - Leaflet Editor is now the default */}
          {/* <button
            onClick={() => setUseLeafletEditor(!useLeafletEditor)}
            disabled={!gpsBounds || !initialFloorplanUrl}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={!gpsBounds ? 'Event needs GPS bounds configured' : !initialFloorplanUrl ? 'Event needs floorplan uploaded' : 'Toggle between editors'}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {useLeafletEditor ? 'Classic Editor' : 'Leaflet Editor'}
          </button> */}
          <button
            onClick={() => setShowCalibrationWizard(true)}
            disabled={!initialFloorplanUrl}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={!initialFloorplanUrl ? 'Upload floorplan first' : 'Calibrate GPS coordinates'}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {gpsBounds ? 'Recalibrate GPS' : 'Calibrate GPS'}
          </button>
          <button
            onClick={handleTestConnectivity}
            disabled={isValidating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isValidating ? 'Validating...' : 'Test Connectivity'}
          </button>
          <button
            onClick={handlePublish}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Publish Map
          </button>
        </div>
      </div>

      {/* Calibration Status Banner */}
      {calibrationStatus && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-800">Map Calibrated</span>
            </div>
            <div className="text-xs text-green-700">
              Scale: <span className="font-mono font-semibold">{calibrationStatus.scale.toFixed(3)} m/px</span>
            </div>
            <div className="text-xs text-green-700">
              Rotation: <span className="font-mono font-semibold">{calibrationStatus.rotation.toFixed(1)}°</span>
            </div>
          </div>
          <button
            onClick={() => setShowCalibrationWizard(true)}
            className="text-xs text-green-700 hover:text-green-900 underline"
          >
            Recalibrate
          </button>
        </div>
      )}

      {/* Validation Results Panel */}
      {validationResult && !validationResult.isValid && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800">Graph Validation Failed</h3>
              <p className="text-sm text-red-700 mt-1">
                Found {validationResult.orphanNodes.length} orphan node(s) that are not connected to the graph:
              </p>
              <ul className="mt-2 space-y-1">
                {validationResult.orphanNodes.map((node) => (
                  <li key={node.id} className="text-sm text-red-600">
                    • <span className="font-mono">{node.name}</span> (ID: {node.id})
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-600 mt-2">
                Fix these issues before publishing to ensure all POIs are reachable.
              </p>
            </div>
            <button
              onClick={() => setValidationResult(null)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* GPS Calibration Wizard Modal */}
      {showCalibrationWizard && initialFloorplanUrl && floorplanId && floorplanDimensions && (
        <GPSCalibrationWizard
          floorplanUrl={initialFloorplanUrl}
          floorplanId={floorplanId}
          imageWidth={floorplanDimensions.width}
          imageHeight={floorplanDimensions.height}
          onComplete={async (calibrationData) => {
            if (!supabase || !eventId || !floorplanId) {
              alert('❌ Cannot save: Missing Supabase client, event ID, or floorplan ID');
              return;
            }

            try {
              // Save GPS bounds to events table (for backward compatibility)
              const { error: eventsError } = await supabase
                .from('events')
                .update({
                  gps_bounds_ne_lat: calibrationData.gpsBounds.ne.lat,
                  gps_bounds_ne_lng: calibrationData.gpsBounds.ne.lng,
                  gps_bounds_sw_lat: calibrationData.gpsBounds.sw.lat,
                  gps_bounds_sw_lng: calibrationData.gpsBounds.sw.lng
                })
                .eq('id', eventId);

              if (eventsError) throw eventsError;

              // Save full calibration data to floorplans table
              const { error: floorplansError } = await supabase
                .from('floorplans')
                .update({
                  image_width: floorplanDimensions.width,
                  image_height: floorplanDimensions.height,
                  scale_meters_per_pixel: calibrationData.scale_meters_per_pixel,
                  rotation_degrees: calibrationData.rotation_degrees,
                  north_bearing_degrees: calibrationData.rotation_degrees, // Same as rotation for now
                  gps_top_left_lat: calibrationData.gps_top_left_lat,
                  gps_top_left_lng: calibrationData.gps_top_left_lng,
                  gps_top_right_lat: calibrationData.gps_top_right_lat,
                  gps_top_right_lng: calibrationData.gps_top_right_lng,
                  gps_bottom_left_lat: calibrationData.gps_bottom_left_lat,
                  gps_bottom_left_lng: calibrationData.gps_bottom_left_lng,
                  gps_bottom_right_lat: calibrationData.gps_bottom_right_lat,
                  gps_bottom_right_lng: calibrationData.gps_bottom_right_lng,
                  calibration_method: 'gps_corners',
                  is_calibrated: true
                })
                .eq('id', floorplanId);

              if (floorplansError) throw floorplansError;

              // Update local state
              setGpsBounds(calibrationData.gpsBounds);
              setCalibrationStatus({
                scale: calibrationData.scale_meters_per_pixel,
                rotation: calibrationData.rotation_degrees
              });
              setShowCalibrationWizard(false);

              alert(`✅ Calibration saved successfully!\n\nScale: ${calibrationData.scale_meters_per_pixel.toFixed(3)} m/px\nRotation: ${calibrationData.rotation_degrees.toFixed(1)}°\nAccuracy: ±${calibrationData.estimated_accuracy_meters.toFixed(1)}m\n\nRefresh the page to enable Leaflet Editor.`);
            } catch (err: any) {
              console.error('Failed to save calibration:', err);
              alert(`❌ Failed to save calibration: ${err.message}`);
            }
          }}
          onCancel={() => setShowCalibrationWizard(false)}
        />
      )}

      <div className="flex-1 relative bg-gray-50">
        {/* GPS Bounds Missing Warning */}
        {useLeafletEditor && (!gpsBounds || !initialFloorplanUrl) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="max-w-md p-8 bg-white rounded-lg shadow-lg border-2 border-yellow-400">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Leaflet Editor Unavailable</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {!gpsBounds && (
                  <p className="flex items-start">
                    <span className="text-red-500 mr-2">✗</span>
                    <span><strong>GPS Bounds Missing:</strong> Configure GPS bounds for this event (ne_lat, ne_lng, sw_lat, sw_lng)</span>
                  </p>
                )}
                {!initialFloorplanUrl && (
                  <p className="flex items-start">
                    <span className="text-red-500 mr-2">✗</span>
                    <span><strong>Floorplan Missing:</strong> Upload a floorplan image for this event</span>
                  </p>
                )}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Use the Classic Editor below to set up your event, then switch to Leaflet for GPS-aligned editing.
                </p>
              </div>
            </div>
          </div>
        )}

        {gpsBounds && initialFloorplanUrl ? (
          <LeafletMapEditor
            floorplanId={floorplanId || ''}
            floorplanUrl={initialFloorplanUrl}
            gpsBounds={gpsBounds}
            onExport={async (nodes, segments) => {
              if (!supabase || !floorplanId) return;

              try {
                console.log('🗑️ Deleting existing navigation data...');

                // Delete existing segments first (foreign key constraint)
                const { error: deleteSegsError } = await supabase
                  .from('navigation_segments')
                  .delete()
                  .eq('floorplan_id', floorplanId);

                if (deleteSegsError) throw deleteSegsError;

                // Delete existing nodes
                const { error: deleteNodesError } = await supabase
                  .from('navigation_points')
                  .delete()
                  .eq('floorplan_id', floorplanId);

                if (deleteNodesError) throw deleteNodesError;

                console.log('📤 Inserting new navigation data...');

                // Insert new nodes
                const { error: nodesError } = await supabase
                  .from('navigation_points')
                  .insert(nodes.map(n => ({
                    id: n.id, // Include ID to maintain references
                    floorplan_id: floorplanId,
                    x_coord: n.x,
                    y_coord: n.y,
                    gps_lat: n.metadata?.gps_lat,
                    gps_lng: n.metadata?.gps_lng,
                    name: n.name,
                    point_type: n.type,
                    is_destination: n.type === 'poi'
                  })));

                if (nodesError) throw nodesError;

                // Insert new segments
                const { error: segsError } = await supabase
                  .from('navigation_segments')
                  .insert(segments.map(s => ({
                    id: s.id, // Include ID to maintain references
                    floorplan_id: floorplanId,
                    start_node_id: s.start_node_id,
                    end_node_id: s.end_node_id,
                    is_bidirectional: true
                  })));

                if (segsError) throw segsError;

                console.log('✅ Export complete!');
                alert(`✅ Exported ${nodes.length} nodes and ${segments.length} segments to database!`);
              } catch (error: any) {
                console.error('❌ Export error:', error);
                alert(`Failed to export: ${error.message}`);
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-6">
              {!eventId ? (
                <>
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Event</h3>
                  <p className="text-gray-500">Choose an event to start editing its navigation map.</p>
                </>
              ) : !initialFloorplanUrl ? (
                <>
                  <svg className="w-16 h-16 mx-auto text-blue-100 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Floorplan</h3>
                  <p className="text-gray-500 mb-6">This event doesn't have a floorplan yet. Upload an image to get started.</p>
                  <label className="inline-flex flex-col items-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                    <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                    </svg>
                    <span className="font-semibold">Select Floorplan Image</span>
                    <input type='file' className="hidden" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !eventId || !supabase) return;

                      try {
                        const fileName = `${eventId}/${Date.now()}_${file.name}`;
                        const { data, error } = await supabase.storage
                          .from('floorplans')
                          .upload(fileName, file);

                        if (error) throw error;

                        const { data: publicUrlData } = supabase.storage
                          .from('floorplans')
                          .getPublicUrl(fileName);

                        if (!publicUrlData.publicUrl) throw new Error('Failed to get public URL');

                        // Create floorplan record
                        const { data: fpData, error: fpError } = await supabase
                          .from('floorplans')
                          .insert({
                            event_id: eventId,
                            name: file.name,
                            image_url: publicUrlData.publicUrl,
                            file_path: fileName
                          })
                          .select()
                          .single();

                        if (fpError) throw fpError;

                        // Reload page state
                        setFloorplanId((fpData as any).id);
                        setInitialFloorplanUrl(publicUrlData.publicUrl);

                        // Load image dimensions
                        const img = new Image();
                        img.onload = () => {
                          setFloorplanDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                        };
                        img.src = publicUrlData.publicUrl;

                      } catch (err: any) {
                        console.error('Upload failed:', err);
                        alert(`Upload failed: ${err.message}`);
                      }
                    }} />
                  </label>
                </>
              ) : (
                <>
                  <svg className="w-16 h-16 mx-auto text-orange-200 mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Calibrate</h3>
                  <p className="text-gray-500 mb-6">Floorplan loaded! Click the button above to set GPS coordinates.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnifiedMapEditorPage
