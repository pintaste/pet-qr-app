import React, { useState, useEffect } from 'react'
import { X, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { superAdminService, type PlatformUser, type UpdateUserRequest, type Tenant } from '@/services/superAdminService'

interface EditUserModalProps {
  isOpen: boolean
  user: PlatformUser | null
  onClose: () => void
  onSuccess: () => void
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
}) => {
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
    if (!isUpdating) {
      setError(null)
      setSuccess(false)
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

          {!success && (
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

        {/* Footer Actions */}
        {!success && (
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
      </div>
    </div>
  )
}
