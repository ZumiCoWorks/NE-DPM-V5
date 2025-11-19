import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './ui/loadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: string[]
  requireAuth?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles,
  requireAuth = true,
}) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (requireAuth && !user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAuth && user && !user.role) {
    // User is authenticated but has no role, send to role selector
    return <Navigate to="/role-selector" replace />
  }

  if (roles && roles.length > 0 && user) {
    // Check if user has required role
    if (!roles.includes(user.role || '')) {
      // Redirect to dashboard if user doesn't have required role
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}