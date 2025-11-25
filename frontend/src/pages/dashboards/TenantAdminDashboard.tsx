import React, { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  PawPrint,
  QrCode,
  BarChart3,
  Settings,
} from 'lucide-react'
import { containerStyles } from '@/styles/containers'
import Header from '@/components/Header'
import { AnalyticsTab } from './tabs/AnalyticsTab'
import SettingsTab from './tabs/SettingsTab'
import TenantOverviewTab from './tabs/TenantOverviewTab'
import TenantQRCodesTab from './tabs/TenantQRCodesTab'
import TenantUsersTab from './tabs/TenantUsersTab'
import TenantPetsTab from './tabs/TenantPetsTab'

type TenantAdminTab = 'overview' | 'users' | 'pets' | 'qrcodes' | 'analytics' | 'settings'

/**
 * Tenant Admin Dashboard
 *
 * For pet store owners to manage their store, users, and QR inventory.
 */
const TenantAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TenantAdminTab>('overview')

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'pets' as const, label: 'Pets', icon: PawPrint },
    { id: 'qrcodes' as const, label: 'QR Codes', icon: QrCode },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]


  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TenantOverviewTab onNavigate={(tab) => setActiveTab(tab as TenantAdminTab)} />

      case 'users':
        return <TenantUsersTab />

      case 'pets':
        return <TenantPetsTab />

      case 'qrcodes':
        return <TenantQRCodesTab />

      case 'analytics':
        return <AnalyticsTab />

      case 'settings':
        return <SettingsTab />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className={containerStyles.extraWide}>
          <Header variant="default" showAuthButton={true} />
        </div>
      </div>

      {/* Dashboard Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-purple-200 dark:border-purple-700">
        <div className={`${containerStyles.extraWide} py-4`}>
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden overflow-x-auto hide-scrollbar -mx-4 px-4">
            <div className="flex gap-2 pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-500'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${containerStyles.extraWide} py-6`}>
        {renderContent()}
      </div>

    </div>
  )
}

export default TenantAdminDashboard
