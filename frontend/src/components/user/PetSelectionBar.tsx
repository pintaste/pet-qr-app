/**
 * Pet Selection Bar Component
 *
 * Displays when in multi-select mode:
 * - Shows count of selected pets
 * - Provides Select All / Deselect All actions
 * - Shows bulk delete button
 */

import React from 'react'
import { Trash2 } from 'lucide-react'
import { Pet } from '@/services/petService'

interface PetSelectionBarProps {
  selectedPetIds: Set<number>
  filteredPets: Pet[]
  onSelectAll: () => void
  onDeselectAll: () => void
  onBulkDelete: () => void
}

/**
 * Renders the selection action bar for multi-select mode
 *
 * @param selectedPetIds - Set of selected pet IDs
 * @param filteredPets - Currently filtered/visible pets
 * @param onSelectAll - Handler to select all visible pets
 * @param onDeselectAll - Handler to deselect all pets
 * @param onBulkDelete - Handler to open bulk delete modal
 */
export const PetSelectionBar: React.FC<PetSelectionBarProps> = ({
  selectedPetIds,
  filteredPets,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
}) => {
  return (
    <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          {selectedPetIds.size} of {filteredPets.length} selected
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Select All
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={onDeselectAll}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Deselect All
          </button>
        </div>
      </div>
      <button
        onClick={onBulkDelete}
        disabled={selectedPetIds.size === 0}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          selectedPetIds.size === 0
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-red-500 hover:bg-red-600 text-white'
        }`}
      >
        <Trash2 className="w-4 h-4" />
        Delete ({selectedPetIds.size})
      </button>
    </div>
  )
}
