import React, { useState } from 'react'
import { X, AlertTriangle, Loader2, Building2 } from 'lucide-react'
import { superAdminService, type Tenant } from '@/services/superAdminService'

interface DeleteTenantModalProps {
  isOpen: boolean
  tenant: Tenant | null
  onClose: () => void
  onSuccess: () => void
}

/**
 * DeleteTenantModal Component
 *
 * Confirmation modal for deleting a tenant with safety checks.
 */
export const DeleteTenantModal: React.FC<DeleteTenantModalProps> = ({
  isOpen,
  tenant,
  onClose,
  onSuccess,
}) => {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!tenant) return

    if (confirmText !== tenant.subdomain) {
      setError('Subdomain does not match. Please type it exactly as shown.')
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      console.log('[DeleteTenantModal] Deleting tenant:', tenant.id)
      await superAdminService.deleteTenant(tenant.id)

      onSuccess()
      handleClose()
    } catch (err) {
      console.error('[DeleteTenantModal] Failed to delete tenant:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete tenant')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('')
      setError(null)
      onClose()
    }
  }

  if (!isOpen || !tenant) return null

  const isConfirmValid = confirmText === tenant.subdomain

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7" />
            Delete Tenant
          </h2>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning Box */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300 mb-2">
                  This action cannot be undone!
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Deleting this tenant will permanently remove:
                </p>
                <ul className="mt-2 text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
                  <li>All tenant users and their data</li>
                  <li>All pets registered under this tenant</li>
                  <li>All QR codes assigned to this tenant</li>
                  <li>The entire tenant database schema</li>
                  <li>All configuration and settings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tenant Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tenant to Delete
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Name:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{tenant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Subdomain:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{tenant.subdomain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tier:</span>
                <span className="font-semibold text-gray-900 dark:text-white capitalize">{tenant.tier}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Confirmation Input */}
          <div>
            <label
              htmlFor="confirmText"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Type <span className="font-mono font-bold text-gray-900 dark:text-white">{tenant.subdomain}</span> to confirm
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              placeholder={tenant.subdomain}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This confirms you understand the consequences of deleting this tenant.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmValid}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                Delete Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
