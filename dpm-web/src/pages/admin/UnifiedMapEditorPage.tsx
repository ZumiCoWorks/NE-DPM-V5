import React, { Suspense, useEffect, useState } from 'react'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { validateGraphConnectivity, ValidationResult } from '../../lib/graphValidation'
import { GraphNode, GraphSegment } from '../../lib/pathfinding'

// Type definition for the FloorplanEditor component
interface FloorplanEditorProps {
  initialFloorplan?: string | null
  initialEventId?: string | null
  onEventChange?: (eventId: string | null) => void
}

// Lazy-load the unified FloorplanEditor merged into src/components
// @ts-ignore - JSX module type declaration
const FloorplanEditor = React.lazy(() => import('../../components/FloorplanEditor')) as unknown as React.FC<FloorplanEditorProps>

export const UnifiedMapEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const floorplanId = searchParams.get('floorplanId')
  const initialEventId = searchParams.get('eventId')
  const [eventId, setEventId] = useState<string | null>(initialEventId)
  const [initialFloorplanUrl, setInitialFloorplanUrl] = useState<string | undefined>(undefined)
  const [gpsFallbackInstruction, setGpsFallbackInstruction] = useState<string>('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (!floorplanId) return
    let mounted = true
      ; (async () => {
        try {
          if (!supabase) {
            console.warn('Supabase client not initialized for UnifiedMapEditor')
            return
          }
          const { data, error } = await supabase.from('floorplans').select('image_url').eq('id', floorplanId).single()
          if (error) {
            console.warn('Could not fetch floorplan for unified editor:', error)
            return
          }
          const row = (data as { image_url?: string } | null)
          if (mounted) setInitialFloorplanUrl(row?.image_url ?? undefined)
        } catch (err) {
          console.warn('UnifiedMapEditor fetch failed', err)
        }
      })()
    return () => { mounted = false }
  }, [floorplanId])

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

      <div className="flex-1 relative bg-gray-50">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
          <FloorplanEditor
            initialFloorplan={initialFloorplanUrl}
            initialEventId={eventId}
            onEventChange={(id) => setEventId(id)}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default UnifiedMapEditorPage
