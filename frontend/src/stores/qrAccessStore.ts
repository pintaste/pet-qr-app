import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface QRVerification {
  timestamp: number
  petId: number
}

interface QRAccessState {
  verifiedQRCodes: Record<string, QRVerification> // QR code -> verification details
  petIdToQRCode: Record<number, string> // Pet ID -> QR code mapping

  // Actions
  markQRAsVerified: (qrCode: string, petId: number) => void
  isQRVerified: (qrCode: string) => boolean
  getVerifiedPetId: (qrCode: string) => number | null
  getQRCodeForPetId: (petId: number) => string | null
  isPetAccessible: (petId: number) => boolean
  clearVerification: (qrCode: string) => void
  clearAllVerifications: () => void
}

const VERIFICATION_EXPIRY_TIME = 30 * 60 * 1000 // 30 minutes in milliseconds

export const useQRAccessStore = create<QRAccessState>()(
  persist(
    (set, get) => ({
      verifiedQRCodes: {},
      petIdToQRCode: {},

      markQRAsVerified: (qrCode: string, petId: number) => {
        set((state) => ({
          verifiedQRCodes: {
            ...state.verifiedQRCodes,
            [qrCode]: {
              timestamp: Date.now(),
              petId
            }
          },
          petIdToQRCode: {
            ...state.petIdToQRCode,
            [petId]: qrCode
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

      getQRCodeForPetId: (petId: number) => {
        return get().petIdToQRCode[petId] || null
      },

      isPetAccessible: (petId: number) => {
        const qrCode = get().getQRCodeForPetId(petId)
        if (!qrCode) return false
        return get().isQRVerified(qrCode)
      },

      clearVerification: (qrCode: string) => {
        set((state) => {
          const newVerifiedQRCodes = { ...state.verifiedQRCodes }
          const newPetIdToQRCode = { ...state.petIdToQRCode }

          // Find and remove pet ID mapping
          const verification = state.verifiedQRCodes[qrCode]
          if (verification) {
            delete newPetIdToQRCode[verification.petId]
          }

          delete newVerifiedQRCodes[qrCode]
          return {
            verifiedQRCodes: newVerifiedQRCodes,
            petIdToQRCode: newPetIdToQRCode
          }
        })
      },

      clearAllVerifications: () => {
        set({ verifiedQRCodes: {}, petIdToQRCode: {} })
      }
    }),
    {
      name: 'qr-access-store'
    }
  )
)