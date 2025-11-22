import React from 'react'
import {
  Building2,
  QrCode,
  Users,
  BarChart3,
  Loader2,
  Zap,
  Dog,
  Scan,
  UserPlus,
} from 'lucide-react'
import { PlatformStats, RealtimeFeed } from '@/services/superAdminService'

export type SuperAdminTab = 'overview' | 'tenants' | 'users' | 'qr-factory' | 'analytics' | 'subscriptions' | 'settings'

/**
 * Props interface for the OverviewTab component
 */
interface OverviewTabProps {
  platformStats: PlatformStats | null
  isLoading: boolean
  error: string | null
  activityFeed: RealtimeFeed | null
  isActivityLoading: boolean
  setActiveTab: (tab: SuperAdminTab) => void
  formatRelativeTime: (timestamp: string) => string
}

/**
 * OverviewTab component for SuperAdmin Dashboard
 *
 * Displays platform statistics and recent activity feed.
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  platformStats,
  isLoading,
  error,
  activityFeed,
  isActivityLoading,
  setActiveTab,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Platform Overview</h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor key metrics and recent platform activity
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading platform statistics...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Platform Stats & Quick Actions Combined */}
      {!isLoading && !error && platformStats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => setActiveTab('tenants')}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Tenants</h3>
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_tenants}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{platformStats.active_tenants} active</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
              Click to manage tenants →
            </p>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_users}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{platformStats.active_users} active</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
              Click to manage users →
            </p>
          </button>

          <button
            onClick={() => setActiveTab('qr-factory')}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">QR Codes</h3>
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_qr_codes}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">Platform-wide</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
              Click to generate QR codes →
            </p>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Scans</h3>
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_scans}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">All time</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
              Click to view analytics →
            </p>
          </button>
        </div>
      )}

      {/* Recent Activity Feed - Simple view for Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Recent Activity (24h)
          </h3>
          <div className="flex gap-3 text-xs">
            <span className="text-blue-600 dark:text-blue-400">
              Users: {activityFeed?.summary?.user_registrations || 0}
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              Pets: {activityFeed?.summary?.pet_registrations || 0}
            </span>
            <span className="text-purple-600 dark:text-purple-400">
              QR: {activityFeed?.summary?.qr_activations || 0}
            </span>
            <span className="text-cyan-600 dark:text-cyan-400">
              Scans: {activityFeed?.summary?.qr_scans || 0}
            </span>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isActivityLoading && !activityFeed ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            </div>
          ) : !activityFeed?.activities || activityFeed.activities.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
          ) : (
            activityFeed.activities.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <div className={`p-1.5 rounded-full flex-shrink-0 ${
                  activity.type === 'user_registered' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  activity.type === 'tenant_created' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                  activity.type === 'pet_registered' ? 'bg-orange-100 dark:bg-orange-900/30' :
                  activity.type === 'qr_activated' ? 'bg-purple-100 dark:bg-purple-900/30' :
                  'bg-cyan-100 dark:bg-cyan-900/30'
                }`}>
                  {activity.type === 'user_registered' && <UserPlus className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                  {activity.type === 'tenant_created' && <Building2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                  {activity.type === 'pet_registered' && <Dog className="w-3 h-3 text-orange-600 dark:text-orange-400" />}
                  {activity.type === 'qr_activated' && <QrCode className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
                  {activity.type === 'qr_scanned' && <Scan className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {activity.tenant_name && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{activity.tenant_name}</span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
