import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowUp } from 'lucide-react'
import { containerStyles } from '@/styles/containers'
import Header from '@/components/Header'
import { superAdminService, PlatformStats } from '@/services/superAdminService'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import SubscriptionsDashboard from '@/components/SubscriptionsDashboard'
import { PlatformSettingsTab } from '@/components/PlatformSettings'
import { SuperAdminModals } from '@/components/SuperAdminModals'
import { TenantsTab } from '@/pages/dashboards/tabs/TenantsTab'
import { UsersTab } from '@/pages/dashboards/tabs/UsersTab'
import { QRFactoryTab } from '@/pages/dashboards/tabs/QRFactoryTab'
import { OverviewTab, SuperAdminTab } from '@/pages/dashboards/tabs/OverviewTab'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { useQRFactory } from '@/hooks/useQRFactory'
import { useTenantManagement } from '@/hooks/useTenantManagement'
import { useUserManagement } from '@/hooks/useUserManagement'
import { useImpersonation } from '@/hooks/useImpersonation'
import TabNavigation from '@/components/TabNavigation'
import { formatRelativeTime } from '@/utils/formatUtils'
import { exportActivityToCSV } from '@/utils/csvExportUtils'

/**
 * Super Admin Dashboard
 *
 * For platform owners to manage all tenants, generate QR batches, and view platform analytics.
 */
