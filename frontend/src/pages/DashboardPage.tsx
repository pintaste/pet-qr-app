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

  // Debug logging
  console.log('[DashboardPage] User role:', role)
  console.log('[DashboardPage] isSuperAdmin:', isSuperAdmin)
  console.log('[DashboardPage] isTenantAdmin:', isTenantAdmin)
  console.log('[DashboardPage] isRegularUser:', isRegularUser)

  // Route based on user role
  if (isSuperAdmin) {
    console.log('[DashboardPage] Rendering SuperAdminDashboard')
    return <SuperAdminDashboard />
  }

  if (isTenantAdmin) {
    console.log('[DashboardPage] Rendering TenantAdminDashboard')
    return <TenantAdminDashboard />
  }

  if (isRegularUser) {
    console.log('[DashboardPage] Rendering UserDashboard')
    return <UserDashboard />
  }

  // If no role detected (shouldn't happen due to ProtectedRoute), redirect to home
  console.log('[DashboardPage] No role detected, redirecting to home')
  return <Navigate to="/" replace />
}

export default DashboardPage