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
  async listTenantUsers(skip = 0, limit = 100): Promise<any[]> {
    return await apiClient.get<any[]>('/api/v1/admin/users', {
      params: { skip, limit }
    })
  },
}
