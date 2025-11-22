import { useState, useEffect, useMemo, useCallback } from 'react'
import { QRCodeData } from '@/components/QRCard'
import { superAdminService } from '@/services/superAdminService'
import { qrService } from '@/services/qrService'
import { downloadSingleQR, downloadBulkQR } from '@/utils/qrDownloadUtils'
import { PAGINATION_CONFIG } from '@/config'

/**
 * Configuration options for the QR Factory hook
 */
export interface UseQRFactoryOptions {
  /** Number of QR codes per page for pagination */
  qrCodesPerPage?: number
  /** Callback when QR codes are updated (e.g., to refresh stats) */
  onQRCodesUpdated?: () => Promise<void>
}

/**
 * Return type for the useQRFactory hook
 */
export interface UseQRFactoryReturn {
  // QR Code data
  qrCodes: QRCodeData[]
  filteredQRCodes: QRCodeData[]
  paginatedQRCodes: QRCodeData[]
  uniqueBatches: string[]
  isQRsLoading: boolean

  // Selection state
  selectedQR: QRCodeData | null
  setSelectedQR: React.Dispatch<React.SetStateAction<QRCodeData | null>>

  // Modal states
  isViewQRModalOpen: boolean
  setIsViewQRModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  isDeleteQRModalOpen: boolean
  setIsDeleteQRModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  showBulkDeleteConfirm: boolean
  setShowBulkDeleteConfirm: React.Dispatch<React.SetStateAction<boolean>>

  // Filter states
  qrSearchQuery: string
  setQrSearchQuery: React.Dispatch<React.SetStateAction<string>>
  qrStatusFilter: string
  setQrStatusFilter: React.Dispatch<React.SetStateAction<string>>
  qrBatchFilter: string
  setQrBatchFilter: React.Dispatch<React.SetStateAction<string>>
  qrAssignmentFilter: string
  setQrAssignmentFilter: React.Dispatch<React.SetStateAction<string>>
  qrTenantFilter: string
  setQrTenantFilter: React.Dispatch<React.SetStateAction<string>>

  // Pagination
  qrCurrentPage: number
  setQrCurrentPage: React.Dispatch<React.SetStateAction<number>>
  qrTotalPages: number
  qrCodesPerPage: number

  // Bulk download state
  isBulkDownloading: boolean
  bulkDownloadProgress: number

  // Delete state
  isDeleting: boolean
  deleteError: string | null
  setDeleteError: React.Dispatch<React.SetStateAction<string | null>>
  isBulkDeleting: boolean
  bulkDeleteProgress: number
  bulkDeleteError: string | null
  setBulkDeleteError: React.Dispatch<React.SetStateAction<string | null>>

  // Handler functions
  handleViewQR: (qr: QRCodeData) => void
  handleDownloadQR: (qr: QRCodeData, style?: 'scanner' | 'rounded') => Promise<void>
  handleDeleteQR: (qr: QRCodeData) => void
  handleBulkDownload: (style?: 'scanner' | 'rounded') => Promise<void>
  confirmDeleteQR: () => Promise<void>
  handleBulkDelete: () => Promise<void>
  refreshQRCodes: () => Promise<void>
}

/**
 * Custom hook for managing QR Factory state and logic
 *
 * Handles QR code listing, filtering, pagination, downloading, and deletion
 * for the Super Admin Dashboard QR Factory tab.
 *
 * @param isActive - Whether the QR Factory tab is active
 * @param options - Configuration options for the hook
 * @returns QR Factory state and handler functions
 *
 * @example
 * ```tsx
 * const {
 *   qrCodes,
 *   filteredQRCodes,
 *   handleViewQR,
 *   handleBulkDownload,
 * } = useQRFactory(activeTab === 'qr-factory', {
 *   onQRCodesUpdated: refreshStats
 * })
 * ```
 */
