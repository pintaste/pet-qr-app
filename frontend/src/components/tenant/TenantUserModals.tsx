import React, { useState, useEffect } from 'react'
import { X, User, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Key, AlertTriangle, Shield, Wand2, Copy } from 'lucide-react'
import { tenantAdminService, type TenantUser, type CreateTenantUserRequest, type UpdateTenantUserRequest } from '@/services/tenantAdminService'

/**
 * Generates a strong random password
 */
const generateStrongPassword = (): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-='
  const all = lowercase + uppercase + numbers + symbols

  // Ensure at least one of each type
  let password = ''
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest randomly (total 12 characters)
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// ===== ADD USER MODAL =====
interface AddTenantUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AddTenantUserModal: React.FC<AddTenantUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateTenantUserRequest>({
    email: '',
    password: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async () => {
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

    setError(null)
    setIsCreating(true)

    try {
      await tenantAdminService.createUser(formData)
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setFormData({ email: '', password: '' })
      setShowPassword(false)
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <User className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            Create User
          </h2>
          <button onClick={handleClose} disabled={isCreating} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50">
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-green-800 dark:text-green-300">User Created Successfully!</p>
            </div>
          )}

          {error && !success && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!success && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isCreating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                  placeholder="user@example.com"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isCreating}
                    className="w-full px-4 py-2.5 pr-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {!success && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleClose} disabled={isCreating} className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isCreating} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {isCreating ? <><Loader2 className="w-5 h-5 animate-spin" />Creating...</> : <><User className="w-5 h-5" />Create User</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== EDIT USER MODAL =====
type EditUserTab = 'details' | 'security' | 'danger'

interface EditTenantUserModalProps {
  isOpen: boolean
  user: TenantUser | null
  onClose: () => void
  onSuccess: () => void
}

export const EditTenantUserModal: React.FC<EditTenantUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<EditUserTab>('details')
  const [formData, setFormData] = useState<UpdateTenantUserRequest>({ email: '', is_active: true })
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Security tab state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  // Danger tab state
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({ email: user.email, is_active: user.is_active })
    }
  }, [user])

  const handleSubmit = async () => {
    if (!user) return
    if (!formData.email?.trim()) {
      setError('Email is required')
      return
    }

    setError(null)
    setIsUpdating(true)

    try {
      await tenantAdminService.updateUser(user.id, formData)
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
      setIsUpdating(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user) return
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    // When password is hidden, require confirmation
    if (!showPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError(null)
    setIsResettingPassword(true)

    try {
      await tenantAdminService.resetUserPassword(user.id, newPassword)
      setPasswordSuccess(true)
      setTimeout(() => {
        setPasswordSuccess(false)
        setNewPassword('')
        setConfirmPassword('')
        setShowPassword(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword()
    setNewPassword(generated)
    setConfirmPassword(generated)
    setShowPassword(true) // Show password when generated so user can see it
  }

  const handleCopyPassword = async () => {
    if (newPassword) {
      await navigator.clipboard.writeText(newPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    if (confirmText !== user.email) {
      setError('Email does not match')
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      await tenantAdminService.deleteUser(user.id)
      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isUpdating && !isResettingPassword && !isDeleting) {
      setError(null)
      setSuccess(false)
      setActiveTab('details')
      setNewPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setPasswordSuccess(false)
      setConfirmText('')
      setCopied(false)
      onClose()
    }
  }

  if (!isOpen || !user) return null

  const isProcessing = isUpdating || isResettingPassword || isDeleting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Edit User
          </h2>
          <button onClick={handleClose} disabled={isProcessing} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50">
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <User className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'danger'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Danger
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {/* Success/Error Messages */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-green-800 dark:text-green-300">User Updated!</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-green-800 dark:text-green-300">Password Reset!</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && !success && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isProcessing}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    disabled={isProcessing}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active User</span>
                </label>
              </div>
            </>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && !passwordSuccess && (
            <>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Reset password for:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user.email}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    disabled={isProcessing}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isProcessing}
                    className="w-full px-4 py-2.5 pr-20 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Minimum 8 characters"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {newPassword && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        title={copied ? 'Copied!' : 'Copy password'}
                      >
                        <Copy className={`w-4 h-4 ${copied ? 'text-green-500' : 'text-gray-500'}`} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Password - only shown when password is hidden */}
              {!showPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isProcessing}
                    className={`w-full px-4 py-2.5 bg-white dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Re-enter password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Danger Tab */}
          {activeTab === 'danger' && (
            <>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="font-semibold text-red-800 dark:text-red-300 mb-2">This action cannot be undone!</p>
                <p className="text-sm text-red-700 dark:text-red-400">Deleting <strong>{user.email}</strong> will permanently remove their account and all associated data.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type <span className="font-mono font-bold">{user.email}</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                  placeholder={user.email}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!success && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            {activeTab === 'details' && (
              <>
                <button onClick={handleClose} disabled={isProcessing} className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={isProcessing} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isUpdating ? <><Loader2 className="w-5 h-5 animate-spin" />Saving...</> : 'Save Changes'}
                </button>
              </>
            )}

            {activeTab === 'security' && !passwordSuccess && (
              <>
                <button onClick={handleClose} disabled={isProcessing} className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleResetPassword} disabled={isProcessing || !newPassword} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isResettingPassword ? <><Loader2 className="w-5 h-5 animate-spin" />Resetting...</> : <><Key className="w-5 h-5" />Reset Password</>}
                </button>
              </>
            )}

            {activeTab === 'danger' && (
              <>
                <button onClick={handleClose} disabled={isProcessing} className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={isProcessing || confirmText !== user.email} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isDeleting ? <><Loader2 className="w-5 h-5 animate-spin" />Deleting...</> : <><AlertTriangle className="w-5 h-5" />Delete User</>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== DELETE USER MODAL =====
interface DeleteTenantUserModalProps {
  isOpen: boolean
  user: TenantUser | null
  onClose: () => void
  onSuccess: () => void
}

export const DeleteTenantUserModal: React.FC<DeleteTenantUserModalProps> = ({
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
      setError('Email does not match')
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      await tenantAdminService.deleteUser(user.id)
      onSuccess()
      handleClose()
    } catch (err) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7" />
            Delete User
          </h2>
          <button onClick={handleClose} disabled={isDeleting} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50">
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="font-semibold text-red-800 dark:text-red-300 mb-2">This action cannot be undone!</p>
            <p className="text-sm text-red-700 dark:text-red-400">Deleting <strong>{user.email}</strong> will permanently remove their account.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type <span className="font-mono font-bold">{user.email}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
              placeholder={user.email}
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleClose} disabled={isDeleting} className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={isDeleting || confirmText !== user.email} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
            {isDeleting ? <><Loader2 className="w-5 h-5 animate-spin" />Deleting...</> : <><AlertTriangle className="w-5 h-5" />Delete</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== RESET PASSWORD MODAL =====
interface ResetTenantUserPasswordModalProps {
  isOpen: boolean
  user: TenantUser | null
  onClose: () => void
  onSuccess: () => void
}

export const ResetTenantUserPasswordModal: React.FC<ResetTenantUserPasswordModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!user) return
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setError(null)
    setIsResetting(true)

    try {
      await tenantAdminService.resetUserPassword(user.id, newPassword)
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
      setIsResetting(false)
    }
  }

  const handleClose = () => {
    if (!isResetting) {
      setNewPassword('')
      setShowPassword(false)
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Key className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            Reset Password
          </h2>
          <button onClick={handleClose} disabled={isResetting} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50">
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-green-800 dark:text-green-300">Password Reset!</p>
            </div>
          )}

          {error && !success && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!success && (
            <>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Resetting password for:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isResetting}
                    className="w-full px-4 py-2.5 pr-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Minimum 8 characters"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {!success && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleClose} disabled={isResetting} className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isResetting} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {isResetting ? <><Loader2 className="w-5 h-5 animate-spin" />Resetting...</> : <><Key className="w-5 h-5" />Reset Password</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
