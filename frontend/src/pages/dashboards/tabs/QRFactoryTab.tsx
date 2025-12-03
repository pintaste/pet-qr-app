import React from 'react'
import {
  QrCode,
  Users,
  CheckCircle,
  Search,
  Plus,
  Filter,
  Download,
  Trash2,
  Loader2,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react'
import type { Tenant } from '@/services/superAdminService'
import { QRCard, QRCardSkeleton, QRCodeData } from '@/components/QRCard'

export interface QRFactoryTabProps {
  qrCodes: QRCodeData[]
  filteredQRCodes: QRCodeData[]
  paginatedQRCodes: QRCodeData[]
  isQRsLoading: boolean
  qrViewMode: 'grid' | 'list'
  setQrViewMode: (mode: 'grid' | 'list') => void
  qrSearchQuery: string
  setQrSearchQuery: (query: string) => void
  qrStatusFilter: string
  setQrStatusFilter: (status: string) => void
  qrBatchFilter: string
  setQrBatchFilter: (batch: string) => void
  qrTenantFilter: string
  setQrTenantFilter: (tenant: string) => void
  qrAssignmentFilter: string
  setQrAssignmentFilter: (assignment: string) => void
  uniqueBatches: string[]
  tenants: Tenant[]
  onGenerateQR: () => void
  onViewQR: (qr: QRCodeData) => void
  onDownloadQR: (qr: QRCodeData) => void
  onDeleteQR: (qr: QRCodeData) => void
  onBulkDownload: (style: 'scanner' | 'rounded') => void
  isBulkDownloading: boolean
  bulkDownloadProgress: number
  isBulkDeleting: boolean
  bulkDeleteProgress: number
  showActionsMenu: boolean
  setShowActionsMenu: (show: boolean) => void
  setShowBulkDeleteConfirm: (show: boolean) => void
  qrCurrentPage: number
  setQrCurrentPage: (page: number | ((prev: number) => number)) => void
  qrTotalPages: number
  qrStartIndex: number
  qrEndIndex: number
}

/**
 * QRFactoryTab Component
 *
 * Displays and manages QR code generation and listing with filters, grid/list views, and pagination.
 */
export const QRFactoryTab: React.FC<QRFactoryTabProps> = ({
  qrCodes,
  filteredQRCodes,
  paginatedQRCodes,
  isQRsLoading,
  qrViewMode,
  setQrViewMode,
  qrSearchQuery,
  setQrSearchQuery,
  qrStatusFilter,
  setQrStatusFilter,
  qrBatchFilter,
  setQrBatchFilter,
  qrTenantFilter,
  setQrTenantFilter,
  qrAssignmentFilter,
  setQrAssignmentFilter,
  uniqueBatches,
  tenants,
  onGenerateQR,
  onViewQR,
  onDownloadQR,
  onDeleteQR,
  onBulkDownload,
  isBulkDownloading,
  bulkDownloadProgress,
  isBulkDeleting,
  bulkDeleteProgress,
  showActionsMenu,
  setShowActionsMenu,
  setShowBulkDeleteConfirm,
  qrCurrentPage,
  setQrCurrentPage,
  qrTotalPages,
  qrStartIndex,
  qrEndIndex,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Generate Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">QR Code Factory</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate and manage QR code batches
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setQrViewMode('grid')}
              className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                qrViewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setQrViewMode('list')}
              className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                qrViewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="List View"
            >
              <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Actions Dropdown - combines Bulk Delete and Bulk Download */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              disabled={filteredQRCodes.length === 0 || isBulkDeleting || isBulkDownloading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting {bulkDeleteProgress}%
                </>
              ) : isBulkDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading {bulkDownloadProgress}%
                </>
              ) : (
                <>
                  <MoreHorizontal className="w-4 h-4" />
                  Actions
                </>
              )}
            </button>
            {showActionsMenu && !isBulkDeleting && !isBulkDownloading && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                {/* Download Options */}
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Download
                </div>
                <button
                  onClick={() => {
                    setShowActionsMenu(false)
                    onBulkDownload('scanner')
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Scanner Style
                </button>
                <button
                  onClick={() => {
                    setShowActionsMenu(false)
                    onBulkDownload('rounded')
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Rounded Style
                </button>

                {/* Divider */}
                <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

                {/* Delete Option */}
                <button
                  onClick={() => {
                    setShowActionsMenu(false)
                    setShowBulkDeleteConfirm(true)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Filtered ({filteredQRCodes.length})
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onGenerateQR}
            className="flex items-center gap-2 px-3 sm:px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[44px]"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Generate QR Batch</span>
            <span className="sm:hidden">Generate</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Clickable to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <button
          onClick={() => {
            setQrStatusFilter('')
            setQrAssignmentFilter('')
          }}
          className={`bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 transition-all hover:shadow-lg text-left min-h-[44px] ${
            !qrStatusFilter && !qrAssignmentFilter
              ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
              : 'border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500'
          }`}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total</h3>
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{qrCodes.length}</p>
        </button>

        <button
          onClick={() => {
            setQrStatusFilter('active')
            setQrAssignmentFilter('')
          }}
          className={`bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 transition-all hover:shadow-lg text-left min-h-[44px] ${
            qrStatusFilter === 'active' && !qrAssignmentFilter
              ? 'border-green-500 dark:border-green-500 ring-2 ring-green-200 dark:ring-green-800'
              : 'border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500'
          }`}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Active</h3>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {qrCodes.filter(qr => qr.status === 'ACTIVE').length}
          </p>
        </button>

        <button
          onClick={() => {
            setQrStatusFilter('')
            setQrAssignmentFilter('assigned')
          }}
          className={`bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 transition-all hover:shadow-lg text-left min-h-[44px] ${
            qrAssignmentFilter === 'assigned'
              ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
              : 'border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Assigned</h3>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {qrCodes.filter(qr => qr.pet_id).length}
          </p>
        </button>

        <button
          onClick={() => {
            setQrStatusFilter('')
            setQrAssignmentFilter('unassigned')
          }}
          className={`bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 transition-all hover:shadow-lg text-left min-h-[44px] ${
            qrAssignmentFilter === 'unassigned'
              ? 'border-gray-500 dark:border-gray-500 ring-2 ring-gray-200 dark:ring-gray-600'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Unassigned</h3>
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {qrCodes.filter(qr => !qr.pet_id).length}
          </p>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
        <div className="space-y-3">
          {/* Row 1: Search (full width) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or batch ID..."
              value={qrSearchQuery}
              onChange={(e) => setQrSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Row 2: Filter dropdowns (evenly distributed) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Status Filter */}
            <select
              value={qrStatusFilter}
              onChange={(e) => setQrStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>

            {/* Batch Filter */}
            <select
              value={qrBatchFilter}
              onChange={(e) => setQrBatchFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">All Batches</option>
              {uniqueBatches.map(batchId => (
                <option key={batchId} value={batchId}>
                  {batchId}
                </option>
              ))}
            </select>

            {/* Tenant Filter */}
            <select
              value={qrTenantFilter}
              onChange={(e) => setQrTenantFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">All Tenants</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id.toString()}>
                  {tenant.name}
                </option>
              ))}
            </select>

            {/* Assignment Filter */}
            <select
              value={qrAssignmentFilter}
              onChange={(e) => setQrAssignmentFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">All Assignment</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(qrSearchQuery || qrStatusFilter || qrBatchFilter || qrTenantFilter || qrAssignmentFilter) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredQRCodes.length} of {qrCodes.length} QR codes
            </span>
            <button
              onClick={() => {
                setQrSearchQuery('')
                setQrStatusFilter('')
                setQrBatchFilter('')
                setQrTenantFilter('')
                setQrAssignmentFilter('')
              }}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* QR Codes Grid/List */}
      <div>
        {isQRsLoading ? (
          qrViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QRCardSkeleton />
              <QRCardSkeleton />
              <QRCardSkeleton />
              <QRCardSkeleton />
              <QRCardSkeleton />
              <QRCardSkeleton />
            </div>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          )
        ) : filteredQRCodes.length === 0 ? (
          <div className="text-center py-12">
            <QrCode className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {qrCodes.length === 0 ? 'No QR Codes Generated Yet' : 'No QR Codes Found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {qrCodes.length === 0
                ? 'Click "Generate QR Batch" to create your first batch of QR codes'
                : 'Try adjusting your search or filters'}
            </p>
            {qrCodes.length === 0 && (
              <button
                onClick={onGenerateQR}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Generate QR Batch
              </button>
            )}
          </div>
        ) : qrViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedQRCodes.map((qr) => (
              <QRCard
                key={qr.id}
                qr={qr}
                onView={onViewQR}
                onDownload={onDownloadQR}
                onDelete={onDeleteQR}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[280px] sm:min-w-0">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Code</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">PIN</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Batch</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Pet</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Created</th>
                  <th className="text-right py-2 sm:py-3 px-1 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQRCodes.map((qr) => (
                  <tr key={qr.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span className="font-mono font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-[60px] sm:max-w-none block">{qr.code}</span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${
                        qr.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        qr.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>{qr.status}</span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs sm:text-sm">{qr.pin}</span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-mono">{qr.batch_id || '-'}</span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {qr.pet_name || (qr.pet_id ? `#${qr.pet_id}` : '-')}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {new Date(qr.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-1 sm:px-4">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button
                          onClick={() => onViewQR(qr)}
                          className="p-1.5 sm:p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded transition-colors min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                          title="View"
                        >
                          <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => onDownloadQR(qr)}
                          className="p-1.5 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded transition-colors min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteQR(qr)}
                          className="p-1.5 sm:p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {!isQRsLoading && filteredQRCodes.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {qrStartIndex + 1}-{Math.min(qrEndIndex, filteredQRCodes.length)} of {filteredQRCodes.length} QR codes
            </p>
            {qrTotalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQrCurrentPage(1)}
                  disabled={qrCurrentPage === 1}
                  className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setQrCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={qrCurrentPage === 1}
                  className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Page {qrCurrentPage} of {qrTotalPages}
                </span>
                <button
                  onClick={() => setQrCurrentPage(prev => Math.min(qrTotalPages, prev + 1))}
                  disabled={qrCurrentPage === qrTotalPages}
                  className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setQrCurrentPage(qrTotalPages)}
                  disabled={qrCurrentPage === qrTotalPages}
                  className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
