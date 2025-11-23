/**
 * Overview Tab for Tenant Admin Dashboard
 *
 * Provides a dashboard summary with key metrics and recent activity.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  QrCode,
  PawPrint,
  Activity,
  AlertTriangle,
  Info,
  RefreshCw,
  TrendingUp,
  Clock,
  UserPlus,
} from 'lucide-react'
import {
  tenantAdminService,
  TenantOverviewData,
} from '../../../services/tenantAdminService'
import { logger } from '../../../utils/logger'

interface TenantOverviewTabProps {
  onNavigate?: (tab: string) => void
  className?: string
}

/**
 * Format timestamp to short format for mobile
 */
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TenantOverviewTab: React.FC<TenantOverviewTabProps> = ({ onNavigate, className }) => {
  const [data, setData] = useState<TenantOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const response = await tenantAdminService.getTenantOverview()
      setData(response)
    } catch (err) {
      logger.error('Failed to fetch overview data', { data: err })
      setError('Failed to load overview data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleNavigate = (tab: string): void => {
    if (onNavigate) {
      onNavigate(tab)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading overview...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800 dark:text-red-200 text-sm">{error || 'Failed to load data'}</p>
        </div>
        <button
          onClick={fetchData}
          className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  const { key_metrics, quick_stats, qr_distribution, scan_trend, activity_feed, alerts } = data
  const maxScanCount = Math.max(...scan_trend.map(d => d.count), 1)

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Overview
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
            Dashboard summary at a glance
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-1.5 sm:p-2 text-gray-500 hover:text-indigo-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-lg gap-2 ${
                alert.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}
            >
              <div className="flex items-start sm:items-center gap-2">
                {alert.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                )}
                <span className={`text-xs sm:text-sm ${
                  alert.type === 'warning'
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  {alert.message}
                </span>
              </div>
              <button
                onClick={() => handleNavigate(alert.title === 'Lost Pets' ? 'pets' : 'qrcodes')}
                className={`text-xs font-medium self-end sm:self-auto flex-shrink-0 ${
                  alert.type === 'warning'
                    ? 'text-yellow-700 dark:text-yellow-300 hover:underline'
                    : 'text-blue-700 dark:text-blue-300 hover:underline'
                }`}
              >
                {alert.action}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[
          { title: 'Users', value: key_metrics.total_users, icon: Users, color: 'indigo', tab: 'users' },
          { title: 'QR Codes', value: key_metrics.active_qr_codes, icon: QrCode, color: 'green', tab: 'qrcodes' },
          { title: 'Pets', value: key_metrics.total_pets, icon: PawPrint, color: 'purple', tab: 'pets' },
          { title: 'Scans', value: key_metrics.total_scans, icon: Activity, color: 'blue', tab: 'analytics' },
        ].map((metric) => {
          const Icon = metric.icon
          const colorClasses: Record<string, string> = {
            indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
            green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
          }
          return (
            <button
              key={metric.title}
              onClick={() => handleNavigate(metric.tab)}
              className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">{metric.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                    {metric.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-1.5 sm:p-2 rounded-lg ${colorClasses[metric.color]}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'Available QRs', value: quick_stats.available_qr_codes },
          { label: 'Lost Pets', value: quick_stats.lost_pets },
          { label: 'New Users (7d)', value: quick_stats.new_users_7d },
          { label: 'Scans (7d)', value: quick_stats.scans_7d },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{stat.label}</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* QR Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
              QR Code Status
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Active', value: qr_distribution.active, color: 'bg-green-500' },
                { label: 'Inactive', value: qr_distribution.inactive, color: 'bg-gray-400' },
                { label: 'Pending', value: qr_distribution.pending, color: 'bg-yellow-500' },
              ].map((item) => {
                const total = qr_distribution.active + qr_distribution.inactive + qr_distribution.pending || 1
                return (
                  <div key={item.label} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-16 sm:w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${(item.value / total) * 100}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white w-6 sm:w-8 text-right">
                        {item.value}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Scan Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Scan Trend (7d)
              </h3>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            </div>
            {scan_trend.length > 0 ? (
              <div className="flex items-end gap-0.5 sm:gap-1 h-12 sm:h-16">
                {scan_trend.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-0.5 sm:gap-1">
                    <div
                      className="w-full bg-indigo-500 rounded-t"
                      style={{
                        height: `${(item.count / maxScanCount) * 100}%`,
                        minHeight: item.count > 0 ? '2px' : '0'
                      }}
                    />
                    <span className="text-[8px] sm:text-[10px] text-gray-400">
                      {new Date(item.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3 sm:py-4">
                No scan data
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
            Recent Activity
          </h3>
          {activity_feed.length > 0 ? (
            <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
              {activity_feed.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 pb-2 sm:pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0"
                >
                  <div className={`p-1 sm:p-1.5 rounded flex-shrink-0 ${
                    item.type === 'scan'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : item.type === 'registration'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                    {item.type === 'scan' ? (
                      <QrCode className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 dark:text-blue-400" />
                    ) : item.type === 'registration' ? (
                      <UserPlus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-900 dark:text-white truncate">
                      {item.description}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5 sm:gap-1 mt-0.5">
                      <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                      {item.timestamp ? formatTime(item.timestamp) : 'Unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3 sm:py-4">
              No recent activity
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TenantOverviewTab
