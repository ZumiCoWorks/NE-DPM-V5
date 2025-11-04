import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { AdminLayout } from './components/Layout/AdminLayout';
import { RoleSelectorPage } from './pages/RoleSelectorPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SponsorDashboardPage } from './pages/SponsorDashboardPage';
import MapEditorPage from './pages/MapEditorPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { SponsorManagementPage } from './pages/SponsorManagementPage';
import { ProfilePage } from './pages/ProfilePage';
import VendorSignupPage from './components/VendorSignupPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleSelectorPage />} />
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
            path="/profile"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <ProfilePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <SettingsPage />
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
