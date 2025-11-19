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
  created_at: string
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

export interface GenerateQRBatchRequest {
  batch_id: string
  quantity: number
  assigned_to_tenant_id?: number
  print_data?: Record<string, any>
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
   * List all users across platform
   */
  async listAllUsers(skip = 0, limit = 100): Promise<any[]> {
    return await apiClient.get<any[]>('/api/v1/super-admin/users', {
      params: { skip, limit }
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
