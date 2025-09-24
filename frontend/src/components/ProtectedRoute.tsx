import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true
}) => {
  const { isAuthenticated, accessToken } = useAuthStore()
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

  // User is authenticated, render the protected content
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