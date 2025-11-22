/**
 * BulkDeleteUsersModal Component
 *
 * Confirmation modal for bulk deleting users.
 */

import React from 'react'
import {
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface BulkDeleteUsersModalProps {
  isOpen: boolean
  selectedCount: number
  isDeleting: boolean
  deleteError: string | null
  onClose: () => void
  onConfirm: () => void
}

/**
 * Modal component for confirming bulk user deletion
 */
export const BulkDeleteUsersModal: React.FC<BulkDeleteUsersModalProps> = ({
  isOpen,
  selectedCount,
  isDeleting,
  deleteError,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Users</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete {selectedCount} user{selectedCount !== 1 ? 's' : ''}?
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This action cannot be undone. All selected users and their associated data will be permanently deleted.
          </p>

          {deleteError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{deleteError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkDeleteUsersModal
