/**
 * User Dashboard API Service
 *
 * Handles all API calls for regular user dashboard functionality.
 */

import { apiClient } from './api'

export interface UserDashboardStats {
  total_pets: number
  active_qr_codes: number
  total_scans: number
  recent_scans: number
}

export const userDashboardService = {
  /**
   * Get user dashboard stats
   */
  async getDashboardStats(): Promise<UserDashboardStats> {
    return await apiClient.get<UserDashboardStats>('/api/v1/user/dashboard/stats')
  },

  /**
   * Get user activity
   */
  async getUserActivity(skip = 0, limit = 20): Promise<any[]> {
    return await apiClient.get<any[]>('/api/v1/user/dashboard/activity', {
      params: { skip, limit }
    })
  },
}
