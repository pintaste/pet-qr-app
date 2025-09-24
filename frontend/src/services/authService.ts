import { apiClient } from './api'
import { useAuthStore } from '@/stores/authStore'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user_id: number
  email: string
  role: string
  tenant_id?: number
}

interface RegisterRequest {
  email: string
  password: string
  name: string
}

interface RegisterResponse {
  message: string
  user_id: number
  email: string
}

interface User {
  id: number
  email: string
  role: string
  tenant_id?: number
  is_active: boolean
  created_at: string
}

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', credentials)

    // Update auth store
    const authStore = useAuthStore.getState()
    authStore.setTokens(response.access_token, response.refresh_token)
    authStore.setUser({
      id: response.user_id,
      email: response.email,
      role: response.role,
      tenant_id: response.tenant_id,
    })

    return response
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return await apiClient.post<RegisterResponse>('/api/v1/auth/register', data)
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout')
    } catch {
      // Ignore logout errors
    } finally {
      // Always clear local auth state
      const authStore = useAuthStore.getState()
      authStore.clearAuth()
    }
  }

  async getCurrentUser(): Promise<User> {
    const user = await apiClient.get<User>('/api/v1/auth/me')

    // Update auth store with fresh user data
    const authStore = useAuthStore.getState()
    authStore.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    })

    return user
  }

  async refreshToken(): Promise<string> {
    const authStore = useAuthStore.getState()
    if (!authStore.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await apiClient.post<{ access_token: string; token_type: string }>('/api/v1/auth/refresh', {
      refresh_token: authStore.refreshToken,
    })

    authStore.setTokens(response.access_token, authStore.refreshToken)
    return response.access_token
  }

  async verifyToken(): Promise<boolean> {
    try {
      const result = await apiClient.post<{ valid: boolean }>('/api/v1/auth/verify-token')
      return result.valid
    } catch {
      return false
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated
  }

  // Get current user from store
  getCurrentUserFromStore() {
    return useAuthStore.getState().user
  }

  // Get access token from store
  getAccessToken(): string | null {
    return useAuthStore.getState().accessToken
  }
}

export const authService = new AuthService()
export { AuthService }