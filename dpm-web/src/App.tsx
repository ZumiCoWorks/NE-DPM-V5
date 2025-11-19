import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout as AdminLayout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { RoleSelectorPage } from './pages/RoleSelectorPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SponsorDashboardPage } from './pages/SponsorDashboardPage';
import ROIDashboardPage from './pages/ROIDashboardPage';
import MapEditorPage from './pages/admin/UnifiedMapEditorPage';
import { EventsPage } from './pages/events/EventsPage';
import { CreateEventPage } from './pages/events/CreateEventPage';
import { EditEventPage as EventDetailPage } from './pages/events/EditEventPage';
import { VenuesPage } from './pages/venues/VenuesPage';
import { CreateVenuePage } from './pages/venues/CreateVenuePage';
import { EditVenuePage } from './pages/venues/EditVenuePage';
import { ARCampaignsPage } from './pages/ar/ARCampaignsPage';
import { CreateARCampaignPage } from './pages/ar/CreateARCampaignPage';
import { EditARCampaignPage } from './pages/ar/EditARCampaignPage';
import SponsorLeadsPage from './pages/sponsor/SponsorLeadsPage';
const SponsorManagementPage = SponsorLeadsPage;
import { ProfilePage } from './pages/profile/ProfilePage';
import { RegisterPage as VendorSignupPage } from './pages/auth/RegisterPage';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/role-selector" element={<RoleSelectorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/signup" element={<VendorSignupPage />} />
          
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
            path="/events/:id"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <EventDetailPage />
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
                  <SponsorDashboardPage />
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


          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
