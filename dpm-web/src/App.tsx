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
import MapEditorPage from './pages/admin/MapEditor'
import ROIDashboardPage from './pages/ROIDashboardPage'
import { ProfilePage } from "./pages/profile/ProfilePage"
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'
// Core CRUD pages
import { EventsPage } from './pages/events/EventsPage'
import { CreateEventPage } from './pages/events/CreateEventPage'
import { EditEventPage } from './pages/events/EditEventPage'
// Removed non-MVP pages: Venues
import ARCampaignsPage from './pages/ar/ARCampaignsPage'

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
            
            {/* Removed non-MVP routes: Quicket Sync, Booth Setup */}
            
                  {/* ROI Reports */}
                  <Route path="/roi" element={
                    <ProtectedRoute roles={['admin']}>
                      <Layout>
                        <ROIDashboardPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Removed non-MVP routes: MVP Setup, MVP Analytics */}

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

                  {/* Removed non-MVP routes: Venues */}

                  {/* AR Campaigns (organizer entry for AR scavenger hunts) */}
                  <Route path="/ar-campaigns" element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <ARCampaignsPage />
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

                  {/* Removed non-MVP route: Staff Scanner (handled in staff-mobile) */}
            
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
