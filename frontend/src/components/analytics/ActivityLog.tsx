/**
 * Activity Log Component
 *
 * Real-time activity feed with:
 * - Activity type filtering
 * - Time range selection
 * - Custom date picker
 * - Auto-refresh toggle
 * - CSV export
 * - Pagination
 */

import React from 'react'
import {
  Clock,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { RealtimeFeed } from '@/services/superAdminService'

const ACTIVITIES_PER_PAGE = 20

interface ActivityLogProps {
  activityFeed: RealtimeFeed | null
  isActivityLoading: boolean
  activityFilter: string
  setActivityFilter: (filter: string) => void
  activityTimeRange: number
  setActivityTimeRange: (range: number) => void
  showCustomDatePicker: boolean
  setShowCustomDatePicker: (show: boolean) => void
  customStartDate: string
  setCustomStartDate: (date: string) => void
  customEndDate: string
  setCustomEndDate: (date: string) => void
  activityCurrentPage: number
  setActivityCurrentPage: (page: number | ((prev: number) => number)) => void
  autoRefreshEnabled: boolean
  setAutoRefreshEnabled: (enabled: boolean) => void
  lastActivityUpdate: Date | null
  fetchActivityFeed: (force?: boolean) => void
  exportActivityToCSV: () => void
  formatRelativeTime: (timestamp: string) => string
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  activityFeed,
  isActivityLoading,
  activityFilter,
  setActivityFilter,
  activityTimeRange,
  setActivityTimeRange,
  showCustomDatePicker,
  setShowCustomDatePicker,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  activityCurrentPage,
  setActivityCurrentPage,
  autoRefreshEnabled,
  setAutoRefreshEnabled,
  lastActivityUpdate,
  fetchActivityFeed,
  exportActivityToCSV,
  formatRelativeTime,
}) => {
  const totalPages = activityFeed?.activities
    ? Math.ceil(activityFeed.activities.length / ACTIVITIES_PER_PAGE)
    : 0

  return (
    <div className="space-y-4">
      {/* Activity Log Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activity Log
          </h2>
          {lastActivityUpdate && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              Updated {formatRelativeTime(lastActivityUpdate.toISOString())}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`px-2 py-1.5 sm:py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 min-h-[36px] sm:min-h-0 ${
              autoRefreshEnabled
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={autoRefreshEnabled ? 'Auto-refresh ON (30s)' : 'Click to enable auto-refresh'}
          >
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">Auto</span>
          </button>
          {/* Manual refresh */}
          <button
            onClick={() => fetchActivityFeed(true)}
            disabled={isActivityLoading}
            className="p-2 sm:p-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 min-h-[36px] sm:min-h-0"
            title="Refresh now"
          >
            <Loader2 className={`w-3.5 h-3.5 ${isActivityLoading ? 'animate-spin' : ''}`} />
          </button>
          {/* Export CSV */}
          <button
            onClick={exportActivityToCSV}
            disabled={!activityFeed?.activities || activityFeed.activities.length === 0}
            className="px-2 py-1.5 sm:py-1 rounded text-xs font-medium transition-colors min-h-[36px] sm:min-h-0 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center gap-1"
            title="Export to CSV"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Activity Type Filter - Left */}
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All', count: activityFeed?.pagination?.total || activityFeed?.summary?.total_activities_24h || 0 },
            { key: 'user_registered', label: 'Users', count: activityFeed?.summary?.user_registrations || 0 },
            { key: 'tenant_created', label: 'Tenants', count: activityFeed?.summary?.tenant_registrations || 0 },
            { key: 'pet_registered', label: 'Pets', count: activityFeed?.summary?.pet_registrations || 0 },
            { key: 'qr_activated', label: 'Activated', count: activityFeed?.summary?.qr_activations || 0 },
            { key: 'qr_scanned', label: 'Scans', count: activityFeed?.summary?.qr_scans || 0 },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActivityFilter(filter.key)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                activityFilter === filter.key
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Time Range Selector - Right */}
        <div className="flex items-center gap-1.5">
          {[
            { value: 1, label: '1h' },
            { value: 24, label: '24h' },
            { value: 168, label: '7d' },
            { value: 720, label: '30d' },
            { value: 2160, label: '90d' },
          ].map(range => (
            <button
              key={range.value}
              onClick={() => {
                setActivityTimeRange(range.value)
                setShowCustomDatePicker(false)
                setCustomStartDate('')
                setCustomEndDate('')
              }}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                activityTimeRange === range.value && !showCustomDatePicker
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              showCustomDatePicker
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Activity List Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Custom Date Picker */}
        {showCustomDatePicker && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
              <div className="w-full sm:w-auto">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full sm:w-auto px-2 py-2.5 sm:py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px] sm:min-h-0"
                />
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full sm:w-auto px-2 py-2.5 sm:py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px] sm:min-h-0"
                />
              </div>
              <button
                onClick={() => {
                  if (customStartDate && customEndDate) {
                    const start = new Date(customStartDate)
                    const end = new Date(customEndDate)
                    const diffHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))
                    if (diffHours > 0 && diffHours <= 2160) {
                      setActivityTimeRange(diffHours)
                    }
                  }
                }}
                disabled={!customStartDate || !customEndDate}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Activity List Table */}
        <div className="overflow-hidden">
          {isActivityLoading && !activityFeed ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            </div>
          ) : !activityFeed?.activities || activityFeed.activities.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
              <p className="text-xs">No activities found</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell whitespace-nowrap">Type</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell whitespace-nowrap">Tenant</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell whitespace-nowrap">Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {activityFeed.activities.slice((activityCurrentPage - 1) * ACTIVITIES_PER_PAGE, activityCurrentPage * ACTIVITIES_PER_PAGE).map((activity, index) => {
                    const typeColors: Record<string, string> = {
                      user_registered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                      tenant_created: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                      pet_registered: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                      qr_activated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                      qr_scanned: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
                    }
                    const typeColor = typeColors[activity.type] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    return (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                          <div
                            className="text-xs text-gray-500 dark:text-gray-400 font-mono"
                            title={activity.timestamp ? formatRelativeTime(activity.timestamp) : ''}
                          >
                            {activity.timestamp ? (() => {
                              const d = new Date(activity.timestamp)
                              const year = d.getFullYear()
                              const month = String(d.getMonth() + 1).padStart(2, '0')
                              const day = String(d.getDate()).padStart(2, '0')
                              const hours = String(d.getHours()).padStart(2, '0')
                              const minutes = String(d.getMinutes()).padStart(2, '0')
                              const seconds = String(d.getSeconds()).padStart(2, '0')
                              return (
                                <>
                                  <div>{year}-{month}-{day}</div>
                                  <div className="text-gray-400 dark:text-gray-500">{hours}:{minutes}:{seconds}</div>
                                </>
                              )
                            })() : '-'}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap hidden sm:table-cell">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${typeColor}`}>
                            {activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3">
                          <div>
                            <div className="sm:hidden mb-1">
                              <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${typeColor}`}>
                                {activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-900 dark:text-white">{activity.description}</p>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 hidden md:table-cell whitespace-nowrap">
                          {activity.tenant_name ? (
                            <span className="text-xs text-gray-900 dark:text-white">{activity.tenant_name}</span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 hidden lg:table-cell">
                          {activity.user_email ? (
                            <span className="text-xs text-gray-900 dark:text-white truncate block max-w-[200px]" title={activity.user_email}>
                              {activity.user_email}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {activityFeed.activities.length > ACTIVITIES_PER_PAGE && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Page {activityCurrentPage} of {totalPages} ({activityFeed.activities.length} items)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActivityCurrentPage(1)}
                        disabled={activityCurrentPage === 1}
                        className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="First page"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => setActivityCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={activityCurrentPage === 1}
                        className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => setActivityCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={activityCurrentPage === totalPages}
                        className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => setActivityCurrentPage(totalPages)}
                        disabled={activityCurrentPage === totalPages}
                        className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Last page"
                      >
                        <ChevronsRight className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
