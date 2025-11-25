import React from 'react'
import {
  PawPrint,
  QrCode,
  Dog,
  Cat,
  Filter,
  X,
  Eye,
  Edit,
} from 'lucide-react'
import { TenantPet } from '@/services/tenantAdminService'

/**
 * Grid View for a single pet card
 */
export const PetGridCard: React.FC<{ pet: TenantPet }> = ({ pet }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow">
    {/* Status Badges */}
    <div className="flex items-center justify-between mb-2">
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
        pet.pet_type?.toLowerCase() === 'dog'
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
          : pet.pet_type?.toLowerCase() === 'cat'
          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
      }`}>
        {pet.pet_type || 'Other'}
      </span>
      {/* QR Binding Status */}
      {pet.qr_code_id ? (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <QrCode className="w-3 h-3 mr-0.5" />
          Linked
        </span>
      ) : (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          No QR
        </span>
      )}
    </div>

    {/* Pet Photo/Icon */}
    <div className="text-center mb-2">
      {pet.profile_photo_url ? (
        <img
          src={pet.profile_photo_url}
          alt={pet.name}
          className="w-12 h-12 rounded-full object-cover mx-auto mb-1"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-1">
          {pet.pet_type?.toLowerCase() === 'dog' ? (
            <Dog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          ) : pet.pet_type?.toLowerCase() === 'cat' ? (
            <Cat className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          ) : (
            <PawPrint className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          )}
        </div>
      )}
      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{pet.name}</p>
      {pet.breed && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{pet.breed}</p>
      )}
      {/* Gender & Color */}
      <div className="flex items-center justify-center gap-1 mt-1">
        {pet.gender && pet.gender !== 'unknown' && (
          <span className="text-[9px] text-gray-400 dark:text-gray-500 capitalize">{pet.gender}</span>
        )}
        {pet.gender && pet.gender !== 'unknown' && pet.color && (
          <span className="text-[9px] text-gray-300 dark:text-gray-600">•</span>
        )}
        {pet.color && (
          <span className="text-[9px] text-gray-400 dark:text-gray-500">{pet.color}</span>
        )}
      </div>
    </div>

    {/* Owner Info */}
    <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700">
      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={pet.owner_email}>{pet.owner_email}</p>
    </div>

    {/* Actions */}
    <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
      <button
        title="View Details"
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
      </button>
      <button
        title="Edit Pet"
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Edit className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  </div>
)

/**
 * Pet Statistics Cards
 */
export const PetStatsCards: React.FC<{
  allPets: TenantPet[]
  petsSpeciesFilter: 'all' | 'dog' | 'cat' | 'other'
  onFilterChange: (filter: 'all' | 'dog' | 'cat' | 'other') => void
}> = ({ allPets, petsSpeciesFilter, onFilterChange }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
    <button
      onClick={() => onFilterChange('all')}
      className={`bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
        petsSpeciesFilter === 'all'
          ? 'border-blue-500 ring-2 ring-blue-500/50'
          : 'border-blue-200 dark:border-blue-800 hover:border-blue-400'
      }`}
    >
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</p>
      <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{allPets.length}</p>
    </button>
    <button
      onClick={() => onFilterChange('dog')}
      className={`bg-amber-50 dark:bg-amber-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
        petsSpeciesFilter === 'dog'
          ? 'border-amber-500 ring-2 ring-amber-500/50'
          : 'border-amber-200 dark:border-amber-800 hover:border-amber-400'
      }`}
    >
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Dogs</p>
      <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
        {allPets.filter(p => p.pet_type?.toLowerCase() === 'dog').length}
      </p>
    </button>
    <button
      onClick={() => onFilterChange('cat')}
      className={`bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
        petsSpeciesFilter === 'cat'
          ? 'border-purple-500 ring-2 ring-purple-500/50'
          : 'border-purple-200 dark:border-purple-800 hover:border-purple-400'
      }`}
    >
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Cats</p>
      <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
        {allPets.filter(p => p.pet_type?.toLowerCase() === 'cat').length}
      </p>
    </button>
    <button
      onClick={() => onFilterChange('other')}
      className={`bg-gray-50 dark:bg-gray-700/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
        petsSpeciesFilter === 'other'
          ? 'border-gray-500 ring-2 ring-gray-500/50'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
      }`}
    >
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Other</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">
        {allPets.filter(p => !['dog', 'cat'].includes(p.pet_type?.toLowerCase() || '')).length}
      </p>
    </button>
  </div>
)

/**
 * Active Filters Summary Component
 */
export const ActiveFiltersSummary: React.FC<{
  filteredPets: TenantPet[]
  allPets: TenantPet[]
  petsSearchQuery: string
  petsSpeciesFilter: 'all' | 'dog' | 'cat' | 'other'
  petsUserFilter: string
  onClearSearch: () => void
  onClearSpecies: () => void
  onClearUser: () => void
  onClearAll: () => void
}> = ({
  filteredPets,
  allPets,
  petsSearchQuery,
  petsSpeciesFilter,
  petsUserFilter,
  onClearSearch,
  onClearSpecies,
  onClearUser,
  onClearAll,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {filteredPets.length} of {allPets.length} pets
      </span>
      {petsSearchQuery && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
          Search: "{petsSearchQuery}"
          <button onClick={onClearSearch} className="hover:text-red-500">
            <X className="w-3 h-3" />
          </button>
        </span>
      )}
      {petsSpeciesFilter !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
          Type: {petsSpeciesFilter.charAt(0).toUpperCase() + petsSpeciesFilter.slice(1)}
          <button onClick={onClearSpecies} className="hover:text-red-500">
            <X className="w-3 h-3" />
          </button>
        </span>
      )}
      {petsUserFilter !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
          Owner: {petsUserFilter}
          <button onClick={onClearUser} className="hover:text-red-500">
            <X className="w-3 h-3" />
          </button>
        </span>
      )}
      {(petsSearchQuery || petsSpeciesFilter !== 'all' || petsUserFilter !== 'all') && (
        <button
          onClick={onClearAll}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto"
        >
          Clear all
        </button>
      )}
    </div>
  </div>
)

/**
 * List View for a single pet row
 */
export const PetListRow: React.FC<{ pet: TenantPet }> = ({ pet }) => (
  <tr className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
    <td className="py-2 sm:py-3 px-2 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        {pet.profile_photo_url ? (
          <img
            src={pet.profile_photo_url}
            alt={pet.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            {pet.pet_type?.toLowerCase() === 'dog' ? (
              <Dog className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            ) : pet.pet_type?.toLowerCase() === 'cat' ? (
              <Cat className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <PawPrint className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
        )}
        <div>
          <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">{pet.name}</p>
          {pet.color && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{pet.color}</p>
          )}
        </div>
      </div>
    </td>
    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
        pet.pet_type?.toLowerCase() === 'dog'
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
          : pet.pet_type?.toLowerCase() === 'cat'
          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
      }`}>
        {pet.pet_type || 'Other'}
      </span>
    </td>
    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        {pet.breed || '-'}
      </span>
    </td>
    <td className="py-2 sm:py-3 px-2 sm:px-4">
      <span className="text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px] block">
        {pet.owner_email}
      </span>
    </td>
    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
      {pet.qr_code_id ? (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <QrCode className="w-3 h-3 mr-1" />
          Linked
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          No QR
        </span>
      )}
    </td>
    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden xl:table-cell">
      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        {new Date(pet.created_at).toLocaleDateString()}
      </span>
    </td>
    <td className="py-2 sm:py-3 px-2 sm:px-4">
      <div className="flex items-center justify-end gap-1">
        <button
          title="View Details"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
        <button
          title="Edit Pet"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </td>
  </tr>
)
