import React from 'react'

export default function App() {
  return (
    <div style={{fontFamily: 'system-ui, sans-serif', padding: 24}}>
      <h1>NavEaze — minimal dev scaffold</h1>
      <p>The full app files were intentionally left out; this is a tiny placeholder so the dev server runs.</p>
      <p>Open <code>/profile</code>, <code>/dashboard</code> etc. once you restore or recreate the full src tree.</p>
    </div>
  )
}
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
// --- NEW MVP PAGE IMPORTS ---
// Import the pages needed for the new flow
import { EventsPage } from './pages/events/EventsPage'
import { CreateEventPage } from './pages/events/CreateEventPage'
import { EditEventPage } from './pages/events/EditEventPage'
import { VenuesPage } from './pages/venues/VenuesPage'
import { CreateVenuePage } from './pages/venues/CreateVenuePage'
import { EditVenuePage } from './pages/venues/EditVenuePage'
import { ARCampaignsPage } from './pages/ar/ARCampaignsPage'
import { CreateARCampaignPage } from './pages/ar/CreateARCampaignPage'
import { EditARCampaignPage } from './pages/ar/EditARCampaignPage'
import SponsorDashboardPage from './pages/SponsorDashboardPage' // Flow 3: B2B ROI
import UnifiedMapEditorPage from './pages/admin/UnifiedMapEditorPage' // Flow 1: Map Editor
import { ProfilePage } from "./pages/profile/ProfilePage";
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
            
            {/* Public root: role selector */}
            <Route path="/" element={<RoleSelectorPage />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            {/* --- NEW MVP PROTECTED ROUTES --- */}

            {/* Events (Flow 1: Create Event) */}
            <Route path="/events" element={
              <ProtectedRoute roles={["admin", "event_organizer"]}>
                <Layout>
                  <EventsPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/events/create" element={
              <ProtectedRoute roles={["admin", "event_organizer"]}>
                <Layout>
                  <CreateEventPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/events/:id/edit" element={
              <ProtectedRoute roles={["admin", "event_organizer"]}>
                <Layout>
                  <EditEventPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Venues (Needed for Events) */}
            <Route path="/venues" element={
              <ProtectedRoute roles={["admin", "venue_manager"]}>
                <Layout>
                  <VenuesPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/venues/create" element={
              <ProtectedRoute roles={["admin", "venue_manager"]}>
                <Layout>
                  <CreateVenuePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/venues/:id/edit" element={
              <ProtectedRoute roles={["admin", "venue_manager"]}>
                <Layout>
                  <EditVenuePage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Map Editor (Flow 1: Draw Paths, Add POIs) */}
            <Route path="/map-editor" element={
              <ProtectedRoute roles={["admin", "event_organizer"]}>
                <Layout>
                  <UnifiedMapEditorPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Sponsors (Flow 3: B2B ROI Dashboard) */}
            <Route path="/sponsors" element={
              <ProtectedRoute roles={["admin", "event_organizer", "advertiser"]}>
                <Layout>
                  <SponsorDashboardPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* AR Campaigns (From your file structure) */}
            <Route path="/ar-campaigns" element={
              <ProtectedRoute roles={["admin", "advertiser"]}>
                <Layout>
                  <ARCampaignsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/ar-campaigns/create" element={
              <ProtectedRoute roles={["admin", "advertiser"]}>
                <Layout>
                  <CreateARCampaignPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/ar-campaigns/:id/edit" element={
              <ProtectedRoute roles={["admin", "advertiser"]}>
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
