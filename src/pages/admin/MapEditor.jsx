import React, { Suspense } from 'react'
import { Layout } from '../../components/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const FloorplanEditor = React.lazy(() => import('../../components/FloorplanEditor'));

const MapEditorPage = () => {
  return (
    <Layout>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>Interactive Map Editor</h2>
        <Suspense fallback={<div style={{ padding: 24 }}><LoadingSpinner size="lg"/></div>}>
          <FloorplanEditor />
        </Suspense>
      </div>
    </Layout>
  )
}

export default MapEditorPage
