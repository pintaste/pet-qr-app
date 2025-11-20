import React, { useState, useEffect } from 'react'
import { X, Building2, Globe, Calendar, CheckCircle, XCircle, Users, Loader2, Clock, AlertTriangle, Crown, Star } from 'lucide-react'
import { superAdminService, type Tenant } from '@/services/superAdminService'

interface ViewTenantModalProps {
  isOpen: boolean
  tenant: Tenant | null
  onClose: () => void
  onEdit?: (tenant: Tenant) => void
}

/**
 * ViewTenantModal Component
 *
 * Modal for viewing detailed tenant information.
 */
export const ViewTenantModal: React.FC<ViewTenantModalProps> = ({
  isOpen,
  tenant: initialTenant,
  onClose,
  onEdit,
}) => {
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch full tenant details when modal opens
  useEffect(() => {
    if (isOpen && initialTenant) {
      fetchTenantDetails()
    }
  }, [isOpen, initialTenant])

  const fetchTenantDetails = async () => {
    if (!initialTenant) return

    try {
      setIsLoading(true)
      const details = await superAdminService.getTenant(initialTenant.id)
      setTenant(details)
    } catch (err) {
      console.error('[ViewTenantModal] Failed to fetch tenant details:', err)
      setTenant(initialTenant)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !tenant) return null

  const createdDate = new Date(tenant.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const tierColors = {
    standard: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  }

  const tierColor = tierColors[tenant.tier] || tierColors.standard

  // Format expiration date and check if expired/expiring soon
  const expirationDate = tenant.subscription_expires_at
    ? new Date(tenant.subscription_expires_at)
    : null
  const formattedExpiration = expirationDate?.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const now = new Date()
  const isExpired = expirationDate && expirationDate < now
  const isExpiringSoon = expirationDate && !isExpired &&
    (expirationDate.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000 // 30 days

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              tenant.is_active
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <Building2 className={`w-6 h-6 ${
                tenant.is_active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tenant.name}
              </h2>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${tierColor} mt-1`}>
                {tenant.tier.charAt(0).toUpperCase() + tenant.tier.slice(1)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subscription */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Subscription
                </h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3">
                  {/* Plan Type */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {tenant.tier === 'enterprise' ? (
                        <Crown className="w-5 h-5 text-purple-500" />
                      ) : (
                        <Star className="w-5 h-5 text-blue-500" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {tenant.tier === 'enterprise' ? 'Enterprise Plan' : 'Standard Plan'}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${tierColor}`}>
                      {tenant.tier.charAt(0).toUpperCase() + tenant.tier.slice(1)}
                    </span>
                  </div>

                  {/* Expiration */}
                  <div className={`flex items-center gap-2 text-sm ${
                    isExpired
                      ? 'text-red-600 dark:text-red-400'
                      : isExpiringSoon
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {isExpired ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>
                      {expirationDate ? (
                        isExpired ? (
                          <>Expired on {formattedExpiration}</>
                        ) : (
                          <>Expires {formattedExpiration}</>
                        )
                      ) : (
                        'No expiration date set'
                      )}
                    </span>
                  </div>

                  {/* User Count */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{tenant.user_count || 0} {(tenant.user_count || 0) === 1 ? 'user' : 'users'}</span>
                    <span className="text-gray-400">•</span>
                    <span>{tenant.tier === 'enterprise' ? 'Unlimited pets' : 'Up to 100 pets'}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Status
                </h3>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  tenant.is_active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                }`}>
                  {tenant.is_active ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span>Inactive</span>
                    </>
                  )}
                </div>
              </div>

              {/* Domain Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Domain Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subdomain</div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {tenant.subdomain}.petqr.com
                      </div>
                    </div>
                  </div>

                  {tenant.custom_domain && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Custom Domain</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {tenant.custom_domain}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Metadata
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div className="text-xs text-gray-500 dark:text-gray-400">Tenant ID</div>
                    </div>
                    <div className="font-mono font-semibold text-gray-900 dark:text-white">
                      #{tenant.id}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div className="text-xs text-gray-500 dark:text-gray-400">Created</div>
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {createdDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Tenant Administrators
                </h3>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                        Manage Tenant Admins
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Each tenant should have at least one Tenant Admin who can access the Tenant Admin Dashboard.
                      </p>
                      <button className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                        View Tenant Admins →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => {
                onClose()
                onEdit(tenant)
              }}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Edit Tenant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
