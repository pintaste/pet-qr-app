/**
 * ImpersonateTenantModal Component
 *
 * Modal for selecting a tenant admin to impersonate.
 */

import React from 'react'
import {
  UserCog,
  Users,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { PlatformUser, Tenant } from '@/services/superAdminService'

interface ImpersonateTenantModalProps {
  isOpen: boolean
  tenant: Tenant | null
  tenantAdmins: PlatformUser[]
  isLoadingAdmins: boolean
  isImpersonating: boolean
  impersonateError: string | null
  onClose: () => void
  onConfirm: (userId: number) => void
}

/**
 * Modal component for selecting tenant admin to impersonate
 */
export const ImpersonateTenantModal: React.FC<ImpersonateTenantModalProps> = ({
  isOpen,
  tenant,
  tenantAdmins,
  isLoadingAdmins,
  isImpersonating,
  impersonateError,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !tenant) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UserCog className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            Impersonate
          </h2>
          <button
            onClick={onClose}
            disabled={isImpersonating}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {impersonateError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{impersonateError}</p>
            </div>
          )}

          <div className="text-center mb-4">
            <p className="text-gray-700 dark:text-gray-300">
              Select a tenant admin to impersonate for <span className="font-bold">{tenant.name}</span>
            </p>
          </div>

          {isLoadingAdmins ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
          ) : tenantAdmins.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No tenant admins found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Create a tenant admin first to impersonate
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tenantAdmins.map((admin) => (
                <button
                  key={admin.id}
                  onClick={() => onConfirm(admin.id)}
                  disabled={isImpersonating}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-2 border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-700 rounded-lg transition-all disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{admin.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tenant Admin</p>
                  </div>
                  {isImpersonating && (
                    <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isImpersonating}
            className="w-full px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImpersonateTenantModal
