import React from 'react'
import { Heart, PawPrint, QrCode, BarChart3, Settings } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab: 'overview' | 'pets' | 'qrcodes' | 'analytics' | 'settings'
  onTabChange: (tab: 'overview' | 'pets' | 'qrcodes' | 'analytics' | 'settings') => void
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Heart },
    { id: 'pets' as const, label: 'My Pets', icon: PawPrint },
    { id: 'qrcodes' as const, label: 'QR Codes', icon: QrCode },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border-2 border-indigo-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-indigo-500" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-light text-gray-900 dark:text-white tracking-wide">
                Dashboard
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pet Management
              </p>
            </div>
          </div>

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
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout
