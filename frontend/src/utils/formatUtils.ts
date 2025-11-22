/**
 * Utility functions for formatting data
 */

/**
 * Formats a timestamp into a human-readable relative time string.
 *
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted relative time string (e.g., "5 minutes ago", "2 hours ago")
 *
 * @example
 * formatRelativeTime('2024-01-01T12:00:00Z') // "3 days ago"
 */
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

/**
 * Formats a date for display in forms and UI.
 *
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', options)
}

/**
 * Formats a number with thousand separators.
 *
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US')
}

/**
 * Formats bytes to human-readable size.
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
