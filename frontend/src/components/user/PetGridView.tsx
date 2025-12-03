/**
 * Pet Grid View Component
 *
 * Displays pets in a grid layout with optional multi-select checkboxes
 */

import React from 'react'
import { CheckSquare } from 'lucide-react'
import { PetCard } from '@/components/PetCard'
import { Pet } from '@/services/petService'

interface PetGridViewProps {
  pets: Pet[]
  isSelectMode: boolean
  selectedPetIds: Set<number>
  onTogglePetSelection: (petId: number) => void
  onViewPet: (petId: number) => void
  onEditPet: (petId: number) => void
  onTogglePin: (petId: number) => void
}

/**
 * Renders pets in a responsive grid layout
 *
 * @param pets - Array of pets to display
 * @param isSelectMode - Whether multi-select mode is active
 * @param selectedPetIds - Set of selected pet IDs
 * @param onTogglePetSelection - Handler to toggle pet selection
 * @param onViewPet - Handler to view pet details
 * @param onEditPet - Handler to edit pet
 * @param onTogglePin - Handler to toggle pin status
 */
export const PetGridView: React.FC<PetGridViewProps> = ({
  pets,
  isSelectMode,
  selectedPetIds,
  onTogglePetSelection,
  onViewPet,
  onEditPet,
  onTogglePin,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map((pet) => (
        <div key={pet.id} className="relative">
          {isSelectMode && (
            <button
              onClick={() => onTogglePetSelection(pet.id)}
              className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                selectedPetIds.has(pet.id)
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-indigo-400'
              }`}
            >
              {selectedPetIds.has(pet.id) && (
                <CheckSquare className="w-4 h-4" />
              )}
            </button>
          )}
          <div
            className={`${
              isSelectMode && selectedPetIds.has(pet.id)
                ? 'ring-2 ring-indigo-500 rounded-2xl'
                : ''
            }`}
            onClick={isSelectMode ? () => onTogglePetSelection(pet.id) : undefined}
          >
            <PetCard
              pet={pet}
              onView={isSelectMode ? undefined : onViewPet}
              onEdit={isSelectMode ? undefined : onEditPet}
              onTogglePin={isSelectMode ? undefined : onTogglePin}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
