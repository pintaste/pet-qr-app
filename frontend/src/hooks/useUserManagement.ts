import { useState, useEffect, useCallback, useMemo } from 'react'
import { superAdminService, PlatformUser, Tenant } from '@/services/superAdminService'

/**
 * Configuration options for the user management hook
 */
export interface UseUserManagementOptions {
  /** Number of users per page for pagination */
  usersPerPage?: number
  /** Callback when user operations complete (e.g., to refresh stats) */
  onUsersUpdated?: () => Promise<void>
  /** Available tenants for filtering */
  tenants?: Tenant[]
}

/**
 * Return type for the useUserManagement hook
 */
export interface UseUserManagementReturn {
  // User data
  users: PlatformUser[]
  filteredUsers: PlatformUser[]
  paginatedUsers: PlatformUser[]
  isUsersLoading: boolean

  // Selection state
  selectedUser: PlatformUser | null
  setSelectedUser: React.Dispatch<React.SetStateAction<PlatformUser | null>>

  // Modal states
  isAddUserModalOpen: boolean
  setIsAddUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  isEditUserModalOpen: boolean
  setIsEditUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  isDeleteUserModalOpen: boolean
  setIsDeleteUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  isResetPasswordModalOpen: boolean
  setIsResetPasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  // Filter states
  userSearchQuery: string
  setUserSearchQuery: React.Dispatch<React.SetStateAction<string>>
  userRoleFilter: string
  setUserRoleFilter: React.Dispatch<React.SetStateAction<string>>
  userTenantFilter: string
  setUserTenantFilter: React.Dispatch<React.SetStateAction<string>>

  // Pagination
  usersCurrentPage: number
  setUsersCurrentPage: React.Dispatch<React.SetStateAction<number>>
  usersTotalPages: number
  usersPerPage: number
  usersStartIndex: number
  usersEndIndex: number

  // View mode
  usersViewMode: 'grid' | 'list'
  setUsersViewMode: React.Dispatch<React.SetStateAction<'grid' | 'list'>>

  // Bulk selection and delete
  selectedUserIds: Set<number>
  setSelectedUserIds: React.Dispatch<React.SetStateAction<Set<number>>>
  isUsersBulkDeleting: boolean
  showUsersBulkDeleteConfirm: boolean
  setShowUsersBulkDeleteConfirm: React.Dispatch<React.SetStateAction<boolean>>
  usersBulkDeleteError: string | null
  setUsersBulkDeleteError: React.Dispatch<React.SetStateAction<string | null>>

  // Handler functions
  handleCreateUser: () => void
  handleEditUser: (user: PlatformUser) => void
  handleDeleteUser: (user: PlatformUser) => void
  handleResetPassword: (user: PlatformUser) => void
  handleUserSuccess: () => Promise<void>
  handleToggleUserSelection: (userId: number) => void
  handleSelectAllUsers: () => void
  handleBulkDeleteUsers: () => Promise<void>
  refreshUsers: () => Promise<void>
}

/**
 * Custom hook for managing user state and logic
 *
 * Handles user listing, filtering, pagination, CRUD operations,
 * and bulk operations for the Super Admin Dashboard users tab.
 *
 * @param isActive - Whether the users tab is active
 * @param options - Configuration options for the hook
 * @returns User management state and handler functions
 *
 * @example
 * ```tsx
 * const {
 *   users,
 *   paginatedUsers,
 *   handleCreateUser,
 *   handleEditUser,
 *   handleBulkDeleteUsers,
 * } = useUserManagement(activeTab === 'users', {
 *   onUsersUpdated: refreshStats
 * })
 * ```
 */
