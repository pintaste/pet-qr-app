/**
 * Tenant QR Codes Tab Component for Tenant Admin Dashboard
 *
 * Manages QR code inventory allocated to the tenant.
 * Features:
 * - View all QR codes assigned to this tenant
 * - Filter by status (Available, Activated, In Use)
 * - Filter by batch and user
 * - Search by QR code or user email
 * - View, download, link/unlink QR codes to pets
 * - Grid and list view modes
 * - Lifecycle-based status filtering
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  QrCode,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Download,
  Link2,
  Unlink,
  PawPrint,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { tenantAdminService, TenantQRCode } from '@/services/tenantAdminService'
import { ViewTenantQRModal, LinkToPetModal } from '@/components/tenant/TenantQRModals'
import { downloadSingleQR } from '@/utils/qrDownloadUtils'
import SearchableSelect from '@/components/common/SearchableSelect'

/**
 * Props interface for TenantQRCodesTab
 */
interface TenantQRCodesTabProps {
  // No props needed - component is self-contained
}

/**
 * TenantQRCodesTab Component
 *
 * Self-contained tab for managing tenant's QR code inventory.
 */
const TenantQRCodesTab: React.FC<TenantQRCodesTabProps> = () => {
  // QR codes management states
  const [qrCodes, setQRCodes] = useState<TenantQRCode[]>([])
  const [isQRCodesLoading, setIsQRCodesLoading] = useState(false)
  const [qrSearchQuery, setQRSearchQuery] = useState('')
  const [qrStatusFilter, setQRStatusFilter] = useState<'all' | 'inactive' | 'active' | 'linked'>('all')
  const [qrBatchFilter, setQRBatchFilter] = useState<string>('all')
  const [qrUserFilter, setQRUserFilter] = useState<string>('all')
  const [qrViewMode, setQRViewMode] = useState<'grid' | 'list'>('list')
  const [qrCurrentPage, setQRCurrentPage] = useState(1)
  const qrPerPage = 12

  // QR modal states
  const [selectedQR, setSelectedQR] = useState<TenantQRCode | null>(null)
  const [isViewQRModalOpen, setIsViewQRModalOpen] = useState(false)
  const [isLinkPetModalOpen, setIsLinkPetModalOpen] = useState(false)

  /**
   * Fetch QR codes from backend
   */
  useEffect(() => {
    const fetchQRCodes = async (): Promise<void> => {
      try {
        setIsQRCodesLoading(true)
        const qrList = await tenantAdminService.listTenantQRCodes({
          search: qrSearchQuery || undefined,
        })
        setQRCodes(qrList)
      } catch (err) {
        console.error('Error fetching QR codes:', err)
      } finally {
        setIsQRCodesLoading(false)
      }
    }

    fetchQRCodes()
  }, [qrSearchQuery])

  /**
   * Get unique batches for filter dropdown
   */
  const availableBatches = useMemo(() => {
    const batches = new Set<string>()
    qrCodes.forEach(qr => {
      if (qr.batch_id) {
        batches.add(qr.batch_id)
      }
    })
    return Array.from(batches).sort()
  }, [qrCodes])

  /**
   * Get unique user emails from QR codes
   */
  const qrUserEmails = useMemo(() => {
    const emails = new Set<string>()
    qrCodes.forEach(qr => {
      if (qr.user_email) {
        emails.add(qr.user_email)
      }
    })
    return Array.from(emails).sort()
  }, [qrCodes])

  /**
   * Filter QR codes based on search, status, batch, and user (lifecycle-based)
   */
  const filteredQRCodes = useMemo(() => {
    let result = qrCodes

    // Apply batch filter
    if (qrBatchFilter !== 'all') {
      result = result.filter(qr => qr.batch_id === qrBatchFilter)
    }

    // Apply user filter
    if (qrUserFilter !== 'all') {
      result = result.filter(qr => qr.user_email === qrUserFilter)
    }

    // Apply status filter based on lifecycle phases
    if (qrStatusFilter === 'inactive') {
      // Available: allocated to tenant but not activated by user
      result = result.filter(qr => qr.status === 'inactive')
    } else if (qrStatusFilter === 'active') {
      // Activated: user has activated (with or without pet)
      result = result.filter(qr => qr.status === 'active')
    } else if (qrStatusFilter === 'linked') {
      // In Use: has pet_id set
      result = result.filter(qr => qr.pet_id !== undefined && qr.pet_id !== null)
    }

    return result
  }, [qrCodes, qrStatusFilter, qrBatchFilter, qrUserFilter])

  /**
   * QR stats calculations based on lifecycle
   * - Total: All QR codes allocated to this tenant
   * - Available: Ready to sell (status = 'inactive')
   * - Activated: User has activated (status = 'active')
   * - In Use: Linked to a pet (pet_id is set)
   */
  const qrStats = useMemo(() => {
    const total = qrCodes.length
    const available = qrCodes.filter(qr => qr.status === 'inactive').length
    const activated = qrCodes.filter(qr => qr.status === 'active').length
    const inUse = qrCodes.filter(qr => qr.pet_id !== undefined && qr.pet_id !== null).length
    return { total, available, activated, inUse }
  }, [qrCodes])

  /**
   * QR pagination calculations
   */
  const qrTotalPages = Math.ceil(filteredQRCodes.length / qrPerPage)
  const qrStartIndex = (qrCurrentPage - 1) * qrPerPage
  const qrEndIndex = qrStartIndex + qrPerPage
  const paginatedQRCodes = filteredQRCodes.slice(qrStartIndex, qrEndIndex)

  /**
   * Reset QR page when filters change
   */
  useEffect(() => {
    setQRCurrentPage(1)
  }, [qrSearchQuery, qrStatusFilter, qrBatchFilter, qrUserFilter])

  /**
   * Handler for viewing QR details
   */
  const handleViewQR = (qr: TenantQRCode): void => {
    setSelectedQR(qr)
    setIsViewQRModalOpen(true)
  }

  /**
   * Handler for downloading QR image
   */
  const handleDownloadQR = async (qr: TenantQRCode): Promise<void> => {
    try {
      await downloadSingleQR({ code: qr.code, pin: qr.pin, batch_id: qr.batch_id })
    } catch (error) {
      console.error('Failed to download QR:', error)
    }
  }

  /**
   * Handler for linking QR to pet
   */
  const handleLinkToPet = (qr: TenantQRCode): void => {
    setSelectedQR(qr)
    setIsLinkPetModalOpen(true)
  }

  /**
   * Handler for unlinking QR from pet
   */
  const handleUnlinkFromPet = async (qr: TenantQRCode): Promise<void> => {
    // TODO: Implement unlink API call
    console.log('Unlink QR from pet:', qr.code)
    // After unlinking, refresh QR codes list
  }

  /**
   * Handler for successful QR operations - refreshes the list
   */
  const handleQRSuccess = async (): Promise<void> => {
    try {
      const qrList = await tenantAdminService.listTenantQRCodes({
        search: qrSearchQuery || undefined,
      })
      setQRCodes(qrList)
    } catch (err) {
      console.error('Error refreshing QR codes:', err)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">QR Code Inventory</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage QR codes assigned to your store
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setQRViewMode('grid')}
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
              onClick={() => setQRViewMode('list')}
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
        </div>
      </div>

      {/* QR Stats - Based on Lifecycle */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <button
          onClick={() => setQRStatusFilter('all')}
          className={`bg-indigo-50 dark:bg-indigo-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
            qrStatusFilter === 'all'
              ? 'border-indigo-500 ring-2 ring-indigo-500/50'
              : 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'
          }`}
        >
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{qrStats.total}</p>
        </button>
        <button
          onClick={() => setQRStatusFilter('inactive')}
          className={`bg-gray-50 dark:bg-gray-700/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
            qrStatusFilter === 'inactive'
              ? 'border-gray-500 ring-2 ring-gray-500/50'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
          }`}
        >
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Available</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{qrStats.available}</p>
        </button>
        <button
          onClick={() => setQRStatusFilter('active')}
          className={`bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
            qrStatusFilter === 'active'
              ? 'border-green-500 ring-2 ring-green-500/50'
              : 'border-green-200 dark:border-green-800 hover:border-green-400'
          }`}
        >
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Activated</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{qrStats.activated}</p>
        </button>
        <button
          onClick={() => setQRStatusFilter('linked')}
          className={`bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
            qrStatusFilter === 'linked'
              ? 'border-blue-500 ring-2 ring-blue-500/50'
              : 'border-blue-200 dark:border-blue-800 hover:border-blue-400'
          }`}
        >
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">In Use</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{qrStats.inUse}</p>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by QR code or user email..."
            value={qrSearchQuery}
            onChange={(e) => setQRSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Batch Filter */}
        {availableBatches.length > 0 && (
          <div className="sm:w-40">
            <SearchableSelect
              value={qrBatchFilter}
              onChange={setQRBatchFilter}
              options={availableBatches}
              placeholder="Search batch..."
              allOptionLabel="All Batches"
            />
          </div>
        )}

        {/* User Filter */}
        {qrUserEmails.length > 0 && (
          <div className="sm:w-44">
            <SearchableSelect
              value={qrUserFilter}
              onChange={setQRUserFilter}
              options={qrUserEmails}
              placeholder="Search user..."
              allOptionLabel="All Users"
            />
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {filteredQRCodes.length} of {qrStats.total} QR codes
          </span>
          {qrSearchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
              Search: "{qrSearchQuery}"
              <button onClick={() => setQRSearchQuery('')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {qrStatusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
              Status: {qrStatusFilter === 'inactive' ? 'Available' : qrStatusFilter === 'active' ? 'Activated' : 'In Use'}
              <button onClick={() => setQRStatusFilter('all')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {qrBatchFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
              Batch: {qrBatchFilter}
              <button onClick={() => setQRBatchFilter('all')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {qrUserFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
              User: {qrUserFilter}
              <button onClick={() => setQRUserFilter('all')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(qrSearchQuery || qrStatusFilter !== 'all' || qrBatchFilter !== 'all' || qrUserFilter !== 'all') && (
            <button
              onClick={() => {
                setQRSearchQuery('')
                setQRStatusFilter('all')
                setQRBatchFilter('all')
                setQRUserFilter('all')
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* QR Codes Grid/List */}
      {isQRCodesLoading ? (
        <div className={qrViewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3' : 'space-y-2'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={qrViewMode === 'grid' ? 'h-40 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse' : 'h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse'} />
          ))}
        </div>
      ) : filteredQRCodes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
          <QrCode className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {qrSearchQuery || qrStatusFilter !== 'all' || qrBatchFilter !== 'all' || qrUserFilter !== 'all' ? 'No QR Codes Found' : 'No QR Codes Yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {qrSearchQuery || qrStatusFilter !== 'all' || qrBatchFilter !== 'all' || qrUserFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Contact support to request QR codes for your store'}
          </p>
        </div>
      ) : qrViewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {paginatedQRCodes.map((qr) => (
            <div
              key={qr.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow"
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  qr.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : qr.status === 'inactive'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {qr.status.charAt(0).toUpperCase() + qr.status.slice(1)}
                </span>
                {qr.pet_id && <PawPrint className="w-3 h-3 text-blue-500" />}
              </div>

              {/* QR Code Info */}
              <div className="text-center mb-2">
                <QrCode className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mx-auto mb-1" />
                <p className="font-mono text-xs font-semibold text-gray-900 dark:text-white truncate">{qr.code}</p>
                <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400">PIN: {qr.pin}</p>
              </div>

              {/* Pet/User Info */}
              <div className="text-center mb-2 min-h-[32px]">
                {qr.pet_name ? (
                  <p className="text-xs text-gray-900 dark:text-white truncate">{qr.pet_name}</p>
                ) : qr.user_email ? (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{qr.user_email}</p>
                ) : (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">Unassigned</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => handleViewQR(qr)}
                  className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded transition-colors"
                  title="View Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDownloadQR(qr)}
                  className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {qr.pet_id ? (
                  <button
                    onClick={() => handleUnlinkFromPet(qr)}
                    className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded transition-colors"
                    title="Unlink"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkToPet(qr)}
                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
                    title="Link to Pet"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[320px] sm:min-w-0">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">QR Code</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">PIN</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Status</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">User</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Linked Pet</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden xl:table-cell">Created</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQRCodes.map((qr) => (
                <tr key={qr.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span className="font-mono text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{qr.code}</span>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                    <span className="font-mono text-xs sm:text-sm text-gray-600 dark:text-gray-400">{qr.pin}</span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      qr.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : qr.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {qr.status.charAt(0).toUpperCase() + qr.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                    {qr.user_email ? (
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-[150px] block">{qr.user_email}</span>
                    ) : (
                      <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    {qr.pet_name ? (
                      <div className="flex items-center gap-1">
                        <PawPrint className="w-3 h-3 text-blue-500" />
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">{qr.pet_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">Not linked</span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 hidden xl:table-cell">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {new Date(qr.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-4">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <button
                        onClick={() => handleViewQR(qr)}
                        className="p-1.5 sm:p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadQR(qr)}
                        className="p-1.5 sm:p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="Download QR Code"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {qr.pet_id ? (
                        <button
                          onClick={() => handleUnlinkFromPet(qr)}
                          className="p-1.5 sm:p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Unlink from Pet"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLinkToPet(qr)}
                          className="p-1.5 sm:p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Link to Pet"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {qrTotalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 py-3">
          <button
            onClick={() => setQRCurrentPage(1)}
            disabled={qrCurrentPage === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setQRCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={qrCurrentPage === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {qrCurrentPage} of {qrTotalPages}
          </span>
          <button
            onClick={() => setQRCurrentPage(prev => Math.min(qrTotalPages, prev + 1))}
            disabled={qrCurrentPage === qrTotalPages}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setQRCurrentPage(qrTotalPages)}
            disabled={qrCurrentPage === qrTotalPages}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}

      {/* QR Count Summary */}
      {!isQRCodesLoading && filteredQRCodes.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {qrStartIndex + 1}-{Math.min(qrEndIndex, filteredQRCodes.length)} of {filteredQRCodes.length} QR code{filteredQRCodes.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Modals */}
      <ViewTenantQRModal
        isOpen={isViewQRModalOpen}
        qr={selectedQR}
        onClose={() => setIsViewQRModalOpen(false)}
      />
      <LinkToPetModal
        isOpen={isLinkPetModalOpen}
        qr={selectedQR}
        onClose={() => setIsLinkPetModalOpen(false)}
        onSuccess={handleQRSuccess}
      />
    </div>
  )
}

export default TenantQRCodesTab
