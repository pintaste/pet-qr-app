/**
 * Platform Settings Component
 *
 * Settings tab for Super Admin Dashboard containing:
 * - Option A: Platform Configuration
 * - Option B: Security & Authentication Settings
 * - Option F: Tenant Default Settings
 */

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Shield,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import { superAdminService, PlatformSettings as PlatformSettingsType, TenantDefaults } from '@/services/superAdminService'

interface SettingsSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  description?: string
  defaultExpanded?: boolean
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, icon, children, description, defaultExpanded }) => {
  // Detect if we're on mobile (default collapsed on mobile, expanded on desktop)
  const [isExpanded, setIsExpanded] = useState(() => {
    // Check if window is available (SSR safety)
    if (typeof window !== 'undefined') {
      // Mobile: collapsed by default, Desktop: expanded by default
      return defaultExpanded !== undefined ? defaultExpanded : window.innerWidth >= 768
    }
    return defaultExpanded !== undefined ? defaultExpanded : true
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-left focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
      >
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{title}</h3>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">{description}</p>
              )}
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 flex-shrink-0 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

interface SettingsRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

const SettingsRow: React.FC<SettingsRowProps> = ({ label, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 sm:gap-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">{description}</p>
      )}
    </div>
    <div className="sm:ml-4 flex-shrink-0">{children}</div>
  </div>
)

