import React, { useState, useEffect, useMemo } from 'react'
import {
  LayoutDashboard,
  Users,
  PawPrint,
  QrCode,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  Search,
  Grid3X3,
  List,
  Dog,
  Cat,
  Zap,
  UserPlus,
  Scan,
  Filter,
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
} from 'lucide-react'
import { containerStyles } from '@/styles/containers'
import Header from '@/components/Header'
import { tenantAdminService, TenantStats, TenantUser } from '@/services/tenantAdminService'
import { TenantUserCard, TenantUserCardSkeleton } from '@/components/tenant/TenantUserCard'
import { AddTenantUserModal, EditTenantUserModal, DeleteTenantUserModal, ResetTenantUserPasswordModal } from '@/components/tenant/TenantUserModals'

type TenantAdminTab = 'overview' | 'users' | 'pets' | 'qrcodes' | 'support' | 'analytics' | 'settings'

/**
 * Tenant Admin Dashboard
 *
 * For pet store owners to manage their store, users, and QR inventory.
 */
const TenantAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TenantAdminTab>('overview')
  const [tenantStats, setTenantStats] = useState<TenantStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // User management states
  const [users, setUsers] = useState<TenantUser[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [usersViewMode, setUsersViewMode] = useState<'grid' | 'list'>('list')
  const [usersCurrentPage, setUsersCurrentPage] = useState(1)
  const usersPerPage = 12
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)

  // Pets management states
  const [petsViewMode, setPetsViewMode] = useState<'grid' | 'list'>('grid')
  const [petsSearchQuery, setPetsSearchQuery] = useState('')
  const [petsSpeciesFilter, setPetsSpeciesFilter] = useState<'all' | 'dog' | 'cat' | 'other'>('all')

  useEffect(() => {
    const fetchTenantStats = async () => {
      try {
        setIsLoading(true)
        const stats = await tenantAdminService.getTenantStats()
        setTenantStats(stats)
      } catch (err) {
        console.error('Error fetching tenant stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTenantStats()
  }, [])

  // Fetch users when users tab is active
  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab === 'users') {
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
    }

    fetchUsers()
  }, [activeTab, userSearchQuery])

  // User handlers
  const handleCreateUser = () => setIsAddUserModalOpen(true)
  const handleEditUser = (user: TenantUser) => {
    setSelectedUser(user)
    setIsEditUserModalOpen(true)
  }
  const handleDeleteUser = (user: TenantUser) => {
    setSelectedUser(user)
    setIsDeleteUserModalOpen(true)
  }
  const handleResetPassword = (user: TenantUser) => {
    setSelectedUser(user)
    setIsResetPasswordModalOpen(true)
  }

  const handleUserSuccess = async () => {
    try {
      const userList = await tenantAdminService.listTenantUsers({
        search: userSearchQuery || undefined,
      })
      setUsers(userList)
      setSelectedUserIds(new Set())
      // Refresh stats
      const stats = await tenantAdminService.getTenantStats()
      setTenantStats(stats)
    } catch (err) {
      console.error('Error refreshing after user operation:', err)
    }
  }

  // Selection handlers
  const handleToggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAllUsers = () => {
    if (selectedUserIds.size === paginatedUsers.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(paginatedUsers.map(u => u.id)))
    }
  }

  const handleBulkDelete = async () => {
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

  // Filter users based on search and status
  const filteredUsers = useMemo(() => {
    let result = users

    // Apply status filter
    if (userStatusFilter === 'active') {
      result = result.filter(user => user.is_active)
    } else if (userStatusFilter === 'inactive') {
      result = result.filter(user => !user.is_active)
    }

    return result
  }, [users, userStatusFilter])

  // Pagination calculations
  const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const usersStartIndex = (usersCurrentPage - 1) * usersPerPage
  const usersEndIndex = usersStartIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(usersStartIndex, usersEndIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setUsersCurrentPage(1)
  }, [userSearchQuery, userStatusFilter])

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'pets' as const, label: 'Pets', icon: PawPrint },
    { id: 'qrcodes' as const, label: 'QR Codes', icon: QrCode },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'support' as const, label: 'Support', icon: HelpCircle },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  // Handler for impersonating a user
  const handleImpersonateUser = (user: TenantUser) => {
    // TODO: Implement actual impersonation logic
    console.log('Impersonating user:', user.email)
    alert(`Impersonation of ${user.email} would start here. This action will be logged.`)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading store statistics...</p>
                </div>
              </div>
            )}

            {/* Store Stats & Quick Actions Combined */}
            {!isLoading && tenantStats && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_users}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{tenantStats.active_users} active</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    Click to manage users →
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('pets')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Pets</h3>
                    <PawPrint className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_pets}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">Registered in your store</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    Click to view pets →
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('qrcodes')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">QR Codes</h3>
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_qr_codes}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{tenantStats.active_qr_codes} active</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    Click to view inventory →
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Scans</h3>
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_scans}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">From your store</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    Click to view analytics →
                  </p>
                </button>
              </div>
            )}

            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Recent Activity (24h)
                </h3>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                >
                  view more →
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Placeholder activity items - will be replaced with real data */}
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-blue-100 dark:bg-blue-900/30">
                    <UserPlus className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">New user registered</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Just now</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-orange-100 dark:bg-orange-900/30">
                    <PawPrint className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">Pet "Buddy" registered</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">5 min ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-purple-100 dark:bg-purple-900/30">
                    <QrCode className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">QR code activated for "Max"</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">15 min ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/30">
                    <Scan className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">QR scanned for "Luna" from San Francisco</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">1 hour ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/30">
                    <Scan className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">QR scanned for "Buddy" from New York</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">2 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'users':
        return (
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
                {/* Bulk Delete Button - shows when users are selected */}
                {selectedUserIds.size > 0 && (
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm min-h-[44px]"
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
                  onClick={handleCreateUser}
                  className="flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">New</span>
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
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <div className="md:w-48">
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(userSearchQuery || userStatusFilter !== 'all') && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {filteredUsers.length} users
                    {userSearchQuery && ` matching "${userSearchQuery}"`}
                  </span>
                  <button
                    onClick={() => {
                      setUserSearchQuery('')
                      setUserStatusFilter('all')
                    }}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline ml-auto"
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
                  {userSearchQuery || userStatusFilter !== 'all' ? 'No Users Found' : 'No Users Yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {userSearchQuery || userStatusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Click "Add User" to create the first user in your store'}
                </p>
                {!userSearchQuery && userStatusFilter === 'all' && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedUsers.map((user) => (
                  <TenantUserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    onResetPassword={handleResetPassword}
                    onImpersonate={handleImpersonateUser}
                  />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[320px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="py-2 sm:py-3 px-2 sm:px-4 w-10">
                        <input
                          type="checkbox"
                          checked={paginatedUsers.length > 0 && selectedUserIds.size === paginatedUsers.length}
                          onChange={handleSelectAllUsers}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Pets</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">QR Codes</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Status</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Created</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          selectedUserIds.has(user.id) ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                        }`}
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => handleToggleUserSelection(user.id)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <p className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{user.email}</p>
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

            {/* User Count Summary */}
            {!isUsersLoading && filteredUsers.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {usersStartIndex + 1}-{Math.min(usersEndIndex, filteredUsers.length)} of {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )

      case 'pets':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Pets</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Pets registered by your store's customers
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPetsViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    petsViewMode === 'grid'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Grid view"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPetsViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    petsViewMode === 'list'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by pet name or owner email..."
                    value={petsSearchQuery}
                    onChange={(e) => setPetsSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Species Filter */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPetsSpeciesFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      petsSpeciesFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setPetsSpeciesFilter('dog')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      petsSpeciesFilter === 'dog'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Dog className="w-4 h-4" />
                    Dogs
                  </button>
                  <button
                    onClick={() => setPetsSpeciesFilter('cat')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      petsSpeciesFilter === 'cat'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Cat className="w-4 h-4" />
                    Cats
                  </button>
                  <button
                    onClick={() => setPetsSpeciesFilter('other')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      petsSpeciesFilter === 'other'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Other
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
              <PawPrint className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Pets Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Pets registered by your store's customers will appear here.
              </p>
            </div>
          </div>
        )

      case 'qrcodes':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">QR Code Inventory</h2>
            </div>

            {/* QR Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Assigned</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">0</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Activated</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">0</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">In Use</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">0</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No QR codes assigned to your store yet. Contact support to request QR codes.
            </p>
          </div>
        )

      case 'analytics':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-green-200 dark:border-green-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Store Analytics</h2>

            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm">
                  Last 7 Days
                </button>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm">
                  Last 30 Days
                </button>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm">
                  Last 90 Days
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Analytics charts will be displayed here (real-time data with 30s polling)
            </p>
          </div>
        )

      case 'settings':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Store Settings</h2>

            <div className="max-w-2xl space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  placeholder="My Pet Store"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subdomain
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="mystore"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-gray-500 dark:text-gray-400">.petqr.app</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branding Color
                </label>
                <input
                  type="color"
                  defaultValue="#8B5CF6"
                  className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-600"
                />
              </div>

              <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        )

      case 'support':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Support Tickets</h2>
              <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
                + New Ticket
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm">
                All
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm">
                Open
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm">
                In Progress
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm">
                Closed
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No support tickets. Create a new ticket if you need help.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className={containerStyles.extraWide}>
          <Header variant="default" showAuthButton={true} />
        </div>
      </div>

      {/* Dashboard Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-purple-200 dark:border-purple-700">
        <div className={`${containerStyles.extraWide} py-4`}>
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden overflow-x-auto hide-scrollbar -mx-4 px-4">
            <div className="flex gap-2 pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-500'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${containerStyles.extraWide} py-6`}>
        {renderContent()}
      </div>

      {/* User Modals */}
      <AddTenantUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={handleUserSuccess}
      />

      <EditTenantUserModal
        isOpen={isEditUserModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsEditUserModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleUserSuccess}
      />

      <DeleteTenantUserModal
        isOpen={isDeleteUserModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsDeleteUserModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleUserSuccess}
      />

      <ResetTenantUserPasswordModal
        isOpen={isResetPasswordModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsResetPasswordModalOpen(false)
          setSelectedUser(null)
        }}
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
    </div>
  )
}

export default TenantAdminDashboard
