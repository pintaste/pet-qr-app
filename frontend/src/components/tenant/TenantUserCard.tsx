import React from 'react'
import { User, Calendar, Edit, Trash2, Key, CheckCircle, XCircle, UserCog } from 'lucide-react'
import type { TenantUser } from '@/services/tenantAdminService'

interface TenantUserCardProps {
  user: TenantUser
  onEdit?: (user: TenantUser) => void
  onDelete?: (user: TenantUser) => void
  onResetPassword?: (user: TenantUser) => void
  onImpersonate?: (user: TenantUser) => void
}

/**
 * TenantUserCard Component
 *
 * Displays a tenant user in a card format with action buttons.
 */
export const TenantUserCard: React.FC<TenantUserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onResetPassword,
  onImpersonate,
}) => {
  // Format created date
  const createdDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
        user.is_active
          ? 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600'
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
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <User
                className={`w-5 h-5 ${
                  user.is_active
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[180px]" title={user.email}>
                {user.email}
              </h3>
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
          {/* Created Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Joined {createdDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-gray-200 dark:border-gray-700">
          {onEdit && (
            <button
              onClick={() => onEdit(user)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-xs font-medium"
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

          {onImpersonate && (
            <button
              onClick={() => onImpersonate(user)}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-lg transition-colors text-xs font-medium"
              title="Impersonate User"
            >
              <UserCog className="w-3.5 h-3.5" />
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
 * TenantUserCardSkeleton Component
 *
 * Loading skeleton for user cards.
 */
export const TenantUserCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex gap-1.5 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex-1 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="w-8 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="w-8 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  )
}
