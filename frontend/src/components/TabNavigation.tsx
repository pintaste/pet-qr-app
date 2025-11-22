import React, { useRef, useState } from 'react'
import {
  LayoutDashboard,
  Building2,
  QrCode,
  Users,
  BarChart3,
  Settings,
  CreditCard,
} from 'lucide-react'
import { SuperAdminTab } from '@/pages/dashboards/tabs/OverviewTab'
import { containerStyles } from '@/styles/containers'

/**
 * Tab configuration for the Super Admin Dashboard navigation
 */
interface TabConfig {
  id: SuperAdminTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
}

/**
 * Props for the TabNavigation component
 */
interface TabNavigationProps {
  activeTab: SuperAdminTab
  setActiveTab: (tab: SuperAdminTab) => void
  tenantCount?: number
  userCount?: number
}

/**
 * TabNavigation component for Super Admin Dashboard
 *
 * Renders both desktop (horizontal) and mobile (scrollable) navigation tabs.
 * Includes drag-to-scroll functionality for mobile devices.
 */
const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  tenantCount = 0,
  userCount = 0,
}) => {
  // Ref for mobile tabs scrolling
  const mobileTabsRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Define tabs configuration
  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tenants', label: 'Tenants', icon: Building2, count: tenantCount },
    { id: 'users', label: 'Users', icon: Users, count: userCount },
    { id: 'qr-factory', label: 'QR Factory', icon: QrCode },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // Mouse drag handlers for mobile tabs
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!mobileTabsRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - mobileTabsRef.current.offsetLeft)
    setScrollLeft(mobileTabsRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !mobileTabsRef.current) return
    e.preventDefault()
    const x = e.pageX - mobileTabsRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    mobileTabsRef.current.scrollLeft = scrollLeft - walk
  }

  const handleScroll = () => {
    // Force re-render to update scroll indicator position
    // The indicator position is calculated based on scrollLeft
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative">
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
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    isActive
                      ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Mobile Navigation - Horizontal scroll */}
        <div className="md:hidden relative">
          <div
            ref={mobileTabsRef}
            className={`overflow-x-auto hide-scrollbar -mx-4 px-4 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onScroll={handleScroll}
          >
            <div className="flex gap-1.5 pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-300 flex-shrink-0 min-h-[60px] min-w-[56px] ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Custom scroll indicator - on bottom border line (mobile only) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 h-[1.5px]">
        <div
          className="h-full bg-gray-300 dark:bg-gray-600 transition-all duration-150"
          style={{
            width: mobileTabsRef.current
              ? `${(mobileTabsRef.current.clientWidth / mobileTabsRef.current.scrollWidth) * 100}%`
              : '50%',
            marginLeft: mobileTabsRef.current
              ? `${(mobileTabsRef.current.scrollLeft / mobileTabsRef.current.scrollWidth) * 100}%`
              : '0%'
          }}
        />
      </div>
    </div>
  )
}

export default TabNavigation
