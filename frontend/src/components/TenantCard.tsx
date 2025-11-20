import React from 'react'
import { Building2, Calendar, Trash2, Globe, CheckCircle, XCircle, Crown, Star, Clock, AlertTriangle, LogIn, Settings, Users } from 'lucide-react'
import type { Tenant } from '@/services/superAdminService'

interface TenantCardProps {
  tenant: Tenant
  onEdit?: (tenant: Tenant) => void
  onDelete?: (tenant: Tenant) => void
  onImpersonate?: (tenant: Tenant) => void
  onClick?: (tenant: Tenant) => void
}

/**
 * TenantCard Component
 *
 * Displays a tenant in a card format with status, tier, and action buttons.
 */
export const TenantCard: React.FC<TenantCardProps> = ({
  tenant,
  onEdit,
  onDelete,
  onImpersonate,
  onClick,
}) => {
  // Format created date
  const createdDate = new Date(tenant.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Format expiration date and check if expired/expiring soon
  const expirationDate = tenant.subscription_expires_at
    ? new Date(tenant.subscription_expires_at)
    : null
  const formattedExpiration = expirationDate?.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const now = new Date()
  const isExpired = expirationDate && expirationDate < now
  const isExpiringSoon = expirationDate && !isExpired &&
    (expirationDate.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000 // 30 days

  // Tier badge color
  const tierColors = {
    standard: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  }

  const tierColor = tierColors[tenant.tier] || tierColors.standard

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
        tenant.is_active
          ? 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 opacity-75'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(tenant)}
    >
      {/* Card Content */}
      <div className="p-6">
        {/* Header with Building Icon and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${
                tenant.is_active
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Building2
                className={`w-6 h-6 ${
                  tenant.is_active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {tenant.name}
              </h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${tierColor} mt-1`}>
                {tenant.tier.charAt(0).toUpperCase() + tenant.tier.slice(1)}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            tenant.is_active
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
          }`}>
            {tenant.is_active ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Active</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Inactive</span>
              </>
            )}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {tenant.tier === 'enterprise' ? (
                <Crown className="w-4 h-4 text-purple-500" />
              ) : (
                <Star className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {tenant.tier === 'enterprise' ? 'Enterprise Plan' : 'Standard Plan'}
              </span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {tenant.user_count || 0} {(tenant.user_count || 0) === 1 ? 'user' : 'users'}
              </span>
              <span className="text-gray-400 mx-1">•</span>
              <span className="text-gray-600 dark:text-gray-400">
                {tenant.tier === 'enterprise' ? 'Unlimited pets' : 'Up to 100 pets'}
              </span>
            </div>
            {/* Expiration Date */}
            <div className={`flex items-center gap-1.5 ${
              isExpired
                ? 'text-red-600 dark:text-red-400'
                : isExpiringSoon
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-600 dark:text-gray-400'
            }`}>
              {isExpired ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>
                {expirationDate ? (
                  isExpired ? (
                    `Expired ${formattedExpiration}`
                  ) : (
                    `Expires ${formattedExpiration}`
                  )
                ) : (
                  'No expiration set'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Tenant Details */}
        <div className="space-y-2 mb-4">
          {/* Subdomain */}
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Subdomain:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {tenant.subdomain}
            </span>
          </div>

          {/* Custom Domain */}
          {tenant.custom_domain && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Custom Domain:</span>
              <span className="text-gray-700 dark:text-gray-300">{tenant.custom_domain}</span>
            </div>
          )}

          {/* Created Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Created:</span>
            <span className="text-gray-700 dark:text-gray-300">{createdDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onImpersonate && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onImpersonate(tenant)
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              title="Impersonate Tenant Admin"
            >
              <LogIn className="w-4 h-4" />
              Impersonate
            </button>
          )}

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(tenant)
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors duration-200 text-sm font-medium"
              title="Edit Tenant"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(tenant)
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors duration-200 text-sm font-medium"
              title="Delete Tenant"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * NoTenantsCard Component
 *
 * Empty state card shown when no tenants exist.
 */
export const NoTenantsCard: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <Building2 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No Tenants Yet
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
        You haven't created any tenants yet. Create your first tenant to start managing the platform.
      </p>
      {onCreate && (
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors duration-200"
        >
          <Building2 className="w-5 h-5" />
          Create Tenant
        </button>
      )}
    </div>
  )
}

/**
 * TenantCardSkeleton Component
 *
 * Loading skeleton for tenant cards.
 */
export const TenantCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  )
}
