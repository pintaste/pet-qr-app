import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  PawPrint,
  QrCode,
  BarChart3,
  Settings,
  HelpCircle,
  UserCog,
  Plus,
  Search,
} from 'lucide-react'
import { containerStyles } from '@/styles/containers'
import Header from '@/components/Header'
import { tenantAdminService, TenantStats, TenantUser } from '@/services/tenantAdminService'
import { TenantUserCard, TenantUserCardSkeleton } from '@/components/tenant/TenantUserCard'
import { AddTenantUserModal, EditTenantUserModal, DeleteTenantUserModal, ResetTenantUserPasswordModal } from '@/components/tenant/TenantUserModals'

type TenantAdminTab = 'overview' | 'users' | 'pets' | 'qrcodes' | 'analytics' | 'settings' | 'support' | 'impersonate'

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
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)

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
      // Refresh stats
      const stats = await tenantAdminService.getTenantStats()
      setTenantStats(stats)
    } catch (err) {
      console.error('Error refreshing after user operation:', err)
    }
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'pets' as const, label: 'Pets', icon: PawPrint },
    { id: 'qrcodes' as const, label: 'QR Codes', icon: QrCode },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'support' as const, label: 'Support', icon: HelpCircle },
    { id: 'impersonate' as const, label: 'Impersonate', icon: UserCog },
  ]

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

            {/* Store Stats */}
            {!isLoading && tenantStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_users}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tenantStats.active_users} active</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pets</h3>
                    <PawPrint className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_pets}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Registered in your store</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">QR Codes Assigned</h3>
                    <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_qr_codes}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tenantStats.active_qr_codes} active</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Scans</h3>
                    <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_scans}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From your store</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex flex-col items-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Users</span>
                </button>
                <button
                  onClick={() => setActiveTab('pets')}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <PawPrint className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Pets</span>
                </button>
                <button
                  onClick={() => setActiveTab('qrcodes')}
                  className="flex flex-col items-center gap-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <QrCode className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">QR Inventory</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Analytics</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                Recent Store Activity
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No recent activity to display
              </p>
            </div>
          </div>
        )

      case 'users':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage customers in your store
                </p>
              </div>
              <button
                onClick={handleCreateUser}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Users Grid */}
            {isUsersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <TenantUserCardSkeleton />
                <TenantUserCardSkeleton />
                <TenantUserCardSkeleton />
              </div>
            ) : users.length === 0 ? (
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <TenantUserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    onResetPassword={handleResetPassword}
                  />
                ))}
              </div>
            )}

            {/* User Count */}
            {!isUsersLoading && users.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {users.length} user{users.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )

      case 'pets':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Pets</h2>
              <div className="flex gap-2">
                <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option>All Breeds</option>
                  <option>Dog</option>
                  <option>Cat</option>
                </select>
                <input
                  type="text"
                  placeholder="Search pets..."
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No pets registered yet. Pets from your store's users will appear here.
            </p>
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

      case 'impersonate':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-red-200 dark:border-red-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Impersonate User</h2>

            <div className="max-w-2xl space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                <p className="text-sm text-red-800 dark:text-red-300">
                  ⚠️ Warning: You can only impersonate users in your store. All actions will be logged.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search User by Email
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <button className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                Start Impersonation
              </button>
            </div>
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
    </div>
  )
}

export default TenantAdminDashboard
