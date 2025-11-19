/**
 * Impersonation API Service
 *
 * Handles user impersonation functionality for admins.
 */

import { apiClient } from './api'

export interface ImpersonationStatus {
  is_impersonating: boolean
  original_user: {
    id: number
    email: string
    role: string
  }
  impersonated_user?: {
    id: number
    email: string
    role: string
    tenant_id?: number
  }
  started_at?: string
}

export const impersonationService = {
  /**
   * Start impersonating a user
   */
  async startImpersonation(userId: number): Promise<any> {
    return await apiClient.post<any>('/api/v1/impersonate/start', {
      user_id: userId
    })
  },

  /**
   * Stop impersonation
   */
  async stopImpersonation(): Promise<any> {
    return await apiClient.post<any>('/api/v1/impersonate/stop')
  },

  /**
   * Get current impersonation status
   */
  async getStatus(): Promise<ImpersonationStatus> {
    return await apiClient.get<ImpersonationStatus>('/api/v1/impersonate/status')
  },
}