const StatusBadge: React.FC<{ connected: boolean; label: string }> = ({ connected, label }) => (
  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
    connected
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  }`}>
    {connected ? (
      <CheckCircle className="w-3 h-3" />
    ) : (
      <AlertCircle className="w-3 h-3" />
    )}
    {label}
  </div>
)

export const PlatformSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettingsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Editable state
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [accessTokenExpire, setAccessTokenExpire] = useState(30)
  const [refreshTokenExpire, setRefreshTokenExpire] = useState(30)
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(60)
  const [scanRateLimitPerHour, setScanRateLimitPerHour] = useState(100)
  const [corsOrigins, setCorsOrigins] = useState<string[]>([])
  const [tenantDefaults, setTenantDefaults] = useState<TenantDefaults | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await superAdminService.getPlatformSettings()
      setSettings(data)
      // Initialize editable state
      setMaintenanceMode(data.maintenance_mode)
      setAccessTokenExpire(data.access_token_expire_minutes)
      setRefreshTokenExpire(data.refresh_token_expire_days)
      setRateLimitPerMinute(data.rate_limit_per_minute)
      setScanRateLimitPerHour(data.scan_rate_limit_per_hour)
      setCorsOrigins(data.cors_origins)
      setTenantDefaults(data.tenant_defaults)
    } catch (err) {
      setError('Failed to load platform settings')
      console.error('Error fetching settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const result = await superAdminService.updatePlatformSettings({
        maintenance_mode: maintenanceMode,
        access_token_expire_minutes: accessTokenExpire,
        refresh_token_expire_days: refreshTokenExpire,
        rate_limit_per_minute: rateLimitPerMinute,
        scan_rate_limit_per_hour: scanRateLimitPerHour,
        cors_origins: corsOrigins,
        tenant_defaults: tenantDefaults || undefined,
      })
      setSuccessMessage(result.message)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to save settings')
      console.error('Error saving settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleMaintenanceMode = async () => {
    const newValue = !maintenanceMode
    setMaintenanceMode(newValue)
    try {
      await superAdminService.toggleMaintenanceMode(newValue)
      setSuccessMessage(`Maintenance mode ${newValue ? 'enabled' : 'disabled'}`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setMaintenanceMode(!newValue) // Revert
      setError('Failed to toggle maintenance mode')
    }
  }

  const updateTierLimit = (tier: 'standard_tier' | 'enterprise_tier', field: string, value: number | boolean) => {
    if (!tenantDefaults) return

    setTenantDefaults({
      ...tenantDefaults,
      [tier]: {
        ...tenantDefaults[tier],
        ...(field.startsWith('features.')
          ? { features: { ...tenantDefaults[tier].features, [field.replace('features.', '')]: value } }
          : { [field]: value }
        )
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading platform settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure platform-wide settings and defaults
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={fetchSettings}
            className="px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 min-h-[44px] text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 sm:px-4 py-2.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 min-h-[44px] text-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Save Changes</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-emerald-800 dark:text-emerald-200">{successMessage}</p>
        </div>
      )}

      {/* Option A: Platform Configuration */}
      <SettingsSection
        title="Platform Configuration"
        icon={<Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        description="Basic platform information and status"
      >
        <div className="space-y-1">
          <SettingsRow label="Application Name" description="Display name of the platform">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {settings?.app_name}
            </span>
          </SettingsRow>

          <SettingsRow label="Version" description="Current application version">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
              {settings?.app_version}
            </span>
          </SettingsRow>

          <SettingsRow label="Environment" description="Current deployment environment">
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              settings?.environment === 'production'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : settings?.environment === 'staging'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
            }`}>
              {settings?.environment}
            </span>
          </SettingsRow>

          <SettingsRow label="Debug Mode" description="Whether debug mode is enabled">
            <span className={`px-2 py-1 rounded text-sm ${
              settings?.debug_mode
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {settings?.debug_mode ? 'Enabled' : 'Disabled'}
            </span>
          </SettingsRow>

          <SettingsRow
            label="Maintenance Mode"
            description="When enabled, users see a maintenance page"
          >
            <button
              onClick={handleToggleMaintenanceMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                maintenanceMode
                  ? 'bg-yellow-500'
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </SettingsRow>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">System Status</p>
            <div className="flex items-center gap-3">
              <StatusBadge connected={settings?.database_connected ?? false} label="Database" />
              <StatusBadge connected={settings?.redis_connected ?? false} label="Redis" />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Option B: Security & Authentication Settings */}
      <SettingsSection
        title="Security & Authentication"
        icon={<Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        description="JWT tokens, rate limiting, and CORS configuration"
      >
        <div className="space-y-1">
          <SettingsRow
            label="Access Token Expiry"
            description="How long access tokens remain valid"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={accessTokenExpire}
                onChange={(e) => setAccessTokenExpire(parseInt(e.target.value) || 30)}
                className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                min={5}
                max={1440}
              />
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">min</span>
            </div>
          </SettingsRow>

          <SettingsRow
            label="Refresh Token Expiry"
            description="How long refresh tokens remain valid"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={refreshTokenExpire}
                onChange={(e) => setRefreshTokenExpire(parseInt(e.target.value) || 30)}
                className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                min={1}
                max={365}
              />
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">days</span>
            </div>
          </SettingsRow>

          <SettingsRow
            label="API Rate Limit"
            description="Maximum API calls per minute"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={rateLimitPerMinute}
                onChange={(e) => setRateLimitPerMinute(parseInt(e.target.value) || 60)}
                className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                min={10}
                max={1000}
              />
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">/min</span>
            </div>
          </SettingsRow>

          <SettingsRow
            label="QR Scan Rate Limit"
            description="Maximum QR scans per hour per IP"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={scanRateLimitPerHour}
                onChange={(e) => setScanRateLimitPerHour(parseInt(e.target.value) || 100)}
                className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                min={10}
                max={1000}
              />
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">/hr</span>
            </div>
          </SettingsRow>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">CORS Origins</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Allowed domains for cross-origin requests
            </p>
            <div className="flex flex-wrap gap-2">
              {corsOrigins.map((origin, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300"
                >
                  {origin}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Option F: Tenant Default Settings */}
      <SettingsSection
        title="Tenant Default Settings"
        icon={<Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        description="Default limits and features for new tenants by tier"
      >
        {tenantDefaults && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Standard Tier */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Standard</span>
                Tier Defaults
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Max Pets</span>
                  <input
                    type="number"
                    value={tenantDefaults.standard_tier.max_pets}
                    onChange={(e) => updateTierLimit('standard_tier', 'max_pets', parseInt(e.target.value) || 0)}
                    className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Max QR Codes</span>
                  <input
                    type="number"
                    value={tenantDefaults.standard_tier.max_qr_codes}
                    onChange={(e) => updateTierLimit('standard_tier', 'max_qr_codes', parseInt(e.target.value) || 0)}
                    className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Max Users</span>
                  <input
                    type="number"
                    value={tenantDefaults.standard_tier.max_users}
                    onChange={(e) => updateTierLimit('standard_tier', 'max_users', parseInt(e.target.value) || 0)}
                    className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Storage (MB)</span>
                  <input
                    type="number"
                    value={tenantDefaults.standard_tier.max_storage_mb}
                    onChange={(e) => updateTierLimit('standard_tier', 'max_storage_mb', parseInt(e.target.value) || 0)}
                    className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Features</p>
                  {Object.entries(tenantDefaults.standard_tier.features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {feature.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => updateTierLimit('standard_tier', `features.${feature}`, !enabled)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          enabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 sm:p-4 border border-emerald-200 dark:border-emerald-800">
              <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded text-xs">Enterprise</span>
                Tier Defaults
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Max Pets</span>
                  <input
                    type="number"
                    value={tenantDefaults.enterprise_tier.max_pets}
                    onChange={(e) => updateTierLimit('enterprise_tier', 'max_pets', parseInt(e.target.value) || 0)}
                    className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Max QR Codes</span>
                  <input
                    type="number"
                    value={tenantDefaults.enterprise_tier.max_qr_codes}
                    onChange={(e) => updateTierLimit('enterprise_tier', 'max_qr_codes', parseInt(e.target.value) || 0)}
                    className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Max Users</span>
                  <input
                    type="number"
                    value={tenantDefaults.enterprise_tier.max_users}
                    onChange={(e) => updateTierLimit('enterprise_tier', 'max_users', parseInt(e.target.value) || 0)}
                    className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Storage (MB)</span>
                  <input
                    type="number"
                    value={tenantDefaults.enterprise_tier.max_storage_mb}
                    onChange={(e) => updateTierLimit('enterprise_tier', 'max_storage_mb', parseInt(e.target.value) || 0)}
                    className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800 mt-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Features</p>
                  {Object.entries(tenantDefaults.enterprise_tier.features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {feature.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => updateTierLimit('enterprise_tier', `features.${feature}`, !enabled)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          enabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Info Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Note about settings persistence
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Maintenance mode and tenant defaults are saved immediately. Other settings (token expiry, rate limits, CORS)
              require environment variable updates and server restart to take effect in production.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
