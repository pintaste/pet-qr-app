import React from 'react'

/**
 * Tenant Admin Dashboard
 *
 * For pet store owners to manage their store, users, and QR inventory.
 */
const TenantAdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-purple-200 dark:border-purple-700">
          <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">
            Tenant Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Store management interface for pet store owners.
          </p>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              🔧 This dashboard is under construction. Full features coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TenantAdminDashboard
