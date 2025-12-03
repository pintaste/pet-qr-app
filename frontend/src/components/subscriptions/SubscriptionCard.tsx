/**
 * Subscription Card Component
 *
 * Displays individual tenant subscription information in grid view
 */

import { Pencil, SlidersHorizontal } from 'lucide-react'

interface TenantSubscription {
  tenant_id: number
  tenant_name: string
  subdomain: string
  tier: string
  subscription_status: string
  days_remaining: number | null
  is_active: boolean
  pet_count: number
  qr_count: number
  user_count: number
}

interface SubscriptionCardProps {
  tenant: TenantSubscription
  onEdit: (tenant: TenantSubscription) => void
  onViewLimits: (tenant: TenantSubscription) => void
}

/**
 * Gets the color classes for a subscription status
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    case 'expiring_soon': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    case 'expiring_month': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
    case 'expired': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
  }
}

/**
 * Gets the display label for a subscription status
 */
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return 'Active'
    case 'expiring_soon': return 'Expiring Soon'
    case 'expiring_month': return 'Expiring This Month'
    case 'expired': return 'Expired'
    case 'no_subscription': return 'No Subscription'
    default: return status
  }
}

export default function SubscriptionCard({ tenant, onEdit, onViewLimits }: SubscriptionCardProps) {
  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
        tenant.is_active
          ? 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 opacity-75'
      }`}
    >
      <div className="p-6">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{tenant.tenant_name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{tenant.subdomain}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
            tenant.tier === 'enterprise'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
          }`}>
            {tenant.tier}
          </span>
        </div>

        {/* Status & Days */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(tenant.subscription_status)}`}>
            {getStatusLabel(tenant.subscription_status)}
          </span>
          {tenant.days_remaining !== null && (
            <span className={`text-sm font-medium ${
              tenant.days_remaining <= 7
                ? 'text-red-600 dark:text-red-400'
                : tenant.days_remaining <= 30
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
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
            onClick={() => onEdit(tenant)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onViewLimits(tenant)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 text-sm font-medium"
            title="Feature Limits"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
