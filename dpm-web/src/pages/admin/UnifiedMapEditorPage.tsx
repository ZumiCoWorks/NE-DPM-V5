import React, { Suspense, useEffect, useState } from 'react'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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
