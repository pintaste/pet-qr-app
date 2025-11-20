import { apiClient } from './api'

export interface UserProfile {
  id: number
  email: string
  full_name: string | null
  role: 'super_admin' | 'tenant_admin' | 'user'
  tenant_id: number | null
  is_active: boolean
  created_at: string
}

export interface UserUpdateRequest {
  role?: 'super_admin' | 'tenant_admin' | 'user'
  email?: string
  full_name?: string
}

class UserService {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile> {
    return await apiClient.get<UserProfile>('/api/v1/users/me')
  }

  /**
   * Update current user profile
   *
   * ⚠️ WARNING: Role updates are for DEVELOPMENT ONLY
   */
  async updateCurrentUser(data: UserUpdateRequest): Promise<UserProfile> {
    return await apiClient.put<UserProfile>('/api/v1/users/me', data)
  }

  /**
   * Update user role (development helper)
   *
   * ⚠️ WARNING: This is for development/testing only.
   * In production, role changes should require admin approval.
   */
  async updateRole(role: 'super_admin' | 'tenant_admin' | 'user'): Promise<UserProfile> {
    console.warn('[DEV] Updating user role to:', role)
    return this.updateCurrentUser({ role })
  }
}

export const userService = new UserService()
export { UserService }
