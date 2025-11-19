import { useAuthStore } from '@/stores/authStore'
import { useTenantStore } from '@/stores/tenantStore'

interface ApiConfig {
  baseURL: string
  timeout: number
}

const defaultConfig: ApiConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
}

class ApiClient {
  private config: ApiConfig

  constructor(config: ApiConfig = defaultConfig) {
    this.config = config
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`

    // Get auth token from store
    const authStore = useAuthStore.getState()
    const tenantStore = useTenantStore.getState()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Add auth header if token exists
    if (authStore.accessToken) {
      headers['Authorization'] = `Bearer ${authStore.accessToken}`
    }

    // Add tenant header if available
    if (tenantStore.currentTenant) {
      headers['X-Tenant-ID'] = tenantStore.currentTenant.id.toString()
    }

    const config: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout),
    }

    try {
      const response = await fetch(url, config)

      // Handle authentication errors
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken()
        if (refreshed) {
          // Retry the original request
          headers['Authorization'] = `Bearer ${useAuthStore.getState().accessToken}`
          const retryResponse = await fetch(url, { ...config, headers })
          if (!retryResponse.ok) {
            throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`)
          }
          return await retryResponse.json()
        } else {
          // Refresh failed, clear auth and redirect to login
          authStore.clearAuth()
          window.location.href = '/auth/login'
          throw new Error('Authentication failed')
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred')
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const authStore = useAuthStore.getState()
      if (!authStore.refreshToken) {
        return false
      }

      const response = await fetch(`${this.config.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: authStore.refreshToken,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        authStore.setTokens(data.access_token, authStore.refreshToken)
        return true
      }

      return false
    } catch {
      return false
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<T> {
    let url = endpoint
    if (options?.params) {
      const searchParams = new URLSearchParams()
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      url = `${endpoint}?${searchParams.toString()}`
    }
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // File upload method
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<T> {
    const authStore = useAuthStore.getState()
    const tenantStore = useTenantStore.getState()

    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const headers: Record<string, string> = {}

    if (authStore.accessToken) {
      headers['Authorization'] = `Bearer ${authStore.accessToken}`
    }

    if (tenantStore.currentTenant) {
      headers['X-Tenant-ID'] = tenantStore.currentTenant.id.toString()
    }

    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: AbortSignal.timeout(this.config.timeout),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient()

// Export the ApiClient class for testing or custom instances
export { ApiClient }