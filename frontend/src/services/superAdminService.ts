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
  admin_count?: number
  pet_count?: number
  qr_count?: number
  scan_count?: number
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

// Analytics Types
export interface GrowthAnalytics {
  user_growth: {
    last_7_days: number
    last_30_days: number
    last_90_days: number
    daily_trend: Array<{ date: string; count: number }>
  }
  tenant_growth: {
    last_7_days: number
    last_30_days: number
    last_90_days: number
    daily_trend: Array<{ date: string; count: number }>
  }
  user_role_distribution: Record<string, number>
}

export interface QRStatusAnalytics {
  status_distribution: {
    active: number
    inactive: number
    expired: number
  }
  assignment: {
    assigned: number
    unassigned: number
  }
  by_tenant: Array<{
    tenant_id: number
    tenant_name: string
    total_qr_codes: number
    assigned: number
    unassigned: number
  }>
}

export interface TenantPerformance {
  tenant_rankings: Array<{
    tenant_id: number
    tenant_name: string
    subdomain: string
    tier: string
    is_active: boolean
    total_users: number
    total_pets: number
    total_qr_codes: number
    total_scans: number
    assigned_qr_codes: number
    subscription_status: string
    engagement_score: number
  }>
  tier_distribution: Record<string, number>
  total_tenants: number
  active_tenants: number
}

export interface RecentActivity {
  recent_users: Array<{
    id: number
    email: string
    role: string
    tenant_id: number | null
    created_at: string
  }>
  recent_tenants: Array<{
    id: number
    name: string
    subdomain: string
    tier: string
    is_active: boolean
    created_at: string
  }>
  summary: {
    new_users_7d: number
    new_tenants_30d: number
  }
}

export interface PetAnalytics {
  species_distribution: Record<string, number>
  breed_distribution: Record<string, number>
  tenant_breakdown: Array<{
    tenant_id: number
    tenant_name: string
    total_pets: number
    species_breakdown: Record<string, number>
  }>
  summary: {
    total_pets: number
    pets_with_photos: number
    photo_percentage: number
  }
}

export interface ScanPatterns {
  hourly_pattern: Array<{ hour: number; count: number }>
  daily_pattern: Array<{ day: string; count: number }>
  recent_scans: Array<{
    id: number
    scanned_at: string
    scanner_ip: string
    location: string | null
    pet_name: string
    species: string
    tenant_name: string
  }>
  summary: {
    total_scans_30d: number
    peak_hours: number[]
    busiest_day: string | null
  }
}

export interface RealtimeFeed {
  activities: Array<{
    type: 'user_registered' | 'tenant_created' | 'pet_registered' | 'qr_activated' | 'qr_scanned'
    timestamp: string
    description: string
    tenant_name: string | null
    user_email?: string | null
    metadata: Record<string, any>
  }>
  pagination: {
    total: number
    skip: number
    limit: number
    has_more: boolean
  }
  summary: {
    total_activities_24h: number
    user_registrations: number
    tenant_registrations: number
    pet_registrations: number
    qr_activations: number
    qr_scans: number
  }
  filter: {
    hours: number
    activity_type: string | null
  }
}

export interface RealtimeFeedParams {
  skip?: number
  limit?: number
  hours?: number
  activity_type?: string
}

// Subscription Management Types
export interface SubscriptionOverview {
  summary: {
    total_tenants: number
    active_subscriptions: number
    expiring_soon: number
    expiring_month: number
    expired: number
    no_subscription: number
    estimated_mrr: number
  }
  tier_distribution: Record<string, number>
  status_breakdown: {
    active: number
    expiring_soon: number
    expiring_month: number
    expired: number
    no_subscription: number
  }
  tenants: Array<{
    tenant_id: number
    tenant_name: string
    subdomain: string
    tier: string
    is_active: boolean
    subscription_status: 'active' | 'expiring_soon' | 'expiring_month' | 'expired' | 'no_subscription'
    subscription_expires_at: string | null
    days_remaining: number | null
    user_count: number
    pet_count: number
    qr_count: number
    feature_limits: Record<string, any>
    created_at: string
  }>
}

export interface SubscriptionUpdateRequest {
  tier?: 'standard' | 'enterprise'
  subscription_expires_at?: string | null
  is_active?: boolean
  extend_days?: number
}

