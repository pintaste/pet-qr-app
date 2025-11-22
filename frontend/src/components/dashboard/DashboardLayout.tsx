import React from 'react'
import { QrCode, BarChart3, Settings, LayoutDashboard } from 'lucide-react'
import Header from '@/components/Header'
import { containerStyles } from '@/styles/containers'

interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab: 'overview' | 'qrcodes' | 'activity' | 'settings'
  onTabChange: (tab: 'overview' | 'qrcodes' | 'activity' | 'settings') => void
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'qrcodes' as const, label: 'QR Codes', icon: QrCode },
    { id: 'activity' as const, label: 'Activity', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Header with Auth */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className={containerStyles.extraWide}>
          <Header variant="default" showAuthButton={true} />
        </div>
      </div>

      {/* Dashboard Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className={`${containerStyles.extraWide} py-4`}>

          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Mobile Navigation Tabs - Scrollable */}
          <div className="md:hidden overflow-x-auto hide-scrollbar -mx-4 px-4">
            <div className="flex gap-2 pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500'
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
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout
