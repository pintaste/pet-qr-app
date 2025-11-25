/**
 * Reusable Chart Components for Analytics
 *
 * Includes:
 * - SimpleBarChart: Basic bar chart for trends
 * - ProgressRing: Circular progress indicator
 * - GrowthCharts: User and tenant growth visualizations
 * - QRStatusCards: QR status distribution and assignment
 */

import React from 'react'
import {
  UserPlus,
  Building2,
  PieChart,
  QrCode,
  Users,
} from 'lucide-react'
import {
  GrowthAnalytics,
  QRStatusAnalytics,
} from '@/services/superAdminService'

// Simple bar chart component
interface SimpleBarChartProps {
  data: Array<{ date: string; count: number }>
  color: string
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, color }) => {
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
interface ProgressRingProps {
  percentage: number
  size?: number
  color: string
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ percentage, size = 60, color }) => {
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

// Growth Charts
interface GrowthChartsProps {
  growthData: GrowthAnalytics | null
}

export const GrowthCharts: React.FC<GrowthChartsProps> = ({ growthData }) => {
  if (!growthData) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {/* User Growth */}
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

      {/* Tenant Growth */}
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
    </div>
  )
}

// QR Status & Distribution Cards
interface QRStatusCardsProps {
  qrStatusData: QRStatusAnalytics | null
  userRoleDistribution?: Record<string, number>
}

export const QRStatusCards: React.FC<QRStatusCardsProps> = ({ qrStatusData, userRoleDistribution }) => {
  if (!qrStatusData) return null

  const assignmentPercentage =
    qrStatusData.assignment.assigned + qrStatusData.assignment.unassigned > 0
      ? (qrStatusData.assignment.assigned / (qrStatusData.assignment.assigned + qrStatusData.assignment.unassigned)) * 100
      : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* QR Status Distribution */}
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

      {/* QR Assignment */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-blue-500" />
          QR Assignment
        </h3>
        <div className="flex items-center justify-center">
          <div className="relative">
            <ProgressRing
              percentage={assignmentPercentage}
              size={80}
              color="text-blue-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {Math.round(assignmentPercentage)}%
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

      {/* User Role Distribution */}
      {userRoleDistribution && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            User Roles
          </h3>
          <div className="space-y-3">
            {Object.entries(userRoleDistribution).map(([role, count]) => (
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
  )
}
