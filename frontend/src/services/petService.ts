import { apiClient } from './api'

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

interface CreatePetRequest {
  name: string
  breed: string
  age_months: number
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
    return await apiClient.post<Pet>('/api/pets', petData)
  }

  async getPets(params?: {
    skip?: number
    limit?: number
    search?: string
    owner_id?: number
  }): Promise<PetListResponse> {
    const queryParams: Record<string, string> = {}

    if (params?.skip !== undefined) queryParams.skip = params.skip.toString()
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString()
    if (params?.search) queryParams.search = params.search
    if (params?.owner_id !== undefined) queryParams.owner_id = params.owner_id.toString()

    return await apiClient.get<PetListResponse>('/api/pets', queryParams)
  }

  async getPet(petId: number): Promise<Pet> {
    return await apiClient.get<Pet>(`/api/pets/${petId}`)
  }

  async updatePet(petId: number, updates: UpdatePetRequest): Promise<Pet> {
    return await apiClient.put<Pet>(`/api/pets/${petId}`, updates)
  }

  async deletePet(petId: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/pets/${petId}`)
  }

  async getPetsByOwner(ownerId: number, params?: {
    skip?: number
    limit?: number
  }): Promise<Pet[]> {
    const queryParams: Record<string, string> = {
      owner_id: ownerId.toString(),
    }

    if (params?.skip !== undefined) queryParams.skip = params.skip.toString()
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString()

    const response = await apiClient.get<PetListResponse>('/api/pets', queryParams)
    return response.pets
  }

  async addPetPhoto(petId: number, photoUrl: string): Promise<Pet> {
    return await apiClient.post<Pet>(`/api/pets/${petId}/photos`, {
      photo_url: photoUrl
    })
  }

  async removePetPhoto(petId: number, photoUrl: string): Promise<Pet> {
    return await apiClient.delete<Pet>(`/api/pets/${petId}/photos?photo_url=${encodeURIComponent(photoUrl)}`)
  }

  async uploadPetPhoto(petId: number, file: File): Promise<{ photo_url: string }> {
    return await apiClient.uploadFile<{ photo_url: string }>(
      `/api/pets/${petId}/upload-photo`,
      file
    )
  }

  async getPetStatistics(): Promise<PetStatistics> {
    return await apiClient.get<PetStatistics>('/api/pets/statistics')
  }

  async linkPetToQR(petId: number, qrCodeId: number): Promise<Pet> {
    return await apiClient.post<Pet>(`/api/pets/${petId}/link-qr`, {
      qr_code_id: qrCodeId
    })
  }

  async unlinkPetFromQR(petId: number): Promise<Pet> {
    return await apiClient.post<Pet>(`/api/pets/${petId}/unlink-qr`)
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
    const queryParams: Record<string, string> = {}

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams[key] = value.toString()
      }
    })

    return await apiClient.get<PetListResponse>('/api/pets/search', queryParams)
  }

  // Bulk operations
  async bulkUpdatePets(
    petIds: number[],
    updates: UpdatePetRequest
  ): Promise<{ updated_count: number; pets: Pet[] }> {
    return await apiClient.post<{ updated_count: number; pets: Pet[] }>('/api/pets/bulk-update', {
      pet_ids: petIds,
      updates,
    })
  }

  async bulkDeletePets(petIds: number[]): Promise<{ deleted_count: number }> {
    return await apiClient.post<{ deleted_count: number }>('/api/pets/bulk-delete', {
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