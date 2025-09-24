import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SuspiciousActivity {
  id: string
  timestamp: number
  type: 'direct_pet_access' | 'invalid_qr_access' | 'excessive_pin_attempts' | 'rapid_requests'
  qrCode?: string
  petId?: number
  userAgent: string
  ipAddress?: string
  metadata?: Record<string, any>
}

interface SecurityMonitorState {
  suspiciousActivities: SuspiciousActivity[]

  // Actions
  logSuspiciousActivity: (activity: Omit<SuspiciousActivity, 'id' | 'timestamp' | 'userAgent'>) => void
  getSuspiciousActivities: () => SuspiciousActivity[]
  clearOldActivities: () => void
  exportSecurityLog: () => string
}

// Keep activities for 7 days
const ACTIVITY_RETENTION_DAYS = 7
const ACTIVITY_RETENTION_TIME = ACTIVITY_RETENTION_DAYS * 24 * 60 * 60 * 1000

export const useSecurityMonitorStore = create<SecurityMonitorState>()(
  persist(
    (set, get) => ({
      suspiciousActivities: [],

      logSuspiciousActivity: (activity: Omit<SuspiciousActivity, 'id' | 'timestamp' | 'userAgent'>) => {
        const newActivity: SuspiciousActivity = {
          ...activity,
          id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        }

        set((state) => ({
          suspiciousActivities: [newActivity, ...state.suspiciousActivities]
        }))

        // Log to console for development monitoring
        console.warn('🚨 SECURITY ALERT:', {
          type: activity.type,
          qrCode: activity.qrCode,
          petId: activity.petId,
          timestamp: new Date().toISOString(),
          metadata: activity.metadata
        })

        // Clean up old activities
        get().clearOldActivities()
      },

      getSuspiciousActivities: () => {
        // Clean up expired activities before returning
        get().clearOldActivities()
        return get().suspiciousActivities
      },

      clearOldActivities: () => {
        const cutoffTime = Date.now() - ACTIVITY_RETENTION_TIME

        set((state) => ({
          suspiciousActivities: state.suspiciousActivities.filter(
            activity => activity.timestamp > cutoffTime
          )
        }))
      },

      exportSecurityLog: () => {
        const activities = get().getSuspiciousActivities()
        const reportData = {
          generatedAt: new Date().toISOString(),
          totalActivities: activities.length,
          retentionPeriodDays: ACTIVITY_RETENTION_DAYS,
          activities: activities.map(activity => ({
            ...activity,
            timestampISO: new Date(activity.timestamp).toISOString()
          }))
        }

        return JSON.stringify(reportData, null, 2)
      }
    }),
    {
      name: 'security-monitor-store'
    }
  )
)

// Export activity types for consistency
export const SUSPICIOUS_ACTIVITY_TYPES = {
  DIRECT_PET_ACCESS: 'direct_pet_access' as const,
  INVALID_QR_ACCESS: 'invalid_qr_access' as const,
  EXCESSIVE_PIN_ATTEMPTS: 'excessive_pin_attempts' as const,
  RAPID_REQUESTS: 'rapid_requests' as const
} as const