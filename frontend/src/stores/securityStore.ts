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
const COOLDOWN_TIMES = [30, 60, 300] // 30s, 1min, 5min
const BLOCK_AFTER_ATTEMPTS = 6
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