import React, { useState, useEffect } from 'react'
import { X, Building2, Loader2, AlertCircle, CheckCircle, User, AlertTriangle } from 'lucide-react'
import { superAdminService, type Tenant, type UpdateTenantRequest } from '@/services/superAdminService'
import { TenantDetailsTab } from '@/components/tenant/TenantDetailsTab'
import { TenantAdminsTab } from '@/components/tenant/TenantAdminsTab'
import { TenantDangerZoneTab } from '@/components/tenant/TenantDangerZoneTab'

interface EditTenantModalProps {
  isOpen: boolean
  tenant: Tenant | null
  onClose: () => void
  onSuccess: () => void
  onDelete?: (tenant: Tenant) => void
}

type TabType = 'details' | 'admins' | 'danger'

/**
 * EditTenantModal Component
 *
 * Modal for Super Admin to edit tenant details and manage tenant admins.
 * Organized into three tabs: Details, Admins, and Danger Zone.
 */
export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  tenant,
  onClose,
  onSuccess,
  onDelete,
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('details')

  // Tenant form state
  const [formData, setFormData] = useState<UpdateTenantRequest>({
    name: '',
    tier: 'standard',
    is_active: true,
    custom_domain: '',
    subscription_expires_at: null,
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Admin count for badge
  const [adminCount, setAdminCount] = useState(0)

  // Initialize form data when tenant changes
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        tier: tenant.tier,
        is_active: tenant.is_active,
        custom_domain: tenant.custom_domain || '',
        subscription_expires_at: tenant.subscription_expires_at || null,
      })
      setAdminCount(tenant.admin_count || 0)
    }
  }, [tenant])

  /**
   * Handles form submission to update tenant details.
   */
  const handleSubmit = async (): Promise<void> => {
    if (!tenant) return

    // Validation
    if (!formData.name?.trim()) {
      setError('Tenant name is required')
      return
    }

    setError(null)
    setIsUpdating(true)

    try {
      await superAdminService.updateTenant(tenant.id, formData)
      setSuccess(true)

      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('[EditTenantModal] Failed to update tenant:', err)
      setError(err instanceof Error ? err.message : 'Failed to update tenant')
      setIsUpdating(false)
    }
  }

  /**
   * Handles modal close with state cleanup.
   */
  const handleClose = (): void => {
    if (!isUpdating) {
      setError(null)
      setSuccess(false)
      setActiveTab('details')
      onClose()
    }
  }

  if (!isOpen || !tenant) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Edit Tenant
          </h2>
          <button
            onClick={handleClose}
            disabled={isUpdating}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4" />
              Tenant Details
            </div>
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'admins'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Admins
              {adminCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                  {adminCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'danger'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">
                  Tenant Updated Successfully!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Tab Content */}
          {!success && activeTab === 'details' && (
            <TenantDetailsTab
              tenant={tenant}
              formData={formData}
              setFormData={setFormData}
              isUpdating={isUpdating}
            />
          )}

          {!success && activeTab === 'admins' && (
            <TenantAdminsTab
              tenantId={tenant.id}
              setError={setError}
            />
          )}

          {!success && activeTab === 'danger' && (
            <TenantDangerZoneTab
              tenant={tenant}
              onDelete={onDelete}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Footer Actions */}
        {!success && activeTab === 'details' && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              disabled={isUpdating}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}

        {!success && (activeTab === 'admins' || activeTab === 'danger') && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              {activeTab === 'admins' ? 'Close' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
