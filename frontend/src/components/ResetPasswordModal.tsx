import React, { useState } from 'react'
import { X, Key, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, User } from 'lucide-react'
import { superAdminService, type PlatformUser } from '@/services/superAdminService'

interface ResetPasswordModalProps {
  isOpen: boolean
  user: PlatformUser | null
  onClose: () => void
  onSuccess: () => void
}

/**
 * ResetPasswordModal Component
 *
 * Modal for Super Admin to reset a user's password.
 */
export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!user) return

    // Validation
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // Only check confirmation if password is hidden
    if (!showPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError(null)
    setIsResetting(true)

    try {
      console.log('[ResetPasswordModal] Resetting password for user:', user.id)
      await superAdminService.resetUserPassword(user.id, newPassword)

      setSuccess(true)

      // Show success message briefly, then close
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('[ResetPasswordModal] Failed to reset password:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset password')
      setIsResetting(false)
    }
  }

  const handleClose = () => {
    if (!isResetting) {
      setNewPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isResetting && !success) {
      handleSubmit()
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Key className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            Reset Password
          </h2>
          <button
            onClick={handleClose}
            disabled={isResetting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">
                  Password Reset Successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  The user can now log in with the new password.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!success && (
            <>
              {/* User Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Resetting password for:
                    </span>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isResetting}
                    className="w-full px-4 py-2.5 pr-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isResetting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password - only show when password is hidden */}
              {!showPassword && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isResetting}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Re-enter password"
                    minLength={8}
                  />
                </div>
              )}

              {/* Info Box */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> The user will need to use this new password to log in. Consider notifying them of the change.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!success && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              disabled={isResetting}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isResetting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Reset Password
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
