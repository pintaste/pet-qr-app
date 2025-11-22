import React from 'react'
import {
  Users,
  Search,
  Plus,
  Filter,
  Trash2,
  Grid3X3,
  List,
  LogIn,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import type { PlatformUser, Tenant } from '@/services/superAdminService'
import { UserCard, UserCardSkeleton } from '@/components/UserCard'

export interface UsersTabProps {
  users: PlatformUser[]
  paginatedUsers: PlatformUser[]
  isUsersLoading: boolean
  usersViewMode: 'grid' | 'list'
  setUsersViewMode: (mode: 'grid' | 'list') => void
  userSearchQuery: string
  setUserSearchQuery: (query: string) => void
  userRoleFilter: string
  setUserRoleFilter: (filter: string) => void
  userTenantFilter: string
  setUserTenantFilter: (filter: string) => void
  selectedUserIds: Set<number>
  onToggleUserSelection: (userId: number) => void
  onSelectAllUsers: () => void
  showUsersBulkDeleteConfirm: boolean
  setShowUsersBulkDeleteConfirm: (show: boolean) => void
  isUsersBulkDeleting: boolean
  usersBulkDeleteError: string | null
  onCreateUser: () => void
  onEditUser: (user: PlatformUser) => void
  onImpersonateUser: (user: PlatformUser) => void
  tenants: Tenant[]
  usersCurrentPage: number
  setUsersCurrentPage: (page: number | ((prev: number) => number)) => void
  usersTotalPages: number
  usersStartIndex: number
  usersEndIndex: number
}

/**
 * UsersTab Component
 *
 * Displays and manages the users list with grid/list view toggle, filters, and pagination.
 */
export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  paginatedUsers,
  isUsersLoading,
  usersViewMode,
  setUsersViewMode,
  userSearchQuery,
  setUserSearchQuery,
  userRoleFilter,
  setUserRoleFilter,
  userTenantFilter,
  setUserTenantFilter,
  selectedUserIds,
  onToggleUserSelection,
  onSelectAllUsers,
  showUsersBulkDeleteConfirm: _showUsersBulkDeleteConfirm,
  setShowUsersBulkDeleteConfirm,
  isUsersBulkDeleting: _isUsersBulkDeleting,
  usersBulkDeleteError: _usersBulkDeleteError,
  onCreateUser,
  onEditUser,
  onImpersonateUser,
  tenants,
  usersCurrentPage,
  setUsersCurrentPage,
  usersTotalPages,
  usersStartIndex,
  usersEndIndex,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all users across the platform
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bulk Delete Button - shown when users are selected */}
          {selectedUserIds.size > 0 && (
            <button
              onClick={() => setShowUsersBulkDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete ({selectedUserIds.size})</span>
              <span className="sm:hidden">{selectedUserIds.size}</span>
            </button>
          )}
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
          <button
            onClick={onCreateUser}
            className="flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[44px]"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Create User</span>
            <span className="sm:hidden">New User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="md:w-48">
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="tenant_admin">Tenant Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Tenant Filter */}
          <div className="md:w-48">
            <select
              value={userTenantFilter}
              onChange={(e) => setUserTenantFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Tenants</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(userSearchQuery || userRoleFilter || userTenantFilter) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {users.length} users
              {userSearchQuery && ` matching "${userSearchQuery}"`}
            </span>
            <button
              onClick={() => {
                setUserSearchQuery('')
                setUserRoleFilter('')
                setUserTenantFilter('')
              }}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline ml-auto"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Users Grid/List */}
      {isUsersLoading ? (
        usersViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
          </div>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        )
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
          <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {userSearchQuery || userRoleFilter || userTenantFilter
              ? 'No Users Found'
              : 'No Users Yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {userSearchQuery || userRoleFilter || userTenantFilter
              ? 'Try adjusting your search or filters'
              : 'Click "Create User" to add a Super Admin or Tenant Admin'}
          </p>
          {!userSearchQuery && !userRoleFilter && !userTenantFilter && (
            <button
              onClick={onCreateUser}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create User
            </button>
          )}
        </div>
      ) : usersViewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={onEditUser}
              onImpersonate={onImpersonateUser}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[320px] sm:min-w-0">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="py-2 sm:py-3 px-2 sm:px-3 w-10">
                  <input
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && selectedUserIds.size === paginatedUsers.length}
                    onChange={onSelectAllUsers}
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Tenant</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Status</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Created</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedUserIds.has(user.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                  <td className="py-2 sm:py-3 px-2 sm:px-3">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.id)}
                      onChange={() => onToggleUserSelection(user.id)}
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <p className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white truncate max-w-[80px] sm:max-w-none">{user.email}</p>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${
                      user.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        : user.role === 'tenant_admin'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {user.role === 'super_admin' ? 'Super' : user.role === 'tenant_admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user.tenant_name || '-'}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-4">
                    <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                      {user.role !== 'super_admin' && (
                        <button
                          onClick={() => onImpersonateUser(user)}
                          className="p-1.5 sm:p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded transition-colors min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                          title={`Impersonate ${user.email}`}
                        >
                          <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditUser(user)}
                        className="p-1.5 sm:p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                        title={`Edit ${user.email}`}
                      >
                        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Count Summary */}
      {/* Users Pagination */}
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
            onClick={() => setUsersCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={usersCurrentPage === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {usersCurrentPage} of {usersTotalPages}
          </span>
          <button
            onClick={() => setUsersCurrentPage(prev => Math.min(usersTotalPages, prev + 1))}
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

      {!isUsersLoading && users.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {usersStartIndex + 1}-{Math.min(usersEndIndex, users.length)} of {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
