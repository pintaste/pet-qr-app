/**
 * AnalyticsTab component for Tenant Admin Dashboard
 *
 * Displays comprehensive analytics including:
 * - Overview Summary Cards
 * - QR Code Activity
 * - User Engagement
 * - Pet Statistics
 * - QR Code Inventory
 * - Support Metrics
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  QrCode,
  Dog,
  Scan,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Package,
  RefreshCw,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import {
  tenantAdminService,
  ComprehensiveAnalytics,
} from '@/services/tenantAdminService'
import { logger } from '@/utils/logger'

/**
 * Props interface for the AnalyticsTab component
 */
interface AnalyticsTabProps {
  className?: string
}

/**
 * AnalyticsTab component for Tenant Admin Dashboard
 */
export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ className }) => {
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDays, setSelectedDays] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [selectedDays])

  const fetchAnalytics = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await tenantAdminService.getComprehensiveAnalytics(selectedDays)
      setAnalytics(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics'
      setError(errorMessage)
      logger.error('Failed to fetch analytics', { data: err })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive insights for your tenant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="p-1.5 text-gray-500 hover:text-emerald-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Summary Cards */}
      <OverviewSection overview={analytics.overview} />

      {/* QR Code Activity */}
      <QRActivitySection qrActivity={analytics.qr_activity} />

      {/* User Engagement */}
      <UserEngagementSection userEngagement={analytics.user_engagement} />

      {/* Pet Statistics */}
      <PetStatisticsSection petStats={analytics.pet_statistics} />

      {/* QR Code Inventory */}
      <QRInventorySection qrInventory={analytics.qr_inventory} />
    </div>
  )
}

/**
 * Overview Summary Section
 */
