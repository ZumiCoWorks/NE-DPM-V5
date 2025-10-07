import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { EventsPage } from './pages/events/EventsPage'
import { CreateEventPage } from './pages/events/CreateEventPage'
import { EditEventPage } from './pages/events/EditEventPage'
import { VenuesPage } from './pages/venues/VenuesPage'
import { CreateVenuePage } from './pages/venues/CreateVenuePage'
import { EditVenuePage } from './pages/venues/EditVenuePage'
import { FloorplanEditorPage } from './pages/floorplan/FloorplanEditorPage'
import { ARCampaignsPage } from './pages/ar/ARCampaignsPage'
import { CreateARCampaignPage } from './pages/ar/CreateARCampaignPage'
import { EditARCampaignPage } from './pages/ar/EditARCampaignPage'
import { ProfilePage } from "./pages/profile/ProfilePage";
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Events routes */}
            <Route path="/events" element={
              <ProtectedRoute roles={['admin', 'event_organizer']}>
                <Layout>
                  <EventsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/events/create" element={
              <ProtectedRoute roles={['admin', 'event_organizer']}>
                <Layout>
                  <CreateEventPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/events/:id/edit" element={
              <ProtectedRoute roles={['admin', 'event_organizer']}>
                <Layout>
                  <EditEventPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Venues routes */}
            <Route path="/venues" element={
              <ProtectedRoute roles={['admin', 'venue_manager']}>
                <Layout>
                  <VenuesPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/venues/create" element={
              <ProtectedRoute roles={['admin', 'venue_manager']}>
                <Layout>
                  <CreateVenuePage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/venues/:id/edit" element={
              <ProtectedRoute roles={['admin', 'venue_manager']}>
                <Layout>
                  <EditVenuePage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Floorplan editor */}
            <Route path="/venues/:venueId/floorplans/:id/edit" element={
              <ProtectedRoute roles={['admin', 'venue_manager']}>
                <FloorplanEditorPage />
              </ProtectedRoute>
            } />
            
            {/* AR Campaigns routes */}
            <Route path="/ar-campaigns" element={
              <ProtectedRoute roles={['admin', 'advertiser']}>
                <Layout>
                  <ARCampaignsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/ar-campaigns/create" element={
              <ProtectedRoute roles={['admin', 'advertiser']}>
                <Layout>
                  <CreateARCampaignPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/ar-campaigns/:id/edit" element={
              <ProtectedRoute roles={['admin', 'advertiser']}>
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
    </AuthProvider>
  )
}

export default App
