import React, { useState, useEffect } from 'react'
import { X, User, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { superAdminService, type CreateUserRequest, type Tenant } from '@/services/superAdminService'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * AddUserModal Component
 *
 * Modal for Super Admin to create new users.
 */
export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    role: 'super_admin',
    tenant_id: null,
  })
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')

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
    setFormData({ ...formData, password })
    setConfirmPassword(password)
    setShowPassword(true)
  }

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
      console.error('[AddUserModal] Failed to fetch tenants:', err)
    } finally {
      setIsLoadingTenants(false)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format')
      return
    }

    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // Tenant admins and users must have a tenant
    if ((formData.role === 'tenant_admin' || formData.role === 'user') && !formData.tenant_id) {
      setError('Tenant Admin and User roles require a tenant assignment')
      return
    }

    // Check password confirmation when password is hidden
    if (!showPassword && formData.password && confirmPassword !== formData.password) {
      setError('Passwords do not match')
      return
    }

    setError(null)
    setIsCreating(true)

    try {
      console.log('[AddUserModal] Creating user:', formData)
      await superAdminService.createUser(formData)

      setSuccess(true)
      setIsCreating(false)

      // Show success message briefly, then close
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('[AddUserModal] Failed to create user:', err)
      setError(err instanceof Error ? err.message : 'Failed to create user')
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setFormData({
        email: '',
        password: '',
        role: 'super_admin',
        tenant_id: null,
      })
      setShowPassword(false)
      setConfirmPassword('')
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating && !success) {
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <User className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Create New User
          </h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
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
                  User Created Successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  The user has been added to the platform.
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
                  disabled={isCreating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="user@example.com"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onKeyPress={handleKeyPress}
                    disabled={isCreating}
                    className="w-full px-4 py-2.5 pr-24 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword(!showPassword)
                        // Clear confirm password when showing password (no longer needed)
                        if (!showPassword) {
                          setConfirmPassword('')
                        }
                      }}
                      disabled={isCreating}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      disabled={isCreating}
                      className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded transition-colors disabled:opacity-50"
                      title="Generate strong password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum 8 characters required
                </p>
              </div>

              {/* Confirm Password - only shown when password is hidden */}
              {!showPassword && formData.password && (
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
                    disabled={isCreating}
                    className={`w-full px-4 py-2.5 bg-white dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      confirmPassword && confirmPassword !== formData.password
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Re-enter password"
                  />
                  {confirmPassword && confirmPassword !== formData.password && (
                    <p className="mt-1 text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}

              {/* Role */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'super_admin' | 'tenant_admin' | 'user' })}
                  disabled={isCreating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="tenant_admin">Tenant Admin</option>
                  <option value="user">User (Not Recommended)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.role === 'super_admin' && 'Full platform access and management capabilities'}
                  {formData.role === 'tenant_admin' && 'Manages a specific tenant and its users'}
                  {formData.role === 'user' && 'Regular user who manages their own pets'}
                </p>
              </div>

              {/* Warning for regular user creation */}
              {formData.role === 'user' && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Not Recommended
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Regular users should be created by their Tenant Admin. Only create a user here if the tenant admin is unavailable or for special circumstances.
                    </p>
                  </div>
                </div>
              )}

              {/* Tenant (only for tenant_admin and user) */}
              {(formData.role === 'tenant_admin' || formData.role === 'user') && (
                <div>
                  <label
                    htmlFor="tenant_id"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Tenant <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tenant_id"
                    value={formData.tenant_id || ''}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value ? parseInt(e.target.value) : null })}
                    disabled={isCreating || isLoadingTenants}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a tenant...</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.subdomain})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info Box */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> The user will receive their login credentials. Super Admins have access to all platform features.
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
              disabled={isCreating}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  Create User
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
