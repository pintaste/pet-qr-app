/**
 * BulkDeleteQRModal Component
 *
 * Confirmation modal for bulk deleting QR codes with progress indicator.
 */

import React from 'react'
import {
  QrCode,
  Trash2,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface BulkDeleteQRModalProps {
  isOpen: boolean
  filteredCount: number
  hasFilters: boolean
  isBulkDeleting: boolean
  bulkDeleteProgress: number
  bulkDeleteError: string | null
  onClose: () => void
  onConfirm: () => void
}

/**
 * Modal component for confirming bulk QR code deletion
 */
export const BulkDeleteQRModal: React.FC<BulkDeleteQRModalProps> = ({
  isOpen,
  filteredCount,
  hasFilters,
  isBulkDeleting,
  bulkDeleteProgress,
  bulkDeleteError,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
            Bulk Delete
          </h2>
          <button
            onClick={onClose}
            disabled={isBulkDeleting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {bulkDeleteError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{bulkDeleteError}</p>
            </div>
          )}

          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Are you sure you want to delete{' '}
              <span className="font-bold text-red-600 dark:text-red-400">
                {filteredCount}
              </span>{' '}
              QR code{filteredCount !== 1 ? 's' : ''}?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {hasFilters ? (
                <>This will delete all QR codes matching your current filters.</>
              ) : (
                <>This will delete ALL QR codes in the system.</>
              )}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isBulkDeleting}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isBulkDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isBulkDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {bulkDeleteProgress}%
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Delete All
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BulkDeleteQRModal
