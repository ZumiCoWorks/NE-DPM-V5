import React, { Suspense, useEffect, useState } from 'react'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// Type definition for the FloorplanEditor component
interface FloorplanEditorProps {
  initialFloorplan?: string | null
  initialEventId?: string | null
}

// Lazy-load the unified FloorplanEditor merged into src/components
const FloorplanEditor = React.lazy(() => import('../../components/FloorplanEditor')) as React.FC<FloorplanEditorProps>

export const UnifiedMapEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const floorplanId = searchParams.get('floorplanId')
  const eventId = searchParams.get('eventId')
  const [initialFloorplanUrl, setInitialFloorplanUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!floorplanId) return
    let mounted = true
    ;(async () => {
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

  return (
    <div style={{ padding: 16 }}>
      <h2>Admin: Unified Map Editor</h2>
      <p style={{ color: '#6b7280' }}>This is the unified editor for building POIs, paths and QR anchors for the NavEaze MVP.</p>
      <div style={{ marginTop: 12 }}>
        <Suspense fallback={<div style={{ padding: 24 }}><LoadingSpinner size="lg" /></div>}>
          <FloorplanEditor initialFloorplan={initialFloorplanUrl ?? null} initialEventId={eventId ?? null} />
        </Suspense>
      </div>
    </div>
  )
}

export default UnifiedMapEditorPage
