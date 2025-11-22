/**
 * Subscriptions Dashboard Component
 *
 * Provides comprehensive subscription management for Super Admins including:
 * - Option B: Subscription Overview
 * - Option C: Manual Subscription Actions
 * - Option D: Feature Limits Configuration
 */

import { useState, useEffect } from 'react'
import { Building2, CheckCircle, AlertCircle, Clock, AlertTriangle, Pencil, SlidersHorizontal, Grid3X3, List, Plus, XCircle } from 'lucide-react'
import { superAdminService, SubscriptionOverview, FeatureLimits } from '../services/superAdminService'

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

  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Add subscription form state
  const [addForm, setAddForm] = useState({
    tenant_id: 0,
    tier: 'standard' as 'standard' | 'enterprise',
    duration_days: 30
  })

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Filter state for subscription status
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadOverview()
  }, [])

  const loadOverview = async () => {
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

  const handleEditSubscription = (tenant: any) => {
    setSelectedTenant(tenant)
    setEditForm({
      tier: tenant.tier,
      extend_days: 30,
      is_active: tenant.is_active
    })
    setShowEditModal(true)
    setActionMessage(null)
  }

  const handleViewLimits = async (tenant: any) => {
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

  const saveSubscription = async () => {
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

  const saveLimits = async () => {
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

  const resetLimits = async () => {
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

  const handleOpenAddModal = () => {
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

  const saveNewSubscription = async () => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'expiring_soon': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'expiring_month': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'expired': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'expiring_soon': return 'Expiring Soon'
      case 'expiring_month': return 'Expiring This Month'
      case 'expired': return 'Expired'
      case 'no_subscription': return 'No Subscription'
      default: return status
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
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-2.5 sm:p-4 hover:shadow-lg transition-all text-left ${
            statusFilter === 'all'
              ? 'border-gray-400 dark:border-gray-500 shadow-md'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Tenants</p>
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{overview?.summary.total_tenants || 0}</p>
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-2.5 sm:p-4 hover:shadow-lg transition-all text-left ${
            statusFilter === 'active'
              ? 'border-emerald-400 dark:border-emerald-600 shadow-md'
              : 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Active</p>
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{overview?.summary.active_subscriptions || 0}</p>
        </button>
        <button
          onClick={() => setStatusFilter('expiring_soon')}
          className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-2.5 sm:p-4 hover:shadow-lg transition-all text-left ${
            statusFilter === 'expiring_soon'
              ? 'border-red-400 dark:border-red-600 shadow-md'
              : 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Exp. Soon</p>
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{overview?.summary.expiring_soon || 0}</p>
        </button>
        <button
          onClick={() => setStatusFilter('expiring_month')}
          className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-2.5 sm:p-4 hover:shadow-lg transition-all text-left ${
            statusFilter === 'expiring_month'
              ? 'border-yellow-400 dark:border-yellow-600 shadow-md'
              : 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Exp. Month</p>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{overview?.summary.expiring_month || 0}</p>
        </button>
        <button
          onClick={() => setStatusFilter('expired')}
          className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-2.5 sm:p-4 hover:shadow-lg transition-all text-left ${
            statusFilter === 'expired'
              ? 'border-gray-400 dark:border-gray-500 shadow-md'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Expired</p>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{overview?.summary.expired || 0}</p>
        </button>
        <button
          onClick={() => setStatusFilter('no_subscription')}
          className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-2.5 sm:p-4 hover:shadow-lg transition-all text-left ${
            statusFilter === 'no_subscription'
              ? 'border-gray-400 dark:border-gray-500 shadow-md'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No Sub</p>
            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{overview?.tenants.filter(t => t.subscription_status === 'no_subscription').length || 0}</p>
        </button>
      </div>

      {/* Tenant Subscriptions Grid/List */}
      {viewMode === 'grid' ? (
        // Grid View - no outer border, matches QR Factory grid style
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
              ) : filteredTenants.map((tenant) => (
            <div
              key={tenant.tenant_id}
              className={`group relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
                tenant.is_active
                  ? 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 opacity-75'
              }`}
            >
              {/* Card Content */}
              <div className="p-6">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{tenant.tenant_name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tenant.subdomain}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${tenant.tier === 'enterprise' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}`}>
                    {tenant.tier}
                  </span>
                </div>

                {/* Status & Days */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(tenant.subscription_status)}`}>
                    {getStatusLabel(tenant.subscription_status)}
                  </span>
                  {tenant.days_remaining !== null && (
                    <span className={`text-sm font-medium ${tenant.days_remaining <= 7 ? 'text-red-600 dark:text-red-400' : tenant.days_remaining <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {tenant.days_remaining}d remaining
                    </span>
                  )}
                </div>

                {/* Usage */}
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {tenant.pet_count} pets / {tenant.qr_count} QR / {tenant.user_count} users
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEditSubscription(tenant)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleViewLimits(tenant)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 text-sm font-medium"
                    title="Feature Limits"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View (Table on desktop, Cards on mobile) - matches QR Factory list style
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tenant</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tier</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Days</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Usage</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No tenants match the selected filter</p>
                      <button
                        onClick={() => setStatusFilter('all')}
                        className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Clear filter
                      </button>
                    </td>
                  </tr>
                ) : filteredTenants.map((tenant) => (
                  <tr key={tenant.tenant_id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!tenant.is_active ? 'bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{tenant.tenant_name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">{tenant.subdomain}</p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-xs font-medium ${tenant.tier === 'enterprise' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}`}>
                        {tenant.tier}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-xs font-medium whitespace-nowrap ${getStatusColor(tenant.subscription_status)}`}>
                        {getStatusLabel(tenant.subscription_status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      {tenant.days_remaining !== null ? (
                        <span className={`font-medium text-xs sm:text-sm ${tenant.days_remaining <= 7 ? 'text-red-600 dark:text-red-400' : tenant.days_remaining <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                          {tenant.days_remaining}d
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {tenant.pet_count} pets / {tenant.qr_count} QR / {tenant.user_count} users
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEditSubscription(tenant)}
                          className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          title="Edit Subscription"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewLimits(tenant)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Feature Limits"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View - List or Grid based on viewMode */}
          <div className="sm:hidden">
            {viewMode === 'list' ? (
              // Mobile List View
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTenants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No tenants match the selected filter</p>
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Clear filter
                    </button>
                  </div>
                ) : filteredTenants.map((tenant) => (
                  <div
                    key={tenant.tenant_id}
                    className={`p-3 ${!tenant.is_active ? 'bg-gray-50 dark:bg-gray-900/30' : ''}`}
                  >
                    {/* Header: Name and Tier */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{tenant.tenant_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tenant.subdomain}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0 ${tenant.tier === 'enterprise' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}`}>
                        {tenant.tier}
                      </span>
                    </div>

                    {/* Status and Days */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(tenant.subscription_status)}`}>
                        {getStatusLabel(tenant.subscription_status)}
                      </span>
                      {tenant.days_remaining !== null && (
                        <span className={`text-xs font-medium ${tenant.days_remaining <= 7 ? 'text-red-600 dark:text-red-400' : tenant.days_remaining <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {tenant.days_remaining}d left
                        </span>
                      )}
                    </div>

                    {/* Usage */}
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                      {tenant.pet_count} pets / {tenant.qr_count} QR / {tenant.user_count} users
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSubscription(tenant)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleViewLimits(tenant)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Limits
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Mobile Grid View
              <div className="p-3">
                <div className="grid grid-cols-1 gap-3">
                  {filteredTenants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No tenants match the selected filter</p>
                      <button
                        onClick={() => setStatusFilter('all')}
                        className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Clear filter
                      </button>
                    </div>
                  ) : filteredTenants.map((tenant) => (
                    <div
                      key={tenant.tenant_id}
                      className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl border p-3 transition-all ${
                        tenant.is_active
                          ? 'border-gray-200 dark:border-gray-600'
                          : 'border-gray-200 dark:border-gray-700 opacity-75'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{tenant.tenant_name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tenant.subdomain}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${tenant.tier === 'enterprise' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}`}>
                          {tenant.tier}
                        </span>
                      </div>

                      {/* Status & Days */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(tenant.subscription_status)}`}>
                          {getStatusLabel(tenant.subscription_status)}
                        </span>
                        {tenant.days_remaining !== null && (
                          <span className={`text-xs font-medium ${tenant.days_remaining <= 7 ? 'text-red-600 dark:text-red-400' : tenant.days_remaining <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            {tenant.days_remaining}d
                          </span>
                        )}
                      </div>

                      {/* Usage */}
                      <div className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                        {tenant.pet_count} pets / {tenant.qr_count} QR / {tenant.user_count} users
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => handleEditSubscription(tenant)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleViewLimits(tenant)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          Limits
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {showEditModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit Subscription - {selectedTenant.tenant_name}</h3>

            {actionMessage && (
              <div className={`mb-4 p-3 rounded-lg ${actionMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {actionMessage.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tier</label>
                <select
                  value={editForm.tier}
                  onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                  className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="standard">Standard</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extend Subscription</label>
                <select
                  value={editForm.extend_days}
                  onChange={(e) => setEditForm({ ...editForm, extend_days: parseInt(e.target.value) })}
                  className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={0}>No extension</option>
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>1 year</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px]"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={saveSubscription}
                disabled={actionLoading}
                className="px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Limits Modal */}
      {showLimitsModal && selectedTenant && featureLimits && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-lg my-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Feature Limits - {selectedTenant.tenant_name}</h3>

            {actionMessage && (
              <div className={`mb-4 p-3 rounded-lg ${actionMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {actionMessage.text}
              </div>
            )}

            {/* Current Usage */}
            <div className="mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Usage</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <div>Pets: {featureLimits.usage.pets} / {featureLimits.limits.max_pets} ({featureLimits.usage_percentage.pets}%)</div>
                <div>QR: {featureLimits.usage.qr_codes} / {featureLimits.limits.max_qr_codes} ({featureLimits.usage_percentage.qr_codes}%)</div>
                <div>Users: {featureLimits.usage.users} / {featureLimits.limits.max_users} ({featureLimits.usage_percentage.users}%)</div>
                <div>Storage: {featureLimits.usage.storage_mb} / {featureLimits.limits.max_storage_mb} MB</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Pets</label>
                  <input
                    type="number"
                    value={limitsForm.max_pets}
                    onChange={(e) => setLimitsForm({ ...limitsForm, max_pets: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max QR Codes</label>
                  <input
                    type="number"
                    value={limitsForm.max_qr_codes}
                    onChange={(e) => setLimitsForm({ ...limitsForm, max_qr_codes: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Users</label>
                  <input
                    type="number"
                    value={limitsForm.max_users}
                    onChange={(e) => setLimitsForm({ ...limitsForm, max_users: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Storage (MB)</label>
                  <input
                    type="number"
                    value={limitsForm.max_storage_mb}
                    onChange={(e) => setLimitsForm({ ...limitsForm, max_storage_mb: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features</label>
                <div className="space-y-2">
                  {Object.entries(limitsForm.features).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`feature_${key}`}
                        checked={value}
                        onChange={(e) => setLimitsForm({
                          ...limitsForm,
                          features: { ...limitsForm.features, [key]: e.target.checked }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`feature_${key}`} className="text-sm text-gray-700 dark:text-gray-300">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
              <button
                onClick={resetLimits}
                disabled={actionLoading}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 sm:py-1.5 rounded-lg transition-colors min-h-[44px] sm:min-h-0 order-last sm:order-first"
              >
                Reset to Defaults
              </button>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowLimitsModal(false)}
                  className="px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px]"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={saveLimits}
                  disabled={actionLoading}
                  className="px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[44px]"
                >
                  {actionLoading ? 'Saving...' : 'Save Limits'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-md my-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add New Subscription</h3>

            {actionMessage && (
              <div className={`mb-4 p-3 rounded-lg ${actionMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {actionMessage.text}
              </div>
            )}

            <div className="space-y-4">
              {/* Tenant Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Tenant <span className="text-red-500">*</span>
                </label>
                <select
                  value={addForm.tenant_id}
                  onChange={(e) => setAddForm({ ...addForm, tenant_id: parseInt(e.target.value) })}
                  className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={0}>-- Select a tenant --</option>
                  {overview?.tenants
                    .sort((a, b) => {
                      // Prioritize tenants without subscription
                      const aNoSub = a.subscription_status === 'no_subscription' || a.subscription_status === 'expired'
                      const bNoSub = b.subscription_status === 'no_subscription' || b.subscription_status === 'expired'
                      if (aNoSub && !bNoSub) return -1
                      if (!aNoSub && bNoSub) return 1
                      return a.tenant_name.localeCompare(b.tenant_name)
                    })
                    .map(tenant => (
                      <option key={tenant.tenant_id} value={tenant.tenant_id}>
                        {tenant.tenant_name}
                        {(tenant.subscription_status === 'no_subscription' || tenant.subscription_status === 'expired')
                          ? ' (No active subscription)'
                          : ` (${tenant.subscription_status})`}
                      </option>
                    ))}
                </select>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subscription Tier
                </label>
                <select
                  value={addForm.tier}
                  onChange={(e) => setAddForm({ ...addForm, tier: e.target.value as 'standard' | 'enterprise' })}
                  className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="standard">Standard</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {addForm.tier === 'enterprise'
                    ? 'Higher limits, advanced features, priority support'
                    : 'Basic features and standard limits'}
                </p>
              </div>

              {/* Duration Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <select
                  value={addForm.duration_days}
                  onChange={(e) => setAddForm({ ...addForm, duration_days: parseInt(e.target.value) })}
                  className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={7}>7 days (Trial)</option>
                  <option value={30}>30 days (1 month)</option>
                  <option value={90}>90 days (3 months)</option>
                  <option value={180}>180 days (6 months)</option>
                  <option value={365}>365 days (1 year)</option>
                </select>
              </div>

              {/* Summary */}
              {addForm.tenant_id > 0 && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    <strong>Summary:</strong> Creating {addForm.tier} subscription for {addForm.duration_days} days
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setActionMessage(null)
                }}
                className="px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px]"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={saveNewSubscription}
                disabled={actionLoading || addForm.tenant_id === 0}
                className="px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              >
                {actionLoading ? 'Creating...' : 'Create Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