const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview')
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerateQRModalOpen, setIsGenerateQRModalOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [qrViewMode, setQrViewMode] = useState<'grid' | 'list'>('list')
  const [activityCurrentPage, setActivityCurrentPage] = useState(1)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  const refreshStats = useCallback(async () => {
    const stats = await superAdminService.getPlatformStats()
    setPlatformStats(stats)
  }, [])

  const {
    activityFeed,
    isActivityLoading,
    activityTimeRange,
    customStartDate,
    customEndDate,
    activityFilter,
    lastActivityUpdate,
    setActivityTimeRange,
    setCustomStartDate,
    setCustomEndDate,
    setActivityFilter,
    fetchActivityFeed
  } = useActivityFeed(activeTab === 'overview')

  // QR Factory hook
  const {
    qrCodes,
    filteredQRCodes,
    paginatedQRCodes,
    uniqueBatches,
    isQRsLoading,
    selectedQR,
    setSelectedQR,
    isViewQRModalOpen,
    setIsViewQRModalOpen,
    isDeleteQRModalOpen,
    setIsDeleteQRModalOpen,
    showBulkDeleteConfirm,
    setShowBulkDeleteConfirm,
    qrSearchQuery,
    setQrSearchQuery,
    qrStatusFilter,
    setQrStatusFilter,
    qrBatchFilter,
    setQrBatchFilter,
    qrAssignmentFilter,
    setQrAssignmentFilter,
    qrTenantFilter,
    setQrTenantFilter,
    qrCurrentPage,
    setQrCurrentPage,
    qrTotalPages,
    qrCodesPerPage: QR_PER_PAGE,
    isBulkDownloading,
    bulkDownloadProgress,
    isDeleting,
    deleteError,
    setDeleteError,
    isBulkDeleting,
    bulkDeleteProgress,
    bulkDeleteError,
    setBulkDeleteError,
    handleViewQR,
    handleDownloadQR,
    handleDeleteQR,
    handleBulkDownload,
    confirmDeleteQR,
    handleBulkDelete,
    refreshQRCodes
  } = useQRFactory(activeTab === 'qr-factory', {
    onQRCodesUpdated: refreshStats
  })

  // Tenant management hook
  const {
    tenants,
    paginatedTenants,
    isTenantsLoading,
    selectedTenant,
    setSelectedTenant,
    isAddTenantModalOpen,
    setIsAddTenantModalOpen,
    isEditTenantModalOpen,
    setIsEditTenantModalOpen,
    isDeleteTenantModalOpen,
    setIsDeleteTenantModalOpen,
    tenantsCurrentPage,
    setTenantsCurrentPage,
    tenantsTotalPages,
    tenantsViewMode,
    setTenantsViewMode,
    handleCreateTenant,
    handleEditTenant,
    handleTenantSuccess
  } = useTenantManagement(activeTab === 'tenants' || activeTab === 'qr-factory' || activeTab === 'users', {
    onTenantsUpdated: refreshStats
  })

  // User management hook
  const {
    users,
    paginatedUsers,
    isUsersLoading,
    selectedUser,
    setSelectedUser,
    isAddUserModalOpen,
    setIsAddUserModalOpen,
    isEditUserModalOpen,
    setIsEditUserModalOpen,
    isDeleteUserModalOpen,
    setIsDeleteUserModalOpen,
    isResetPasswordModalOpen,
    setIsResetPasswordModalOpen,
    userSearchQuery,
    setUserSearchQuery,
    userRoleFilter,
    setUserRoleFilter,
    userTenantFilter,
    setUserTenantFilter,
    usersCurrentPage,
    setUsersCurrentPage,
    usersTotalPages,
    usersStartIndex,
    usersEndIndex,
    usersViewMode,
    setUsersViewMode,
    selectedUserIds,
    isUsersBulkDeleting,
    showUsersBulkDeleteConfirm,
    setShowUsersBulkDeleteConfirm,
    usersBulkDeleteError,
    setUsersBulkDeleteError,
    handleCreateUser,
    handleEditUser,
    handleUserSuccess,
    handleToggleUserSelection,
    handleSelectAllUsers,
    handleBulkDeleteUsers
  } = useUserManagement(activeTab === 'users', {
    onUsersUpdated: refreshStats
  })

  // Impersonation hook
  const {
    isImpersonateModalOpen,
    impersonateTenant,
    tenantAdmins,
    isLoadingAdmins,
    isImpersonating,
    impersonateError,
    handleImpersonateTenant,
    handleImpersonateUser,
    confirmImpersonation,
    closeImpersonationModal
  } = useImpersonation()

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch platform stats
  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        setIsLoading(true)
        const stats = await superAdminService.getPlatformStats()
        setPlatformStats(stats)
        setError(null)
      } catch (err) {
        console.error('Error fetching platform stats:', err)
        setError('Failed to load platform statistics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatformStats()
  }, [])

  // Export activity log to CSV wrapper
  const handleExportActivityToCSV = useCallback(() => {
    exportActivityToCSV({
      activityFeed,
      activityTimeRange,
      customStartDate,
      customEndDate
    })
  }, [activityFeed, activityTimeRange, customStartDate, customEndDate])

  // Wrapper for impersonate user that passes tenants
  const handleImpersonateUserWithTenants = useCallback((user: Parameters<typeof handleImpersonateUser>[0]) => {
    handleImpersonateUser(user, tenants)
  }, [handleImpersonateUser, tenants])

  const handleQRGenerateSuccess = useCallback(async () => {
    await refreshQRCodes()
    await refreshStats()
  }, [refreshQRCodes, refreshStats])

  // Memoized pagination indices for QR codes
  const qrStartIndex = useMemo(() => (qrCurrentPage - 1) * QR_PER_PAGE, [qrCurrentPage])
  const qrEndIndex = useMemo(() => qrStartIndex + QR_PER_PAGE, [qrStartIndex])

  // Memoized tenant data for subscriptions
  const subscriptionTenants = useMemo(() =>
    tenants.map(t => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      tier: t.tier
    })), [tenants])

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            platformStats={platformStats}
            isLoading={isLoading}
            error={error}
            activityFeed={activityFeed}
            isActivityLoading={isActivityLoading}
            setActiveTab={setActiveTab}
            formatRelativeTime={formatRelativeTime}
          />
        )
      case 'tenants':
        return (
          <TenantsTab
            tenants={tenants}
            paginatedTenants={paginatedTenants}
            isTenantsLoading={isTenantsLoading}
            tenantsViewMode={tenantsViewMode}
            setTenantsViewMode={setTenantsViewMode}
            tenantsCurrentPage={tenantsCurrentPage}
            setTenantsCurrentPage={setTenantsCurrentPage}
            tenantsTotalPages={tenantsTotalPages}
            onCreateTenant={handleCreateTenant}
            onEditTenant={handleEditTenant}
            onImpersonateTenant={handleImpersonateTenant}
          />
        )
      case 'qr-factory':
        return (
          <QRFactoryTab
            qrCodes={qrCodes}
            filteredQRCodes={filteredQRCodes}
            paginatedQRCodes={paginatedQRCodes}
            isQRsLoading={isQRsLoading}
            qrViewMode={qrViewMode}
            setQrViewMode={setQrViewMode}
            qrSearchQuery={qrSearchQuery}
            setQrSearchQuery={setQrSearchQuery}
            qrStatusFilter={qrStatusFilter}
            setQrStatusFilter={setQrStatusFilter}
            qrBatchFilter={qrBatchFilter}
            setQrBatchFilter={setQrBatchFilter}
            qrTenantFilter={qrTenantFilter}
            setQrTenantFilter={setQrTenantFilter}
            qrAssignmentFilter={qrAssignmentFilter}
            setQrAssignmentFilter={setQrAssignmentFilter}
            uniqueBatches={uniqueBatches}
            tenants={tenants}
            onGenerateQR={() => setIsGenerateQRModalOpen(true)}
            onViewQR={handleViewQR}
            onDownloadQR={handleDownloadQR}
            onDeleteQR={handleDeleteQR}
            onBulkDownload={handleBulkDownload}
            isBulkDownloading={isBulkDownloading}
            bulkDownloadProgress={bulkDownloadProgress}
            isBulkDeleting={isBulkDeleting}
            bulkDeleteProgress={bulkDeleteProgress}
            showActionsMenu={showActionsMenu}
            setShowActionsMenu={setShowActionsMenu}
            setShowBulkDeleteConfirm={setShowBulkDeleteConfirm}
            qrCurrentPage={qrCurrentPage}
            setQrCurrentPage={setQrCurrentPage}
            qrTotalPages={qrTotalPages}
            qrStartIndex={qrStartIndex}
            qrEndIndex={qrEndIndex}
          />
        )
      case 'users':
        return (
          <UsersTab
            users={users}
            paginatedUsers={paginatedUsers}
            isUsersLoading={isUsersLoading}
            usersViewMode={usersViewMode}
            setUsersViewMode={setUsersViewMode}
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            userTenantFilter={userTenantFilter}
            setUserTenantFilter={setUserTenantFilter}
            selectedUserIds={selectedUserIds}
            onToggleUserSelection={handleToggleUserSelection}
            onSelectAllUsers={handleSelectAllUsers}
            showUsersBulkDeleteConfirm={showUsersBulkDeleteConfirm}
            setShowUsersBulkDeleteConfirm={setShowUsersBulkDeleteConfirm}
            isUsersBulkDeleting={isUsersBulkDeleting}
            usersBulkDeleteError={usersBulkDeleteError}
            onCreateUser={handleCreateUser}
            onEditUser={handleEditUser}
            onImpersonateUser={handleImpersonateUserWithTenants}
            tenants={tenants}
            usersCurrentPage={usersCurrentPage}
            setUsersCurrentPage={setUsersCurrentPage}
            usersTotalPages={usersTotalPages}
            usersStartIndex={usersStartIndex}
            usersEndIndex={usersEndIndex}
          />
        )
      case 'analytics':
        return (
          <AnalyticsDashboard
            platformStats={platformStats}
            activityFeed={activityFeed}
            isActivityLoading={isActivityLoading}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            activityTimeRange={activityTimeRange}
            setActivityTimeRange={setActivityTimeRange}
            showCustomDatePicker={showCustomDatePicker}
            setShowCustomDatePicker={setShowCustomDatePicker}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            activityCurrentPage={activityCurrentPage}
            setActivityCurrentPage={setActivityCurrentPage}
            autoRefreshEnabled={autoRefreshEnabled}
            setAutoRefreshEnabled={setAutoRefreshEnabled}
            lastActivityUpdate={lastActivityUpdate}
            fetchActivityFeed={fetchActivityFeed}
            exportActivityToCSV={handleExportActivityToCSV}
            formatRelativeTime={formatRelativeTime}
          />
        )
      case 'settings':
        return <PlatformSettingsTab />
      case 'subscriptions':
        return (
          <SubscriptionsDashboard
            tenants={subscriptionTenants}
          />
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
      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tenantCount={tenants.length}
        userCount={users.length}
      />

      {/* Main Content */}
      <div className={`${containerStyles.extraWide} py-4 sm:py-6`}>
        {renderContent()}
      </div>

      {/* All Modals */}
      <SuperAdminModals
        generateQR={{
          isOpen: isGenerateQRModalOpen,
          onClose: () => setIsGenerateQRModalOpen(false),
          onSuccess: handleQRGenerateSuccess
        }}
        tenant={{
          isAddTenantModalOpen,
          setIsAddTenantModalOpen,
          isEditTenantModalOpen,
          setIsEditTenantModalOpen,
          isDeleteTenantModalOpen,
          setIsDeleteTenantModalOpen,
          selectedTenant,
          setSelectedTenant,
          onTenantSuccess: handleTenantSuccess
        }}
        user={{
          isAddUserModalOpen,
          setIsAddUserModalOpen,
          isEditUserModalOpen,
          setIsEditUserModalOpen,
          isDeleteUserModalOpen,
          setIsDeleteUserModalOpen,
          isResetPasswordModalOpen,
          setIsResetPasswordModalOpen,
          showUsersBulkDeleteConfirm,
          setShowUsersBulkDeleteConfirm,
          selectedUserIds,
          isUsersBulkDeleting,
          usersBulkDeleteError,
          setUsersBulkDeleteError,
          handleBulkDeleteUsers,
          selectedUser,
          setSelectedUser,
          onUserSuccess: handleUserSuccess
        }}
        qr={{
          isViewQRModalOpen,
          setIsViewQRModalOpen,
          isDeleteQRModalOpen,
          setIsDeleteQRModalOpen,
          showBulkDeleteConfirm,
          setShowBulkDeleteConfirm,
          selectedQR,
          setSelectedQR,
          isDeleting,
          deleteError,
          setDeleteError,
          confirmDeleteQR,
          filteredQRCodes,
          qrStatusFilter,
          qrBatchFilter,
          qrSearchQuery,
          qrAssignmentFilter,
          qrTenantFilter,
          isBulkDeleting,
          bulkDeleteProgress,
          bulkDeleteError,
          setBulkDeleteError,
          handleBulkDelete
        }}
        impersonation={{
          isImpersonateModalOpen,
          impersonateTenant,
          tenantAdmins,
          isLoadingAdmins,
          isImpersonating,
          impersonateError,
          closeImpersonationModal,
          confirmImpersonation
        }}
      />

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-br from-gray-200/70 to-gray-300/70 hover:from-gray-200/90 hover:to-gray-300/90 text-gray-600/80 hover:text-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-md"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default SuperAdminDashboard
