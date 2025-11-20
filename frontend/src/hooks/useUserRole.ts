import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'

export type UserRole = 'super_admin' | 'tenant_admin' | 'user'

interface UseUserRoleReturn {
  role: UserRole | null
  isSuperAdmin: boolean
  isTenantAdmin: boolean
  isRegularUser: boolean
  hasAdminAccess: boolean // true for both super_admin and tenant_admin
  canImpersonate: boolean
  canManageTenants: boolean
  canManageUsers: boolean
}

/**
 * Hook to determine the current user's role and permissions.
 *
 * @returns User role information and permission flags
 */
export const useUserRole = (): UseUserRoleReturn => {
  const { user } = useAuthStore()

  return useMemo(() => {
    console.log('[useUserRole] User from auth store:', user)

    if (!user) {
      return {
        role: null,
        isSuperAdmin: false,
        isTenantAdmin: false,
        isRegularUser: false,
        hasAdminAccess: false,
        canImpersonate: false,
        canManageTenants: false,
        canManageUsers: false,
      }
    }

    const role = user.role as UserRole
    console.log('[useUserRole] Extracted role:', role)
    console.log('[useUserRole] Role type:', typeof role)

    const isSuperAdmin = role === 'super_admin'
    const isTenantAdmin = role === 'tenant_admin'
    const isRegularUser = role === 'user'
    const hasAdminAccess = isSuperAdmin || isTenantAdmin

    console.log('[useUserRole] Comparison results:', {
      isSuperAdmin: `${role} === 'super_admin' = ${isSuperAdmin}`,
      isTenantAdmin: `${role} === 'tenant_admin' = ${isTenantAdmin}`,
      isRegularUser: `${role} === 'user' = ${isRegularUser}`,
    })

    return {
      role,
      isSuperAdmin,
      isTenantAdmin,
      isRegularUser,
      hasAdminAccess,
      canImpersonate: hasAdminAccess, // Both super_admin and tenant_admin can impersonate
      canManageTenants: isSuperAdmin, // Only super_admin can manage tenants
      canManageUsers: hasAdminAccess, // Both can manage users (with different scopes)
    }
  }, [user])
}
