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
import { NotFoundPage } from './pages/NotFoundPage'

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
              <ProtectedRoute roles={['admin', 'event_organizer']}>
                <Layout>
                  <QuicketSyncPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Booth Setup */}
            <Route path="/booths" element={
              <ProtectedRoute roles={['admin', 'event_organizer']}>
                <Layout>
                  <BoothSetupPage />
                </Layout>
              </ProtectedRoute>
            } />
            
                  {/* ROI Reports */}
                  <Route path="/roi" element={
                    <ProtectedRoute roles={['admin', 'event_organizer']}>
                      <Layout>
                        <ROIDashboardPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* MVP Setup */}
                  <Route path="/mvp-setup" element={
                    <ProtectedRoute roles={['admin', 'event_organizer']}>
                      <Layout>
                        <MVPSetupPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* MVP Analytics */}
                  <Route path="/mvp-analytics" element={
                    <ProtectedRoute roles={['admin', 'event_organizer']}>
                      <Layout>
                        <MVPAnalyticsPage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  {/* Map Editor (interactive floorplan admin) */}
                  <Route path="/admin/map-editor" element={
                    <ProtectedRoute roles={["admin", "event_organizer"]}>
                      <Layout>
                        <MapEditorPage />
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
