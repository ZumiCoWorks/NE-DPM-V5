import React, { Suspense } from 'react'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const FloorplanEditor = React.lazy(() => import('../../components/FloorplanEditor'));

const MapEditorPage = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Interactive Map Editor</h2>
      <Suspense fallback={<div className="py-6"><LoadingSpinner size="lg"/></div>}>
        <FloorplanEditor />
      </Suspense>
    </div>
  )
}

export default MapEditorPage