export interface SubscriptionUpdateResponse {
  tenant_id: number
  tenant_name: string
  subdomain: string
  tier: string
  is_active: boolean
  subscription_expires_at: string | null
  days_remaining: number | null
  updated_at: string
  changes: string[]
  message: string
}

export interface FeatureLimits {
  tenant_id: number
  tenant_name: string
  tier: string
  limits: {
    max_pets: number
    max_qr_codes: number
    max_users: number
    max_storage_mb: number
    features: {
      analytics: boolean
      export: boolean
      custom_domain: boolean
      api_access: boolean
    }
  }
  usage: {
    pets: number
    qr_codes: number
    users: number
    storage_mb: number
  }
  usage_percentage: {
    pets: number
    qr_codes: number
    users: number
    storage_mb: number
  }
  is_custom: boolean
  at_limit: boolean
}

export interface FeatureLimitsUpdateRequest {
  max_pets?: number
  max_qr_codes?: number
  max_users?: number
  max_storage_mb?: number
  features?: {
    analytics?: boolean
    export?: boolean
    custom_domain?: boolean
    api_access?: boolean
  }
}

export interface ExpiringSubscriptions {
  count: number
  tenants: Array<{
    tenant_id: number
    tenant_name: string
    subdomain: string
    tier: string
    subscription_expires_at: string
    days_remaining: number
    admin_email: string | null
    urgency: 'critical' | 'warning' | 'notice'
  }>
  summary: {
    critical: number
    warning: number
    notice: number
  }
}

// Platform Settings Types
export interface PlatformSettings {
  // Platform Configuration
  app_name: string
  app_version: string
  environment: string
  debug_mode: boolean
  maintenance_mode: boolean

  // Security Settings
  access_token_expire_minutes: number
  refresh_token_expire_days: number
  cors_origins: string[]
  rate_limit_per_minute: number
  scan_rate_limit_per_hour: number

  // Tenant Defaults
  tenant_defaults: TenantDefaults

  // System Status
  database_connected: boolean
  redis_connected: boolean
}

export interface TenantDefaults {
  standard_tier: TierLimits
  enterprise_tier: TierLimits
}

export interface TierLimits {
  max_pets: number
  max_qr_codes: number
  max_users: number
  max_storage_mb: number
  features: {
    analytics: boolean
    export: boolean
    custom_domain: boolean
    api_access: boolean
  }
}

