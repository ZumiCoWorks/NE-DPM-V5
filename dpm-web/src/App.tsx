import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import RoleSelectorPage from './pages/RoleSelectorPage'
import { DashboardPage } from './pages/DashboardPage'
import SponsorDashboardPage from './pages/SponsorDashboardPage'
// Thin integration layer pages
import QuicketSyncPage from './pages/QuicketSyncPage'
import MapEditorPage from './pages/admin/MapEditor'
import BoothSetupPage from './pages/BoothSetupPage'
import ROIDashboardPage from './pages/ROIDashboardPage'
// MVP Pages
import MVPSetupPage from './pages/MVPSetupPage'
import MVPAnalyticsPage from './pages/MVPAnalyticsPage'
import { ProfilePage } from "./pages/profile/ProfilePage"
import { SettingsPage } from './pages/SettingsPage'
import { StaffScannerPage } from './pages/StaffScannerPage'
import { NotFoundPage } from './pages/NotFoundPage'
// Core CRUD pages
import { EventsPage } from './pages/events/EventsPage'
import { CreateEventPage } from './pages/events/CreateEventPage'
import { EditEventPage } from './pages/events/EditEventPage'
import { VenuesPage } from './pages/venues/VenuesPage'
import { CreateVenuePage } from './pages/venues/CreateVenuePage'
import { EditVenuePage } from './pages/venues/EditVenuePage'
import { ARCampaignsPage } from './pages/ar/ARCampaignsPage'
import { CreateARCampaignPage } from './pages/ar/CreateARCampaignPage'
import { EditARCampaignPage } from './pages/ar/EditARCampaignPage'

function App() {
  // Diagnostic log to confirm the App component is mounted and rendering
  // eslint-disable-next-line no-console
  console.log('LOG: App.tsx component is rendering.')
  return (
    <AuthProvider>
      <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/role-selector" element={<RoleSelectorPage />} />
            
            {/* Public root: role selector */}
            <Route path="/" element={<RoleSelectorPage />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/sponsor" element={
              <ProtectedRoute>
                <Layout>
                  <SponsorDashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Quicket Sync */}
            <Route path="/quicket-sync" element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <QuicketSyncPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Booth Setup */}
            <Route path="/booths" element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <BoothSetupPage />
                </Layout>
              </ProtectedRoute>
            } />
            
                  {/* ROI Reports */}
                  <Route path="/roi" element={
                    <ProtectedRoute roles={['admin']}>
                      <Layout>
                        <ROIDashboardPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* MVP Setup */}
                  <Route path="/mvp-setup" element={
                    <ProtectedRoute roles={['admin']}>
                      <Layout>
                        <MVPSetupPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* MVP Analytics */}
                  <Route path="/mvp-analytics" element={
                    <ProtectedRoute roles={['admin']}>
                      <Layout>
                        <MVPAnalyticsPage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  {/* Map Editor (interactive floorplan admin) */}
                  <Route path="/admin/map-editor" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <MapEditorPage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  {/* Events */}
                  <Route path="/events" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <EventsPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/events/create" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <CreateEventPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/events/:id/edit" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <EditEventPage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  {/* Venues */}
                  <Route path="/venues" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <VenuesPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/venues/create" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <CreateVenuePage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/venues/:id/edit" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <EditVenuePage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  {/* AR Campaigns */}
                  <Route path="/ar-campaigns" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <ARCampaignsPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/ar-campaigns/create" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <CreateARCampaignPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/ar-campaigns/:id/edit" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <EditARCampaignPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Profile */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Layout>
                        <ProfilePage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  {/* Settings */}
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Layout>
                        <SettingsPage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  {/* Staff Scanner */}
                  <Route path="/staff-scanner" element={
                    <ProtectedRoute roles={['admin', 'staff']}>
                      <Layout>
                        <StaffScannerPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
            
            {/* Catch all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App
