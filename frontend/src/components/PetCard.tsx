/**
 * Pet Card Component
 *
 * Displays pet information in a beautiful card format for grid view.
 */

import React from 'react'
import { Eye, Edit, MapPin, Calendar, Heart, QrCode, AlertTriangle, Pin } from 'lucide-react'

interface PetCardProps {
  pet: {
    id: number
    name: string
    breed: string
    age: number  // Age in months
    photos: string[]
    qr_code_id?: number
    is_pinned?: boolean
    medical_info?: {
      microchip_id?: string
      medical_conditions?: string
    }
  }
  onView: (petId: number) => void
  onEdit: (petId: number) => void
  onTogglePin?: (petId: number) => void
}

export const PetCard: React.FC<PetCardProps> = ({ pet, onView, onEdit, onTogglePin }) => {
  const formatAge = (ageMonths: number): string => {
    if (ageMonths < 12) {
      return `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`
    }
    const years = Math.floor(ageMonths / 12)
    const months = ageMonths % 12
    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`
    }
    return `${years}y ${months}m`
  }

  const defaultPhoto = 'https://via.placeholder.com/400x300?text=No+Photo'
  const photoUrl = pet.photos && pet.photos.length > 0 ? pet.photos[0] : defaultPhoto

  return (
    <div className="group bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 hover:shadow-lg">
      {/* Pet Photo */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20">
        <img
          src={photoUrl}
          alt={pet.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = defaultPhoto
          }}
        />

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {/* QR Status Badge - Always Show */}
          {pet.qr_code_id ? (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white rounded-full text-xs font-medium shadow-lg">
              <QrCode className="w-3 h-3" />
              <span>QR Linked</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-500 text-white rounded-full text-xs font-medium shadow-lg">
              <QrCode className="w-3 h-3" />
              <span>No QR</span>
            </div>
          )}

          {/* Medical Alert Badge */}
          {pet.medical_info?.medical_conditions && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white rounded-full text-xs font-medium shadow-lg">
              <AlertTriangle className="w-3 h-3" />
              <span>Medical</span>
            </div>
          )}
        </div>

        {/* Pin Button (top right) */}
        {onTogglePin && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin(pet.id)
            }}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 shadow-lg ${
              pet.is_pinned
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white scale-110'
                : 'bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400'
            }`}
            title={pet.is_pinned ? 'Unpin pet' : 'Pin pet'}
          >
            <Pin className={`w-4 h-4 transition-transform ${pet.is_pinned ? 'rotate-0' : 'rotate-45'}`} />
          </button>
        )}
      </div>

      {/* Pet Info */}
      <div className="p-4">
        {/* Name & Breed */}
        <div className="mb-3">
          <h3 className="text-lg font-light text-gray-900 dark:text-white mb-1 line-clamp-1">
            {pet.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
            {pet.breed}
          </p>
        </div>

        {/* Quick Info */}
        <div className="flex items-center gap-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span>{formatAge(pet.age)}</span>
          </div>
          {pet.medical_info?.microchip_id && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-xs font-mono">{pet.medical_info.microchip_id.slice(0, 8)}...</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(pet.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg border border-indigo-500 transition-all duration-300"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm">View</span>
          </button>
          <button
            onClick={() => onEdit(pet.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 transition-all duration-300"
          >
            <Edit className="w-4 h-4" />
            <span className="text-sm">Edit</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Empty State for No Pets
 */
export const NoPetsCard: React.FC<{ onAddPet: () => void }> = ({ onAddPet }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mb-4">
        <Heart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>

      <h3 className="text-lg font-light text-gray-900 dark:text-white mb-2">
        No Pets Yet
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
        Start your pet care journey by adding your first furry friend. Keep all their important information in one place!
      </p>

      <button
        onClick={onAddPet}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl border-2 border-indigo-500 transition-all duration-300 hover:scale-[1.05]"
      >
        Add Your First Pet
      </button>
    </div>
  )
}

/**
 * Loading Skeleton for Pet Card
 */
export const PetCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse">
      {/* Photo Skeleton */}
      <div className="h-48 bg-gray-200 dark:bg-gray-700" />

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 w-1/2" />

        <div className="flex gap-3 mb-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-16" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-20" />
        </div>

        <div className="flex gap-2">
          <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