const OverviewSection: React.FC<{ overview: ComprehensiveAnalytics['overview'] }> = ({
  overview,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-emerald-600" />
        Overview Summary
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Users"
          value={overview.total_users}
          subValue={`${overview.active_users} active`}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Total QR Codes"
          value={overview.total_qr_codes}
          subValue={`${overview.active_qr_codes} active`}
          icon={<QrCode className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          label="Total Pets"
          value={overview.total_pets}
          icon={<Dog className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          label="Total Scans"
          value={overview.total_scans}
          icon={<Scan className="w-5 h-5" />}
          color="cyan"
        />
      </div>
    </div>
  )
}

/**
 * QR Code Activity Section
 */
const QRActivitySection: React.FC<{ qrActivity: ComprehensiveAnalytics['qr_activity'] }> = ({
  qrActivity,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Activity className="w-5 h-5 text-purple-600" />
        QR Code Activity
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scans Over Time Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Scans Over Time
          </h4>
          {qrActivity.scans_over_time.length > 0 ? (
            <SimpleBarChart data={qrActivity.scans_over_time} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No scan data available
            </p>
          )}
        </div>

        {/* Top Scanned QR Codes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Top Scanned QR Codes
          </h4>
          {qrActivity.top_scanned_qr_codes.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {qrActivity.top_scanned_qr_codes.slice(0, 5).map((qr, index) => (
                <div
                  key={qr.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-5">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {qr.code}
                      </p>
                      {qr.pet_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {qr.pet_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {qr.scan_count} scans
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No QR codes scanned yet
            </p>
          )}
        </div>

        {/* Activation Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Activation Rate
            </h4>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {qrActivity.activation_rate}%
            </span>
          </div>
          <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(qrActivity.activation_rate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * User Engagement Section
 */
const UserEngagementSection: React.FC<{
  userEngagement: ComprehensiveAnalytics['user_engagement']
}> = ({ userEngagement }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        User Engagement
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            User Status
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
              <span className="font-semibold text-green-600">{userEngagement.active_users}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Inactive</span>
              <span className="font-semibold text-gray-500">{userEngagement.inactive_users}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">With Pets</span>
              <span className="font-semibold text-blue-600">{userEngagement.users_with_pets}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Without Pets</span>
              <span className="font-semibold text-orange-500">{userEngagement.users_without_pets}</span>
            </div>
          </div>
        </div>

        {/* Registrations Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            New Registrations
          </h4>
          {userEngagement.registrations_over_time.length > 0 ? (
            <SimpleBarChart data={userEngagement.registrations_over_time} color="blue" />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No registration data available
            </p>
          )}
        </div>

        {/* Pet to User Ratio */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pet to User Ratio
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Average number of pets per user
              </p>
            </div>
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {userEngagement.pet_to_user_ratio}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Pet Statistics Section
 */
const PetStatisticsSection: React.FC<{
  petStats: ComprehensiveAnalytics['pet_statistics']
}> = ({ petStats }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <PieChart className="w-5 h-5 text-orange-600" />
        Pet Statistics
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pets by Species */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Pets by Species
          </h4>
          {petStats.pets_by_species.length > 0 ? (
            <div className="space-y-2">
              {petStats.pets_by_species.map((item) => (
                <div key={item.species} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {item.species}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${(item.count / petStats.total_pets) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No pet data available
            </p>
          )}
        </div>

        {/* Top Breeds */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Top Breeds
          </h4>
          {petStats.top_breeds.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {petStats.top_breeds.map((breed, index) => (
                <div
                  key={breed.breed}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {index + 1}. {breed.breed}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {breed.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No breed data available
            </p>
          )}
        </div>

        {/* Pet QR Link Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Pet QR Link Status
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {petStats.total_pets}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Pets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {petStats.pets_with_qr}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">With QR</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">
                {petStats.pets_without_qr}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Without QR</p>
            </div>
          </div>
          {petStats.lost_pets > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-red-600 dark:text-red-400">
                <span className="text-sm">Lost Pets Reported</span>
                <span className="font-semibold">{petStats.lost_pets}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * QR Code Inventory Section
 */
const QRInventorySection: React.FC<{
  qrInventory: ComprehensiveAnalytics['qr_inventory']
}> = ({ qrInventory }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Package className="w-5 h-5 text-indigo-600" />
        QR Code Inventory
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* QR by Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            QR Codes by Status
          </h4>
          {qrInventory.qr_by_status.length > 0 ? (
            <div className="space-y-3">
              {qrInventory.qr_by_status.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span
                    className={`text-sm px-2 py-0.5 rounded ${
                      item.status === 'ACTIVE'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : item.status === 'INACTIVE'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No QR code data
            </p>
          )}
        </div>

        {/* QR by Batch */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            QR Codes by Batch
          </h4>
          {qrInventory.qr_by_batch.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {qrInventory.qr_by_batch.map((batch) => (
                <div
                  key={batch.batch}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                    {batch.batch}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {batch.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No batch data
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {qrInventory.available_qr_codes}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Available for Activation</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {qrInventory.recent_qr_codes}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Created (Last 7 Days)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  label: string
  value: number
  subValue?: string
  icon: React.ReactNode
  color: 'blue' | 'purple' | 'orange' | 'cyan' | 'green' | 'red'
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, color }) => {
  const colorClasses = {
    blue: 'border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400',
    purple: 'border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400',
    orange: 'border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400',
    cyan: 'border-cyan-200 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400',
    green: 'border-green-200 dark:border-green-700 text-green-600 dark:text-green-400',
    red: 'border-red-200 dark:border-red-700 text-red-600 dark:text-red-400',
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </h4>
        <span className={colorClasses[color]}>{icon}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </p>
      {subValue && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>
      )}
    </div>
  )
}

/**
 * Simple Bar Chart Component
 */
interface SimpleBarChartProps {
  data: Array<{ date: string; count: number }>
  color?: 'emerald' | 'blue' | 'purple'
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, color = 'emerald' }) => {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data])

  const colorClass = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  }

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((item, index) => (
        <div
          key={item.date}
          className="flex-1 flex flex-col items-center"
          title={`${item.date}: ${item.count}`}
        >
          <div
            className={`w-full ${colorClass[color]} rounded-t opacity-80 hover:opacity-100 transition-opacity min-h-[2px]`}
            style={{ height: `${(item.count / maxValue) * 100}%` }}
          />
          {index % Math.ceil(data.length / 7) === 0 && (
            <span className="text-[8px] text-gray-500 dark:text-gray-400 mt-1 transform -rotate-45">
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default AnalyticsTab
