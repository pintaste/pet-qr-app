/**
 * Settings Tab for Tenant Admin Dashboard
 *
 * Provides configuration options for the tenant including business info,
 * branding, QR defaults, user settings, notifications, and privacy.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Palette,
  QrCode,
  Users,
  Bell,
  Shield,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import {
  tenantAdminService,
  TenantSettings,
  TenantSettingsUpdate,
} from '../../../services/tenantAdminService'
import { logger } from '../../../utils/logger'

interface SettingsSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
}

/**
 * Collapsible settings section component
 */
const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-indigo-500">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

interface FormFieldProps {
  label: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'color' | 'textarea'
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  helpText?: string
}

/**
 * Form field component
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  helpText,
}) => {
  const inputClasses =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={inputClasses}
        />
      ) : type === 'color' ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClasses} flex-1`}
          />
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)
          }
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
      {helpText && <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>}
    </div>
  )
}

interface ToggleFieldProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/**
 * Toggle switch component
 */
const ToggleField: React.FC<ToggleFieldProps> = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const response = await tenantAdminService.getTenantSettings()
      setSettings(response.settings)
    } catch (err) {
      logger.error('Failed to fetch settings', { data: err })
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = useCallback(
    <K extends keyof TenantSettings>(section: K, field: keyof TenantSettings[K], value: unknown) => {
      if (!settings) return

      setSettings((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        }
      })
      setHasChanges(true)
      setSuccess(null)
    },
    [settings]
  )

  const handleSave = async (): Promise<void> => {
    if (!settings) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const updateData: TenantSettingsUpdate = {
        business: settings.business,
        branding: settings.branding,
        qr_defaults: settings.qr_defaults,
        user_settings: settings.user_settings,
        notifications: settings.notifications,
        privacy: settings.privacy,
      }

      await tenantAdminService.updateTenantSettings(updateData)
      setSuccess('Settings saved successfully')
      setHasChanges(false)
    } catch (err) {
      logger.error('Failed to save settings', { data: err })
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Failed to load settings</p>
        <button
          onClick={fetchSettings}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure your tenant settings and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            hasChanges
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Business Information */}
      <SettingsSection
        title="Business Information"
        icon={<Building2 className="w-5 h-5" />}
        defaultExpanded={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Business Name"
            value={settings.business.name}
            onChange={(v) => updateSettings('business', 'name', v)}
            placeholder="Your Pet Store"
          />
          <FormField
            label="Contact Email"
            type="email"
            value={settings.business.email}
            onChange={(v) => updateSettings('business', 'email', v)}
            placeholder="contact@example.com"
          />
          <FormField
            label="Phone Number"
            type="tel"
            value={settings.business.phone}
            onChange={(v) => updateSettings('business', 'phone', v)}
            placeholder="+1 (555) 123-4567"
          />
          <FormField
            label="Business Hours"
            value={settings.business.business_hours}
            onChange={(v) => updateSettings('business', 'business_hours', v)}
            placeholder="Mon-Fri 9AM-6PM"
          />
          <div className="md:col-span-2">
            <FormField
              label="Address"
              value={settings.business.address}
              onChange={(v) => updateSettings('business', 'address', v)}
              placeholder="123 Main St, City, State 12345"
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Description"
              type="textarea"
              value={settings.business.description}
              onChange={(v) => updateSettings('business', 'description', v)}
              placeholder="Tell customers about your business..."
            />
          </div>
        </div>
      </SettingsSection>

      {/* Branding & Appearance */}
      <SettingsSection title="Branding & Appearance" icon={<Palette className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Logo URL"
            value={settings.branding.logo_url}
            onChange={(v) => updateSettings('branding', 'logo_url', v)}
            placeholder="https://example.com/logo.png"
            helpText="URL to your business logo"
          />
          <FormField
            label="Favicon URL"
            value={settings.branding.favicon_url}
            onChange={(v) => updateSettings('branding', 'favicon_url', v)}
            placeholder="https://example.com/favicon.ico"
            helpText="URL to your favicon"
          />
          <FormField
            label="Primary Color"
            type="color"
            value={settings.branding.primary_color}
            onChange={(v) => updateSettings('branding', 'primary_color', v)}
          />
          <FormField
            label="Secondary Color"
            type="color"
            value={settings.branding.secondary_color}
            onChange={(v) => updateSettings('branding', 'secondary_color', v)}
          />
        </div>
      </SettingsSection>

      {/* QR Code Defaults */}
      <SettingsSection title="QR Code Defaults" icon={<QrCode className="w-5 h-5" />}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default QR Style
            </label>
            <div className="flex gap-4">
              {['scanner', 'rounded'].map((style) => (
                <button
                  key={style}
                  onClick={() => updateSettings('qr_defaults', 'style', style)}
                  className={`px-4 py-2 rounded-lg border-2 capitalize ${
                    settings.qr_defaults.style === style
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          <FormField
            label="Default PIN Length"
            type="number"
            value={settings.qr_defaults.pin_length}
            onChange={(v) => updateSettings('qr_defaults', 'pin_length', v)}
            helpText="Number of digits for auto-generated PINs (4-8)"
          />
          <ToggleField
            label="Auto-generate PIN"
            description="Automatically generate a PIN when creating QR codes"
            checked={settings.qr_defaults.auto_generate_pin}
            onChange={(v) => updateSettings('qr_defaults', 'auto_generate_pin', v)}
          />
        </div>
      </SettingsSection>

      {/* User Settings */}
      <SettingsSection title="User Settings" icon={<Users className="w-5 h-5" />}>
        <div className="space-y-4">
          <ToggleField
            label="Allow Self-Registration"
            description="Allow users to create accounts without admin approval"
            checked={settings.user_settings.allow_self_registration}
            onChange={(v) => updateSettings('user_settings', 'allow_self_registration', v)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default User Role
            </label>
            <select
              value={settings.user_settings.default_user_role}
              onChange={(e) => updateSettings('user_settings', 'default_user_role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="user">User</option>
              <option value="tenant_admin">Tenant Admin</option>
            </select>
          </div>
          <FormField
            label="Session Timeout (minutes)"
            type="number"
            value={settings.user_settings.session_timeout_minutes}
            onChange={(v) => updateSettings('user_settings', 'session_timeout_minutes', v)}
            helpText="Automatically log out users after this period of inactivity"
          />
        </div>
      </SettingsSection>

      {/* Notification Settings */}
      <SettingsSection title="Notification Settings" icon={<Bell className="w-5 h-5" />}>
        <div className="space-y-4">
          <ToggleField
            label="Enable Email Notifications"
            description="Send email notifications to users"
            checked={settings.notifications.email_enabled}
            onChange={(v) => updateSettings('notifications', 'email_enabled', v)}
          />
          <ToggleField
            label="QR Scan Alerts"
            description="Notify pet owners when their QR code is scanned"
            checked={settings.notifications.scan_alerts}
            onChange={(v) => updateSettings('notifications', 'scan_alerts', v)}
          />
          <ToggleField
            label="New User Alerts"
            description="Notify admin when a new user registers"
            checked={settings.notifications.new_user_alerts}
            onChange={(v) => updateSettings('notifications', 'new_user_alerts', v)}
          />
          <ToggleField
            label="Lost Pet Alerts"
            description="Notify admin when a pet is marked as lost"
            checked={settings.notifications.lost_pet_alerts}
            onChange={(v) => updateSettings('notifications', 'lost_pet_alerts', v)}
          />
        </div>
      </SettingsSection>

      {/* Privacy Settings */}
      <SettingsSection title="Privacy & Data" icon={<Shield className="w-5 h-5" />}>
        <div className="space-y-4">
          <ToggleField
            label="Default Pet Visibility"
            description="Make pet profiles public by default when QR code is scanned"
            checked={settings.privacy.default_pet_public}
            onChange={(v) => updateSettings('privacy', 'default_pet_public', v)}
          />
          <FormField
            label="Data Retention Period (days)"
            type="number"
            value={settings.privacy.data_retention_days}
            onChange={(v) => updateSettings('privacy', 'data_retention_days', v)}
            helpText="How long to keep scan event data (0 = forever)"
          />
        </div>
      </SettingsSection>
    </div>
  )
}

export default SettingsTab
