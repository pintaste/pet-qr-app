import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { superAdminService, Tenant, PlatformUser } from '@/services/superAdminService'
import { impersonationService } from '@/services/impersonationService'
import { useImpersonationStore } from '@/stores/impersonationStore'

/**
 * Configuration options for the impersonation hook
 */
export interface UseImpersonationOptions {
  /** Callback after successful impersonation */
  onImpersonationSuccess?: () => void
}

/**
 * Return type for the useImpersonation hook
 */
export interface UseImpersonationReturn {
  // Modal state
  isImpersonateModalOpen: boolean
  setIsImpersonateModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  // Impersonation data
  impersonateTenant: Tenant | null
  setImpersonateTenant: React.Dispatch<React.SetStateAction<Tenant | null>>
  tenantAdmins: PlatformUser[]
  setTenantAdmins: React.Dispatch<React.SetStateAction<PlatformUser[]>>

  // Loading and error states
  isLoadingAdmins: boolean
  isImpersonating: boolean
  impersonateError: string | null
  setImpersonateError: React.Dispatch<React.SetStateAction<string | null>>

  // Handler functions
  handleImpersonateTenant: (tenant: Tenant) => Promise<void>
  handleImpersonateUser: (user: PlatformUser, tenants: Tenant[]) => void
  confirmImpersonation: (userId: number) => Promise<void>
  closeImpersonationModal: () => void
}

/**
 * Custom hook for managing impersonation state and logic
 *
 * Handles tenant and user impersonation for the Super Admin Dashboard.
 * Allows super admins to impersonate tenant admins or regular users.
 *
 * @param options - Configuration options for the hook
 * @returns Impersonation state and handler functions
 *
 * @example
 * ```tsx
 * const {
 *   isImpersonateModalOpen,
 *   handleImpersonateTenant,
 *   handleImpersonateUser,
 *   confirmImpersonation,
 * } = useImpersonation({
 *   onImpersonationSuccess: () => console.log('Impersonation started')
 * })
 * ```
 */
export function useImpersonation(
  options: UseImpersonationOptions = {}
): UseImpersonationReturn {
  const { onImpersonationSuccess } = options
  const navigate = useNavigate()
  const { startImpersonation } = useImpersonationStore()

  // Modal state
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false)

  // Impersonation data
  const [impersonateTenant, setImpersonateTenant] = useState<Tenant | null>(null)
  const [tenantAdmins, setTenantAdmins] = useState<PlatformUser[]>([])

  // Loading and error states
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonateError, setImpersonateError] = useState<string | null>(null)

  /**
   * Handle impersonation of a tenant (opens modal to select admin)
   *
   * Fetches tenant admins and opens the impersonation modal
   */
  const handleImpersonateTenant = useCallback(async (tenant: Tenant) => {
    setImpersonateTenant(tenant)
    setImpersonateError(null)
    setIsLoadingAdmins(true)
    setIsImpersonateModalOpen(true)

    try {
      // Fetch tenant admins for this tenant
      const admins = await superAdminService.listAllUsers({
        tenant_id: tenant.id,
        role: 'tenant_admin'
      })
      setTenantAdmins(admins)

      // If there are no admins, show an error
      if (admins.length === 0) {
        setImpersonateError('No tenant admin found for this tenant')
      }
    } catch (err) {
      console.error('[useImpersonation] Error fetching tenant admins:', err)
      setImpersonateError('Failed to fetch tenant admins')
    } finally {
      setIsLoadingAdmins(false)
    }
  }, [])

  /**
   * Handle direct impersonation of a user (from users list)
   *
   * For tenant_admin and user roles, directly starts impersonation.
   * Cannot impersonate super_admin users.
   */
  const handleImpersonateUser = useCallback((user: PlatformUser, tenants: Tenant[]) => {
    // Can only impersonate tenant_admin or user, not super_admin
    if (user.role === 'super_admin') {
      console.warn('[useImpersonation] Cannot impersonate super_admin')
      return
    }

    // For tenant admins and users, we need their tenant
    if (!user.tenant_id) {
      console.warn('[useImpersonation] User has no tenant_id')
      return
    }

    try {
      // Find the tenant for this user
      const tenant = tenants.find(t => t.id === user.tenant_id)
      if (!tenant) {
        console.error('[useImpersonation] Tenant not found for user')
        return
      }

      // Start impersonation directly
      startImpersonation({
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: tenant.id,
      })

      // Call success callback if provided
      if (onImpersonationSuccess) {
        onImpersonationSuccess()
      }

      // Navigate to tenant dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error('[useImpersonation] Failed to impersonate user:', err)
    }
  }, [navigate, startImpersonation, onImpersonationSuccess])

  /**
   * Confirm and execute impersonation of a specific user
   *
   * Used after selecting a user from the impersonation modal
   */
  const confirmImpersonation = useCallback(async (userId: number) => {
    setIsImpersonating(true)
    setImpersonateError(null)

    try {
      await impersonationService.startImpersonation(userId)

      // Update impersonation store
      const user = tenantAdmins.find(u => u.id === userId)
      if (user) {
        startImpersonation({
          id: user.id,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id || undefined
        })
      }

      // Close modal and reset state
      setIsImpersonateModalOpen(false)
      setImpersonateTenant(null)
      setTenantAdmins([])

      // Call success callback if provided
      if (onImpersonationSuccess) {
        onImpersonationSuccess()
      }

      // Navigate to tenant admin dashboard
      navigate('/dashboard/tenant-admin')
    } catch (err) {
      console.error('[useImpersonation] Error starting impersonation:', err)
      setImpersonateError(err instanceof Error ? err.message : 'Failed to start impersonation')
    } finally {
      setIsImpersonating(false)
    }
  }, [tenantAdmins, navigate, startImpersonation, onImpersonationSuccess])

  /**
   * Close the impersonation modal and reset state
   */
  const closeImpersonationModal = useCallback(() => {
    setIsImpersonateModalOpen(false)
    setImpersonateTenant(null)
    setTenantAdmins([])
    setImpersonateError(null)
  }, [])

  return {
    // Modal state
    isImpersonateModalOpen,
    setIsImpersonateModalOpen,

    // Impersonation data
    impersonateTenant,
    setImpersonateTenant,
    tenantAdmins,
    setTenantAdmins,

    // Loading and error states
    isLoadingAdmins,
    isImpersonating,
    impersonateError,
    setImpersonateError,

    // Handler functions
    handleImpersonateTenant,
    handleImpersonateUser,
    confirmImpersonation,
    closeImpersonationModal
  }
}

export default useImpersonation