export function useQRFactory(
  isActive: boolean,
  options: UseQRFactoryOptions = {}
): UseQRFactoryReturn {
  const {
    qrCodesPerPage = PAGINATION_CONFIG.QR_CODES_PER_PAGE,
    onQRCodesUpdated
  } = options

  // QR codes data
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([])
  const [isQRsLoading, setIsQRsLoading] = useState(false)

  // Selection state
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null)

  // Modal states
  const [isViewQRModalOpen, setIsViewQRModalOpen] = useState(false)
  const [isDeleteQRModalOpen, setIsDeleteQRModalOpen] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Filter states
  const [qrSearchQuery, setQrSearchQuery] = useState('')
  const [qrStatusFilter, setQrStatusFilter] = useState<string>('')
  const [qrBatchFilter, setQrBatchFilter] = useState<string>('')
  const [qrAssignmentFilter, setQrAssignmentFilter] = useState<string>('')
  const [qrTenantFilter, setQrTenantFilter] = useState<string>('')

  // Pagination
  const [qrCurrentPage, setQrCurrentPage] = useState(1)

  // Bulk download state
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState(0)

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)

  // Get unique batch IDs for filter dropdown
  const uniqueBatches = useMemo(() => {
    return [...new Set(qrCodes.map(qr => qr.batch_id).filter(Boolean))] as string[]
  }, [qrCodes])

  // Filter QR codes based on search and filters
  const filteredQRCodes = useMemo(() => {
    return qrCodes.filter(qr => {
      const matchesSearch = !qrSearchQuery ||
        qr.code.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
        qr.batch_id?.toLowerCase().includes(qrSearchQuery.toLowerCase())
      const matchesStatus = !qrStatusFilter || qr.status.toLowerCase() === qrStatusFilter.toLowerCase()
      const matchesBatch = !qrBatchFilter || qr.batch_id === qrBatchFilter
      const matchesAssignment = !qrAssignmentFilter ||
        (qrAssignmentFilter === 'assigned' && qr.pet_id) ||
        (qrAssignmentFilter === 'unassigned' && !qr.pet_id)
      return matchesSearch && matchesStatus && matchesBatch && matchesAssignment
    })
  }, [qrCodes, qrSearchQuery, qrStatusFilter, qrBatchFilter, qrAssignmentFilter])

  // Calculate pagination
  const qrTotalPages = Math.ceil(filteredQRCodes.length / qrCodesPerPage)
  const qrStartIndex = (qrCurrentPage - 1) * qrCodesPerPage
  const qrEndIndex = qrStartIndex + qrCodesPerPage
  const paginatedQRCodes = filteredQRCodes.slice(qrStartIndex, qrEndIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setQrCurrentPage(1)
  }, [qrSearchQuery, qrStatusFilter, qrBatchFilter, qrAssignmentFilter])

  /**
   * Fetch QR codes from the API
   */
  const refreshQRCodes = useCallback(async () => {
    try {
      setIsQRsLoading(true)
      const codes = await superAdminService.getAllQRCodes({ limit: PAGINATION_CONFIG.MAX_FETCH_LIMIT })
      setQRCodes(codes || [])
    } catch (err) {
      console.error('[useQRFactory] Error fetching QR codes:', err)
    } finally {
      setIsQRsLoading(false)
    }
  }, [])

  // Fetch QR codes when tab becomes active
  useEffect(() => {
    if (isActive) {
      refreshQRCodes()
    }
  }, [isActive, refreshQRCodes])

  /**
   * Open view modal for a QR code
   */
  const handleViewQR = useCallback((qr: QRCodeData) => {
    setSelectedQR(qr)
    setIsViewQRModalOpen(true)
  }, [])

  /**
   * Download a single QR code
   */
  const handleDownloadQR = useCallback(async (qr: QRCodeData, style: 'scanner' | 'rounded' = 'scanner') => {
    try {
      await downloadSingleQR(qr, style)
    } catch (error) {
      console.error('[useQRFactory] Error downloading QR:', error)
    }
  }, [])

  /**
   * Open delete confirmation modal for a QR code
   */
  const handleDeleteQR = useCallback((qr: QRCodeData) => {
    setSelectedQR(qr)
    setDeleteError(null)
    setIsDeleteQRModalOpen(true)
  }, [])

  /**
   * Bulk download filtered QR codes as ZIP
   */
  const handleBulkDownload = useCallback(async (style: 'scanner' | 'rounded' = 'scanner') => {
    if (filteredQRCodes.length === 0) return

    setIsBulkDownloading(true)
    setBulkDownloadProgress(0)

    try {
      await downloadBulkQR(
        filteredQRCodes,
        style,
        qrBatchFilter || undefined,
        (progress) => setBulkDownloadProgress(progress)
      )
    } catch (error) {
      console.error('[useQRFactory] Error bulk downloading QR codes:', error)
    } finally {
      setIsBulkDownloading(false)
      setBulkDownloadProgress(0)
    }
  }, [filteredQRCodes, qrBatchFilter])

  /**
   * Confirm and execute single QR deletion
   */
  const confirmDeleteQR = useCallback(async () => {
    if (!selectedQR) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await qrService.deleteQRCode(selectedQR.id)

      // Refresh QR codes
      const codes = await superAdminService.getAllQRCodes({ limit: PAGINATION_CONFIG.MAX_FETCH_LIMIT })
      setQRCodes(codes || [])

      // Refresh stats if callback provided
      if (onQRCodesUpdated) {
        await onQRCodesUpdated()
      }

      setIsDeleteQRModalOpen(false)
      setSelectedQR(null)
    } catch (error) {
      console.error('[useQRFactory] Error deleting QR:', error)
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete QR code')
    } finally {
      setIsDeleting(false)
    }
  }, [selectedQR, onQRCodesUpdated])

  /**
   * Bulk delete filtered QR codes using polling
   */
  const handleBulkDelete = useCallback(async () => {
    if (filteredQRCodes.length === 0) return

    setIsBulkDeleting(true)
    setBulkDeleteProgress(0)
    setBulkDeleteError(null)

    try {
      // Get all QR IDs to delete
      const qrIds = filteredQRCodes.map(qr => qr.id)

      // Start bulk delete task
      const response = await qrService.startBulkDelete(qrIds)
      const taskId = response.task_id

      console.log('[useQRFactory] Bulk delete started, task:', taskId)

      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const status = await qrService.getBulkDeleteStatus(taskId)

          setBulkDeleteProgress(status.progress)

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval)

            // Refresh QR codes
            const codes = await superAdminService.getAllQRCodes({ limit: PAGINATION_CONFIG.MAX_FETCH_LIMIT })
            setQRCodes(codes || [])

            // Refresh stats if callback provided
            if (onQRCodesUpdated) {
              await onQRCodesUpdated()
            }

            if (status.fail_count > 0) {
              setBulkDeleteError(`Deleted ${status.success_count} QR codes. Failed to delete ${status.fail_count}.`)
            } else if (status.status === 'failed') {
              setBulkDeleteError(status.error_message || 'Bulk delete failed')
            }

            setIsBulkDeleting(false)
            setBulkDeleteProgress(100)

            // Close modal after a brief delay to show 100%
            setTimeout(() => {
              setShowBulkDeleteConfirm(false)
              setBulkDeleteProgress(0)
            }, 500)
          }
        } catch (err) {
          console.error('[useQRFactory] Error polling bulk delete status:', err)
          clearInterval(pollInterval)
          setBulkDeleteError('Failed to get delete progress')
          setIsBulkDeleting(false)
        }
      }, 1000) // Poll every 1 second

    } catch (error) {
      console.error('[useQRFactory] Error starting bulk delete:', error)
      setBulkDeleteError(error instanceof Error ? error.message : 'Failed to start bulk delete')
      setIsBulkDeleting(false)
      setBulkDeleteProgress(0)
    }
  }, [filteredQRCodes, onQRCodesUpdated])

  return {
    // QR Code data
    qrCodes,
    filteredQRCodes,
    paginatedQRCodes,
    uniqueBatches,
    isQRsLoading,

    // Selection state
    selectedQR,
    setSelectedQR,

    // Modal states
    isViewQRModalOpen,
    setIsViewQRModalOpen,
    isDeleteQRModalOpen,
    setIsDeleteQRModalOpen,
    showBulkDeleteConfirm,
    setShowBulkDeleteConfirm,

    // Filter states
    qrSearchQuery,
    setQrSearchQuery,
    qrStatusFilter,
    setQrStatusFilter,
    qrBatchFilter,
    setQrBatchFilter,
    qrAssignmentFilter,
    setQrAssignmentFilter,
    qrTenantFilter,
    setQrTenantFilter,

    // Pagination
    qrCurrentPage,
    setQrCurrentPage,
    qrTotalPages,
    qrCodesPerPage,

    // Bulk download state
    isBulkDownloading,
    bulkDownloadProgress,

    // Delete state
    isDeleting,
    deleteError,
    setDeleteError,
    isBulkDeleting,
    bulkDeleteProgress,
    bulkDeleteError,
    setBulkDeleteError,

    // Handler functions
    handleViewQR,
    handleDownloadQR,
    handleDeleteQR,
    handleBulkDownload,
    confirmDeleteQR,
    handleBulkDelete,
    refreshQRCodes
  }
}

export default useQRFactory
