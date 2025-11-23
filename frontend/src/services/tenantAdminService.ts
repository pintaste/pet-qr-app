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
  activated_by_user_id?: number
  activation_count: number
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
  qr_code_id?: string
}

export interface TenantPetListParams {
  skip?: number
  limit?: number
  search?: string
  species?: string
}

export interface TenantScanEvent {
  id: number
  qr_code_id: number
  ip_address?: string
  user_agent?: string
  location_data?: Record<string, unknown>
  scanned_at: string
  qr_code?: string
  pet_name?: string
  owner_id?: number
  owner_email?: string
}

export interface TenantScanEventListParams {
  skip?: number
  limit?: number
}

// Comprehensive Analytics Types
export interface ComprehensiveAnalytics {
  overview: OverviewSummary
  qr_activity: QRActivity
  user_engagement: UserEngagement
  pet_statistics: PetStatistics
  qr_inventory: QRInventory
  support_metrics: SupportMetrics
}

export interface OverviewSummary {
  total_users: number
  active_users: number
  inactive_users: number
  total_qr_codes: number
  active_qr_codes: number
  inactive_qr_codes: number
  total_pets: number
  total_scans: number
}

export interface QRActivity {
  scans_over_time: Array<{ date: string; count: number }>
  top_scanned_qr_codes: Array<{
    code: string
    id: number
    pet_name: string | null
    scan_count: number
  }>
  scan_locations: Array<Record<string, unknown>>
  activation_rate: number
}

export interface UserEngagement {
  registrations_over_time: Array<{ date: string; count: number }>
  total_users: number
  active_users: number
  inactive_users: number
  pet_to_user_ratio: number
  users_with_pets: number
  users_without_pets: number
}

export interface PetStatistics {
  pets_by_species: Array<{ species: string; count: number }>
  top_breeds: Array<{ breed: string; count: number }>
  total_pets: number
  pets_with_qr: number
  pets_without_qr: number
  lost_pets: number
}

export interface QRInventory {
  qr_by_status: Array<{ status: string; count: number }>
  qr_by_batch: Array<{ batch: string; count: number }>
  available_qr_codes: number
  recent_qr_codes: number
}

export interface SupportMetrics {
  tickets_by_status: Array<{ status: string; count: number }>
  tickets_by_priority: Array<{ priority: string; count: number }>
  open_tickets: number
  recent_tickets: number
}

export const tenantAdminService = {
  /**
   * Get tenant analytics
   */
  async getTenantStats(): Promise<TenantStats> {
    return await apiClient.get<TenantStats>('/api/v1/admin/analytics/tenant')
  },

  /**
   * Get comprehensive analytics for the dashboard
   */
  async getComprehensiveAnalytics(days: number = 30): Promise<ComprehensiveAnalytics> {
    return await apiClient.get<ComprehensiveAnalytics>('/api/v1/admin/analytics/comprehensive', {
      params: { days }
    })
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

  /**
   * List scan events for the tenant
   */
  async listTenantScanEvents(params: TenantScanEventListParams = {}): Promise<TenantScanEvent[]> {
    const { skip = 0, limit = 100 } = params
    return await apiClient.get<TenantScanEvent[]>('/api/v1/admin/scan-events', {
      params: { skip, limit }
    })
  },
}
