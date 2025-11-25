/**
 * Bulk Delete Modal Component
 *
 * Confirmation modal for bulk deleting pets:
 * - Shows count and names of selected pets
 * - 10-second countdown before delete button activates
 * - Cancel button is highlighted (safer default)
 */

import React, { useEffect } from 'react'
import { X, AlertTriangle, PawPrint } from 'lucide-react'
import { Pet } from '@/services/petService'

interface BulkDeleteModalProps {
  isOpen: boolean
  selectedPetIds: Set<number>
  pets: Pet[]
  countdown: number
  setCountdown: React.Dispatch<React.SetStateAction<number>>
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

/**
 * Renders the bulk delete confirmation modal
 *
 * @param isOpen - Whether the modal is visible
 * @param selectedPetIds - Set of pet IDs to delete
 * @param pets - Array of all pets (to display names)
 * @param countdown - Current countdown value
 * @param setCountdown - Function to update countdown
 * @param isDeleting - Whether deletion is in progress
 * @param onClose - Handler to close modal
 * @param onConfirm - Handler to confirm deletion
 */
export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  selectedPetIds,
  pets,
  countdown,
  setCountdown,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  // Countdown timer effect
  useEffect(() => {
    if (!isOpen) return

    if (countdown <= 0) return

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isOpen, countdown, setCountdown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Delete {selectedPetIds.size} Pet{selectedPetIds.size !== 1 ? 's' : ''}?
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          This action cannot be undone. All selected pets and their associated data will be permanently deleted.
        </p>

        {/* Pet Names Preview */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-6 max-h-32 overflow-y-auto">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
            Selected Pets:
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedPetIds).map(petId => {
              const pet = pets.find(p => p.id === petId)
              return pet ? (
                <span
                  key={petId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs text-gray-700 dark:text-gray-300"
                >
                  <PawPrint className="w-3 h-3" />
                  {pet.name}
                </span>
              ) : null
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* Cancel Button - Highlighted */}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            autoFocus
          >
            Cancel
          </button>

          {/* Delete Button - Inactive until countdown finishes */}
          <button
            onClick={onConfirm}
            disabled={countdown > 0 || isDeleting}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
              countdown > 0 || isDeleting
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Deleting...
              </span>
            ) : countdown > 0 ? (
              `Delete (${countdown}s)`
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
