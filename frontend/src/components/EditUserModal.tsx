import React, { useState, useEffect } from 'react'
import { X, User, Loader2, AlertCircle, CheckCircle, AlertTriangle, Trash2, Key, Eye, EyeOff, RefreshCw, Shield } from 'lucide-react'
import { superAdminService, type PlatformUser, type UpdateUserRequest, type Tenant } from '@/services/superAdminService'

interface EditUserModalProps {
  isOpen: boolean
  user: PlatformUser | null
  onClose: () => void
  onSuccess: () => void
  onDelete?: (user: PlatformUser) => void
}

type TabType = 'details' | 'security' | 'danger'

/**
 * DangerZoneTab Component for User deletion
 */
const UserDangerZoneTab: React.FC<{
  user: PlatformUser
  onDelete?: (user: PlatformUser) => void
  onClose: () => void
}> = ({ user, onDelete, onClose }) => {
  const [confirmEmail, setConfirmEmail] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (confirmEmail !== user.email) {
      setDeleteError('Email does not match')
      return
    }

    setDeleteError(null)
    setIsDeleting(true)

    try {
      await superAdminService.deleteUser(user.id)
      onDelete?.(user)
      onClose()
    } catch (err) {
      console.error('[UserDangerZoneTab] Failed to delete user:', err)
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete user')
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
              Delete User
            </h4>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              This action is irreversible. The user account and all associated data will be permanently deleted.
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Email:</span>
            <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Role:</span>
            <span className="text-gray-900 dark:text-white">
              {user.role === 'super_admin' ? 'Super Admin' : user.role === 'tenant_admin' ? 'Tenant Admin' : 'User'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Tenant:</span>
            <span className="text-gray-900 dark:text-white">{user.tenant_name || 'None'}</span>
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
          Type <span className="font-semibold text-red-600 dark:text-red-400">"{user.email}"</span> to confirm deletion
        </label>
        <input
          type="text"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          disabled={isDeleting}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={user.email}
        />
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting || confirmEmail !== user.email}
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
            Delete User Permanently
          </>
        )}
      </button>
    </div>
  )
}

/**
 * EditUserModal Component
 *
 * Modal for Super Admin to edit existing users.
 */
export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
  onDelete,
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('details')

  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: '',
    role: 'user',
    is_active: true,
    tenant_id: null,
  })
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Password reset state
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)

  // Generate strong password
  const generateStrongPassword = () => {
    const length = 12
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*'
    const allChars = uppercase + lowercase + numbers + symbols

    let password = ''
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]

    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    password = password.split('').sort(() => Math.random() - 0.5).join('')
    setNewPassword(password)
    setShowPassword(true)
  }

  const handleResetPassword = async () => {
    if (!user) return

    if (!newPassword.trim() || newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setError(null)
    setIsResettingPassword(true)

    try {
      await superAdminService.resetUserPassword(user.id, newPassword)
      setPasswordResetSuccess(true)
      setNewPassword('')
      setShowPassword(false)

      // Clear success message after 3 seconds
      setTimeout(() => setPasswordResetSuccess(false), 3000)
    } catch (err) {
      console.error('[EditUserModal] Failed to reset password:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsResettingPassword(false)
    }
  }

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        tenant_id: user.tenant_id,
      })
    }
  }, [user])

  // Fetch tenants when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTenants()
    }
  }, [isOpen])

  const fetchTenants = async () => {
    try {
      setIsLoadingTenants(true)
      const data = await superAdminService.listTenants()
      setTenants(data)
    } catch (err) {
      console.error('[EditUserModal] Failed to fetch tenants:', err)
    } finally {
      setIsLoadingTenants(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    // Validation
    if (!formData.email?.trim()) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format')
      return
    }

    // Tenant admins and users must have a tenant
    if ((formData.role === 'tenant_admin' || formData.role === 'user') && !formData.tenant_id) {
      setError('Tenant Admin and User roles require a tenant assignment')
      return
    }

    setError(null)
    setIsUpdating(true)

    try {
      console.log('[EditUserModal] Updating user:', formData)
      await superAdminService.updateUser(user.id, formData)

      setSuccess(true)

      // Show success message briefly, then close
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('[EditUserModal] Failed to update user:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user')
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    if (!isUpdating && !isResettingPassword) {
      setError(null)
      setSuccess(false)
      setActiveTab('details')
      setNewPassword('')
      setShowPassword(false)
      setPasswordResetSuccess(false)
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isUpdating && !success) {
      handleSubmit()
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Edit User
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
              <User className="w-4 h-4" />
              Details
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Security
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
              Danger
            </div>
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
                  User Updated Successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  The user details have been saved.
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

          {/* Danger Zone Tab */}
          {!success && activeTab === 'danger' && (
            <UserDangerZoneTab
              user={user}
              onDelete={onDelete}
              onClose={handleClose}
            />
          )}

          {/* Security Tab */}
          {!success && activeTab === 'security' && (
            <div className="space-y-4">
              {/* Password Reset Success */}
              {passwordResetSuccess && (
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-300">
                    Password reset successfully!
                  </p>
                </div>
              )}

              {/* Password Reset Section */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Reset Password
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                  Set a new password for this user. They will need to use this password on their next login.
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 characters)"
                      disabled={isResettingPassword}
                      className="w-full px-3 py-2 pr-20 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isResettingPassword}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        disabled={isResettingPassword}
                        className="p-1 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 disabled:opacity-50"
                        title="Generate strong password"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleResetPassword}
                    disabled={isResettingPassword || !newPassword.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* User Security Info */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>User ID:</span>
                    <span className="font-mono">#{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Status:</span>
                    <span className={user.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!success && activeTab === 'details' && (
            <>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onKeyPress={handleKeyPress}
                  disabled={isUpdating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="user@example.com"
                  autoFocus
                />
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'super_admin' | 'tenant_admin' | 'user' })}
                  disabled={isUpdating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="user">User</option>
                  <option value="tenant_admin">Tenant Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {/* Tenant */}
              <div>
                <label
                  htmlFor="tenant_id"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Tenant {(formData.role === 'tenant_admin' || formData.role === 'user') && <span className="text-red-500">*</span>}
                </label>
                <select
                  id="tenant_id"
                  value={formData.tenant_id || ''}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={isUpdating || isLoadingTenants}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">No tenant (Platform user)</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.subdomain})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Super Admins don't require a tenant assignment
                </p>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    disabled={isUpdating}
                    className="w-5 h-5 text-emerald-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active User
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Inactive users cannot log in to the platform
                    </p>
                  </div>
                </label>
              </div>

              {/* User Info */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>User ID:</span>
                    <span className="font-mono">#{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions for Details Tab */}
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
                  <User className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer Actions for Security Tab */}
        {!success && activeTab === 'security' && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              disabled={isResettingPassword}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
          </div>
        )}

        {/* Footer Actions for Danger Zone Tab */}
        {!success && activeTab === 'danger' && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
