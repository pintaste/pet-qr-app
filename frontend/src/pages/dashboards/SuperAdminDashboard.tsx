import React from 'react'

/**
 * Super Admin Dashboard
 *
 * For platform owners to manage all tenants, generate QR batches, and view platform analytics.
 */
const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-emerald-200 dark:border-emerald-700">
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Platform management interface for system administrators.
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              🔧 This dashboard is under construction. Full features coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard
