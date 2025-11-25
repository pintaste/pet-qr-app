/**
 * Pet Filters Component
 *
 * Provides search, filter, and view mode controls:
 * - Search input for pet name, breed, description
 * - Filter toggle (All / With QR / No QR)
 * - View mode switcher (Grid / List)
 * - Select mode toggle
 * - Add Pet button
 */

import React from 'react'
import { Search, Filter, LayoutGrid, List, CheckSquare, Plus } from 'lucide-react'

type PetFilter = 'all' | 'linked' | 'unlinked'
type ViewMode = 'grid' | 'list'

interface PetFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  petFilter: PetFilter
  cycleFilter: () => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  isSelectMode: boolean
  toggleSelectMode: () => void
  onAddPet: () => void
}

/**
 * Get display label for current filter
 */
const getFilterLabel = (filter: PetFilter): string => {
  switch (filter) {
    case 'linked': return 'With QR'
    case 'unlinked': return 'No QR'
    default: return 'All'
  }
}

/**
 * Renders the filter controls and action buttons
 *
 * @param searchQuery - Current search query
 * @param setSearchQuery - Function to update search query
 * @param petFilter - Current filter selection
 * @param cycleFilter - Function to cycle through filters
 * @param viewMode - Current view mode (grid/list)
 * @param setViewMode - Function to update view mode
 * @param isSelectMode - Whether multi-select mode is active
 * @param toggleSelectMode - Function to toggle select mode
 * @param onAddPet - Handler for Add Pet button
 */
export const PetFilters: React.FC<PetFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  petFilter,
  cycleFilter,
  viewMode,
  setViewMode,
  isSelectMode,
  toggleSelectMode,
  onAddPet,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Pets</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your pets and their QR codes
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {/* Search Bar */}
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={cycleFilter}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getFilterLabel(petFilter)}
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

        {/* Select Mode Toggle */}
        <button
          onClick={toggleSelectMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isSelectMode
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700'
              : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          {isSelectMode ? 'Cancel' : 'Select'}
        </button>

        {/* Add Pet Button */}
        <button
          onClick={onAddPet}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Pet
        </button>
      </div>
    </div>
  )
}
