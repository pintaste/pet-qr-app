import React, { useState } from 'react'
import { PawPrint, QrCode, Activity, Settings, LayoutDashboard } from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import StatsCard from '@/components/dashboard/StatsCard'
import QuickActions from '@/components/dashboard/QuickActions'
import EmptyState from '@/components/dashboard/EmptyState'
import { StatsCardSkeleton } from '@/components/dashboard/LoadingSkeleton'

type UserDashboardTab = 'overview' | 'pets' | 'qrcodes' | 'activity' | 'settings'

/**
 * Regular User Dashboard
 *
 * For pet owners to manage their pets, QR codes, and view activity.
 */
const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserDashboardTab>('overview')
  const [isLoading, setIsLoading] = useState(false)

  // Mock data - will be replaced with real API calls
  const stats = {
    totalPets: 0,
    activeQRCodes: 0,
    totalScans: 0,
    recentScans: 0,
  }

  const handleAddPet = () => {
    console.log('Add pet clicked')
    // TODO: Open add pet modal/form
  }

  const handleBindQR = () => {
    console.log('Bind QR clicked')
    // TODO: Open QR binding modal
  }

  const handleViewActivity = () => {
    console.log('View activity clicked')
    setActiveTab('activity')
  }

  const handleUpdateProfile = () => {
    console.log('Update profile clicked')
    setActiveTab('settings')
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'pets' as const, label: 'My Pets', icon: PawPrint },
    { id: 'qrcodes' as const, label: 'QR Codes', icon: QrCode },
    { id: 'activity' as const, label: 'Activity', icon: Activity },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading ? (
                <>
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                </>
              ) : (
                <>
                  <StatsCard
                    title="Total Pets"
                    value={stats.totalPets}
                    subtitle="Registered pets"
                    icon={PawPrint}
                    color="indigo"
                    onClick={() => setActiveTab('pets')}
                  />
                  <StatsCard
                    title="Active QR Codes"
                    value={stats.activeQRCodes}
                    subtitle="Assigned codes"
                    icon={QrCode}
                    color="green"
                    onClick={() => setActiveTab('qrcodes')}
                  />
                  <StatsCard
                    title="Total Scans"
                    value={stats.totalScans}
                    subtitle="All time"
                    icon={Activity}
                    color="blue"
                  />
                  <StatsCard
                    title="Recent Scans"
                    value={stats.recentScans}
                    subtitle="This month"
                    icon={Activity}
                    color="purple"
                  />
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={handleAddPet}
                  className="flex flex-col items-center gap-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PawPrint className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Pet</span>
                </button>
                <button
                  onClick={handleBindQR}
                  className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <QrCode className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bind QR</span>
                </button>
                <button
                  onClick={handleViewActivity}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Activity</span>
                </button>
                <button
                  onClick={handleUpdateProfile}
                  className="flex flex-col items-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Update Profile</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                Recent Activity
              </h2>
              <EmptyState
                icon={Activity}
                title="No Recent Activity"
                description="QR code scans and pet updates will appear here"
              />
            </div>
          </div>
        )

      case 'pets':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <EmptyState
              icon={PawPrint}
              title="No Pets Yet"
              description="Add your first pet to get started with QR code generation and management"
              actionLabel="Add Your First Pet"
              onAction={handleAddPet}
            />
          </div>
        )

      case 'qrcodes':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <EmptyState
              icon={QrCode}
              title="No QR Codes"
              description="Bind QR codes to your pets to enable easy information sharing"
              actionLabel="Bind QR Code"
              onAction={handleBindQR}
            />
          </div>
        )

      case 'activity':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <EmptyState
              icon={Activity}
              title="No Activity Data"
              description="Scan events and pet activity will appear here"
            />
          </div>
        )

      case 'settings':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-light text-gray-900 dark:text-white mb-4">
              Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Profile settings and preferences will be available here
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as UserDashboardTab)}>
      {renderContent()}
    </DashboardLayout>
  )
}

export default UserDashboard
