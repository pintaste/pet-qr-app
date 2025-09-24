import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SecurityAttempt {
  qrCode: string
  attempts: number
  cooldownUntil: number | null
  isBlocked: boolean
  lastAttempt: number
}

interface SecurityState {
  securityAttempts: Record<string, SecurityAttempt> // QR code -> security data

  // Actions
  getSecurityData: (qrCode: string) => SecurityAttempt
  incrementAttempts: (qrCode: string) => void
  setCooldown: (qrCode: string, cooldownUntil: number) => void
  blockQRCode: (qrCode: string) => void
  clearSecurityData: (qrCode: string) => void
  clearAllSecurityData: () => void
}

// Security constants
const MAX_ATTEMPTS = 3
// Progressive cooldown: 30s for 4th, 1min for 5th, 5min for 6th, 30min for 7th, 2hr for 8th, 12hr for 9th, 24hr for 10th+
const COOLDOWN_TIMES = [
  30,           // 4th attempt (after 3 failures)
  60,           // 5th attempt
  300,          // 6th attempt (5 minutes)
  1800,         // 7th attempt (30 minutes)
  7200,         // 8th attempt (2 hours)
  43200,        // 9th attempt (12 hours)
  86400         // 10th+ attempt (24 hours)
]
const BLOCK_AFTER_ATTEMPTS = 10 // Block after 10 attempts instead of 6
const SECURITY_DATA_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      securityAttempts: {},

      getSecurityData: (qrCode: string) => {
        const data = get().securityAttempts[qrCode]

        // Return default data if none exists or if expired
        if (!data || (Date.now() - data.lastAttempt > SECURITY_DATA_EXPIRY)) {
          const defaultData: SecurityAttempt = {
            qrCode,
            attempts: 0,
            cooldownUntil: null,
            isBlocked: false,
            lastAttempt: Date.now()
          }

          // Clean up expired data
          if (data && Date.now() - data.lastAttempt > SECURITY_DATA_EXPIRY) {
            get().clearSecurityData(qrCode)
          }

          return defaultData
        }

        // Check if cooldown has expired
        if (data.cooldownUntil && Date.now() >= data.cooldownUntil) {
          const updatedData = {
            ...data,
            cooldownUntil: null
          }

          set((state) => ({
            securityAttempts: {
              ...state.securityAttempts,
              [qrCode]: updatedData
            }
          }))

          return updatedData
        }

        return data
      },

      incrementAttempts: (qrCode: string) => {
        const currentData = get().getSecurityData(qrCode)
        const newAttempts = currentData.attempts + 1

        // Determine if should be blocked
        const isBlocked = newAttempts >= BLOCK_AFTER_ATTEMPTS

        // Determine cooldown
        let cooldownUntil: number | null = null
        if (newAttempts % MAX_ATTEMPTS === 0 && !isBlocked) {
          const cooldownIndex = Math.min(
            Math.floor((newAttempts - 1) / MAX_ATTEMPTS),
            COOLDOWN_TIMES.length - 1
          )
          const cooldownSeconds = COOLDOWN_TIMES[cooldownIndex]
          cooldownUntil = Date.now() + (cooldownSeconds * 1000)
        }

        const updatedData: SecurityAttempt = {
          qrCode,
          attempts: newAttempts,
          cooldownUntil,
          isBlocked,
          lastAttempt: Date.now()
        }

        set((state) => ({
          securityAttempts: {
            ...state.securityAttempts,
            [qrCode]: updatedData
          }
        }))
      },

      setCooldown: (qrCode: string, cooldownUntil: number) => {
        const currentData = get().getSecurityData(qrCode)

        set((state) => ({
          securityAttempts: {
            ...state.securityAttempts,
            [qrCode]: {
              ...currentData,
              cooldownUntil,
              lastAttempt: Date.now()
            }
          }
        }))
      },

      blockQRCode: (qrCode: string) => {
        const currentData = get().getSecurityData(qrCode)

        set((state) => ({
          securityAttempts: {
            ...state.securityAttempts,
            [qrCode]: {
              ...currentData,
              isBlocked: true,
              lastAttempt: Date.now()
            }
          }
        }))
      },

      clearSecurityData: (qrCode: string) => {
        set((state) => {
          const newSecurityAttempts = { ...state.securityAttempts }
          delete newSecurityAttempts[qrCode]
          return { securityAttempts: newSecurityAttempts }
        })
      },

      clearAllSecurityData: () => {
        set({ securityAttempts: {} })
      }
    }),
    {
      name: 'security-store'
    }
  )
)

// Export constants for use in components
export { MAX_ATTEMPTS, COOLDOWN_TIMES, BLOCK_AFTER_ATTEMPTS }