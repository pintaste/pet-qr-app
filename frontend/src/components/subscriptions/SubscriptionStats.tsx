/**
 * Subscription Statistics Component
 *
 * Displays clickable summary cards showing subscription metrics
 */

import { Building2, CheckCircle, AlertCircle, Clock, AlertTriangle, XCircle } from 'lucide-react'
import { SubscriptionOverview } from '../../services/superAdminService'

interface SubscriptionStatsProps {
  overview: SubscriptionOverview | null
  statusFilter: string
  onFilterChange: (filter: string) => void
}

export default function SubscriptionStats({ overview, statusFilter, onFilterChange }: SubscriptionStatsProps) {
  const stats = [
    {
      id: 'all',
      label: 'Tenants',
      value: overview?.summary.total_tenants || 0,
      icon: Building2,
      iconColor: 'text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-700',
      hoverBorder: 'hover:border-gray-300 dark:hover:border-gray-600',
      activeBorder: 'border-gray-400 dark:border-gray-500'
    },
    {
      id: 'active',
      label: 'Active',
      value: overview?.summary.active_subscriptions || 0,
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      activeBorder: 'border-emerald-400 dark:border-emerald-600'
    },
    {
      id: 'expiring_soon',
      label: 'Exp. Soon',
      value: overview?.summary.expiring_soon || 0,
      icon: AlertCircle,
      iconColor: 'text-red-500',
      borderColor: 'border-red-200 dark:border-red-800',
      hoverBorder: 'hover:border-red-300 dark:hover:border-red-700',
      activeBorder: 'border-red-400 dark:border-red-600'
    },
    {
      id: 'expiring_month',
      label: 'Exp. Month',
      value: overview?.summary.expiring_month || 0,
      icon: Clock,
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      hoverBorder: 'hover:border-yellow-300 dark:hover:border-yellow-700',
      activeBorder: 'border-yellow-400 dark:border-yellow-600'
    },
    {
      id: 'expired',
      label: 'Expired',
      value: overview?.summary.expired || 0,
      icon: AlertTriangle,
      iconColor: 'text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-700',
      hoverBorder: 'hover:border-gray-300 dark:hover:border-gray-600',
      activeBorder: 'border-gray-400 dark:border-gray-500'
    },
    {
      id: 'no_subscription',
      label: 'No Sub',
      value: overview?.tenants.filter(t => t.subscription_status === 'no_subscription').length || 0,
      icon: XCircle,
      iconColor: 'text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-700',
      hoverBorder: 'hover:border-gray-300 dark:hover:border-gray-600',
      activeBorder: 'border-gray-400 dark:border-gray-500'
    }
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const isActive = statusFilter === stat.id

        return (
          <button
            key={stat.id}
            onClick={() => onFilterChange(stat.id)}
            className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-2.5 sm:p-4 hover:shadow-lg transition-all text-left ${
              isActive
                ? `${stat.activeBorder} shadow-md`
                : `${stat.borderColor} ${stat.hoverBorder}`
            }`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.iconColor}`} />
            </div>
            <p className={`text-lg sm:text-2xl font-bold ${
              stat.id === 'active'
                ? 'text-emerald-600 dark:text-emerald-400'
                : stat.id === 'expiring_soon'
                ? 'text-red-600 dark:text-red-400'
                : stat.id === 'expiring_month'
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-900 dark:text-white'
            }`}>
              {stat.value}
            </p>
          </button>
        )
      })}
    </div>
  )
}
