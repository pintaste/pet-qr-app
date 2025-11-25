import React from 'react'
import { Calendar } from 'lucide-react'
import type { Tenant, UpdateTenantRequest } from '@/services/superAdminService'

interface TenantDetailsTabProps {
  tenant: Tenant
  formData: UpdateTenantRequest
  setFormData: React.Dispatch<React.SetStateAction<UpdateTenantRequest>>
  isUpdating: boolean
}

/**
 * TenantDetailsTab Component
 *
 * Form for editing tenant basic information, tier, subscription, and settings.
 */
export const TenantDetailsTab: React.FC<TenantDetailsTabProps> = ({
  tenant,
  formData,
  setFormData,
  isUpdating,
}) => {
  return (
    <div className="space-y-4">
      {/* Subdomain (Read-Only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Subdomain
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tenant.subdomain}
            disabled
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 font-mono cursor-not-allowed"
          />
          <span className="text-gray-500 dark:text-gray-400 text-sm">.petqr.com</span>
        </div>
      </div>

      {/* Tenant Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Tenant Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isUpdating}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., Demo Pet Store"
        />
      </div>

      {/* Tier */}
      <div>
        <label
          htmlFor="tier"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Subscription Tier
        </label>
        <select
          id="tier"
          value={formData.tier}
          onChange={(e) => setFormData({ ...formData, tier: e.target.value as 'standard' | 'enterprise' })}
          disabled={isUpdating}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="standard">Standard</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formData.tier === 'enterprise' ? 'Unlimited pets, priority support' : 'Up to 100 pets per tenant'}
        </p>
      </div>

      {/* Subscription Expiration */}
      <div>
        <label
          htmlFor="subscription_expires_at"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Subscription Expiration
          </div>
        </label>
        <input
          id="subscription_expires_at"
          type="date"
          value={formData.subscription_expires_at ? new Date(formData.subscription_expires_at).toISOString().split('T')[0] : ''}
          onChange={(e) => setFormData({
            ...formData,
            subscription_expires_at: e.target.value ? new Date(e.target.value).toISOString() : null
          })}
          disabled={isUpdating}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Leave empty for no expiration
        </p>
      </div>

      {/* Custom Domain */}
      <div>
        <label
          htmlFor="custom_domain"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Custom Domain (Optional)
        </label>
        <input
          id="custom_domain"
          type="text"
          value={formData.custom_domain || ''}
          onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
          disabled={isUpdating}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., pets.yourcompany.com"
        />
      </div>

      {/* Active Status */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            disabled={isUpdating}
            className="w-5 h-5 text-emerald-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Tenant
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Inactive tenants cannot access the platform
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}
