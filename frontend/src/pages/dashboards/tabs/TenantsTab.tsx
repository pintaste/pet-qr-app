import React from 'react'
import {
  Building2,
  Grid3X3,
  List,
  Users,
  Globe,
  Calendar,
  Clock,
  LogIn,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import type { Tenant } from '@/services/superAdminService'
import { TenantCard, NoTenantsCard, TenantCardSkeleton } from '@/components/TenantCard'

export interface TenantsTabProps {
  tenants: Tenant[]
  paginatedTenants: Tenant[]
  isTenantsLoading: boolean
  tenantsViewMode: 'grid' | 'list'
  setTenantsViewMode: (mode: 'grid' | 'list') => void
  tenantsCurrentPage: number
  setTenantsCurrentPage: (page: number | ((prev: number) => number)) => void
  tenantsTotalPages: number
  onCreateTenant: () => void
  onEditTenant: (tenant: Tenant) => void
  onImpersonateTenant: (tenant: Tenant) => void
}

/**
 * TenantsTab Component
 *
 * Displays and manages the tenants list with grid/list view toggle and pagination.
 */
export const TenantsTab: React.FC<TenantsTabProps> = ({
  tenants,
  paginatedTenants,
  isTenantsLoading,
  tenantsViewMode,
  setTenantsViewMode,
  tenantsCurrentPage,
  setTenantsCurrentPage,
  tenantsTotalPages,
  onCreateTenant,
  onEditTenant,
  onImpersonateTenant,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Tenant Management</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all tenants and their configurations
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setTenantsViewMode('grid')}
              className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                tenantsViewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setTenantsViewMode('list')}
              className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                tenantsViewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="List View"
            >
              <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <button
            onClick={onCreateTenant}
            className="flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[44px]"
          >
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Create New Tenant</span>
            <span className="sm:hidden">New Tenant</span>
          </button>
        </div>
      </div>

      {/* Tenants Grid/List */}
      {isTenantsLoading ? (
        tenantsViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TenantCardSkeleton />
            <TenantCardSkeleton />
            <TenantCardSkeleton />
          </div>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        )
      ) : tenants.length === 0 ? (
        <NoTenantsCard onCreate={onCreateTenant} />
      ) : tenantsViewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onEdit={onEditTenant}
              onImpersonate={onImpersonateTenant}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[320px] sm:min-w-0">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Tenant</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Tier / Users</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Created</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Expires</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <div>
                      <p className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white truncate max-w-[80px] sm:max-w-none">{tenant.name}</p>
                      {tenant.subdomain && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate max-w-[80px] sm:max-w-none">
                          <Globe className="w-3 h-3 flex-shrink-0 hidden sm:inline" />
                          {tenant.subdomain}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {tenant.tier === 'enterprise' ? 'Enterprise' : 'Standard'}
                      </p>
                      {tenant.user_count !== undefined && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {tenant.user_count} users
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${
                      tenant.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {tenant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                    {tenant.subscription_expires_at ? (
                      <span className={`text-xs sm:text-sm flex items-center gap-1 ${
                        new Date(tenant.subscription_expires_at) < new Date()
                          ? 'text-red-600 dark:text-red-400'
                          : new Date(tenant.subscription_expires_at).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {new Date(tenant.subscription_expires_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-4">
                    <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                      <button
                        onClick={() => onImpersonateTenant(tenant)}
                        className="p-1.5 sm:p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded transition-colors min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                        title={`Impersonate ${tenant.name} Admin`}
                      >
                        <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => onEditTenant(tenant)}
                        className="p-1.5 sm:p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                        title={`Edit ${tenant.name}`}
                      >
                        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tenants Pagination */}
      {tenantsTotalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 py-3">
          <button
            onClick={() => setTenantsCurrentPage(1)}
            disabled={tenantsCurrentPage === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setTenantsCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={tenantsCurrentPage === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {tenantsCurrentPage} of {tenantsTotalPages}
          </span>
          <button
            onClick={() => setTenantsCurrentPage(prev => Math.min(tenantsTotalPages, prev + 1))}
            disabled={tenantsCurrentPage === tenantsTotalPages}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setTenantsCurrentPage(tenantsTotalPages)}
            disabled={tenantsCurrentPage === tenantsTotalPages}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}
    </div>
  )
}

export default TenantsTab
