import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DemoModeProvider } from './contexts/DemoModeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PinProtection } from './components/PinProtection';
import { Layout as AdminLayout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { NavEazeLandingPage } from './pages/NavEazeLandingPage';
import { WaitlistPage } from './pages/WaitlistPage';
import { RoleSelectorPage } from './pages/RoleSelectorPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import SponsorAnalytics from './pages/admin/SponsorAnalytics';
import ROIDashboardPage from './pages/ROIDashboardPage';
import MapEditorPage from './pages/admin/UnifiedMapEditorPage';
import { EventsPage } from './pages/events/EventsPage';
import { CreateEventPage } from './pages/events/CreateEventPage';
import { EditEventPage as EventDetailPage } from './pages/events/EditEventPage';
import { EventSetupPage } from './pages/events/EventSetupPage';
import { VenuesPage } from './pages/venues/VenuesPage';
import { CreateVenuePage } from './pages/venues/CreateVenuePage';
import { EditVenuePage } from './pages/venues/EditVenuePage';
import { ARCampaignsPage } from './pages/ar/ARCampaignsPage';
import { CreateARCampaignPage } from './pages/ar/CreateARCampaignPage';
import { EditARCampaignPage } from './pages/ar/EditARCampaignPage';
import { SponsorManagementPage } from './pages/admin/SponsorManagementPage';
import { SponsorSignupPage } from './pages/sponsor/SponsorSignupPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { RegisterPage as VendorSignupPage } from './pages/auth/RegisterPage';
import AttendeePWANew from './pages/mobile/AttendeePWANew';
import StaffPWA from './pages/mobile/StaffPWA-new';
import SecurityDashboard from './pages/admin/SecurityDashboard';


const APP_TYPE = import.meta.env.VITE_APP_TYPE || 'admin';

export default function App() {
  if (APP_TYPE === 'attendee') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PinProtection><AttendeePWANew /></PinProtection>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  if (APP_TYPE === 'staff') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PinProtection><StaffPWA /></PinProtection>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Admin / default routing
  return (
    <DemoModeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<NavEazeLandingPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/role-selector" element={<RoleSelectorPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/signup" element={<VendorSignupPage />} />
            <Route path="/sponsor/signup" element={<SponsorSignupPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <DashboardPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <EventsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/events/create"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <CreateEventPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/events/:id/edit"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <EventDetailPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/events/:eventId/setup"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <EventSetupPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/events/:id/sponsors"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <SponsorManagementPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/map-editor"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <MapEditorPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/map-editor/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <MapEditorPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/sponsors"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <SponsorAnalytics />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/venues"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <VenuesPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/venues/create"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <CreateVenuePage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/venues/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <EditVenuePage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/roi-reports"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ROIDashboardPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/ar-campaigns"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ARCampaignsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/ar-campaigns/create"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <CreateARCampaignPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/ar-campaigns/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <EditARCampaignPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ProfilePage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Security Command Center - Protected */}
            <Route path="/security" element={
              <ProtectedRoute>
                <SecurityDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DemoModeProvider>
  );
}
