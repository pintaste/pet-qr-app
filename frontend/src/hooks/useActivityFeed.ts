import { useState, useEffect, useCallback } from 'react'
import { superAdminService, RealtimeFeed } from '@/services/superAdminService'

/**
 * Activity feed filter options
 */
export type ActivityFilter = 'all' | 'user_registered' | 'tenant_created' | 'pet_registered' | 'qr_activated' | 'qr_scanned'

/**
 * Configuration options for the activity feed hook
 */
export interface UseActivityFeedOptions {
  /** Initial time range in hours */
  initialTimeRange?: number
  /** Initial filter type */
  initialFilter?: string
  /** Number of activities per page */
  activitiesPerPage?: number
  /** Whether auto-refresh is enabled by default */
  autoRefreshEnabled?: boolean
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval?: number
}

/**
 * Return type for the useActivityFeed hook
 */
export interface UseActivityFeedReturn {
  // State values
  activityFeed: RealtimeFeed | null
  isActivityLoading: boolean
  activityTimeRange: number
  customStartDate: string
  customEndDate: string
  activityFilter: string
  activitySkip: number
  lastActivityUpdate: Date | null

  // Setters
  setActivityTimeRange: React.Dispatch<React.SetStateAction<number>>
  setCustomStartDate: React.Dispatch<React.SetStateAction<string>>
  setCustomEndDate: React.Dispatch<React.SetStateAction<string>>
  setActivityFilter: React.Dispatch<React.SetStateAction<string>>
  setActivitySkip: React.Dispatch<React.SetStateAction<number>>

  // Functions
  fetchActivityFeed: (resetSkip?: boolean) => Promise<void>
  _loadMoreActivities: () => void
}

/**
 * Custom hook for managing activity feed state and logic
 *
 * Handles fetching, filtering, and pagination of activity feed data
 * for the Super Admin Dashboard overview tab.
 *
 * @param isActive - Whether the activity feed should be active (typically when overview tab is selected)
 * @param options - Configuration options for the hook
 * @returns Activity feed state and handler functions
 *
 * @example
 * ```tsx
 * const {
 *   activityFeed,
 *   isActivityLoading,
 *   activityTimeRange,
 *   setActivityTimeRange,
 *   fetchActivityFeed,
 * } = useActivityFeed(activeTab === 'overview')
 * ```
 */
export function useActivityFeed(
  isActive: boolean,
  options: UseActivityFeedOptions = {}
): UseActivityFeedReturn {
  const {
    initialTimeRange = 24,
    initialFilter = 'all',
    activitiesPerPage = 10,
    autoRefreshEnabled: initialAutoRefresh = true,
    autoRefreshInterval = 30000
  } = options

  // Activity feed states
  const [activityFeed, setActivityFeed] = useState<RealtimeFeed | null>(null)
  const [isActivityLoading, setIsActivityLoading] = useState(false)
  const [activityFilter, setActivityFilter] = useState<string>(initialFilter)
  const [activityTimeRange, setActivityTimeRange] = useState<number>(initialTimeRange)
  const [activitySkip, setActivitySkip] = useState(0)
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [lastActivityUpdate, setLastActivityUpdate] = useState<Date | null>(null)

  /**
   * Fetch activity feed data from the API
   *
   * @param resetSkip - Whether to reset the skip value to 0
   */
  const fetchActivityFeed = useCallback(async (resetSkip: boolean = false) => {
    try {
      setIsActivityLoading(true)
      const currentSkip = resetSkip ? 0 : activitySkip
      if (resetSkip) {
        setActivitySkip(0)
      }
      const feed = await superAdminService.getRealtimeFeed({
        skip: currentSkip,
        limit: activitiesPerPage,
        hours: activityTimeRange,
        activity_type: activityFilter === 'all' ? undefined : activityFilter
      })
      setActivityFeed(feed)
      setLastActivityUpdate(new Date())
    } catch (err) {
      console.error('Error fetching activity feed:', err)
    } finally {
      setIsActivityLoading(false)
    }
  }, [activitySkip, activitiesPerPage, activityTimeRange, activityFilter])

  // Fetch activity feed when tab becomes active or filters change
  useEffect(() => {
    if (isActive) {
      fetchActivityFeed(true)
    }
  }, [isActive, activityTimeRange, activityFilter])

  // Handle pagination - fetch more when skip changes
  useEffect(() => {
    if (isActive && activitySkip > 0) {
      fetchActivityFeed(false)
    }
  }, [activitySkip])

  // Auto-refresh activity feed
  useEffect(() => {
    if (!isActive || !initialAutoRefresh) return

    const interval = setInterval(() => {
      fetchActivityFeed(true)
    }, autoRefreshInterval)

    return () => clearInterval(interval)
  }, [isActive, initialAutoRefresh, activityTimeRange, activityFilter, fetchActivityFeed])

  /**
   * Load more activities by increasing the skip value
   *
   * Note: Prefixed with underscore as it may not be used in all implementations
   * but is available for future pagination features.
   */
  const _loadMoreActivities = useCallback(() => {
    const newSkip = activitySkip + activitiesPerPage
    setActivitySkip(newSkip)
  }, [activitySkip, activitiesPerPage])

  return {
    // State values
    activityFeed,
    isActivityLoading,
    activityTimeRange,
    customStartDate,
    customEndDate,
    activityFilter,
    activitySkip,
    lastActivityUpdate,

    // Setters
    setActivityTimeRange,
    setCustomStartDate,
    setCustomEndDate,
    setActivityFilter,
    setActivitySkip,

    // Functions
    fetchActivityFeed,
    _loadMoreActivities
  }
}

export default useActivityFeed
