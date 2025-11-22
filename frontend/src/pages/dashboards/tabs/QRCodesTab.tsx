/**
 * QR Codes Tab Component for User Dashboard
 *
 * Redesigned based on QR Code Lifecycle:
 * - Users can only see their ACTIVATED QR codes
 * - Main actions: View, Download, Link to Pet, Unlink from Pet
 * - No Edit/Delete (QR codes are physical products)
 * - Activate new QR codes with CODE+PIN
 */

import React, { useState, useMemo, useEffect } from 'react'
import {
  QrCode,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Eye,
  Download,
  Link2,
  Unlink,
  Calendar,
  PawPrint
} from 'lucide-react'
import { QRCard, QRCardSkeleton, NoQRCodesCard, QRCodeData } from '@/components/QRCard'
import { ViewQRModal } from '@/components/ViewQRModal'
import { ActivateQRModal } from '@/components/ActivateQRModal'
import { SelectPetModal } from '@/components/SelectPetModal'
import { qrService } from '@/services/qrService'
import { petService, Pet } from '@/services/petService'
import { userDashboardService, UserDashboardStats } from '@/services/userDashboardService'

interface QRCodesTabProps {
  pets: Pet[]
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>
  setStats: React.Dispatch<React.SetStateAction<UserDashboardStats>>
}

type QRFilter = 'all' | 'linked' | 'unlinked'
type ViewMode = 'grid' | 'list'

/**
 * QR Codes Tab component for managing user's QR codes
 */
