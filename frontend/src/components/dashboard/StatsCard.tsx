import React from 'react'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'indigo' | 'green' | 'blue' | 'purple' | 'orange'
  onClick?: () => void
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
  onClick,
}) => {
  const colorClasses = {
    indigo: 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
    green: 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    blue: 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    purple: 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    orange: 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-3xl font-light text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  )
}

export default StatsCard
