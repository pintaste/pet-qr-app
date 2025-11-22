/**
 * Tenant Admin API Service
 *
 * Handles all API calls for tenant admin dashboard functionality.
 */

import { apiClient } from './api'

export interface TenantStats {
  tenant_id: number
  total_users: number
  active_users: number
  total_pets: number
  total_qr_codes: number
  active_qr_codes: number
  total_scans: number
}

export interface TenantUser {
  id: number
  email: string
  role: string
  is_active: boolean
  created_at: string
  pet_count?: number
  qr_count?: number
}

export interface CreateTenantUserRequest {
  email: string
  password: string
}

export interface UpdateTenantUserRequest {
  email?: string
  is_active?: boolean
}

export interface TenantUserListParams {
  skip?: number
  limit?: number
  search?: string
}

export interface TenantQRCode {
  id: number
  code: string
  pin: string
  status: 'active' | 'inactive' | 'pending'
  pet_id?: number
  pet_name?: string
  user_id?: number
  user_email?: string
  batch_id?: string
  activated_at?: string
  created_at: string
}

export interface TenantQRListParams {
  skip?: number
  limit?: number
  status?: string
  search?: string
}

export interface TenantPet {
  id: number
  name: string
  pet_type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other'
  breed?: string
  gender: 'male' | 'female' | 'unknown'
  size?: 'xs' | 's' | 'm' | 'l' | 'xl'
  color?: string
  birth_date?: string
  profile_photo_url?: string
  is_active: boolean
  is_lost: boolean
  owner_id: number
  owner_email: string
  created_at: string
}

export interface TenantPetListParams {
  skip?: number
  limit?: number
  search?: string
  species?: string
}

export const tenantAdminService = {
  /**
   * Get tenant analytics
   */
  async getTenantStats(): Promise<TenantStats> {
    return await apiClient.get<TenantStats>('/api/v1/admin/analytics/tenant')
  },

  /**
   * List users in tenant
   */
  async listTenantUsers(params: TenantUserListParams = {}): Promise<TenantUser[]> {
    const { skip = 0, limit = 100, search } = params
    return await apiClient.get<TenantUser[]>('/api/v1/admin/users', {
      params: { skip, limit, search }
    })
  },

  /**
   * Get user by ID
   */
  async getUser(userId: number): Promise<TenantUser> {
    return await apiClient.get<TenantUser>(`/api/v1/admin/users/${userId}`)
  },

  /**
   * Create a new user in the tenant
   */
  async createUser(data: CreateTenantUserRequest): Promise<TenantUser> {
    return await apiClient.post<TenantUser>('/api/v1/admin/users', data)
  },

  /**
   * Update a user in the tenant
   */
  async updateUser(userId: number, data: UpdateTenantUserRequest): Promise<TenantUser> {
    return await apiClient.put<TenantUser>(`/api/v1/admin/users/${userId}`, data)
  },

  /**
   * Delete a user from the tenant
   */
  async deleteUser(userId: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/v1/admin/users/${userId}`)
  },

  /**
   * Reset user password
   */
  async resetUserPassword(userId: number, newPassword: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(`/api/v1/admin/users/${userId}/reset-password`, {
      new_password: newPassword
    })
  },

  /**
   * List QR codes in tenant (dedicated endpoint for Tenant Admin)
   */
  async listTenantQRCodes(params: TenantQRListParams = {}): Promise<TenantQRCode[]> {
    const { skip = 0, limit = 100, status, search } = params
    return await apiClient.get<TenantQRCode[]>('/api/v1/admin/qr-codes', {
      params: { skip, limit, status, search }
    })
  },

  /**
   * Get QR code by ID
   */
  async getQRCode(qrCodeId: number): Promise<TenantQRCode> {
    return await apiClient.get<TenantQRCode>(`/api/v1/qr-codes/${qrCodeId}`)
  },

  /**
   * List pets in tenant
   */
  async listTenantPets(params: TenantPetListParams = {}): Promise<TenantPet[]> {
    const { skip = 0, limit = 100, search, species } = params
    return await apiClient.get<TenantPet[]>('/api/v1/admin/pets', {
      params: { skip, limit, search, species }
    })
  },
}
