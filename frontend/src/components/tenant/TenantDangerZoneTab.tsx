import React, { useState } from 'react'
import { Trash2, Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import { superAdminService, type Tenant } from '@/services/superAdminService'

interface TenantDangerZoneTabProps {
  tenant: Tenant
  onDelete?: (tenant: Tenant) => void
  onClose: () => void
}

/**
 * TenantDangerZoneTab Component
 *
 * Danger zone tab content with delete tenant functionality.
 */
export const TenantDangerZoneTab: React.FC<TenantDangerZoneTabProps> = ({
  tenant,
  onDelete,
  onClose,
}) => {
  const [confirmName, setConfirmName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (): Promise<void> => {
    if (confirmName !== tenant.name) {
      setDeleteError('Tenant name does not match')
      return
    }

    setDeleteError(null)
    setIsDeleting(true)

    try {
      await superAdminService.deleteTenant(tenant.id)
      onDelete?.(tenant)
      onClose()
    } catch (err) {
      console.error('[TenantDangerZoneTab] Failed to delete tenant:', err)
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete tenant')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800 dark:text-red-300">
              Delete Tenant
            </h4>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              This action is irreversible. All tenant data including users, pets, and QR codes will be permanently deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Tenant Info */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Tenant Information
        </h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Tenant Name:</span>
            <span className="font-medium text-gray-900 dark:text-white">{tenant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Subdomain:</span>
            <span className="font-mono text-gray-900 dark:text-white">{tenant.subdomain}</span>
          </div>
        </div>
      </div>

      {/* Data to be Deleted */}
      <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
        <h5 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-3">
          Data to be Permanently Deleted
        </h5>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Admins:</span>
            <span className="font-medium text-gray-900 dark:text-white">{tenant.admin_count || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Users:</span>
            <span className="font-medium text-gray-900 dark:text-white">{(tenant.user_count || 0) - (tenant.admin_count || 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Pets:</span>
            <span className="font-medium text-gray-900 dark:text-white">{tenant.pet_count || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">QR Codes:</span>
            <span className="font-medium text-gray-900 dark:text-white">{tenant.qr_count || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Scan Logs:</span>
            <span className="font-medium text-gray-900 dark:text-white">{tenant.scan_count || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Database Schema</span>
          </div>
        </div>
      </div>

      {/* Delete Error */}
      {deleteError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">{deleteError}</p>
        </div>
      )}

      {/* Confirmation Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Type <span className="font-semibold text-red-600 dark:text-red-400">"{tenant.name}"</span> to confirm deletion
        </label>
        <input
          type="text"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          disabled={isDeleting}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={tenant.name}
        />
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting || confirmName !== tenant.name}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="w-5 h-5" />
            Delete Tenant Permanently
          </>
        )}
      </button>
    </div>
  )
}
