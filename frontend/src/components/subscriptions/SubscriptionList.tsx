/**
 * Subscription List Component
 *
 * Displays tenant subscriptions in list/table view with responsive design
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

interface SubscriptionListProps {
  tenants: TenantSubscription[]
  onEdit: (tenant: TenantSubscription) => void
  onViewLimits: (tenant: TenantSubscription) => void
  onClearFilter: () => void
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

/**
 * Empty State Component
 */
function EmptyState({ onClearFilter }: { onClearFilter: () => void }) {
  return (
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      <p>No tenants match the selected filter</p>
      <button
        onClick={onClearFilter}
        className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        Clear filter
      </button>
    </div>
  )
}

export default function SubscriptionList({ tenants, onEdit, onViewLimits, onClearFilter }: SubscriptionListProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Tenant
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Tier
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Status
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Days
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">
                Usage
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState onClearFilter={onClearFilter} />
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <tr
                  key={tenant.tenant_id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !tenant.is_active ? 'bg-gray-50 dark:bg-gray-900/30' : ''
                  }`}
                >
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                        {tenant.tenant_name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">
                        {tenant.subdomain}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-xs font-medium ${
                      tenant.tier === 'enterprise'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    }`}>
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
                      <span className={`font-medium text-xs sm:text-sm ${
                        tenant.days_remaining <= 7
                          ? 'text-red-600 dark:text-red-400'
                          : tenant.days_remaining <= 30
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
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
                        onClick={() => onEdit(tenant)}
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Edit Subscription"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onViewLimits(tenant)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Feature Limits"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Compact List */}
      <div className="sm:hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tenants.length === 0 ? (
            <EmptyState onClearFilter={onClearFilter} />
          ) : (
            tenants.map((tenant) => (
              <div
                key={tenant.tenant_id}
                className={`p-3 ${!tenant.is_active ? 'bg-gray-50 dark:bg-gray-900/30' : ''}`}
              >
                {/* Header: Name and Tier */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {tenant.tenant_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tenant.subdomain}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0 ${
                    tenant.tier === 'enterprise'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}>
                    {tenant.tier}
                  </span>
                </div>

                {/* Status and Days */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(tenant.subscription_status)}`}>
                    {getStatusLabel(tenant.subscription_status)}
                  </span>
                  {tenant.days_remaining !== null && (
                    <span className={`text-xs font-medium ${
                      tenant.days_remaining <= 7
                        ? 'text-red-600 dark:text-red-400'
                        : tenant.days_remaining <= 30
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
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
                    onClick={() => onEdit(tenant)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => onViewLimits(tenant)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Limits
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
