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

      const floorplanData = floorplan as { image_url?: string } | null;
      const nodesData = (nodes || []) as any[];

      const payload = {
        generated_at: new Date().toISOString(),
        event_id: eventId,
        mapUrl: floorplanData?.image_url || '',
        nodes: nodes || [],
        edges: segments || [],
        pois: nodesData.filter((n: any) => n.point_type === 'poi') || [],
      };

      console.log('🚀 Publishing Map Payload:', payload);

      // Simulate saving to a "published_maps" bucket or table
      // For now, we'll just download it as a JSON file for the user to verify
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `naveaze_map_${eventId}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      alert('Map Published Successfully! JSON payload downloaded.');
    } catch (error) {
      console.error('Error publishing map:', error);
      alert('Failed to publish map. See console for details.');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Unified Map Editor</h2>
          <p className="text-gray-500">Build POIs, paths, and QR anchors for the NavEaze MVP.</p>
        </div>
        <button
          onClick={handlePublish}
          className="bg-brand-red text-white px-4 py-2 rounded-md hover:bg-brand-redHover transition-colors flex items-center gap-2 font-medium shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
          Publish Map
        </button>
      </div>

      <div style={{ marginTop: 12 }} className="bg-white rounded-lg shadow p-1">
        <Suspense fallback={<div style={{ padding: 24 }}><LoadingSpinner size="lg" /></div>}>
          <FloorplanEditor
            initialFloorplan={initialFloorplanUrl ?? null}
            initialEventId={initialEventId ?? null}
            onEventChange={(id: string | null) => setEventId(id)}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default UnifiedMapEditorPage
