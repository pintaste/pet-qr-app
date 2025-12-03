/**
 * Subscriptions Dashboard Component
 *
 * Provides comprehensive subscription management for Super Admins including:
 * - Option B: Subscription Overview
 * - Option C: Manual Subscription Actions
 * - Option D: Feature Limits Configuration
 */

import { useState, useEffect } from 'react'
import { Grid3X3, List, Plus } from 'lucide-react'
import { superAdminService, SubscriptionOverview, FeatureLimits } from '../services/superAdminService'
import SubscriptionStats from './subscriptions/SubscriptionStats'
import SubscriptionCard from './subscriptions/SubscriptionCard'
import SubscriptionList from './subscriptions/SubscriptionList'
import {
  EditSubscriptionModal,
  FeatureLimitsModal,
  AddSubscriptionModal
} from './subscriptions/SubscriptionModals'

interface SubscriptionsDashboardProps {
  tenants: Array<{
    id: number
    name: string
    subdomain: string
    tier: string
  }>
}

export default function SubscriptionsDashboard({ tenants: _tenants }: SubscriptionsDashboardProps) {
  // Note: _tenants is available for future use (e.g., filtering) but currently
  // we fetch all subscription data directly from the API
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLimitsModal, setShowLimitsModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [featureLimits, setFeatureLimits] = useState<FeatureLimits | null>(null)

  // Form states
  const [editForm, setEditForm] = useState({
    tier: 'standard',
    extend_days: 30,
    is_active: true
  })
  const [limitsForm, setLimitsForm] = useState({
    max_pets: 50,
    max_qr_codes: 100,
    max_users: 5,
    max_storage_mb: 500,
    features: {
      analytics: false,
      export: false,
      custom_domain: false,
      api_access: false
    }
  })
  const [addForm, setAddForm] = useState({
    tenant_id: 0,
    tier: 'standard' as 'standard' | 'enterprise',
    duration_days: 30
  })

  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Filter state for subscription status
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadOverview()
  }, [])

  /**
   * Load subscription overview data from API
   */
  const loadOverview = async (): Promise<void> => {
    try {
      setLoading(true)
      const data = await superAdminService.getSubscriptionOverview()
      setOverview(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Open edit subscription modal with tenant data
   */
  const handleEditSubscription = (tenant: any): void => {
    setSelectedTenant(tenant)
    setEditForm({
      tier: tenant.tier,
      extend_days: 30,
      is_active: tenant.is_active
    })
    setShowEditModal(true)
    setActionMessage(null)
  }

  /**
   * Open feature limits modal and load tenant limits
   */
  const handleViewLimits = async (tenant: any): Promise<void> => {
    setSelectedTenant(tenant)
    setActionLoading(true)
    try {
      const limits = await superAdminService.getFeatureLimits(tenant.tenant_id)
      setFeatureLimits(limits)
      setLimitsForm({
        max_pets: limits.limits.max_pets,
        max_qr_codes: limits.limits.max_qr_codes,
        max_users: limits.limits.max_users,
        max_storage_mb: limits.limits.max_storage_mb,
        features: { ...limits.limits.features }
      })
      setShowLimitsModal(true)
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to load feature limits' })
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Save subscription changes
   */
  const saveSubscription = async (): Promise<void> => {
    if (!selectedTenant) return
    setActionLoading(true)
    try {
      await superAdminService.updateSubscription(selectedTenant.tenant_id, {
        tier: editForm.tier as 'standard' | 'enterprise',
        extend_days: editForm.extend_days,
        is_active: editForm.is_active
      })
      setActionMessage({ type: 'success', text: 'Subscription updated successfully' })
      await loadOverview()
      setTimeout(() => setShowEditModal(false), 1500)
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update subscription' })
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Save feature limits changes
   */
  const saveLimits = async (): Promise<void> => {
    if (!selectedTenant) return
    setActionLoading(true)
    try {
      await superAdminService.updateFeatureLimits(selectedTenant.tenant_id, limitsForm)
      setActionMessage({ type: 'success', text: 'Feature limits updated successfully' })
      await loadOverview()
      setTimeout(() => setShowLimitsModal(false), 1500)
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update limits' })
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Reset feature limits to tier defaults
   */
  const resetLimits = async (): Promise<void> => {
    if (!selectedTenant) return
    setActionLoading(true)
    try {
      await superAdminService.resetFeatureLimits(selectedTenant.tenant_id)
      setActionMessage({ type: 'success', text: 'Limits reset to tier defaults' })
      // Reload limits to show defaults
      const limits = await superAdminService.getFeatureLimits(selectedTenant.tenant_id)
      setFeatureLimits(limits)
      setLimitsForm({
        max_pets: limits.limits.max_pets,
        max_qr_codes: limits.limits.max_qr_codes,
        max_users: limits.limits.max_users,
        max_storage_mb: limits.limits.max_storage_mb,
        features: { ...limits.limits.features }
      })
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to reset limits' })
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Open add subscription modal
   */
  const handleOpenAddModal = (): void => {
    // Find tenants without active subscription
    const tenantsWithoutSub = overview?.tenants.filter(
      t => t.subscription_status === 'no_subscription' || t.subscription_status === 'expired'
    ) || []

    if (tenantsWithoutSub.length > 0) {
      setAddForm({
        tenant_id: tenantsWithoutSub[0].tenant_id,
        tier: 'standard',
        duration_days: 30
      })
    } else {
      setAddForm({
        tenant_id: overview?.tenants[0]?.tenant_id || 0,
        tier: 'standard',
        duration_days: 30
      })
    }
    setActionMessage(null)
    setShowAddModal(true)
  }

  /**
   * Save new subscription
   */
  const saveNewSubscription = async (): Promise<void> => {
    if (!addForm.tenant_id) return
    setActionLoading(true)
    try {
      await superAdminService.updateSubscription(addForm.tenant_id, {
        tier: addForm.tier,
        extend_days: addForm.duration_days,
        is_active: true
      })
      setActionMessage({ type: 'success', text: 'Subscription added successfully' })
      await loadOverview()
      setTimeout(() => setShowAddModal(false), 1500)
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add subscription' })
    } finally {
      setActionLoading(false)
    }
  }

  // Filter tenants based on selected status
  const filteredTenants = overview?.tenants.filter(tenant => {
    if (statusFilter === 'all') return true
    // "active" filter shows all active subscriptions (active, expiring_soon, expiring_month)
    if (statusFilter === 'active') {
      return ['active', 'expiring_soon', 'expiring_month'].includes(tenant.subscription_status)
    }
    return tenant.subscription_status === statusFilter
  }) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Subscription Management</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage tenant subscriptions and feature limits
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="List View"
            >
              <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Add New Subscription Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Subscription</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Summary Cards - Clickable filters */}
      <SubscriptionStats
        overview={overview}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Tenant Subscriptions Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No tenants match the selected filter</p>
              <button
                onClick={() => setStatusFilter('all')}
                className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : (
            filteredTenants.map((tenant) => (
              <SubscriptionCard
                key={tenant.tenant_id}
                tenant={tenant}
                onEdit={handleEditSubscription}
                onViewLimits={handleViewLimits}
              />
            ))
          )}
        </div>
      ) : (
        <SubscriptionList
          tenants={filteredTenants}
          onEdit={handleEditSubscription}
          onViewLimits={handleViewLimits}
          onClearFilter={() => setStatusFilter('all')}
        />
      )}

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal
        isOpen={showEditModal}
        tenant={selectedTenant}
        form={editForm}
        onFormChange={setEditForm}
        onSave={saveSubscription}
        onClose={() => setShowEditModal(false)}
        loading={actionLoading}
        message={actionMessage}
      />

      {/* Feature Limits Modal */}
      <FeatureLimitsModal
        isOpen={showLimitsModal}
        tenant={selectedTenant}
        featureLimits={featureLimits}
        form={limitsForm}
        onFormChange={setLimitsForm}
        onSave={saveLimits}
        onReset={resetLimits}
        onClose={() => setShowLimitsModal(false)}
        loading={actionLoading}
        message={actionMessage}
      />

      {/* Add Subscription Modal */}
      <AddSubscriptionModal
        isOpen={showAddModal}
        form={addForm}
        overview={overview}
        onFormChange={setAddForm}
        onSave={saveNewSubscription}
        onClose={() => {
          setShowAddModal(false)
          setActionMessage(null)
        }}
        loading={actionLoading}
        message={actionMessage}
      />
    </div>
  )
}