const QRCodesTab: React.FC<QRCodesTabProps> = ({
  pets,
  setPets,
  setStats,
}) => {
  // QR codes state
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal states
  const [isViewQRModalOpen, setIsViewQRModalOpen] = useState(false)
  const [isActivateQRModalOpen, setIsActivateQRModalOpen] = useState(false)
  const [isLinkQRModalOpen, setIsLinkQRModalOpen] = useState(false)

  // Selected QR for modals
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null)

  // Filter, search, and view states
  const [qrFilter, setQrFilter] = useState<QRFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Fetch QR codes on mount
  useEffect(() => {
    fetchQRCodes()
  }, [])

  const fetchQRCodes = async () => {
    try {
      setIsLoading(true)
      const codes = await qrService.getQRCodes()

      // Enrich with pet names
      const enrichedCodes: QRCodeData[] = codes.map((qr) => {
        const pet = pets.find(p => p.id === qr.pet_id)
        return {
          ...qr,
          pet_name: pet?.name,
        } as QRCodeData
      })

      setQRCodes(enrichedCodes)
    } catch (err) {
      console.error('[QRCodesTab] Error fetching QR codes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Re-fetch when pets change (to update pet names)
  useEffect(() => {
    if (qrCodes.length > 0) {
      const enrichedCodes = qrCodes.map((qr) => {
        const pet = pets.find(p => p.id === qr.pet_id)
        return {
          ...qr,
          pet_name: pet?.name,
        }
      })
      setQRCodes(enrichedCodes)
    }
  }, [pets])

  // Memoize filtered QR codes
  const filteredQRCodes = useMemo(() => {
    let result = [...qrCodes]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(qr =>
        qr.code.toLowerCase().includes(query) ||
        qr.pet_name?.toLowerCase().includes(query)
      )
    }

    // Apply link filter
    if (qrFilter === 'linked') {
      result = result.filter(qr => qr.pet_id)
    } else if (qrFilter === 'unlinked') {
      result = result.filter(qr => !qr.pet_id)
    }

    return result
  }, [qrCodes, searchQuery, qrFilter])

  // Handler functions
  const handleViewQR = (qr: QRCodeData) => {
    setSelectedQR(qr)
    setIsViewQRModalOpen(true)
  }

  const handleDownloadQR = async (qr: QRCodeData) => {
    try {
      await qrService.downloadQRImage(qr, `qr-code-${qr.code}.png`)
    } catch (error) {
      console.error('[QRCodesTab] Error downloading QR code:', error)
      alert(`Failed to download QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleLinkQR = (qr: QRCodeData) => {
    setSelectedQR(qr)
    setIsLinkQRModalOpen(true)
  }

  const handleUnlinkQR = async (qr: QRCodeData) => {
    if (!qr.pet_id) return

    if (!confirm(`Are you sure you want to unlink ${qr.pet_name || 'this pet'} from QR code ${qr.code}?`)) {
      return
    }

    try {
      await petService.unlinkQRCode(qr.pet_id)

      // Refresh data
      await fetchQRCodes()

      const updatedPets = await petService.getPets()
      setPets(updatedPets || [])

      const updatedStats = await userDashboardService.getDashboardStats()
      setStats(updatedStats)

      console.log('[QRCodesTab] QR code unlinked successfully')
    } catch (error) {
      console.error('[QRCodesTab] Error unlinking QR code:', error)
      alert(`Failed to unlink QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleActivateQR = () => {
    setIsActivateQRModalOpen(true)
  }

  const handleActivateSuccess = async () => {
    // Refresh all data
    await fetchQRCodes()

    const updatedStats = await userDashboardService.getDashboardStats()
    setStats(updatedStats)
  }

  const handleLinkSuccess = async () => {
    // Refresh data
    await fetchQRCodes()

    const updatedPets = await petService.getPets()
    setPets(updatedPets || [])

    const updatedStats = await userDashboardService.getDashboardStats()
    setStats(updatedStats)
  }

  // Filter helpers
  const getFilterLabel = () => {
    switch (qrFilter) {
      case 'linked': return 'Linked'
      case 'unlinked': return 'Unlinked'
      default: return 'All'
    }
  }

  const cycleFilter = () => {
    if (qrFilter === 'all') setQrFilter('linked')
    else if (qrFilter === 'linked') setQrFilter('unlinked')
    else setQrFilter('all')
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      {/* Header with Search, Filter, View Switcher, and Activate Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My QR Codes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your activated QR codes and link them to pets
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search QR codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={cycleFilter}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getFilterLabel()}
            </span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Activate QR Button */}
          <button
            onClick={handleActivateQR}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Activate QR
          </button>
        </div>
      </div>

      {/* QR Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setQrFilter('all')}
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all duration-200 text-left hover:shadow-md ${
            qrFilter === 'all'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{qrCodes.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total QR Codes</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setQrFilter('linked')}
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all duration-200 text-left hover:shadow-md ${
            qrFilter === 'linked'
              ? 'border-green-500 ring-2 ring-green-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Link2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {qrCodes.filter(qr => qr.pet_id).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Linked</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setQrFilter('unlinked')}
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all duration-200 text-left hover:shadow-md ${
            qrFilter === 'unlinked'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Unlink className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {qrCodes.filter(qr => !qr.pet_id).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unlinked</p>
            </div>
          </div>
        </button>
      </div>

      {/* QR Codes Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QRCardSkeleton />
          <QRCardSkeleton />
          <QRCardSkeleton />
        </div>
      ) : filteredQRCodes.length === 0 ? (
        searchQuery || qrFilter !== 'all' ? (
          // No results from search/filter
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-light text-gray-900 dark:text-white mb-2">
              No QR Codes Found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {searchQuery
                ? `No QR codes match "${searchQuery}". Try a different search term.`
                : `No QR codes match the "${getFilterLabel()}" filter.`}
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setQrFilter('all')
              }}
              className="mt-4 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          // No QR codes at all
          <NoQRCodesCard onGenerate={handleActivateQR} />
        )
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQRCodes.map((qr) => (
            <QRCard
              key={qr.id}
              qr={qr}
              onView={handleViewQR}
              onDownload={handleDownloadQR}
              onLink={!qr.pet_id ? () => handleLinkQR(qr) : undefined}
              onUnlink={qr.pet_id ? () => handleUnlinkQR(qr) : undefined}
            />
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* List Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="col-span-3">QR Code</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Linked Pet</div>
            <div className="col-span-2">Activated</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredQRCodes.map((qr) => (
              <div
                key={qr.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors items-center"
              >
                {/* QR Code */}
                <div className="col-span-1 md:col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-medium text-gray-900 dark:text-white text-sm truncate">
                      {qr.code}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PIN: {qr.pin}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="hidden md:block col-span-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    qr.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {qr.status}
                  </span>
                </div>

                {/* Linked Pet */}
                <div className="hidden md:block col-span-3">
                  {qr.pet_id ? (
                    <div className="flex items-center gap-2">
                      <PawPrint className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm text-gray-900 dark:text-white truncate">
                        {qr.pet_name || `Pet #${qr.pet_id}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      Not linked
                    </span>
                  )}
                </div>

                {/* Activated Date */}
                <div className="hidden md:flex col-span-2 items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {qr.activated_at ? formatDate(qr.activated_at) : formatDate(qr.created_at)}
                  </span>
                </div>

                {/* Mobile Info */}
                <div className="md:hidden flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className={qr.status === 'active' ? 'text-green-600' : ''}>{qr.status}</span>
                  {qr.pet_name && <span className="text-indigo-600">{qr.pet_name}</span>}
                </div>

                {/* Actions */}
                <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleViewQR(qr)}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadQR(qr)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {qr.pet_id ? (
                    <button
                      onClick={() => handleUnlinkQR(qr)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Unlink from pet"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLinkQR(qr)}
                      className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Link to pet"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ViewQRModal
        isOpen={isViewQRModalOpen}
        qr={selectedQR}
        onClose={() => {
          setIsViewQRModalOpen(false)
          setSelectedQR(null)
        }}
        onDownload={handleDownloadQR}
      />

      <ActivateQRModal
        isOpen={isActivateQRModalOpen}
        onClose={() => setIsActivateQRModalOpen(false)}
        onSuccess={handleActivateSuccess}
      />

      {selectedQR && !selectedQR.pet_id && (
        <SelectPetModal
          isOpen={isLinkQRModalOpen}
          qrCodeId={selectedQR.id}
          qrCode={selectedQR.code}
          onClose={() => {
            setIsLinkQRModalOpen(false)
            setSelectedQR(null)
          }}
          onSuccess={handleLinkSuccess}
        />
      )}
    </div>
  )
}

export default QRCodesTab