export function useUserManagement(
  isActive: boolean,
  options: UseUserManagementOptions = {}
): UseUserManagementReturn {
  const {
    usersPerPage = 100,
    onUsersUpdated
  } = options

  // User data
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)

  // Selection state
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)

  // Filter states
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('')
  const [userTenantFilter, setUserTenantFilter] = useState<string>('')

  // Pagination
  const [usersCurrentPage, setUsersCurrentPage] = useState(1)

  // View mode
  const [usersViewMode, setUsersViewMode] = useState<'grid' | 'list'>('list')

  // Bulk selection and delete
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [isUsersBulkDeleting, setIsUsersBulkDeleting] = useState(false)
  const [showUsersBulkDeleteConfirm, setShowUsersBulkDeleteConfirm] = useState(false)
  const [usersBulkDeleteError, setUsersBulkDeleteError] = useState<string | null>(null)

  // Filter users - note: filtering is done server-side when fetching,
  // but we still provide the filtered list for consistency
  const filteredUsers = useMemo(() => {
    return users
  }, [users])

  // Calculate pagination
  const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const usersStartIndex = (usersCurrentPage - 1) * usersPerPage
  const usersEndIndex = usersStartIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(usersStartIndex, usersEndIndex)

  // Reset users page when users or filters change
  useEffect(() => {
    setUsersCurrentPage(1)
  }, [userSearchQuery, userRoleFilter, userTenantFilter])

  /**
   * Fetch users from the API with current filters
   */
  const refreshUsers = useCallback(async () => {
    try {
      setIsUsersLoading(true)
      const userList = await superAdminService.listAllUsers({
        search: userSearchQuery || undefined,
        role: userRoleFilter || undefined,
        tenant_id: userTenantFilter ? parseInt(userTenantFilter) : undefined,
      })
      setUsers(userList)
    } catch (err) {
      console.error('[useUserManagement] Error fetching users:', err)
    } finally {
      setIsUsersLoading(false)
    }
  }, [userSearchQuery, userRoleFilter, userTenantFilter])

  // Fetch users when tab becomes active or filters change
  useEffect(() => {
    if (isActive) {
      refreshUsers()
    }
  }, [isActive, userSearchQuery, userRoleFilter, userTenantFilter, refreshUsers])

  /**
   * Open add user modal
   */
  const handleCreateUser = useCallback(() => {
    setIsAddUserModalOpen(true)
  }, [])

  /**
   * Open edit user modal for a specific user
   */
  const handleEditUser = useCallback((user: PlatformUser) => {
    setSelectedUser(user)
    setIsEditUserModalOpen(true)
  }, [])

  /**
   * Open delete user modal for a specific user
   */
  const handleDeleteUser = useCallback((user: PlatformUser) => {
    setSelectedUser(user)
    setIsDeleteUserModalOpen(true)
  }, [])

  /**
   * Open reset password modal for a specific user
   */
  const handleResetPassword = useCallback((user: PlatformUser) => {
    setSelectedUser(user)
    setIsResetPasswordModalOpen(true)
  }, [])

  /**
   * Handle successful user operation (create/edit/delete/reset)
   * Refreshes user list and platform stats
   */
  const handleUserSuccess = useCallback(async () => {
    try {
      // Refresh user list
      const userList = await superAdminService.listAllUsers({
        search: userSearchQuery || undefined,
        role: userRoleFilter || undefined,
        tenant_id: userTenantFilter ? parseInt(userTenantFilter) : undefined,
      })
      setUsers(userList)

      // Refresh platform stats if callback provided
      if (onUsersUpdated) {
        await onUsersUpdated()
      }
    } catch (err) {
      console.error('[useUserManagement] Error refreshing after user operation:', err)
    }
  }, [userSearchQuery, userRoleFilter, userTenantFilter, onUsersUpdated])

  /**
   * Toggle selection for a single user
   */
  const handleToggleUserSelection = useCallback((userId: number) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }, [])

  /**
   * Select or deselect all users on current page
   */
  const handleSelectAllUsers = useCallback(() => {
    if (selectedUserIds.size === paginatedUsers.length) {
      // Deselect all
      setSelectedUserIds(new Set())
    } else {
      // Select all on current page
      setSelectedUserIds(new Set(paginatedUsers.map(u => u.id)))
    }
  }, [selectedUserIds.size, paginatedUsers])

  /**
   * Bulk delete selected users
   */
  const handleBulkDeleteUsers = useCallback(async () => {
    if (selectedUserIds.size === 0) return

    setIsUsersBulkDeleting(true)
    setUsersBulkDeleteError(null)

    try {
      const result = await superAdminService.bulkDeleteUsers(Array.from(selectedUserIds))

      // Remove deleted users from the list
      setUsers(prev => prev.filter(u => !selectedUserIds.has(u.id)))

      // Clear selection
      setSelectedUserIds(new Set())
      setShowUsersBulkDeleteConfirm(false)

      // Update platform stats if callback provided
      if (onUsersUpdated) {
        await onUsersUpdated()
      }

      console.log(`[useUserManagement] Bulk deleted ${result.deleted_count} users`)
    } catch (err) {
      console.error('[useUserManagement] Failed to bulk delete users:', err)
      setUsersBulkDeleteError(err instanceof Error ? err.message : 'Failed to delete users')
    } finally {
      setIsUsersBulkDeleting(false)
    }
  }, [selectedUserIds, onUsersUpdated])

  return {
    // User data
    users,
    filteredUsers,
    paginatedUsers,
    isUsersLoading,

    // Selection state
    selectedUser,
    setSelectedUser,

    // Modal states
    isAddUserModalOpen,
    setIsAddUserModalOpen,
    isEditUserModalOpen,
    setIsEditUserModalOpen,
    isDeleteUserModalOpen,
    setIsDeleteUserModalOpen,
    isResetPasswordModalOpen,
    setIsResetPasswordModalOpen,

    // Filter states
    userSearchQuery,
    setUserSearchQuery,
    userRoleFilter,
    setUserRoleFilter,
    userTenantFilter,
    setUserTenantFilter,

    // Pagination
    usersCurrentPage,
    setUsersCurrentPage,
    usersTotalPages,
    usersPerPage,
    usersStartIndex,
    usersEndIndex,

    // View mode
    usersViewMode,
    setUsersViewMode,

    // Bulk selection and delete
    selectedUserIds,
    setSelectedUserIds,
    isUsersBulkDeleting,
    showUsersBulkDeleteConfirm,
    setShowUsersBulkDeleteConfirm,
    usersBulkDeleteError,
    setUsersBulkDeleteError,

    // Handler functions
    handleCreateUser,
    handleEditUser,
    handleDeleteUser,
    handleResetPassword,
    handleUserSuccess,
    handleToggleUserSelection,
    handleSelectAllUsers,
    handleBulkDeleteUsers,
    refreshUsers
  }
}

export default useUserManagement
