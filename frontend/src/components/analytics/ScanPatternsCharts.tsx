/**
 * Scan Patterns Charts Component
 *
 * Displays QR code scanning patterns:
 * - Hourly distribution (24-hour view)
 * - Daily distribution (day of week)
 * - Peak hours and busiest days
 */

import React from 'react'
import {
  Clock,
  BarChart3,
} from 'lucide-react'
import { ScanPatterns } from '@/services/superAdminService'

interface ScanPatternsChartsProps {
  scanPatterns: ScanPatterns | null
}

export const ScanPatternsCharts: React.FC<ScanPatternsChartsProps> = ({ scanPatterns }) => {
  if (!scanPatterns) return null

  return (
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
  )
}
