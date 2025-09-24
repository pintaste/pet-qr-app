import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface QRVerification {
  timestamp: number
  petId: number
}

interface QRAccessState {
  verifiedQRCodes: Record<string, QRVerification> // QR code -> verification details

  // Actions
  markQRAsVerified: (qrCode: string, petId: number) => void
  isQRVerified: (qrCode: string) => boolean
  getVerifiedPetId: (qrCode: string) => number | null
  clearVerification: (qrCode: string) => void
  clearAllVerifications: () => void
}

const VERIFICATION_EXPIRY_TIME = 30 * 60 * 1000 // 30 minutes in milliseconds

export const useQRAccessStore = create<QRAccessState>()(
  persist(
    (set, get) => ({
      verifiedQRCodes: {},

      markQRAsVerified: (qrCode: string, petId: number) => {
        set((state) => ({
          verifiedQRCodes: {
            ...state.verifiedQRCodes,
            [qrCode]: {
              timestamp: Date.now(),
              petId
            }
          }
        }))
      },

      isQRVerified: (qrCode: string) => {
        const verification = get().verifiedQRCodes[qrCode]
        if (!verification) return false

        // Check if verification is still valid (not expired)
        const isValid = Date.now() - verification.timestamp < VERIFICATION_EXPIRY_TIME

        // Clean up expired verification
        if (!isValid) {
          get().clearVerification(qrCode)
        }

        return isValid
      },

      getVerifiedPetId: (qrCode: string) => {
        const verification = get().verifiedQRCodes[qrCode]
        if (!verification) return null

        // Check if verification is still valid (not expired)
        const isValid = Date.now() - verification.timestamp < VERIFICATION_EXPIRY_TIME

        // Clean up expired verification
        if (!isValid) {
          get().clearVerification(qrCode)
          return null
        }

        return verification.petId
      },

      clearVerification: (qrCode: string) => {
        set((state) => {
          const newVerifiedQRCodes = { ...state.verifiedQRCodes }
          delete newVerifiedQRCodes[qrCode]
          return { verifiedQRCodes: newVerifiedQRCodes }
        })
      },

      clearAllVerifications: () => {
        set({ verifiedQRCodes: {} })
      }
    }),
    {
      name: 'qr-access-store'
    }
  )
)