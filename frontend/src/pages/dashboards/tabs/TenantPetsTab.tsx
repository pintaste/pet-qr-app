import React, { useState, useEffect, useMemo } from 'react'
import {
  PawPrint,
  Search,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { tenantAdminService, TenantPet } from '@/services/tenantAdminService'
import SearchableSelect from '@/components/common/SearchableSelect'
import {
  PetGridCard,
  PetStatsCards,
  ActiveFiltersSummary,
  PetListRow,
} from '@/components/tenant/TenantPetsComponents'

/**
 * Tenant Admin Pets Tab
 *
 * Displays and manages all pets registered by the tenant's customers.
 */
const TenantPetsTab: React.FC = () => {
  // Pets management states
  const [allPets, setAllPets] = useState<TenantPet[]>([])
  const [isPetsLoading, setIsPetsLoading] = useState(false)
  const [petsViewMode, setPetsViewMode] = useState<'grid' | 'list'>('list')
  const [petsSearchQuery, setPetsSearchQuery] = useState('')
  const [petsSpeciesFilter, setPetsSpeciesFilter] = useState<'all' | 'dog' | 'cat' | 'other'>('all')
  const [petsUserFilter, setPetsUserFilter] = useState<string>('all')
  const [petsCurrentPage, setPetsCurrentPage] = useState(1)
  const petsPerPage = 12

  // Fetch pets on component mount
  useEffect(() => {
    const fetchPets = async (): Promise<void> => {
      try {
        setIsPetsLoading(true)
        const petList = await tenantAdminService.listTenantPets({})
        setAllPets(petList)
      } catch (err) {
        console.error('Error fetching pets:', err)
      } finally {
        setIsPetsLoading(false)
      }
    }

    fetchPets()
  }, [])

  // Get unique owner emails from pets
  const petsUserEmails = useMemo(() => {
    const emails = new Set<string>()
    allPets.forEach(pet => {
      if (pet.owner_email) {
        emails.add(pet.owner_email)
      }
    })
    return Array.from(emails).sort()
  }, [allPets])

  // Client-side filtered pets
  const filteredPets = useMemo(() => {
    let result = allPets

    // Apply search filter
    if (petsSearchQuery) {
      const query = petsSearchQuery.toLowerCase()
      result = result.filter(pet =>
        pet.name.toLowerCase().includes(query) ||
        pet.owner_email?.toLowerCase().includes(query)
      )
    }

    // Apply species filter
    if (petsSpeciesFilter !== 'all') {
      if (petsSpeciesFilter === 'other') {
        result = result.filter(pet => !['dog', 'cat'].includes(pet.pet_type?.toLowerCase() || ''))
      } else {
        result = result.filter(pet => pet.pet_type?.toLowerCase() === petsSpeciesFilter)
      }
    }

    // Apply user filter
    if (petsUserFilter !== 'all') {
      result = result.filter(pet => pet.owner_email === petsUserFilter)
    }

    return result
  }, [allPets, petsSearchQuery, petsSpeciesFilter, petsUserFilter])

  // Pets pagination calculations
  const petsTotalPages = Math.ceil(filteredPets.length / petsPerPage)
  const petsStartIndex = (petsCurrentPage - 1) * petsPerPage
  const petsEndIndex = petsStartIndex + petsPerPage
  const paginatedPets = filteredPets.slice(petsStartIndex, petsEndIndex)

  // Reset pets page when filters change
  useEffect(() => {
    setPetsCurrentPage(1)
  }, [petsSearchQuery, petsSpeciesFilter, petsUserFilter])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">All Pets</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pets registered by your store's customers
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setPetsViewMode('grid')}
              className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                petsViewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setPetsViewMode('list')}
              className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                petsViewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="List View"
            >
              <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Pet Stats - Clickable for filtering */}
      <PetStatsCards
        allPets={allPets}
        petsSpeciesFilter={petsSpeciesFilter}
        onFilterChange={setPetsSpeciesFilter}
      />

      {/* Search and User Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by pet name or owner email..."
            value={petsSearchQuery}
            onChange={(e) => setPetsSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* User Filter */}
        {petsUserEmails.length > 0 && (
          <div className="sm:w-44">
            <SearchableSelect
              value={petsUserFilter}
              onChange={setPetsUserFilter}
              options={petsUserEmails}
              placeholder="Search owner..."
              allOptionLabel="All Owners"
            />
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      <ActiveFiltersSummary
        filteredPets={filteredPets}
        allPets={allPets}
        petsSearchQuery={petsSearchQuery}
        petsSpeciesFilter={petsSpeciesFilter}
        petsUserFilter={petsUserFilter}
        onClearSearch={() => setPetsSearchQuery('')}
        onClearSpecies={() => setPetsSpeciesFilter('all')}
        onClearUser={() => setPetsUserFilter('all')}
        onClearAll={() => {
          setPetsSearchQuery('')
          setPetsSpeciesFilter('all')
          setPetsUserFilter('all')
        }}
      />

      {/* Pets Grid/List */}
      {isPetsLoading ? (
        <div className={petsViewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3' : 'space-y-2'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={petsViewMode === 'grid' ? 'h-48 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse' : 'h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse'} />
          ))}
        </div>
      ) : filteredPets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
          <PawPrint className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {petsSearchQuery || petsSpeciesFilter !== 'all' || petsUserFilter !== 'all' ? 'No Pets Found' : 'No Pets Yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {petsSearchQuery || petsSpeciesFilter !== 'all' || petsUserFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Pets registered by your store\'s customers will appear here.'}
          </p>
        </div>
      ) : petsViewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {paginatedPets.map((pet) => (
            <PetGridCard key={pet.id} pet={pet} />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[320px] sm:min-w-0">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Pet</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Type</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Breed</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Owner</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">QR</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden xl:table-cell">Created</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPets.map((pet) => (
                <PetListRow key={pet.id} pet={pet} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {petsTotalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 py-3">
          <button
            onClick={() => setPetsCurrentPage(1)}
            disabled={petsCurrentPage === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setPetsCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={petsCurrentPage === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {petsCurrentPage} of {petsTotalPages}
          </span>
          <button
            onClick={() => setPetsCurrentPage(prev => Math.min(petsTotalPages, prev + 1))}
            disabled={petsCurrentPage === petsTotalPages}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setPetsCurrentPage(petsTotalPages)}
            disabled={petsCurrentPage === petsTotalPages}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}

      {/* Pet Count Summary */}
      {!isPetsLoading && filteredPets.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {petsStartIndex + 1}-{Math.min(petsEndIndex, filteredPets.length)} of {filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

export default TenantPetsTab
