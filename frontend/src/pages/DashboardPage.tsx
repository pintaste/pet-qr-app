import React from 'react'
import { Navigate } from 'react-router-dom'
import { useUserRole } from '@/hooks/useUserRole'
import SuperAdminDashboard from './dashboards/SuperAdminDashboard'
import TenantAdminDashboard from './dashboards/TenantAdminDashboard'
import UserDashboard from './dashboards/UserDashboard'

/**
 * Main Dashboard Router Component
 *
 * Routes users to the appropriate dashboard based on their role:
 * - SUPER_ADMIN → SuperAdminDashboard
 * - TENANT_ADMIN → TenantAdminDashboard
 * - USER → UserDashboard
 */
const DashboardPage: React.FC = () => {
  const { role, isSuperAdmin, isTenantAdmin, isRegularUser } = useUserRole()

  // Route based on user role
  if (isSuperAdmin) {
    return <SuperAdminDashboard />
  }

  if (isTenantAdmin) {
    return <TenantAdminDashboard />
  }

  if (isRegularUser) {
    return <UserDashboard />
  }

  // If no role detected (shouldn't happen due to ProtectedRoute), redirect to home
  return <Navigate to="/" replace />
}

export default DashboardPage