import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  PawPrint,
  QrCode,
  Plus,
  Search,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LogIn,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  CheckSquare,
} from 'lucide-react'
import { tenantAdminService, TenantUser } from '@/services/tenantAdminService'
import { TenantUserCard, TenantUserCardSkeleton } from '@/components/tenant/TenantUserCard'
import {
  AddTenantUserModal,
  EditTenantUserModal,
  DeleteTenantUserModal,
  ResetTenantUserPasswordModal,
} from '@/components/tenant/TenantUserModals'

/**
 * Tenant Users Tab Component
 *
 * Manages tenant users with search, pagination, and CRUD operations.
 * Supports grid/list view modes and multi-select for bulk operations.
 */
const TenantUsersTab: React.FC = () => {
  // User management states
  const [users, setUsers] = useState<TenantUser[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [usersViewMode, setUsersViewMode] = useState<'grid' | 'list'>('list')
  const [usersCurrentPage, setUsersCurrentPage] = useState(1)
  const usersPerPage = 12
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [isUserSelectMode, setIsUserSelectMode] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)

  // Fetch users on mount and when search changes
  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      try {
        setIsUsersLoading(true)
        const userList = await tenantAdminService.listTenantUsers({
          search: userSearchQuery || undefined,
        })
        setUsers(userList)
      } catch (err) {
        console.error('Error fetching users:', err)
      } finally {
        setIsUsersLoading(false)
      }
    }

    fetchUsers()
  }, [userSearchQuery])

  // User handlers
  const handleCreateUser = (): void => setIsAddUserModalOpen(true)

  const handleEditUser = (user: TenantUser): void => {
    setSelectedUser(user)
    setIsEditUserModalOpen(true)
  }

  const handleDeleteUser = (user: TenantUser): void => {
    setSelectedUser(user)
    setIsDeleteUserModalOpen(true)
  }

  const handleResetPassword = (user: TenantUser): void => {
    setSelectedUser(user)
    setIsResetPasswordModalOpen(true)
  }

  const handleUserSuccess = async (): Promise<void> => {
    try {
      const userList = await tenantAdminService.listTenantUsers({
        search: userSearchQuery || undefined,
      })
      setUsers(userList)
      setSelectedUserIds(new Set())
    } catch (err) {
      console.error('Error refreshing after user operation:', err)
    }
  }

  // Selection handlers
  const handleToggleUserSelection = (userId: number): void => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAllUsers = (): void => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)))
    }
  }

  const handleToggleUserSelectMode = (): void => {
    setIsUserSelectMode((prev) => !prev)
    setSelectedUserIds(new Set())
  }

  const handleDeselectAllUsers = (): void => {
    setSelectedUserIds(new Set())
  }

  const handleBulkDelete = async (): Promise<void> => {
    if (selectedUserIds.size === 0) return

    setIsBulkDeleting(true)
    try {
      // Delete users one by one
      for (const userId of selectedUserIds) {
        await tenantAdminService.deleteUser(userId)
      }
      setShowBulkDeleteConfirm(false)
      await handleUserSuccess()
    } catch (err) {
      console.error('Error during bulk delete:', err)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleImpersonateUser = (user: TenantUser): void => {
    // TODO: Implement actual impersonation logic
    console.log('Impersonating user:', user.email)
    alert(`Impersonation of ${user.email} would start here. This action will be logged.`)
  }

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    let result = users

    // Apply search filter
    if (userSearchQuery) {
      const query = userSearchQuery.toLowerCase()
      result = result.filter((user) => user.email.toLowerCase().includes(query))
    }

    return result
  }, [users, userSearchQuery])

  // Pagination calculations
  const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const usersStartIndex = (usersCurrentPage - 1) * usersPerPage
  const usersEndIndex = usersStartIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(usersStartIndex, usersEndIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setUsersCurrentPage(1)
  }, [userSearchQuery])

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage customers in your store
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setUsersViewMode('grid')}
                className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                  usersViewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setUsersViewMode('list')}
                className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                  usersViewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="List View"
              >
                <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            {/* Select Mode Toggle */}
            <button
              onClick={handleToggleUserSelectMode}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm min-h-[44px] ${
                isUserSelectMode
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{isUserSelectMode ? 'Cancel' : 'Select'}</span>
            </button>
            <button
              onClick={handleCreateUser}
              className="flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[44px]"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add User</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Search Bar with User Count */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </div>
        </div>

        {/* Active Search Filter Tag */}
        {userSearchQuery && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
              Search: "{userSearchQuery}"
              <button
                onClick={() => setUserSearchQuery('')}
                className="hover:text-purple-900 dark:hover:text-purple-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {/* Selection Action Bar */}
        {isUserSelectMode && (
          <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                {selectedUserIds.size} of {filteredUsers.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllUsers}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  Select All
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={handleDeselectAllUsers}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={selectedUserIds.size === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedUserIds.size === 0
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedUserIds.size})
            </button>
          </div>
        )}

        {/* Users Grid/List */}
        {isUsersLoading ? (
          usersViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TenantUserCardSkeleton />
              <TenantUserCardSkeleton />
              <TenantUserCardSkeleton />
              <TenantUserCardSkeleton />
              <TenantUserCardSkeleton />
              <TenantUserCardSkeleton />
            </div>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          )
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
            <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {userSearchQuery ? 'No Users Found' : 'No Users Yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {userSearchQuery
                ? 'Try adjusting your search'
                : 'Click "Add User" to create the first user in your store'}
            </p>
            {!userSearchQuery && (
              <button
                onClick={handleCreateUser}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            )}
          </div>
        ) : usersViewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedUsers.map((user) => (
              <div key={user.id} className="relative">
                {isUserSelectMode && (
                  <button
                    onClick={() => handleToggleUserSelection(user.id)}
                    className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                      selectedUserIds.has(user.id)
                        ? 'bg-purple-500 border-purple-500 text-white'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-purple-400'
                    }`}
                  >
                    {selectedUserIds.has(user.id) && <CheckSquare className="w-4 h-4" />}
                  </button>
                )}
                <div
                  className={`${
                    isUserSelectMode && selectedUserIds.has(user.id) ? 'ring-2 ring-purple-500 rounded-xl' : ''
                  }`}
                  onClick={isUserSelectMode ? () => handleToggleUserSelection(user.id) : undefined}
                >
                  <TenantUserCard
                    user={user}
                    onEdit={isUserSelectMode ? undefined : handleEditUser}
                    onDelete={isUserSelectMode ? undefined : handleDeleteUser}
                    onResetPassword={isUserSelectMode ? undefined : handleResetPassword}
                    onImpersonate={isUserSelectMode ? undefined : handleImpersonateUser}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[320px] sm:min-w-0">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  {isUserSelectMode && (
                    <th className="py-2 sm:py-3 px-2 sm:px-4 w-10">
                      <input
                        type="checkbox"
                        checked={paginatedUsers.length > 0 && selectedUserIds.size === paginatedUsers.length}
                        onChange={handleSelectAllUsers}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </th>
                  )}
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    User
                  </th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    Pets
                  </th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    QR Codes
                  </th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    Created
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      isUserSelectMode && selectedUserIds.has(user.id) ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    {isUserSelectMode && (
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => handleToggleUserSelection(user.id)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </td>
                    )}
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <p className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                        {user.email}
                      </p>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <PawPrint className="w-3 h-3 mr-1" />
                        {user.pet_count ?? 0}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        <QrCode className="w-3 h-3 mr-1" />
                        {user.qr_count ?? 0}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-1 sm:px-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleImpersonateUser(user)}
                          className="p-1.5 sm:p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title={`Impersonate ${user.email}`}
                        >
                          <LogIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 sm:p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title={`Edit ${user.email}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {usersTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 py-3">
            <button
              onClick={() => setUsersCurrentPage(1)}
              disabled={usersCurrentPage === 1}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setUsersCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={usersCurrentPage === 1}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
              Page {usersCurrentPage} of {usersTotalPages}
            </span>
            <button
              onClick={() => setUsersCurrentPage((prev) => Math.min(usersTotalPages, prev + 1))}
              disabled={usersCurrentPage === usersTotalPages}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setUsersCurrentPage(usersTotalPages)}
              disabled={usersCurrentPage === usersTotalPages}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}

        {/* User Count Summary */}
        {!isUsersLoading && filteredUsers.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {usersStartIndex + 1}-{Math.min(usersEndIndex, filteredUsers.length)} of {filteredUsers.length}{' '}
              user{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* User Modals */}
      <AddTenantUserModal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} onSuccess={handleUserSuccess} />

      <EditTenantUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onSuccess={handleUserSuccess}
      />

      <DeleteTenantUserModal
        isOpen={isDeleteUserModalOpen}
        onClose={() => {
          setIsDeleteUserModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onSuccess={handleUserSuccess}
      />

      <ResetTenantUserPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => {
          setIsResetPasswordModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onSuccess={handleUserSuccess}
      />

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete {selectedUserIds.size} User{selectedUserIds.size !== 1 ? 's' : ''}?
                </h3>
              </div>
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. All selected users and their associated data will be permanently deleted.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                disabled={isBulkDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TenantUsersTab
