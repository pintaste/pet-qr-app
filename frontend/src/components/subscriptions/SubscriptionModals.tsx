/**
 * Subscription Modal Components
 *
 * Contains all modal dialogs for subscription management:
 * - Edit Subscription Modal
 * - Feature Limits Modal
 * - Add Subscription Modal
 */

import { FeatureLimits, SubscriptionOverview } from '../../services/superAdminService'

interface EditSubscriptionModalProps {
  isOpen: boolean
  tenant: any
  form: {
    tier: string
    extend_days: number
    is_active: boolean
  }
  onFormChange: (form: any) => void
  onSave: () => void
  onClose: () => void
  loading: boolean
  message: { type: 'success' | 'error', text: string } | null
}

interface FeatureLimitsModalProps {
  isOpen: boolean
  tenant: any
  featureLimits: FeatureLimits | null
  form: {
    max_pets: number
    max_qr_codes: number
    max_users: number
    max_storage_mb: number
    features: {
      analytics: boolean
      export: boolean
      custom_domain: boolean
      api_access: boolean
    }
  }
  onFormChange: (form: any) => void
  onSave: () => void
  onReset: () => void
  onClose: () => void
  loading: boolean
  message: { type: 'success' | 'error', text: string } | null
}

interface AddSubscriptionModalProps {
  isOpen: boolean
  form: {
    tenant_id: number
    tier: 'standard' | 'enterprise'
    duration_days: number
  }
  overview: SubscriptionOverview | null
  onFormChange: (form: any) => void
  onSave: () => void
  onClose: () => void
  loading: boolean
  message: { type: 'success' | 'error', text: string } | null
}

/**
 * Edit Subscription Modal
 */
export function EditSubscriptionModal({
  isOpen,
  tenant,
  form,
  onFormChange,
  onSave,
  onClose,
  loading,
  message
}: EditSubscriptionModalProps) {
  if (!isOpen || !tenant) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Edit Subscription - {tenant.tenant_name}
        </h3>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tier</label>
            <select
              value={form.tier}
              onChange={(e) => onFormChange({ ...form, tier: e.target.value })}
              className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="standard">Standard</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Extend Subscription
            </label>
            <select
              value={form.extend_days}
              onChange={(e) => onFormChange({ ...form, extend_days: parseInt(e.target.value) })}
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
              checked={form.is_active}
              onChange={(e) => onFormChange({ ...form, is_active: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px]"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[44px]"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Feature Limits Modal
 */
export function FeatureLimitsModal({
  isOpen,
  tenant,
  featureLimits,
  form,
  onFormChange,
  onSave,
  onReset,
  onClose,
  loading,
  message
}: FeatureLimitsModalProps) {
  if (!isOpen || !tenant || !featureLimits) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-lg my-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Feature Limits - {tenant.tenant_name}
        </h3>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {message.text}
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
                value={form.max_pets}
                onChange={(e) => onFormChange({ ...form, max_pets: parseInt(e.target.value) })}
                className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max QR Codes</label>
              <input
                type="number"
                value={form.max_qr_codes}
                onChange={(e) => onFormChange({ ...form, max_qr_codes: parseInt(e.target.value) })}
                className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Users</label>
              <input
                type="number"
                value={form.max_users}
                onChange={(e) => onFormChange({ ...form, max_users: parseInt(e.target.value) })}
                className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Storage (MB)</label>
              <input
                type="number"
                value={form.max_storage_mb}
                onChange={(e) => onFormChange({ ...form, max_storage_mb: parseInt(e.target.value) })}
                className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features</label>
            <div className="space-y-2">
              {Object.entries(form.features).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`feature_${key}`}
                    checked={value}
                    onChange={(e) => onFormChange({
                      ...form,
                      features: { ...form.features, [key]: e.target.checked }
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
            onClick={onReset}
            disabled={loading}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 sm:py-1.5 rounded-lg transition-colors min-h-[44px] sm:min-h-0 order-last sm:order-first"
          >
            Reset to Defaults
          </button>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px]"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={loading}
              className="px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              {loading ? 'Saving...' : 'Save Limits'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Add Subscription Modal
 */
export function AddSubscriptionModal({
  isOpen,
  form,
  overview,
  onFormChange,
  onSave,
  onClose,
  loading,
  message
}: AddSubscriptionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-md my-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add New Subscription</h3>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Tenant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Tenant <span className="text-red-500">*</span>
            </label>
            <select
              value={form.tenant_id}
              onChange={(e) => onFormChange({ ...form, tenant_id: parseInt(e.target.value) })}
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
              value={form.tier}
              onChange={(e) => onFormChange({ ...form, tier: e.target.value as 'standard' | 'enterprise' })}
              className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="standard">Standard</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {form.tier === 'enterprise'
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
              value={form.duration_days}
              onChange={(e) => onFormChange({ ...form, duration_days: parseInt(e.target.value) })}
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
          {form.tenant_id > 0 && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                <strong>Summary:</strong> Creating {form.tier} subscription for {form.duration_days} days
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px]"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading || form.tenant_id === 0}
            className="px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {loading ? 'Creating...' : 'Create Subscription'}
          </button>
        </div>
      </div>
    </div>
  )
}
