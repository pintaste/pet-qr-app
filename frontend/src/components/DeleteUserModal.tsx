import React, { useState } from 'react'
import { X, AlertTriangle, Loader2, User, Shield, ShieldCheck } from 'lucide-react'
import { superAdminService, type PlatformUser } from '@/services/superAdminService'

interface DeleteUserModalProps {
  isOpen: boolean
  user: PlatformUser | null
  onClose: () => void
  onSuccess: () => void
}

/**
 * DeleteUserModal Component
 *
 * Confirmation modal for deleting a user with safety checks.
 */
export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!user) return

    if (confirmText !== user.email) {
      setError('Email does not match. Please type it exactly as shown.')
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      console.log('[DeleteUserModal] Deleting user:', user.id)
      await superAdminService.deleteUser(user.id)

      onSuccess()
      handleClose()
    } catch (err) {
      console.error('[DeleteUserModal] Failed to delete user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
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

  if (!isOpen || !user) return null

  const isConfirmValid = confirmText === user.email

  // Role display
  const roleConfig = {
    super_admin: { icon: ShieldCheck, label: 'Super Admin', color: 'text-purple-600 dark:text-purple-400' },
    tenant_admin: { icon: Shield, label: 'Tenant Admin', color: 'text-blue-600 dark:text-blue-400' },
    user: { icon: User, label: 'User', color: 'text-gray-600 dark:text-gray-400' },
  }
  const role = roleConfig[user.role] || roleConfig.user
  const RoleIcon = role.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7" />
            Delete User
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
                  Deleting this user will permanently remove:
                </p>
                <ul className="mt-2 text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
                  <li>User account and login credentials</li>
                  <li>All user activity history</li>
                  <li>Associated pet registrations (if any)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                User to Delete
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]" title={user.email}>
                  {user.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Role:</span>
                <span className={`flex items-center gap-1 font-semibold ${role.color}`}>
                  <RoleIcon className="w-4 h-4" />
                  {role.label}
                </span>
              </div>
              {user.tenant_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tenant:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{user.tenant_name}</span>
                </div>
              )}
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
              Type <span className="font-mono font-bold text-gray-900 dark:text-white break-all">{user.email}</span> to confirm
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={user.email}
              autoFocus
            />
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
