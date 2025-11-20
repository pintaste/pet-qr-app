import React, { useState, useEffect } from 'react'
import { X, Building2, Loader2, AlertCircle, CheckCircle, User, Key, Plus, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff, RefreshCw, AlertTriangle, Calendar } from 'lucide-react'
import { superAdminService, type Tenant, type UpdateTenantRequest, type PlatformUser } from '@/services/superAdminService'

interface EditTenantModalProps {
  isOpen: boolean
  tenant: Tenant | null
  onClose: () => void
  onSuccess: () => void
  onDelete?: (tenant: Tenant) => void
}

type TabType = 'details' | 'admins' | 'danger'

/**
 * DangerZoneTab Component
 *
 * Danger zone tab content with delete tenant functionality.
 */
const DangerZoneTab: React.FC<{
  tenant: Tenant
  onDelete?: (tenant: Tenant) => void
  onClose: () => void
}> = ({ tenant, onDelete, onClose }) => {
  const [confirmName, setConfirmName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
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
      console.error('[DangerZoneTab] Failed to delete tenant:', err)
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

/**
 * EditTenantModal Component
 *
 * Modal for Super Admin to edit tenant details and manage tenant admins.
 */
export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  tenant,
  onClose,
  onSuccess,
  onDelete,
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('details')

  // Tenant form state
  const [formData, setFormData] = useState<UpdateTenantRequest>({
    name: '',
    tier: 'standard',
    is_active: true,
    custom_domain: '',
    subscription_expires_at: null,
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Admin management state
  const [admins, setAdmins] = useState<PlatformUser[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [confirmNewAdminPassword, setConfirmNewAdminPassword] = useState('')
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Generate strong password
  const generateStrongPassword = () => {
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
    password = password.split('').sort(() => Math.random() - 0.5).join('')

    setNewAdminPassword(password)
    setConfirmNewAdminPassword(password)
    setShowNewPassword(true) // Show password so user can see it
  }

  // Password reset state
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null)

  // Generate strong password for reset
  const generateResetPassword = () => {
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
    setShowResetPassword(true)
  }

  // Initialize form data when tenant changes
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        tier: tenant.tier,
        is_active: tenant.is_active,
        custom_domain: tenant.custom_domain || '',
        subscription_expires_at: tenant.subscription_expires_at || null,
      })
      fetchAdmins(tenant.id)
    }
  }, [tenant])

  const fetchAdmins = async (tenantId: number) => {
    setIsLoadingAdmins(true)
    try {
      const adminList = await superAdminService.listAllUsers({
        tenant_id: tenantId,
        role: 'tenant_admin'
      })
      setAdmins(adminList)
    } catch (err) {
      console.error('Failed to fetch tenant admins:', err)
      setAdmins([])
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  const handleSubmit = async () => {
    if (!tenant) return

    // Validation
    if (!formData.name?.trim()) {
      setError('Tenant name is required')
      return
    }

    setError(null)
    setIsUpdating(true)

    try {
      await superAdminService.updateTenant(tenant.id, formData)
      setSuccess(true)

      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('[EditTenantModal] Failed to update tenant:', err)
      setError(err instanceof Error ? err.message : 'Failed to update tenant')
      setIsUpdating(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!tenant) return

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
        tenant_id: tenant.id,
      })

      // Refresh admin list
      await fetchAdmins(tenant.id)

      // Reset form
      setNewAdminEmail('')
      setNewAdminPassword('')
      setConfirmNewAdminPassword('')
      setShowAddAdmin(false)
      setShowNewPassword(false)
      setError(null)
      setAdminActionSuccess(`Admin "${emailCreated}" created successfully`)
      // Clear success message after 3 seconds
      setTimeout(() => setAdminActionSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to create admin:', err)
      setError(err instanceof Error ? err.message : 'Failed to create admin')
      setAdminActionSuccess(null)
    } finally {
      setIsAddingAdmin(false)
    }
  }

  const handleToggleAdminStatus = async (admin: PlatformUser) => {
    try {
      await superAdminService.updateUser(admin.id, {
        is_active: !admin.is_active
      })
      // Update local state
      setAdmins(admins.map(a =>
        a.id === admin.id ? { ...a, is_active: !a.is_active } : a
      ))
    } catch (err) {
      console.error('Failed to toggle admin status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update admin status')
    }
  }

  const handleResetPassword = async (userId: number) => {
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
      // Clear success message after 3 seconds
      setTimeout(() => setAdminActionSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to reset password:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset password')
      setAdminActionSuccess(null)
    }
  }

  const handleDeleteAdmin = async (admin: PlatformUser) => {
    if (!confirm(`Are you sure you want to delete admin "${admin.email}"?`)) {
      return
    }

    try {
      await superAdminService.deleteUser(admin.id)
      setAdmins(admins.filter(a => a.id !== admin.id))
    } catch (err) {
      console.error('Failed to delete admin:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete admin')
    }
  }

  const handleClose = () => {
    if (!isUpdating && !isAddingAdmin) {
      setError(null)
      setSuccess(false)
      setActiveTab('details')
      setShowAddAdmin(false)
      setNewAdminEmail('')
      setNewAdminPassword('')
      setConfirmNewAdminPassword('')
      setShowNewPassword(false)
      setResetPasswordUserId(null)
      setNewPassword('')
      setShowResetPassword(false)
      setAdminActionSuccess(null)
      onClose()
    }
  }

  if (!isOpen || !tenant) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Edit Tenant
          </h2>
          <button
            onClick={handleClose}
            disabled={isUpdating || isAddingAdmin}
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
              <Building2 className="w-4 h-4" />
              Tenant Details
            </div>
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'admins'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Admins
              {admins.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                  {admins.length}
                </span>
              )}
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
              Danger Zone
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">
                  Tenant Updated Successfully!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!success && activeTab === 'details' && (
            <div className="space-y-4">
              {/* Subdomain (Read-Only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subdomain
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tenant.subdomain}
                    disabled
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 font-mono cursor-not-allowed"
                  />
                  <span className="text-gray-500 dark:text-gray-400 text-sm">.petqr.com</span>
                </div>
              </div>

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
                  disabled={isUpdating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., Demo Pet Store"
                />
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
                  disabled={isUpdating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="standard">Standard</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.tier === 'enterprise' ? 'Unlimited pets, priority support' : 'Up to 100 pets per tenant'}
                </p>
              </div>

              {/* Subscription Expiration */}
              <div>
                <label
                  htmlFor="subscription_expires_at"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Subscription Expiration
                  </div>
                </label>
                <input
                  id="subscription_expires_at"
                  type="date"
                  value={formData.subscription_expires_at ? new Date(formData.subscription_expires_at).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    subscription_expires_at: e.target.value ? new Date(e.target.value).toISOString() : null
                  })}
                  disabled={isUpdating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty for no expiration
                </p>
              </div>

              {/* Custom Domain */}
              <div>
                <label
                  htmlFor="custom_domain"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Custom Domain (Optional)
                </label>
                <input
                  id="custom_domain"
                  type="text"
                  value={formData.custom_domain || ''}
                  onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                  disabled={isUpdating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., pets.yourcompany.com"
                />
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
                      Active Tenant
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Inactive tenants cannot access the platform
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Danger Zone Tab */}
          {!success && activeTab === 'danger' && (
            <DangerZoneTab
              tenant={tenant}
              onDelete={onDelete}
              onClose={handleClose}
            />
          )}

          {!success && activeTab === 'admins' && (
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
                                  onClick={generateResetPassword}
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
                          onClick={generateStrongPassword}
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
          )}
        </div>

        {/* Footer Actions */}
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
                  <Building2 className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}

        {!success && activeTab === 'admins' && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}

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
