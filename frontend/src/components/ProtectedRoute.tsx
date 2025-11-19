import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUserRole, UserRole } from '@/hooks/useUserRole'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: UserRole | UserRole[]
  fallbackPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireRole,
  fallbackPath = '/',
}) => {
  const { isAuthenticated, accessToken } = useAuthStore()
  const { role } = useUserRole()
  const location = useLocation()

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>
  }

  // If we're checking authentication and no token/auth state
  if (!isAuthenticated || !accessToken) {
    // Redirect to login, preserving the current location
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Check if specific role is required
  if (requireRole) {
    const requiredRoles = Array.isArray(requireRole) ? requireRole : [requireRole]

    if (!role || !requiredRoles.includes(role)) {
      // User doesn't have the required role, redirect to fallback path
      return <Navigate to={fallbackPath} replace />
    }
  }

  // User is authenticated and authorized, render the protected content
  return <>{children}</>
}

// Higher-order component for pages that need authentication
export const withAuth = (Component: React.ComponentType) => {
  return (props: any) => (
    <ProtectedRoute>
      <Component {...props} />
    </ProtectedRoute>
  )
}

export default ProtectedRoute