import React from 'react'
import { Edit, Trash2, QrCode, Heart, Calendar, Info } from 'lucide-react'
import type { Pet } from '@/types'

interface PetListProps {
  pets: Pet[]
  onEdit: (pet: Pet) => void
  onDelete: (petId: number) => void
  onViewQR: (pet: Pet) => void
  isLoading?: boolean
}

/**
 * Pet List Component - Displays user's pets in a grid layout.
 *
 * Features:
 * - Grid/card view of all pets
 * - Quick actions: Edit, Delete, View QR
 * - Shows pet photo, name, breed, and age
 * - Empty state for no pets
 * - Loading state
 */
const PetList: React.FC<PetListProps> = ({ pets, onEdit, onDelete, onViewQR, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (pets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
          <Heart className="w-10 h-10 text-gray-400 dark:text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No pets yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Add your first pet to get started with QR code protection.
        </p>
      </div>
    )
  }

  const calculateAge = (ageInMonths?: number) => {
    if (!ageInMonths) return 'Unknown age'
    const years = Math.floor(ageInMonths / 12)
    const months = ageInMonths % 12

    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`
    return `${years}y ${months}m`
  }

  const handleDelete = (e: React.MouseEvent, petId: number, petName: string) => {
    e.stopPropagation()

    if (window.confirm(`Are you sure you want to delete ${petName}? This action cannot be undone.`)) {
      onDelete(petId)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map(pet => (
        <div
          key={pet.id}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100 dark:border-gray-700"
        >
          {/* Pet Photo */}
          <div className="relative aspect-square bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            {pet.photos && pet.photos.length > 0 ? (
              <img
                src={pet.photos[0]}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Heart className="w-20 h-20 text-gray-300 dark:text-gray-600" />
              </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                pet.isActive
                  ? 'bg-green-500/90 text-white'
                  : 'bg-gray-500/90 text-white'
              }`}>
                {pet.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          {/* Pet Info */}
          <div className="p-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {pet.name}
            </h3>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
              {pet.breed && <span>{pet.breed}</span>}
              {pet.breed && pet.age && <span>•</span>}
              {pet.age && <span>{calculateAge(pet.age)}</span>}
            </div>

            {pet.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                {pet.description}
              </p>
            )}

            {/* Quick Info */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
              {pet.sex && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Info className="w-3 h-3" />
                  {pet.sex}
                </div>
              )}
              {pet.microchipId && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <QrCode className="w-3 h-3" />
                  Chipped
                </div>
              )}
              {pet.birthday && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(pet.birthday).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewQR(pet)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium text-sm transition-colors"
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </button>

              <button
                onClick={() => onEdit(pet)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"
                title="Edit pet"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => handleDelete(e, pet.id, pet.name)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                title="Delete pet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PetList
