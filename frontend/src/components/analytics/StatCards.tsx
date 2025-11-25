/**
 * Platform Statistics Cards Component
 *
 * Displays overview metrics in card format:
 * - Total tenants, users, active users
 * - QR codes, pets, scans
 * - Active tenants
 */

import React from 'react'
import {
  Building2,
  Users,
  Activity,
  QrCode,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import { PlatformStats } from '@/services/superAdminService'

interface StatCardsProps {
  platformStats: PlatformStats | null
}

export const StatCards: React.FC<StatCardsProps> = ({ platformStats }) => {
  if (!platformStats) return null

  const stats = [
    {
      icon: Building2,
      label: 'Tenants',
      value: platformStats.total_tenants,
      color: 'text-indigo-500',
    },
    {
      icon: Users,
      label: 'Users',
      value: platformStats.total_users,
      color: 'text-blue-500',
    },
    {
      icon: Activity,
      label: 'Active Users',
      value: platformStats.active_users,
      color: 'text-green-500',
    },
    {
      icon: QrCode,
      label: 'QR Codes',
      value: platformStats.total_qr_codes,
      color: 'text-purple-500',
    },
    {
      icon: BarChart3,
      label: 'Pets',
      value: platformStats.total_pets,
      color: 'text-orange-500',
    },
    {
      icon: TrendingUp,
      label: 'Scans',
      value: platformStats.total_scans,
      color: 'text-cyan-500',
    },
    {
      icon: Building2,
      label: 'Active',
      value: platformStats.active_tenants,
      color: 'text-emerald-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
            </div>
            <p className="text-lg sm:text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        )
      })}
    </div>
  )
}
