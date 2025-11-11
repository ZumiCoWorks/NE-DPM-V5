import React, { Suspense } from 'react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

// Lazy-load a dev-local copy of the scaffold editor so Vite can resolve it.
// @ts-ignore - JSX file without types
const ScaffoldFloorplanEditor = React.lazy(() => import('../components/DevScaffoldFloorplanEditor'))

export const DevFloorplanEditorPage: React.FC = () => {
  return (
    <div style={{ padding: 16 }}>
      <h2>Dev: Floorplan Editor (scaffold)</h2>
      <Suspense fallback={<div style={{ padding: 24 }}><LoadingSpinner size="lg" /></div>}>
        <ScaffoldFloorplanEditor />
      </Suspense>
    </div>
  )
}

export default DevFloorplanEditorPage
