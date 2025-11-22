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
}
