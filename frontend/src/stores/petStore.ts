import { create } from 'zustand'

interface Pet {
  id: number
  name: string
  breed: string
  age_months: number
  description?: string
  photos: string[]
  medical_info: any
  contact_info: any
  owner_id: number
  tenant_id: number
  qr_code_id?: number
  created_at: string
  updated_at: string
}

interface QRCode {
  id: number
  code: string
  status: string
  pet_id?: number
  batch_name?: string
  activated_at?: string
  created_at: string
}

interface PetState {
  pets: Pet[]
  currentPet: Pet | null
  qrCodes: QRCode[]
  isLoading: boolean
  error: string | null

  // Actions
  setPets: (pets: Pet[]) => void
  addPet: (pet: Pet) => void
  updatePet: (petId: number, updates: Partial<Pet>) => void
  deletePet: (petId: number) => void
  setCurrentPet: (pet: Pet | null) => void

  setQRCodes: (qrCodes: QRCode[]) => void
  addQRCode: (qrCode: QRCode) => void
  updateQRCode: (qrCodeId: number, updates: Partial<QRCode>) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearPets: () => void
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  currentPet: null,
  qrCodes: [],
  isLoading: false,
  error: null,

  setPets: (pets: Pet[]) => {
    set({ pets, error: null })
  },

  addPet: (pet: Pet) => {
    const { pets } = get()
    set({ pets: [...pets, pet] })
  },

  updatePet: (petId: number, updates: Partial<Pet>) => {
    const { pets, currentPet } = get()

    const updatedPets = pets.map(pet =>
      pet.id === petId ? { ...pet, ...updates } : pet
    )

    const updatedCurrentPet = currentPet && currentPet.id === petId
      ? { ...currentPet, ...updates }
      : currentPet

    set({ pets: updatedPets, currentPet: updatedCurrentPet })
  },

  deletePet: (petId: number) => {
    const { pets, currentPet } = get()

    const updatedPets = pets.filter(pet => pet.id !== petId)
    const updatedCurrentPet = currentPet && currentPet.id === petId ? null : currentPet

    set({ pets: updatedPets, currentPet: updatedCurrentPet })
  },

  setCurrentPet: (pet: Pet | null) => {
    set({ currentPet: pet })
  },

  setQRCodes: (qrCodes: QRCode[]) => {
    set({ qrCodes, error: null })
  },

  addQRCode: (qrCode: QRCode) => {
    const { qrCodes } = get()
    set({ qrCodes: [...qrCodes, qrCode] })
  },

  updateQRCode: (qrCodeId: number, updates: Partial<QRCode>) => {
    const { qrCodes } = get()

    const updatedQRCodes = qrCodes.map(qr =>
      qr.id === qrCodeId ? { ...qr, ...updates } : qr
    )

    set({ qrCodes: updatedQRCodes })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  clearPets: () => {
    set({
      pets: [],
      currentPet: null,
      qrCodes: [],
      error: null,
    })
  },
}))