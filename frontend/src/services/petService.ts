import { apiClient } from './api'

interface Pet {
  id: number
  name: string
  breed: string
  age: number  // Age in years (from backend)
  sex?: string
  color?: string
  size?: string
  weight?: string
  microchip_id?: string
  is_spayed_neutered?: boolean
  birthday?: string
  description?: string
  photos: string[]
  medical_info: Record<string, unknown>
  contact_info?: Record<string, unknown>
  owner_id: number
  is_pinned?: boolean
  created_at: string
  updated_at: string
  qr_code_id?: string  // String QR code identifier
}

interface CreatePetRequest {
  name: string
  breed: string
  age_months: number  // For creation, still using age_months for backward compatibility
  description?: string
  photos?: string[]
  medical_info?: any
  contact_info?: any
}

interface UpdatePetRequest extends Partial<CreatePetRequest> {}

interface PetListResponse {
  pets: Pet[]
  total: number
  skip: number
  limit: number
}

interface PetStatistics {
  total_pets: number
  pets_with_qr_codes: number
  most_common_breeds: Array<{
    breed: string
    count: number
  }>
}

class PetService {
  async createPet(petData: CreatePetRequest): Promise<Pet> {
    return await apiClient.post<Pet>('/api/v1/pets', petData)
  }

  async getPets(params?: {
    skip?: number
    limit?: number
    search?: string
    owner_id?: number
  }): Promise<Pet[]> {
    const queryParams: Record<string, any> = {}

    if (params?.skip !== undefined) queryParams.skip = params.skip
    if (params?.limit !== undefined) queryParams.limit = params.limit
    if (params?.search) queryParams.search = params.search
    if (params?.owner_id !== undefined) queryParams.owner_id = params.owner_id

    return await apiClient.get<Pet[]>('/api/v1/pets/', { params: queryParams })
  }

  async getPet(petId: number): Promise<Pet> {
    return await apiClient.get<Pet>(`/api/v1/pets/${petId}`)
  }

  async updatePet(petId: number, updates: UpdatePetRequest): Promise<Pet> {
    return await apiClient.put<Pet>(`/api/v1/pets/${petId}`, updates)
  }

  async deletePet(petId: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/v1/pets/${petId}`)
  }

  async getPetsByOwner(ownerId: number, params?: {
    skip?: number
    limit?: number
  }): Promise<Pet[]> {
    const queryParams: Record<string, any> = {
      owner_id: ownerId,
    }

    if (params?.skip !== undefined) queryParams.skip = params.skip
    if (params?.limit !== undefined) queryParams.limit = params.limit

    const response = await apiClient.get<PetListResponse>('/api/v1/pets', { params: queryParams })
    return response.pets
  }

  async addPetPhoto(petId: number, photoUrl: string): Promise<Pet> {
    return await apiClient.post<Pet>(`/api/v1/pets/${petId}/photos`, {
      photo_url: photoUrl
    })
  }

  async removePetPhoto(petId: number, photoUrl: string): Promise<Pet> {
    return await apiClient.delete<Pet>(`/api/v1/pets/${petId}/photos?photo_url=${encodeURIComponent(photoUrl)}`)
  }

  async uploadPetPhoto(petId: number, file: File): Promise<{ photo_url: string }> {
    return await apiClient.uploadFile<{ photo_url: string }>(
      `/api/v1/pets/${petId}/upload-photo`,
      file
    )
  }

  async getPetStatistics(): Promise<PetStatistics> {
    return await apiClient.get<PetStatistics>('/api/v1/pets/statistics')
  }

  async linkPetToQR(petId: number, qrCodeId: number): Promise<Pet> {
    return await apiClient.post<Pet>(`/api/v1/pets/${petId}/link-qr`, {
      qr_code_id: qrCodeId
    })
  }

  async unlinkPetFromQR(petId: number): Promise<Pet> {
    return await apiClient.post<Pet>(`/api/v1/pets/${petId}/unlink-qr`)
  }

  async togglePinPet(petId: number): Promise<Pet> {
    return await apiClient.post<Pet>(`/api/v1/pets/${petId}/toggle-pin`)
  }

  async linkQRCode(petId: number, qrCodeId: number): Promise<Pet> {
    return await apiClient.post<Pet>(`/api/v1/pets/${petId}/link-qr`, {
      qr_code_id: qrCodeId
    })
  }

  async unlinkQRCode(petId: number): Promise<Pet> {
    return await apiClient.post<Pet>(`/api/v1/pets/${petId}/unlink-qr`)
  }

  // Search pets with advanced filters
  async searchPets(filters: {
    search?: string
    breed?: string
    min_age?: number
    max_age?: number
    has_qr?: boolean
    skip?: number
    limit?: number
  }): Promise<PetListResponse> {
    const queryParams: Record<string, any> = {}

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams[key] = value
      }
    })

    return await apiClient.get<PetListResponse>('/api/v1/pets/search', { params: queryParams })
  }

  // Bulk operations
  async bulkUpdatePets(
    petIds: number[],
    updates: UpdatePetRequest
  ): Promise<{ updated_count: number; pets: Pet[] }> {
    return await apiClient.post<{ updated_count: number; pets: Pet[] }>('/api/v1/pets/bulk-update', {
      pet_ids: petIds,
      updates,
    })
  }

  async bulkDeletePets(petIds: number[]): Promise<{ deleted_count: number }> {
    return await apiClient.post<{ deleted_count: number }>('/api/v1/pets/bulk-delete', {
      pet_ids: petIds,
    })
  }

  // Export pets data
  async exportPets(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await fetch(`${apiClient}/api/pets/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${apiClient}`, // This would need to be properly implemented
      },
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    return await response.blob()
  }

  // Get pet age in human-readable format
  formatPetAge(ageMonths: number): string {
    if (ageMonths < 12) {
      return `${ageMonths} month${ageMonths !== 1 ? 's' : ''} old`
    }

    const years = Math.floor(ageMonths / 12)
    const months = ageMonths % 12

    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''} old`
    }

    return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''} old`
  }

  // Validate pet data before submission
  validatePetData(petData: CreatePetRequest | UpdatePetRequest): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if ('name' in petData && petData.name) {
      if (petData.name.length < 1 || petData.name.length > 100) {
        errors.push('Pet name must be between 1 and 100 characters')
      }
    }

    if ('breed' in petData && petData.breed) {
      if (petData.breed.length < 1 || petData.breed.length > 100) {
        errors.push('Pet breed must be between 1 and 100 characters')
      }
    }

    if ('age_months' in petData && petData.age_months !== undefined) {
      if (petData.age_months < 0 || petData.age_months > 300) {
        errors.push('Pet age must be between 0 and 300 months')
      }
    }

    if ('photos' in petData && petData.photos) {
      if (petData.photos.length > 10) {
        errors.push('Maximum 10 photos allowed per pet')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export const petService = new PetService()
export { PetService }
export type { Pet, CreatePetRequest, UpdatePetRequest, PetListResponse, PetStatistics }