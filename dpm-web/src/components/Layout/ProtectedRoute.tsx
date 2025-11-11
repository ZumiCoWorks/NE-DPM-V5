import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user && !profile?.role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
