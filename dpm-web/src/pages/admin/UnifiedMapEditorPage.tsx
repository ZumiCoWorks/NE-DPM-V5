import React, { Suspense, useEffect, useState } from 'react'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// Lazy-load the unified FloorplanEditor merged into src/components
// @ts-ignore - JSX file without types
const FloorplanEditor = React.lazy(() => import('../../components/FloorplanEditor'))

export const UnifiedMapEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const floorplanId = searchParams.get('floorplanId')
  const [initialFloorplanUrl, setInitialFloorplanUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!floorplanId) return
    let mounted = true
    ;(async () => {
      try {
        const { data, error } = await supabase.from('floorplans').select('image_url').eq('id', floorplanId).single()
        if (error) {
          console.warn('Could not fetch floorplan for unified editor:', error.message || error)
          return
        }
        if (mounted) setInitialFloorplanUrl(data?.image_url ?? null)
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
          <FloorplanEditor initialFloorplan={initialFloorplanUrl as any} />
        </Suspense>
      </div>
    </div>
  )
}

export default UnifiedMapEditorPage
