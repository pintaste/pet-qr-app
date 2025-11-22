import { useState, useEffect, useCallback } from 'react'
import { superAdminService, Tenant } from '@/services/superAdminService'
import { PAGINATION_CONFIG } from '@/config'

/**
 * Configuration options for the tenant management hook
 */
export interface UseTenantManagementOptions {
  /** Number of tenants per page for pagination */
  tenantsPerPage?: number
  /** Callback when tenant operations complete (e.g., to refresh stats) */
  onTenantsUpdated?: () => Promise<void>
}

/**
 * Return type for the useTenantManagement hook
 */
export interface UseTenantManagementReturn {
  // Tenant data
  tenants: Tenant[]
  paginatedTenants: Tenant[]
  isTenantsLoading: boolean

  // Selection state
  selectedTenant: Tenant | null
  setSelectedTenant: React.Dispatch<React.SetStateAction<Tenant | null>>

  // Modal states
  isAddTenantModalOpen: boolean
  setIsAddTenantModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  isEditTenantModalOpen: boolean
  setIsEditTenantModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  isDeleteTenantModalOpen: boolean
  setIsDeleteTenantModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  // Pagination
  tenantsCurrentPage: number
  setTenantsCurrentPage: React.Dispatch<React.SetStateAction<number>>
  tenantsTotalPages: number
  tenantsPerPage: number

  // View mode
  tenantsViewMode: 'grid' | 'list'
  setTenantsViewMode: React.Dispatch<React.SetStateAction<'grid' | 'list'>>

  // Handler functions
  handleCreateTenant: () => void
  handleEditTenant: (tenant: Tenant) => void
  handleDeleteTenant: (tenant: Tenant) => void
  handleTenantSuccess: () => Promise<void>
  refreshTenants: () => Promise<void>
}

/**
 * Custom hook for managing tenant state and logic
 *
 * Handles tenant listing, pagination, CRUD operations
 * for the Super Admin Dashboard tenants tab.
 *
 * @param isActive - Whether the tenants tab is active (or needs tenant data)
 * @param options - Configuration options for the hook
 * @returns Tenant management state and handler functions
 *
 * @example
 * ```tsx
 * const {
 *   tenants,
 *   paginatedTenants,
 *   handleCreateTenant,
 *   handleEditTenant,
 * } = useTenantManagement(activeTab === 'tenants' || activeTab === 'qr-factory', {
 *   onTenantsUpdated: refreshStats
 * })
 * ```
 */
export function useTenantManagement(
  isActive: boolean,
  options: UseTenantManagementOptions = {}
): UseTenantManagementReturn {
  const {
    tenantsPerPage = PAGINATION_CONFIG.TENANTS_PER_PAGE,
    onTenantsUpdated
  } = options

  // Tenant data
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isTenantsLoading, setIsTenantsLoading] = useState(false)

  // Selection state
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  // Modal states
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false)
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false)
  const [isDeleteTenantModalOpen, setIsDeleteTenantModalOpen] = useState(false)

  // Pagination
  const [tenantsCurrentPage, setTenantsCurrentPage] = useState(1)

  // View mode
  const [tenantsViewMode, setTenantsViewMode] = useState<'grid' | 'list'>('list')

  // Calculate pagination
  const tenantsTotalPages = Math.ceil(tenants.length / tenantsPerPage)
  const tenantsStartIndex = (tenantsCurrentPage - 1) * tenantsPerPage
  const tenantsEndIndex = tenantsStartIndex + tenantsPerPage
  const paginatedTenants = tenants.slice(tenantsStartIndex, tenantsEndIndex)

  // Reset tenants page when tenants change
  useEffect(() => {
    setTenantsCurrentPage(1)
  }, [tenants.length])

  /**
   * Fetch tenants from the API
   */
  const refreshTenants = useCallback(async () => {
    try {
      setIsTenantsLoading(true)
      const tenantList = await superAdminService.listTenants()
      setTenants(tenantList)
    } catch (err) {
      console.error('[useTenantManagement] Error fetching tenants:', err)
    } finally {
      setIsTenantsLoading(false)
    }
  }, [])

  // Fetch tenants when tab becomes active
  useEffect(() => {
    if (isActive) {
      refreshTenants()
    }
  }, [isActive, refreshTenants])

  /**
   * Open add tenant modal
   */
  const handleCreateTenant = useCallback(() => {
    setIsAddTenantModalOpen(true)
  }, [])

  /**
   * Open edit tenant modal for a specific tenant
   */
  const handleEditTenant = useCallback((tenant: Tenant) => {
    setSelectedTenant(tenant)
    setIsEditTenantModalOpen(true)
  }, [])

  /**
   * Open delete tenant modal for a specific tenant
   */
  const handleDeleteTenant = useCallback((tenant: Tenant) => {
    setSelectedTenant(tenant)
    setIsDeleteTenantModalOpen(true)
  }, [])

  /**
   * Handle successful tenant operation (create/edit/delete)
   * Refreshes tenant list and platform stats
   */
  const handleTenantSuccess = useCallback(async () => {
    try {
      // Refresh tenant list
      const tenantList = await superAdminService.listTenants()
      setTenants(tenantList)

      // Refresh platform stats if callback provided
      if (onTenantsUpdated) {
        await onTenantsUpdated()
      }
    } catch (err) {
      console.error('[useTenantManagement] Error refreshing after tenant operation:', err)
    }
  }, [onTenantsUpdated])

  return {
    // Tenant data
    tenants,
    paginatedTenants,
    isTenantsLoading,

    // Selection state
    selectedTenant,
    setSelectedTenant,

    // Modal states
    isAddTenantModalOpen,
    setIsAddTenantModalOpen,
    isEditTenantModalOpen,
    setIsEditTenantModalOpen,
    isDeleteTenantModalOpen,
    setIsDeleteTenantModalOpen,

    // Pagination
    tenantsCurrentPage,
    setTenantsCurrentPage,
    tenantsTotalPages,
    tenantsPerPage,

    // View mode
    tenantsViewMode,
    setTenantsViewMode,

    // Handler functions
    handleCreateTenant,
    handleEditTenant,
    handleDeleteTenant,
    handleTenantSuccess,
    refreshTenants
  }
}

export default useTenantManagement
