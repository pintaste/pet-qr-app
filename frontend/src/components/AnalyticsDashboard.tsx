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
  TrendingUp,
  Users,
  Building2,
  QrCode,
  Activity,
  Award,
  RefreshCw,
  Loader2,
  AlertCircle,
  UserPlus,
  Clock,
  BarChart3,
  PieChart,
  Dog,
  Cat,
  Scan,
  Zap,
  Image,
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

interface AnalyticsDashboardProps {
  platformStats: PlatformStats | null
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ platformStats }) => {
  const [growthData, setGrowthData] = useState<GrowthAnalytics | null>(null)
  const [qrStatusData, setQRStatusData] = useState<QRStatusAnalytics | null>(null)
  const [tenantPerformance, setTenantPerformance] = useState<TenantPerformance | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null)
  const [petAnalytics, setPetAnalytics] = useState<PetAnalytics | null>(null)
  const [scanPatterns, setScanPatterns] = useState<ScanPatterns | null>(null)
  const [realtimeFeed, setRealtimeFeed] = useState<RealtimeFeed | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [growth, qrStatus, performance, activity, pets, scans, feed] = await Promise.all([
        superAdminService.getGrowthAnalytics(),
        superAdminService.getQRStatusAnalytics(),
        superAdminService.getTenantPerformance(),
        superAdminService.getRecentActivity(),
        superAdminService.getPetAnalytics(),
        superAdminService.getScanPatterns(),
        superAdminService.getRealtimeFeed(),
      ])
      setGrowthData(growth)
      setQRStatusData(qrStatus)
      setTenantPerformance(performance)
      setRecentActivity(activity)
      setPetAnalytics(pets)
      setScanPatterns(scans)
      setRealtimeFeed(feed)
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

  // Simple bar chart component
  const SimpleBarChart: React.FC<{ data: Array<{ date: string; count: number }>; color: string }> = ({ data, color }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1)
    const recentData = data.slice(-14) // Last 14 days

    return (
      <div className="flex items-end gap-0.5 h-20">
        {recentData.map((item) => (
          <div
            key={item.date}
            className={`flex-1 ${color} rounded-t transition-all hover:opacity-80`}
            style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '4px' : '0' }}
            title={`${item.date}: ${item.count}`}
          />
        ))}
      </div>
    )
  }

  // Progress ring component
  const ProgressRing: React.FC<{ percentage: number; size?: number; color: string }> = ({ percentage, size = 60, color }) => {
    const strokeWidth = 6
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={color}
        />
      </svg>
    )
  }

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
      {platformStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Tenants</span>
            </div>
            <p className="text-lg sm:text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{platformStats.total_tenants}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Users</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{platformStats.total_users}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Active Users</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{platformStats.active_users}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">QR Codes</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{platformStats.total_qr_codes}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Pets</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{platformStats.total_pets}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-cyan-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Scans</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{platformStats.total_scans}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Active</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{platformStats.active_tenants}</p>
          </div>
        </div>
      )}

      {/* Growth Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* User Growth */}
        {growthData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                User Growth
              </h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  +{growthData.user_growth.last_30_days}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">last 30 days</span>
              </div>
            </div>
            <SimpleBarChart data={growthData.user_growth.daily_trend} color="bg-blue-500" />
            <div className="flex justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span>7d: +{growthData.user_growth.last_7_days}</span>
              <span>90d: +{growthData.user_growth.last_90_days}</span>
            </div>
          </div>
        )}

        {/* Tenant Growth */}
        {growthData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                Tenant Growth
              </h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  +{growthData.tenant_growth.last_30_days}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">last 30 days</span>
              </div>
            </div>
            <SimpleBarChart data={growthData.tenant_growth.daily_trend} color="bg-indigo-500" />
            <div className="flex justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span>7d: +{growthData.tenant_growth.last_7_days}</span>
              <span>90d: +{growthData.tenant_growth.last_90_days}</span>
            </div>
          </div>
        )}
      </div>

      {/* QR Status & Distribution Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* QR Status Distribution */}
        {qrStatusData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              QR Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {qrStatusData.status_distribution.active}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Inactive</span>
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  {qrStatusData.status_distribution.inactive}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Expired</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {qrStatusData.status_distribution.expired}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* QR Assignment */}
        {qrStatusData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-500" />
              QR Assignment
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative">
                <ProgressRing
                  percentage={
                    qrStatusData.assignment.assigned + qrStatusData.assignment.unassigned > 0
                      ? (qrStatusData.assignment.assigned / (qrStatusData.assignment.assigned + qrStatusData.assignment.unassigned)) * 100
                      : 0
                  }
                  size={80}
                  color="text-blue-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {qrStatusData.assignment.assigned + qrStatusData.assignment.unassigned > 0
                      ? Math.round((qrStatusData.assignment.assigned / (qrStatusData.assignment.assigned + qrStatusData.assignment.unassigned)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-3 text-xs">
              <span className="text-blue-600 dark:text-blue-400">
                Assigned: {qrStatusData.assignment.assigned}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Unassigned: {qrStatusData.assignment.unassigned}
              </span>
            </div>
          </div>
        )}

        {/* User Role Distribution */}
        {growthData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              User Roles
            </h3>
            <div className="space-y-3">
              {Object.entries(growthData.user_role_distribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {role.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tenant Performance Rankings */}
      {tenantPerformance && tenantPerformance.tenant_rankings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Tenant Performance Rankings
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Rank</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Tenant</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Users</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Pets</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">QR Codes</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Scans</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Score</th>
                </tr>
              </thead>
              <tbody>
                {tenantPerformance.tenant_rankings.slice(0, 10).map((tenant, index) => (
                  <tr key={tenant.tenant_id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                        index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{tenant.tenant_name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">{tenant.subdomain}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center text-sm text-gray-600 dark:text-gray-400">{tenant.total_users}</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-600 dark:text-gray-400">{tenant.total_pets}</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-600 dark:text-gray-400">{tenant.total_qr_codes}</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-600 dark:text-gray-400">{tenant.total_scans}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        tenant.engagement_score >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        tenant.engagement_score >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {tenant.engagement_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pet Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Species Distribution */}
        {petAnalytics && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Dog className="w-5 h-5 text-orange-500" />
              Pet Species
            </h3>
            <div className="space-y-3">
              {Object.entries(petAnalytics.species_distribution).map(([species, count]) => (
                <div key={species} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {species.toLowerCase() === 'dog' ? (
                      <Dog className="w-4 h-4 text-orange-400" />
                    ) : species.toLowerCase() === 'cat' ? (
                      <Cat className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Activity className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{species}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
              {Object.keys(petAnalytics.species_distribution).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No pet data</p>
              )}
            </div>
          </div>
        )}

        {/* Top Breeds */}
        {petAnalytics && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Top Breeds
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(petAnalytics.breed_distribution).slice(0, 8).map(([breed, count]) => (
                <div key={breed} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate pr-2">{breed}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{count}</span>
                </div>
              ))}
              {Object.keys(petAnalytics.breed_distribution).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No breed data</p>
              )}
            </div>
          </div>
        )}

        {/* Pet Photo Stats */}
        {petAnalytics && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-pink-500" />
              Photo Coverage
            </h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <ProgressRing
                  percentage={petAnalytics.summary.photo_percentage}
                  size={80}
                  color="text-pink-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {petAnalytics.summary.photo_percentage}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              {petAnalytics.summary.pets_with_photos} of {petAnalytics.summary.total_pets} pets have photos
            </div>
          </div>
        )}
      </div>

      {/* Scan Patterns Row */}
      {scanPatterns && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Hourly Pattern */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-500" />
                Scan Hours (30 days)
              </h3>
              <div className="text-right">
                <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                  Peak: {scanPatterns.summary.peak_hours.slice(0, 2).map(h => `${h}:00`).join(', ')}
                </span>
              </div>
            </div>
            <div className="flex items-end gap-0.5 h-20">
              {scanPatterns.hourly_pattern.map((item) => {
                const maxCount = Math.max(...scanPatterns.hourly_pattern.map(d => d.count), 1)
                return (
                  <div
                    key={item.hour}
                    className="flex-1 bg-cyan-500 rounded-t transition-all hover:opacity-80"
                    style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '2px' : '0' }}
                    title={`${item.hour}:00 - ${item.count} scans`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>0:00</span>
              <span>12:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Daily Pattern */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Scan Days (30 days)
              </h3>
              {scanPatterns.summary.busiest_day && (
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Busiest: {scanPatterns.summary.busiest_day}
                </span>
              )}
            </div>
            <div className="flex items-end gap-1 h-20">
              {scanPatterns.daily_pattern.map((item) => {
                const maxCount = Math.max(...scanPatterns.daily_pattern.map(d => d.count), 1)
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-emerald-500 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                      title={`${item.day}: ${item.count} scans`}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.day.slice(0, 2)}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-semibold">{scanPatterns.summary.total_scans_30d}</span> scans in 30 days
            </div>
          </div>
        </div>
      )}

      {/* Realtime Activity Feed */}
      {realtimeFeed && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Live Activity Feed (24h)
            </h3>
            <div className="flex gap-3 text-xs">
              <span className="text-blue-600 dark:text-blue-400">
                Users: {realtimeFeed.summary.user_registrations}
              </span>
              <span className="text-orange-600 dark:text-orange-400">
                Pets: {realtimeFeed.summary.pet_registrations}
              </span>
              <span className="text-purple-600 dark:text-purple-400">
                QR: {realtimeFeed.summary.qr_activations}
              </span>
              <span className="text-cyan-600 dark:text-cyan-400">
                Scans: {realtimeFeed.summary.qr_scans}
              </span>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {realtimeFeed.activities.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              realtimeFeed.activities.slice(0, 20).map((activity, index) => (
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
      )}

      {/* Recent Activity */}
      {recentActivity && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Recent Users */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Recent Users ({recentActivity.summary.new_users_7d} in 7 days)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.recent_users.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent users</p>
              ) : (
                recentActivity.recent_users.map(user => (
                  <div key={user.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-900 dark:text-white">{user.email}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        user.role === 'super_admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        user.role === 'tenant_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Tenants */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              Recent Tenants ({recentActivity.summary.new_tenants_30d} in 30 days)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.recent_tenants.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent tenants</p>
              ) : (
                recentActivity.recent_tenants.map(tenant => (
                  <div key={tenant.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-900 dark:text-white">{tenant.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({tenant.subdomain})</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tier Distribution */}
      {tenantPerformance && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Subscription Tiers</h3>
          <div className="flex gap-4">
            {Object.entries(tenantPerformance.tier_distribution).map(([tier, count]) => (
              <div key={tier} className="flex-1 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                  tier === 'enterprise' ? 'bg-purple-100 dark:bg-purple-900/30' :
                  tier === 'standard' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <span className={`text-lg font-bold ${
                    tier === 'enterprise' ? 'text-purple-600 dark:text-purple-400' :
                    tier === 'standard' ? 'text-blue-600 dark:text-blue-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{tier}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
