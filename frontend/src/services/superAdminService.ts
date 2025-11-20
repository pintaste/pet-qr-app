/**
 * Super Admin API Service
 *
 * Handles all API calls for super admin dashboard functionality.
 */

import { apiClient } from './api'

export interface Tenant {
  id: number
  name: string
  subdomain: string
  custom_domain: string | null
  tier: 'standard' | 'enterprise'
  is_active: boolean
  subscription_expires_at: string | null
  created_at: string
  user_count?: number
}

export interface PlatformStats {
  total_tenants: number
  active_tenants: number
  total_users: number
  active_users: number
  total_pets: number
  total_qr_codes: number
  total_scans: number
}

export interface CreateTenantRequest {
  name: string
  subdomain: string
  tier: 'standard' | 'enterprise'
  admin_email: string
  admin_password: string
}

export interface UpdateTenantRequest {
  name?: string
  tier?: 'standard' | 'enterprise'
  is_active?: boolean
  custom_domain?: string
  subscription_expires_at?: string | null
}

export interface GenerateQRBatchRequest {
  batch_id: string
  quantity: number
  assigned_to_tenant_id?: number
  print_data?: Record<string, any>
}

export interface PlatformUser {
  id: number
  email: string
  tenant_id: number | null
  tenant_name: string | null
  role: 'super_admin' | 'tenant_admin' | 'user'
  is_active: boolean
  created_at: string
}

export interface CreateUserRequest {
  email: string
  password: string
  role: 'super_admin' | 'tenant_admin' | 'user'
  tenant_id?: number | null
}

export interface UpdateUserRequest {
  email?: string
  role?: 'super_admin' | 'tenant_admin' | 'user'
  is_active?: boolean
  tenant_id?: number | null
}

export interface UserListParams {
  skip?: number
  limit?: number
  role?: string
  tenant_id?: number
  search?: string
}

export const superAdminService = {
  /**
   * Get platform-wide analytics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    return await apiClient.get<PlatformStats>('/api/v1/super-admin/analytics/platform')
  },

  /**
   * List all tenants
   */
  async listTenants(): Promise<Tenant[]> {
    return await apiClient.get<Tenant[]>('/api/v1/super-admin/tenants')
  },

  /**
   * Create a new tenant
   */
  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    return await apiClient.post<Tenant>('/api/v1/super-admin/tenants', data)
  },

  /**
   * Get tenant details by ID
   */
  async getTenant(tenantId: number): Promise<Tenant> {
    return await apiClient.get<Tenant>(`/api/v1/super-admin/tenants/${tenantId}`)
  },

  /**
   * Update tenant details
   */
  async updateTenant(tenantId: number, data: UpdateTenantRequest): Promise<Tenant> {
    return await apiClient.put<Tenant>(`/api/v1/super-admin/tenants/${tenantId}`, data)
  },

  /**
   * Delete a tenant
   */
  async deleteTenant(tenantId: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/v1/super-admin/tenants/${tenantId}`)
  },

  /**
   * List all users across platform
   */
  async listAllUsers(params: UserListParams = {}): Promise<PlatformUser[]> {
    const { skip = 0, limit = 100, role, tenant_id, search } = params
    return await apiClient.get<PlatformUser[]>('/api/v1/super-admin/users', {
      params: { skip, limit, role, tenant_id, search }
    })
  },

  /**
   * Get user by ID
   */
  async getUser(userId: number): Promise<PlatformUser> {
    return await apiClient.get<PlatformUser>(`/api/v1/super-admin/users/${userId}`)
  },

  /**
   * Create a new user
   */
  async createUser(data: CreateUserRequest): Promise<PlatformUser> {
    return await apiClient.post<PlatformUser>('/api/v1/super-admin/users', data)
  },

  /**
   * Update user
   */
  async updateUser(userId: number, data: UpdateUserRequest): Promise<PlatformUser> {
    return await apiClient.put<PlatformUser>(`/api/v1/super-admin/users/${userId}`, data)
  },

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/v1/super-admin/users/${userId}`)
  },

  /**
   * Reset user password
   */
  async resetUserPassword(userId: number, newPassword: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(`/api/v1/super-admin/users/${userId}/reset-password`, {
      new_password: newPassword
    })
  },

  /**
   * Generate QR code batch
   */
  async generateQRBatch(data: GenerateQRBatchRequest): Promise<any> {
    return await apiClient.post<any>('/api/v1/super-admin/qr/batch', data)
  },

  /**
   * Get QR batch inventory
   */
  async getQRInventory(): Promise<any[]> {
    return await apiClient.get<any[]>('/api/v1/super-admin/qr/inventory')
  },
}