export interface PlatformSettingsUpdate {
  maintenance_mode?: boolean
  access_token_expire_minutes?: number
  refresh_token_expire_days?: number
  cors_origins?: string[]
  rate_limit_per_minute?: number
  scan_rate_limit_per_hour?: number
  tenant_defaults?: TenantDefaults
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
   * Bulk delete users
   */
  async bulkDeleteUsers(userIds: number[]): Promise<{ message: string; deleted_count: number; deleted_emails: string[] }> {
    return await apiClient.post<{ message: string; deleted_count: number; deleted_emails: string[] }>(
      `/api/v1/super-admin/users/bulk-delete`,
      { user_ids: userIds }
    )
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

  /**
   * Get all QR codes across all tenants
   */
  async getAllQRCodes(params?: { skip?: number; limit?: number }): Promise<any[]> {
    const queryParams: Record<string, any> = {}
    if (params?.skip !== undefined) queryParams.skip = params.skip
    if (params?.limit !== undefined) queryParams.limit = params.limit
    return await apiClient.get<any[]>('/api/v1/super-admin/qr/all', { params: queryParams })
  },

  // Analytics endpoints
  /**
   * Get growth analytics
   */
  async getGrowthAnalytics(): Promise<GrowthAnalytics> {
    return await apiClient.get<GrowthAnalytics>('/api/v1/super-admin/analytics/growth')
  },

  /**
   * Get QR status analytics
   */
  async getQRStatusAnalytics(): Promise<QRStatusAnalytics> {
    return await apiClient.get<QRStatusAnalytics>('/api/v1/super-admin/analytics/qr-status')
  },

  /**
   * Get tenant performance metrics
   */
  async getTenantPerformance(): Promise<TenantPerformance> {
    return await apiClient.get<TenantPerformance>('/api/v1/super-admin/analytics/tenant-performance')
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(): Promise<RecentActivity> {
    return await apiClient.get<RecentActivity>('/api/v1/super-admin/analytics/activity')
  },

  /**
   * Get pet analytics
   */
  async getPetAnalytics(): Promise<PetAnalytics> {
    return await apiClient.get<PetAnalytics>('/api/v1/super-admin/analytics/pets')
  },

  /**
   * Get scan patterns analytics
   */
  async getScanPatterns(): Promise<ScanPatterns> {
    return await apiClient.get<ScanPatterns>('/api/v1/super-admin/analytics/scan-patterns')
  },

  /**
   * Get realtime activity feed with pagination and filters
   */
  async getRealtimeFeed(params: RealtimeFeedParams = {}): Promise<RealtimeFeed> {
    return await apiClient.get<RealtimeFeed>('/api/v1/super-admin/analytics/realtime-feed', {
      params: {
        skip: params.skip,
        limit: params.limit,
        hours: params.hours,
        activity_type: params.activity_type
      }
    })
  },

  // =============================================================================
  // Subscription Management Methods (Option B, C, D)
  // =============================================================================

  /**
   * Get subscription overview for all tenants (Option B)
   */
  async getSubscriptionOverview(): Promise<SubscriptionOverview> {
    return await apiClient.get<SubscriptionOverview>('/api/v1/super-admin/subscriptions/overview')
  },

  /**
   * Update a tenant's subscription (Option C)
   */
  async updateSubscription(tenantId: number, data: SubscriptionUpdateRequest): Promise<SubscriptionUpdateResponse> {
    return await apiClient.put<SubscriptionUpdateResponse>(`/api/v1/super-admin/subscriptions/${tenantId}`, data)
  },

  /**
   * Get a tenant's feature limits and usage (Option D)
   */
  async getFeatureLimits(tenantId: number): Promise<FeatureLimits> {
    return await apiClient.get<FeatureLimits>(`/api/v1/super-admin/subscriptions/${tenantId}/limits`)
  },

  /**
   * Update a tenant's feature limits (Option D)
   */
  async updateFeatureLimits(tenantId: number, data: FeatureLimitsUpdateRequest): Promise<any> {
    return await apiClient.put<any>(`/api/v1/super-admin/subscriptions/${tenantId}/limits`, data)
  },

  /**
   * Reset a tenant's feature limits to tier defaults
   */
  async resetFeatureLimits(tenantId: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/v1/super-admin/subscriptions/${tenantId}/limits`)
  },

  /**
   * Get list of expiring subscriptions
   */
  async getExpiringSubscriptions(days: number = 30): Promise<ExpiringSubscriptions> {
    return await apiClient.get<ExpiringSubscriptions>('/api/v1/super-admin/subscriptions/expiring', {
      params: { days }
    })
  },

  // =============================================================================
  // Platform Settings Methods
  // =============================================================================

  /**
   * Get platform settings
   */
  async getPlatformSettings(): Promise<PlatformSettings> {
    return await apiClient.get<PlatformSettings>('/api/v1/super-admin/settings/platform')
  },

  /**
   * Update platform settings
   */
  async updatePlatformSettings(updates: PlatformSettingsUpdate): Promise<{ message: string; changes: string[]; updated_at: string }> {
    return await apiClient.put<{ message: string; changes: string[]; updated_at: string }>('/api/v1/super-admin/settings/platform', updates)
  },

  /**
   * Get tenant defaults
   */
  async getTenantDefaults(): Promise<TenantDefaults> {
    return await apiClient.get<TenantDefaults>('/api/v1/super-admin/settings/tenant-defaults')
  },

  /**
   * Update tenant defaults
   */
  async updateTenantDefaults(defaults: TenantDefaults): Promise<{ message: string; tenant_defaults: TenantDefaults; updated_at: string }> {
    return await apiClient.put<{ message: string; tenant_defaults: TenantDefaults; updated_at: string }>('/api/v1/super-admin/settings/tenant-defaults', defaults)
  },

  /**
   * Toggle maintenance mode
   */
  async toggleMaintenanceMode(enabled: boolean): Promise<{ maintenance_mode: boolean; message: string; updated_at: string }> {
    return await apiClient.post<{ maintenance_mode: boolean; message: string; updated_at: string }>(`/api/v1/super-admin/settings/maintenance-mode?enabled=${enabled}`, {})
  },
}
