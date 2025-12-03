/**
 * Pet List View Component
 *
 * Displays pets in a table/list layout with columns:
 * - Pet info (photo, name, medical alert)
 * - Breed
 * - Age
 * - QR Status
 * - Actions (Link/Unlink, Pin, View, Edit)
 */

import React from 'react'
import {
  PawPrint,
  Pin,
  Eye,
  Edit,
  Calendar,
  AlertTriangle,
  QrCode,
  Link2,
  Unlink,
  CheckSquare,
} from 'lucide-react'
import { Pet } from '@/services/petService'

interface PetListViewProps {
  pets: Pet[]
  isSelectMode: boolean
  selectedPetIds: Set<number>
  onTogglePetSelection: (petId: number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onViewPet: (petId: number) => void
  onEditPet: (petId: number) => void
  onTogglePin: (petId: number) => void
  onLinkQR: (petId: number) => void
  onUnlinkQR: (petId: number) => void
}

/**
 * Format age from years to readable string
 */
const formatAge = (age: number): string => {
  if (age === 0) {
    return '< 1 year'
  }
  if (age === 1) {
    return '1 year'
  }
  return `${age} years`
}

/**
 * Renders pets in a table/list layout
 *
 * @param pets - Array of pets to display
 * @param isSelectMode - Whether multi-select mode is active
 * @param selectedPetIds - Set of selected pet IDs
 * @param onTogglePetSelection - Handler to toggle pet selection
 * @param onSelectAll - Handler to select all pets
 * @param onDeselectAll - Handler to deselect all pets
 * @param onViewPet - Handler to view pet details
 * @param onEditPet - Handler to edit pet
 * @param onTogglePin - Handler to toggle pin status
 * @param onLinkQR - Handler to link QR code
 * @param onUnlinkQR - Handler to unlink QR code
 */
export const PetListView: React.FC<PetListViewProps> = ({
  pets,
  isSelectMode,
  selectedPetIds,
  onTogglePetSelection,
  onSelectAll,
  onDeselectAll,
  onViewPet,
  onEditPet,
  onTogglePin,
  onLinkQR,
  onUnlinkQR,
}) => {
  const allSelected = selectedPetIds.size === pets.length && pets.length > 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* List Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {isSelectMode && (
          <div className="col-span-1 flex items-center">
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                allSelected
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
              }`}
            >
              {allSelected && (
                <CheckSquare className="w-3 h-3" />
              )}
            </button>
          </div>
        )}
        <div className={isSelectMode ? 'col-span-3' : 'col-span-4'}>Pet</div>
        <div className="col-span-2">Breed</div>
        <div className="col-span-2">Age</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* List Items */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {pets.map((pet) => (
          <div
            key={pet.id}
            className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors items-center ${
              selectedPetIds.has(pet.id) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''
            } ${isSelectMode ? 'cursor-pointer' : ''}`}
            onClick={isSelectMode ? () => onTogglePetSelection(pet.id) : undefined}
          >
            {/* Checkbox */}
            {isSelectMode && (
              <div className="col-span-1 flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTogglePetSelection(pet.id)
                  }}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedPetIds.has(pet.id)
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                  }`}
                >
                  {selectedPetIds.has(pet.id) && (
                    <CheckSquare className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}

            {/* Pet Info */}
            <div className={`col-span-1 flex items-center gap-3 ${isSelectMode ? 'md:col-span-3' : 'md:col-span-4'}`}>
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex-shrink-0">
                {pet.photos && pet.photos.length > 0 ? (
                  <img
                    src={pet.photos[0]}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PawPrint className="w-6 h-6 text-indigo-400 dark:text-indigo-500" />
                  </div>
                )}
                {pet.is_pinned && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Pin className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {pet.name}
                </p>
                {pet.medical_info?.medical_conditions && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-orange-600 dark:text-orange-400 truncate">
                      Medical
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Breed */}
            <div className="hidden md:block col-span-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {pet.breed || '-'}
              </p>
            </div>

            {/* Age */}
            <div className="hidden md:flex col-span-2 items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatAge(pet.age)}
              </span>
            </div>

            {/* Status */}
            <div className="hidden md:block col-span-2">
              {pet.qr_code_id ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  <QrCode className="w-3 h-3" />
                  Linked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                  <QrCode className="w-3 h-3" />
                  No QR
                </span>
              )}
            </div>

            {/* Mobile Info */}
            <div className="md:hidden flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{pet.breed}</span>
              <span>{formatAge(pet.age)}</span>
              {pet.qr_code_id && (
                <span className="text-green-600 dark:text-green-400">QR</span>
              )}
            </div>

            {/* Actions */}
            <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-1">
              {pet.qr_code_id ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnlinkQR(pet.id)
                  }}
                  className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Unlink QR Code"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onLinkQR(pet.id)
                  }}
                  className="p-2 text-green-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Link QR Code"
                >
                  <Link2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePin(pet.id)
                }}
                className={`p-2 rounded-lg transition-colors ${
                  pet.is_pinned
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={pet.is_pinned ? 'Unpin' : 'Pin'}
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewPet(pet.id)
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditPet(pet.id)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
