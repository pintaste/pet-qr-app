/**
 * Analytics Dashboard Component
 *
 * Displays platform-wide analytics for Super Admin including:
 * - Growth trends (users, tenants)
 * - QR code status distribution
 * - Tenant performance rankings
 * - Recent activity feed
 */

import React, { useState, useEffect } from 'react'
import {
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  superAdminService,
  GrowthAnalytics,
  QRStatusAnalytics,
  TenantPerformance,
  RecentActivity,
  PlatformStats,
  PetAnalytics,
  ScanPatterns,
  RealtimeFeed,
} from '@/services/superAdminService'
import { StatCards } from './analytics/StatCards'
import { GrowthCharts, QRStatusCards } from './analytics/ChartComponents'
import { TenantPerformanceTable } from './analytics/TenantPerformanceTable'
import { PetAnalyticsCards } from './analytics/PetAnalyticsCards'
import { ScanPatternsCharts } from './analytics/ScanPatternsCharts'
import { ActivityLog } from './analytics/ActivityLog'

interface AnalyticsDashboardProps {
  platformStats: PlatformStats | null
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

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  platformStats,
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
  const [growthData, setGrowthData] = useState<GrowthAnalytics | null>(null)
  const [qrStatusData, setQRStatusData] = useState<QRStatusAnalytics | null>(null)
  const [tenantPerformance, setTenantPerformance] = useState<TenantPerformance | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null)
  const [petAnalytics, setPetAnalytics] = useState<PetAnalytics | null>(null)
  const [scanPatterns, setScanPatterns] = useState<ScanPatterns | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAnalytics = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const [growth, qrStatus, performance, activity, pets, scans] = await Promise.all([
        superAdminService.getGrowthAnalytics(),
        superAdminService.getQRStatusAnalytics(),
        superAdminService.getTenantPerformance(),
        superAdminService.getRecentActivity(),
        superAdminService.getPetAnalytics(),
        superAdminService.getScanPatterns(),
      ])
      setGrowthData(growth)
      setQRStatusData(qrStatus)
      setTenantPerformance(performance)
      setRecentActivity(activity)
      setPetAnalytics(pets)
      setScanPatterns(scans)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[AnalyticsDashboard] Failed to fetch analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive insights into platform performance
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-3 py-2.5 sm:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors min-h-[44px] sm:min-h-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <StatCards platformStats={platformStats} />

      {/* Growth Charts Row */}
      <GrowthCharts growthData={growthData} />

      {/* QR Status & Distribution Row */}
      <QRStatusCards
        qrStatusData={qrStatusData}
        userRoleDistribution={growthData?.user_role_distribution}
      />

      {/* Tenant Performance Rankings & Recent Activity */}
      <TenantPerformanceTable
        tenantPerformance={tenantPerformance}
        recentActivity={recentActivity}
      />

      {/* Pet Analytics Row */}
      <PetAnalyticsCards petAnalytics={petAnalytics} />

      {/* Scan Patterns Row */}
      <ScanPatternsCharts scanPatterns={scanPatterns} />

      {/* Activity Log */}
      <ActivityLog
        activityFeed={activityFeed}
        isActivityLoading={isActivityLoading}
        activityFilter={activityFilter}
        setActivityFilter={setActivityFilter}
        activityTimeRange={activityTimeRange}
        setActivityTimeRange={setActivityTimeRange}
        showCustomDatePicker={showCustomDatePicker}
        setShowCustomDatePicker={setShowCustomDatePicker}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        activityCurrentPage={activityCurrentPage}
        setActivityCurrentPage={setActivityCurrentPage}
        autoRefreshEnabled={autoRefreshEnabled}
        setAutoRefreshEnabled={setAutoRefreshEnabled}
        lastActivityUpdate={lastActivityUpdate}
        fetchActivityFeed={fetchActivityFeed}
        exportActivityToCSV={exportActivityToCSV}
        formatRelativeTime={formatRelativeTime}
      />
    </div>
  )
}
