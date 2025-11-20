import React from 'react'
import { User, Shield, ShieldCheck, Calendar, Edit, Trash2, Building2, CheckCircle, XCircle, Key } from 'lucide-react'
import type { PlatformUser } from '@/services/superAdminService'

interface UserCardProps {
  user: PlatformUser
  onEdit?: (user: PlatformUser) => void
  onDelete?: (user: PlatformUser) => void
  onResetPassword?: (user: PlatformUser) => void
}

/**
 * UserCard Component
 *
 * Displays a user in a card format with role, tenant, and action buttons.
 */
export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onResetPassword,
}) => {
  // Format created date
  const createdDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Role badge colors and icons
  const roleConfig = {
    super_admin: {
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      icon: ShieldCheck,
      label: 'Super Admin',
    },
    tenant_admin: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      icon: Shield,
      label: 'Tenant Admin',
    },
    user: {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      icon: User,
      label: 'User',
    },
  }

  const role = roleConfig[user.role] || roleConfig.user
  const RoleIcon = role.icon

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
        user.is_active
          ? 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 opacity-75'
      }`}
    >
      <div className="p-5">
        {/* Header with User Icon and Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                user.is_active
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <User
                className={`w-5 h-5 ${
                  user.is_active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[180px]" title={user.email}>
                {user.email}
              </h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${role.color} mt-1`}>
                <RoleIcon className="w-3 h-3" />
                {role.label}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            user.is_active
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
          }`}>
            {user.is_active ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-1.5 mb-3 text-xs">
          {/* Tenant */}
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {user.tenant_name || 'No tenant (Platform user)'}
            </span>
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">{createdDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-gray-200 dark:border-gray-700">
          {onEdit && (
            <button
              onClick={() => onEdit(user)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors text-xs font-medium"
              title="Edit User"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
          )}

          {onResetPassword && (
            <button
              onClick={() => onResetPassword(user)}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg transition-colors text-xs font-medium"
              title="Reset Password"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(user)}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors text-xs font-medium"
              title="Delete User"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * UserCardSkeleton Component
 *
 * Loading skeleton for user cards.
 */
export const UserCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex gap-1.5 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex-1 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="w-8 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="w-8 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  )
}
