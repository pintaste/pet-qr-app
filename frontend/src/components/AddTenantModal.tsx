import React, { useState } from 'react'
import { X, Building2, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { superAdminService, type CreateTenantRequest } from '@/services/superAdminService'

interface AddTenantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * AddTenantModal Component
 *
 * Modal for Super Admin to create new tenants.
 */
export const AddTenantModal: React.FC<AddTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateTenantRequest>({
    name: '',
    subdomain: '',
    tier: 'standard',
    admin_email: '',
    admin_password: '',
  })
  const [isCreating, setIsCreating] = useState(false)
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
    setFormData({ ...formData, admin_password: password })
    setConfirmPassword(password)
    setShowPassword(true)
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Tenant name is required')
      return
    }

    if (!formData.subdomain.trim()) {
      setError('Subdomain is required')
      return
    }

    if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      setError('Subdomain can only contain lowercase letters, numbers, and hyphens')
      return
    }

    if (!formData.admin_email.trim()) {
      setError('Admin email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      setError('Invalid email format')
      return
    }

    if (!formData.admin_password || formData.admin_password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // Only require password confirmation if password is hidden
    if (!showPassword && formData.admin_password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError(null)
    setIsCreating(true)

    try {
      console.log('[AddTenantModal] Creating tenant:', formData)
      await superAdminService.createTenant(formData)

      setSuccess(true)
      setIsCreating(false)

      // Show success message briefly, then close
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('[AddTenantModal] Failed to create tenant:', err)
      setError(err instanceof Error ? err.message : 'Failed to create tenant')
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setFormData({
        name: '',
        subdomain: '',
        tier: 'standard',
        admin_email: '',
        admin_password: '',
      })
      setConfirmPassword('')
      setShowPassword(false)
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
            <Building2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Create New Tenant
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
                  Tenant Created Successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  The tenant has been added to the platform.
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
              {/* Tenant Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Tenant Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyPress={handleKeyPress}
                  disabled={isCreating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., Demo Pet Store"
                  autoFocus
                />
              </div>

              {/* Subdomain */}
              <div>
                <label
                  htmlFor="subdomain"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Subdomain <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="subdomain"
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                    onKeyPress={handleKeyPress}
                    disabled={isCreating}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                    placeholder="demo-store"
                  />
                  <span className="text-gray-500 dark:text-gray-400 text-sm">.petqr.com</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>

              {/* Tier */}
              <div>
                <label
                  htmlFor="tier"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Subscription Tier
                </label>
                <select
                  id="tier"
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value as 'standard' | 'enterprise' })}
                  disabled={isCreating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="standard">Standard</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {/* Admin Email */}
              <div>
                <label
                  htmlFor="admin_email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="admin_email"
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  onKeyPress={handleKeyPress}
                  disabled={isCreating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="admin@example.com"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be the tenant administrator's login email
                </p>
              </div>

              {/* Admin Password */}
              <div>
                <label
                  htmlFor="admin_password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Admin Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="admin_password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
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
                  Click the refresh icon to auto-generate a strong password
                </p>
              </div>

              {/* Confirm Password - only show when password is hidden */}
              {!showPassword && (
                <div>
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isCreating}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Re-enter password"
                    minLength={8}
                  />
                </div>
              )}

              {/* Info Box */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-800 dark:text-emerald-200">
                  <strong>Note:</strong> A new database schema will be created for this tenant with isolated data storage.
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
                  <Building2 className="w-5 h-5" />
                  Create Tenant
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
