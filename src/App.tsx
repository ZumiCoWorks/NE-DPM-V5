import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { EventsPage } from './pages/EventsPage'
import { VenuesPage } from './pages/VenuesPage'
import { FloorplansPage } from './pages/FloorplansPage'
import { ARCampaignsPage } from './pages/ar/ARCampaignsPage'
import { CreateARCampaignPage } from './pages/ar/CreateARCampaignPage'
import { AIFloorplanUploadPage } from './pages/floorplans/AIFloorplanUploadPage'
import { EmergencyRouteConfigPage } from './pages/emergency/EmergencyRouteConfigPage'
import { APIDocumentationPage } from './pages/api/APIDocumentationPage'
import MobileSDKPreviewPage from './pages/mobile/MobileSDKPreviewPage'
import RealTimeHeatmapPage from './pages/analytics/RealTimeHeatmapPage'
import EngagementVelocityPage from './pages/analytics/EngagementVelocityPage'
import BottleneckAlertPage from './pages/analytics/BottleneckAlertPage'
import VendorAnalyticsPage from './pages/analytics/VendorAnalyticsPage'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster position="top-right" />
      </>
    )
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/venues/:venueId/floorplans" element={<FloorplansPage />} />
          <Route path="/floorplans" element={<FloorplansPage />} />
          <Route path="/ar-campaigns" element={<ARCampaignsPage />} />
          <Route path="/ar-campaigns/create" element={<CreateARCampaignPage />} />
          <Route path="/ai-floorplan-upload" element={<AIFloorplanUploadPage />} />
          <Route path="/emergency-routes" element={<EmergencyRouteConfigPage />} />
          <Route path="/api-documentation" element={<APIDocumentationPage />} />
          <Route path="/mobile-sdk-preview" element={<MobileSDKPreviewPage />} />
          <Route path="/analytics/heatmap/:eventId" element={<RealTimeHeatmapPage />} />
          <Route path="/analytics/engagement/:eventId" element={<EngagementVelocityPage />} />
          <Route path="/analytics/bottlenecks/:eventId" element={<BottleneckAlertPage />} />
          <Route path="/analytics/vendors" element={<VendorAnalyticsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
