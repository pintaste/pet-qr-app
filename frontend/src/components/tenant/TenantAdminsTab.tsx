import React, { useState, useEffect } from 'react'
import { Plus, Loader2, CheckCircle, Key, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { superAdminService, type PlatformUser } from '@/services/superAdminService'

interface TenantAdminsTabProps {
  tenantId: number
  setError: (error: string | null) => void
}

/**
 * Generates a strong random password.
 *
 * @returns A 12-character password with uppercase, lowercase, numbers, and symbols
 */
const generateStrongPassword = (): string => {
  const length = 12
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + symbols

  let password = ''
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * TenantAdminsTab Component
 *
 * Manages tenant administrators: list, add, reset password, toggle status, delete.
 */
export const TenantAdminsTab: React.FC<TenantAdminsTabProps> = ({
  tenantId,
  setError,
}) => {
  // Admin list state
  const [admins, setAdmins] = useState<PlatformUser[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null)

  // Add admin state
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [confirmNewAdminPassword, setConfirmNewAdminPassword] = useState('')
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Password reset state
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)

  // Fetch admins on mount and when tenantId changes
  useEffect(() => {
    fetchAdmins(tenantId)
  }, [tenantId])

  /**
   * Fetches the list of admins for the given tenant.
   */
  const fetchAdmins = async (id: number): Promise<void> => {
    setIsLoadingAdmins(true)
    try {
      const adminList = await superAdminService.listAllUsers({
        tenant_id: id,
        role: 'tenant_admin'
      })
      setAdmins(adminList)
    } catch (err) {
      console.error('[TenantAdminsTab] Failed to fetch tenant admins:', err)
      setAdmins([])
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  /**
   * Handles adding a new admin.
   */
  const handleAddAdmin = async (): Promise<void> => {
    if (!newAdminEmail.trim()) {
      setError('Admin email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdminEmail)) {
      setError('Invalid email format')
      return
    }

    if (!newAdminPassword.trim() || newAdminPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Check password confirmation when password is hidden
    if (!showNewPassword && newAdminPassword !== confirmNewAdminPassword) {
      setError('Passwords do not match')
      return
    }

    setError(null)
    setIsAddingAdmin(true)

    try {
      const emailCreated = newAdminEmail
      await superAdminService.createUser({
        email: newAdminEmail,
        password: newAdminPassword,
        role: 'tenant_admin',
        tenant_id: tenantId,
      })

      // Refresh admin list
      await fetchAdmins(tenantId)

      // Reset form
      setNewAdminEmail('')
      setNewAdminPassword('')
      setConfirmNewAdminPassword('')
      setShowAddAdmin(false)
      setShowNewPassword(false)
      setError(null)
      setAdminActionSuccess(`Admin "${emailCreated}" created successfully`)
      setTimeout(() => setAdminActionSuccess(null), 3000)
    } catch (err) {
      console.error('[TenantAdminsTab] Failed to create admin:', err)
      setError(err instanceof Error ? err.message : 'Failed to create admin')
      setAdminActionSuccess(null)
    } finally {
      setIsAddingAdmin(false)
    }
  }

  /**
   * Toggles an admin's active status.
   */
  const handleToggleAdminStatus = async (admin: PlatformUser): Promise<void> => {
    try {
      await superAdminService.updateUser(admin.id, {
        is_active: !admin.is_active
      })
      setAdmins(admins.map(a =>
        a.id === admin.id ? { ...a, is_active: !a.is_active } : a
      ))
    } catch (err) {
      console.error('[TenantAdminsTab] Failed to toggle admin status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update admin status')
    }
  }

  /**
   * Resets an admin's password.
   */
  const handleResetPassword = async (userId: number): Promise<void> => {
    if (!newPassword.trim() || newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      const admin = admins.find(a => a.id === userId)
      await superAdminService.resetUserPassword(userId, newPassword)
      setResetPasswordUserId(null)
      setNewPassword('')
      setShowResetPassword(false)
      setError(null)
      setAdminActionSuccess(`Password reset successfully for ${admin?.email || 'user'}`)
      setTimeout(() => setAdminActionSuccess(null), 3000)
    } catch (err) {
      console.error('[TenantAdminsTab] Failed to reset password:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset password')
      setAdminActionSuccess(null)
    }
  }

  /**
   * Deletes an admin after confirmation.
   */
  const handleDeleteAdmin = async (admin: PlatformUser): Promise<void> => {
    if (!confirm(`Are you sure you want to delete admin "${admin.email}"?`)) {
      return
    }

    try {
      await superAdminService.deleteUser(admin.id)
      setAdmins(admins.filter(a => a.id !== admin.id))
    } catch (err) {
      console.error('[TenantAdminsTab] Failed to delete admin:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete admin')
    }
  }

  /**
   * Generates and sets a strong password for new admin creation.
   */
  const handleGenerateStrongPassword = (): void => {
    const password = generateStrongPassword()
    setNewAdminPassword(password)
    setConfirmNewAdminPassword(password)
    setShowNewPassword(true) // Show password so user can see it
  }

  /**
   * Generates and sets a strong password for password reset.
   */
  const handleGenerateResetPassword = (): void => {
    const password = generateStrongPassword()
    setNewPassword(password)
    setShowResetPassword(true)
  }

  return (
    <div className="space-y-4">
      {/* Success Message for Admin Actions */}
      {adminActionSuccess && (
        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-300">{adminActionSuccess}</p>
        </div>
      )}

      {/* Admin List */}
      {isLoadingAdmins ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : admins.length > 0 ? (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {admin.email}
                  </p>
                  <p className={`text-xs ${admin.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleAdminStatus(admin)}
                    className={`p-1.5 rounded transition-colors ${
                      admin.is_active
                        ? 'hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        : 'hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400'
                    }`}
                    title={admin.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {admin.is_active ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setResetPasswordUserId(resetPasswordUserId === admin.id ? null : admin.id)}
                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
                    title="Reset Password"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAdmin(admin)}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                    title="Delete Admin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Password Reset Form */}
              {resetPasswordUserId === admin.id && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full px-3 py-1.5 pr-16 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-500 rounded transition-colors"
                          title={showResetPassword ? 'Hide password' : 'Show password'}
                        >
                          {showResetPassword ? (
                            <EyeOff className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateResetPassword}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
                          title="Generate strong password"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResetPassword(admin.id)}
                      className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No admins found for this tenant
        </p>
      )}

      {/* Add New Admin */}
      {!showAddAdmin ? (
        <button
          onClick={() => setShowAddAdmin(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Admin
        </button>
      ) : (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">
            Create New Admin
          </h4>
          <div className="space-y-3">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="Email address"
              disabled={isAddingAdmin}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                disabled={isAddingAdmin}
                className="w-full px-3 py-2 pr-20 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewPassword(!showNewPassword)
                    // Clear confirm password when showing password (no longer needed)
                    if (!showNewPassword) {
                      setConfirmNewAdminPassword('')
                    }
                  }}
                  disabled={isAddingAdmin}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateStrongPassword}
                  disabled={isAddingAdmin}
                  className="p-1 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50"
                  title="Generate strong password"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Confirm Password - only shown when password is hidden */}
            {!showNewPassword && newAdminPassword && (
              <div>
                <input
                  type="password"
                  value={confirmNewAdminPassword}
                  onChange={(e) => setConfirmNewAdminPassword(e.target.value)}
                  placeholder="Confirm password"
                  disabled={isAddingAdmin}
                  className={`w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50 ${
                    confirmNewAdminPassword && confirmNewAdminPassword !== newAdminPassword
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {confirmNewAdminPassword && confirmNewAdminPassword !== newAdminPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    Passwords do not match
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddAdmin(false)
                  setNewAdminEmail('')
                  setNewAdminPassword('')
                  setConfirmNewAdminPassword('')
                  setShowNewPassword(false)
                }}
                disabled={isAddingAdmin}
                className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={isAddingAdmin}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isAddingAdmin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
