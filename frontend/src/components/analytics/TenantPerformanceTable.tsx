/**
 * Tenant Performance Rankings Table
 *
 * Displays tenant leaderboard with:
 * - User count, pet count, QR codes
 * - Total scans
 * - Engagement score with color coding
 * - Top 10 tenants
 */

import React from 'react'
import { Award, Building2, Clock } from 'lucide-react'
import { TenantPerformance, RecentActivity } from '@/services/superAdminService'

interface TenantPerformanceTableProps {
  tenantPerformance: TenantPerformance | null
  recentActivity?: RecentActivity | null
}

export const TenantPerformanceTable: React.FC<TenantPerformanceTableProps> = ({
  tenantPerformance,
  recentActivity,
}) => {
  if (!tenantPerformance) return null

  return (
    <div className="space-y-3 sm:gap-4">
      {/* Tenant Performance Rankings */}
      {tenantPerformance.tenant_rankings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Tenant Performance Rankings
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Rank</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Tenant</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Users</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Pets</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">QR Codes</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Scans</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Score</th>
                </tr>
              </thead>
              <tbody>
                {tenantPerformance.tenant_rankings.slice(0, 10).map((tenant, index) => (
                  <tr key={tenant.tenant_id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                        index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{tenant.tenant_name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">{tenant.subdomain}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center text-sm text-gray-600 dark:text-gray-400">{tenant.total_users}</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-600 dark:text-gray-400">{tenant.total_pets}</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-600 dark:text-gray-400">{tenant.total_qr_codes}</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-600 dark:text-gray-400">{tenant.total_scans}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        tenant.engagement_score >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        tenant.engagement_score >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {tenant.engagement_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Recent Users */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Recent Users ({recentActivity.summary.new_users_7d} in 7 days)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.recent_users.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent users</p>
              ) : (
                recentActivity.recent_users.map(user => (
                  <div key={user.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-900 dark:text-white">{user.email}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        user.role === 'super_admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        user.role === 'tenant_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Tenants */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              Recent Tenants ({recentActivity.summary.new_tenants_30d} in 30 days)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.recent_tenants.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent tenants</p>
              ) : (
                recentActivity.recent_tenants.map(tenant => (
                  <div key={tenant.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-900 dark:text-white">{tenant.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({tenant.subdomain})</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tier Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Subscription Tiers</h3>
        <div className="flex gap-4">
          {Object.entries(tenantPerformance.tier_distribution).map(([tier, count]) => (
            <div key={tier} className="flex-1 text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                tier === 'enterprise' ? 'bg-purple-100 dark:bg-purple-900/30' :
                tier === 'standard' ? 'bg-blue-100 dark:bg-blue-900/30' :
                'bg-gray-100 dark:bg-gray-700'
              }`}>
                <span className={`text-lg font-bold ${
                  tier === 'enterprise' ? 'text-purple-600 dark:text-purple-400' :
                  tier === 'standard' ? 'text-blue-600 dark:text-blue-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {count}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{tier}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
