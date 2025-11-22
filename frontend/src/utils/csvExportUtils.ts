/**
 * Utility functions for exporting data to CSV format
 */

import type { RealtimeFeed } from '@/services/superAdminService'

interface ExportActivityOptions {
  activityFeed: RealtimeFeed | null
  activityTimeRange: number
  customStartDate: string
  customEndDate: string
}

/**
 * Exports activity log data to a CSV file.
 *
 * @param options - Export options containing activity data and time range
 * @returns void - Downloads a CSV file
 *
 * @example
 * exportActivityToCSV({
 *   activityFeed: feedData,
 *   activityTimeRange: 24,
 *   customStartDate: '',
 *   customEndDate: ''
 * })
 */
export const exportActivityToCSV = (options: ExportActivityOptions): void => {
  const { activityFeed, activityTimeRange, customStartDate, customEndDate } = options

  if (!activityFeed?.activities || activityFeed.activities.length === 0) return

  const now = new Date()
  const exportDateTime = now.toLocaleString()

  // Calculate data time range
  let dataTimeRange = ''
  if (customStartDate && customEndDate) {
    dataTimeRange = `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`
  } else {
    const rangeLabels: Record<number, string> = {
      1: 'Last 1 hour',
      24: 'Last 24 hours',
      168: 'Last 7 days',
      720: 'Last 30 days',
      2160: 'Last 90 days'
    }
    dataTimeRange = rangeLabels[activityTimeRange] || `Last ${activityTimeRange} hours`
  }

  // Metadata section
  const metadata = [
    ['Pet QR System - Activity Log Export'],
    ['Export Date/Time', exportDateTime],
    ['Data Time Range', dataTimeRange],
    ['Total Records', String(activityFeed.activities.length)],
    ['']
  ]

  // CSV header
  const headers = ['Time', 'Type', 'Description', 'Tenant', 'User']

  // CSV rows - use user_email from API
  const rows = activityFeed.activities.map(activity => [
    new Date(activity.timestamp).toLocaleString(),
    activity.type,
    activity.description,
    activity.tenant_name || '-',
    activity.user_email || '-'
  ])

  // Combine metadata, headers and rows
  const csvContent = [
    ...metadata.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  link.setAttribute('download', `pet_qr_activity_log_${timestamp}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exports a generic data array to CSV format.
 *
 * @param data - Array of objects to export
 * @param filename - Name of the CSV file
 * @param headers - Optional custom headers (uses object keys if not provided)
 */
export const exportToCSV = <T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: string[]
): void => {
  if (data.length === 0) return

  const keys = headers || Object.keys(data[0])

  const csvContent = [
    keys.join(','),
    ...data.map(row =>
      keys.map(key => {
        const value = row[key]
        const stringValue = value === null || value === undefined ? '' : String(value)
        return `"${stringValue.replace(/"/g, '""')}"`
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
