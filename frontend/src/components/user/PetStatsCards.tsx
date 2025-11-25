/**
 * Pet Stats Cards Component
 *
 * Displays three clickable stat cards showing:
 * - Total pets count
 * - Pets with QR codes linked
 * - Pets without QR codes
 */

import React from 'react'
import { PawPrint, Link2, Unlink } from 'lucide-react'
import { Pet } from '@/services/petService'

type PetFilter = 'all' | 'linked' | 'unlinked'

interface PetStatsCardsProps {
  pets: Pet[]
  petFilter: PetFilter
  setPetFilter: (filter: PetFilter) => void
}

/**
 * Renders the three stat cards for pet statistics
 *
 * @param pets - Array of all pets
 * @param petFilter - Current filter selection
 * @param setPetFilter - Function to update filter
 */
export const PetStatsCards: React.FC<PetStatsCardsProps> = ({
  pets,
  petFilter,
  setPetFilter,
}) => {
  const linkedCount = pets.filter(p => p.qr_code_id).length
  const unlinkedCount = pets.filter(p => !p.qr_code_id).length

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Total Pets */}
      <button
        onClick={() => setPetFilter('all')}
        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all duration-200 text-left hover:shadow-md ${
          petFilter === 'all'
            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <PawPrint className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pets.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Pets</p>
          </div>
        </div>
      </button>

      {/* Linked Pets */}
      <button
        onClick={() => setPetFilter('linked')}
        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all duration-200 text-left hover:shadow-md ${
          petFilter === 'linked'
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
              {linkedCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">With QR</p>
          </div>
        </div>
      </button>

      {/* Unlinked Pets */}
      <button
        onClick={() => setPetFilter('unlinked')}
        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all duration-200 text-left hover:shadow-md ${
          petFilter === 'unlinked'
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
              {unlinkedCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">No QR</p>
          </div>
        </div>
      </button>
    </div>
  )
}
