import React, { useState } from 'react'
import { PawPrint, QrCode, Scan, TrendingUp } from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import StatsCard from '@/components/dashboard/StatsCard'
import QuickActions from '@/components/dashboard/QuickActions'
import EmptyState from '@/components/dashboard/EmptyState'
import { StatsCardSkeleton } from '@/components/dashboard/LoadingSkeleton'

type DashboardTab = 'overview' | 'pets' | 'qrcodes' | 'analytics' | 'settings'

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [isLoading, setIsLoading] = useState(false)

  // Mock data - will be replaced with real API calls
  const stats = {
    totalPets: 3,
    activeQRCodes: 5,
    totalScans: 127,
    thisMonthScans: 42,
  }

  const handleAddPet = () => {
    console.log('Add pet clicked')
    // TODO: Open add pet modal/form
  }

  const handleGenerateQR = () => {
    console.log('Generate QR clicked')
    // TODO: Open QR generation modal
  }

  const handleDownloadQR = () => {
    console.log('Download QR clicked')
    // TODO: Open QR download options
  }

  const handleViewReports = () => {
    console.log('View reports clicked')
    setActiveTab('analytics')
  }

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
                    subtitle="Generated codes"
                    icon={QrCode}
                    color="green"
                    onClick={() => setActiveTab('qrcodes')}
                  />
                  <StatsCard
                    title="Total Scans"
                    value={stats.totalScans}
                    subtitle="All time"
                    icon={Scan}
                    color="blue"
                  />
                  <StatsCard
                    title="This Month"
                    value={stats.thisMonthScans}
                    subtitle="Recent activity"
                    icon={TrendingUp}
                    color="purple"
                    trend={{ value: 12.5, isPositive: true }}
                  />
                </>
              )}
            </div>

            {/* Quick Actions */}
            <QuickActions
              onAddPet={handleAddPet}
              onGenerateQR={handleGenerateQR}
              onDownloadQR={handleDownloadQR}
              onViewReports={handleViewReports}
            />

            {/* Recent Activity - Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                Recent Activity
              </h2>
              <EmptyState
                icon={Scan}
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
              description="Generate QR codes for your pets to enable easy information sharing"
              actionLabel="Generate QR Code"
              onAction={handleGenerateQR}
            />
          </div>
        )

      case 'analytics':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <EmptyState
              icon={TrendingUp}
              title="No Analytics Data"
              description="Analytics and insights will appear here once you have QR code scans"
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
              Settings and preferences will be available here
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  )
}

export default DashboardPage