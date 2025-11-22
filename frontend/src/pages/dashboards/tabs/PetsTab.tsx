/**
 * Pets Tab Component for User Dashboard
 *
 * Provides full CRUD operations for pets:
 * - Add new pets
 * - View pet details
 * - Edit pet information
 * - Delete pets
 * - Link/unlink QR codes
 * - Search and filter pets
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, PawPrint, Link2, Unlink, LayoutGrid, List, Eye, Edit, Pin, QrCode, Calendar, AlertTriangle, Trash2, X, CheckSquare, Square } from 'lucide-react'
import { PetCard, NoPetsCard, PetCardSkeleton } from '@/components/PetCard'
import { AddPetModal, PetFormData } from '@/components/AddPetModal'
import { ViewPetModal } from '@/components/ViewPetModal'
import { EditPetModal } from '@/components/EditPetModal'
import { LinkQRModal } from '@/components/LinkQRModal'
import { petService, Pet } from '@/services/petService'
import { userDashboardService, UserDashboardStats } from '@/services/userDashboardService'

interface PetsTabProps {
  pets: Pet[]
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>
  setStats: React.Dispatch<React.SetStateAction<UserDashboardStats>>
  isLoading: boolean
}

type PetFilter = 'all' | 'linked' | 'unlinked'
type ViewMode = 'grid' | 'list'

/**
 * Pets Tab component for managing user's pets
 *
 * @param pets - Array of pets to display
 * @param setPets - Function to update pets state
 * @param setStats - Function to update dashboard stats
 * @param isLoading - Loading state for pets
 */
const PetsTab: React.FC<PetsTabProps> = ({
  pets,
  setPets,
  setStats,
  isLoading,
}) => {
  // Modal states
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false)
  const [isViewPetModalOpen, setIsViewPetModalOpen] = useState(false)
  const [isEditPetModalOpen, setIsEditPetModalOpen] = useState(false)
  const [isLinkQRModalOpen, setIsLinkQRModalOpen] = useState(false)

  // Selected pet for modals
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null)

  // Filter, search, and view states
  const [petFilter, setPetFilter] = useState<PetFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  // Default to list view if more than 4 pets
  const [viewMode, setViewMode] = useState<ViewMode>(pets.length > 4 ? 'list' : 'grid')

  // Multi-select states
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedPetIds, setSelectedPetIds] = useState<Set<number>>(new Set())

  // Bulk delete modal states
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [deleteCountdown, setDeleteCountdown] = useState(10)
  const [isDeleting, setIsDeleting] = useState(false)

  // Memoize selected pet
  const selectedPet = useMemo(() =>
    selectedPetId ? pets.find(p => p.id === selectedPetId) : null,
    [selectedPetId, pets])

  // Memoize sorted and filtered pets
  const filteredPets = useMemo(() => {
    let result = [...pets]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(pet =>
        pet.name.toLowerCase().includes(query) ||
        pet.breed?.toLowerCase().includes(query) ||
        pet.description?.toLowerCase().includes(query)
      )
    }

    // Apply QR link filter
    if (petFilter === 'linked') {
      result = result.filter(pet => pet.qr_code_id)
    } else if (petFilter === 'unlinked') {
      result = result.filter(pet => !pet.qr_code_id)
    }

    // Sort: pinned first
    result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return 0
    })

    return result
  }, [pets, searchQuery, petFilter])

  // Handler functions
  const handleAddPet = () => {
    setIsAddPetModalOpen(true)
  }

  const handleSubmitPet = async (petData: PetFormData) => {
    try {
      // Convert PetFormData to API format
      const createPetData = {
        name: petData.name,
        breed: petData.breed,
        age_months: Math.round(petData.age * 12),
        description: petData.description,
        medical_info: {
          microchip_id: petData.microchip_id,
          spayed_neutered: petData.spayed_neutered,
          medical_conditions: petData.medical_conditions,
          medications: petData.medications,
          allergies: petData.allergies,
          veterinarian: petData.veterinarian,
          vet_clinic: petData.vet_clinic,
          vet_phone: petData.vet_phone,
        },
        contact_info: {
          emergency_contact_name: petData.emergency_contact_name,
          emergency_contact_phone: petData.emergency_contact_phone,
        },
      }

      const newPet = await petService.createPet(createPetData)

      // Upload photos if provided
      if (petData.photos && petData.photos.length > 0) {
        const mainPhoto = petData.photos.find((p) => p.isMain)
        if (mainPhoto) {
          await petService.uploadPetPhoto(newPet.id, mainPhoto.file)
        }

        const otherPhotos = petData.photos.filter((p) => !p.isMain)
        for (const photo of otherPhotos) {
          await petService.uploadPetPhoto(newPet.id, photo.file)
        }
      } else if (petData.profile_photo) {
        await petService.uploadPetPhoto(newPet.id, petData.profile_photo)
      }

      // Refresh data
      const updatedStats = await userDashboardService.getDashboardStats()
      setStats(updatedStats)

      const updatedPets = await petService.getPets()
      setPets(updatedPets || [])

      console.log('[PetsTab] Pet added successfully:', newPet)
    } catch (error) {
      console.error('[PetsTab] Error adding pet:', error)
      throw error
    }
  }

  const handleViewPet = (petId: number) => {
    setSelectedPetId(petId)
    setIsViewPetModalOpen(true)
  }

  const handleEditPet = (petId: number) => {
    setSelectedPetId(petId)
    setIsEditPetModalOpen(true)
  }

  const handleEditPetSubmit = async (petId: number, petData: any) => {
    try {
      const updateData = {
        name: petData.name,
        breed: petData.breed,
        age_months: Math.round(petData.age * 12),
        description: petData.description,
        medical_info: {
          microchip_id: petData.microchip_id,
          spayed_neutered: petData.spayed_neutered,
          medical_conditions: petData.medical_conditions,
          medications: petData.medications,
          allergies: petData.allergies,
          veterinarian: petData.veterinarian,
          vet_clinic: petData.vet_clinic,
          vet_phone: petData.vet_phone,
        },
        contact_info: {
          emergency_contact_name: petData.emergency_contact_name,
          emergency_contact_phone: petData.emergency_contact_phone,
        },
      }

      await petService.updatePet(petId, updateData)

      // Refresh data
      const updatedPets = await petService.getPets()
      setPets(updatedPets || [])

      const updatedStats = await userDashboardService.getDashboardStats()
      setStats(updatedStats)

      console.log('[PetsTab] Pet updated successfully')
    } catch (error) {
      console.error('[PetsTab] Error updating pet:', error)
      throw error
    }
  }

  const handleDeletePet = async (petId: number) => {
    try {
      await petService.deletePet(petId)

      // Refresh data
      const updatedPets = await petService.getPets()
      setPets(updatedPets || [])

      const updatedStats = await userDashboardService.getDashboardStats()
      setStats(updatedStats)

      console.log('[PetsTab] Pet deleted successfully')
    } catch (error) {
      console.error('[PetsTab] Error deleting pet:', error)
      throw error
    }
  }

  const handleTogglePin = async (petId: number) => {
    try {
      await petService.togglePinPet(petId)

      // Refresh pets list
      const updatedPets = await petService.getPets()
      setPets(updatedPets || [])
    } catch (error) {
      console.error('[PetsTab] Error toggling pin:', error)
      alert(`Failed to toggle pin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleLinkQRSuccess = async () => {
    // Refresh data
    try {
      const updatedPets = await petService.getPets()
      setPets(updatedPets || [])

      const updatedStats = await userDashboardService.getDashboardStats()
      setStats(updatedStats)

      console.log('[PetsTab] QR code linked successfully')
    } catch (error) {
      console.error('[PetsTab] Error refreshing after QR link:', error)
    }
  }

  const handleLinkQR = (petId: number) => {
    setSelectedPetId(petId)
    setIsLinkQRModalOpen(true)
  }

  const handleUnlinkQR = async (petId: number) => {
    try {
      await petService.unlinkQRCode(petId)

      // Refresh data
      const updatedPets = await petService.getPets()
      setPets(updatedPets || [])

      const updatedStats = await userDashboardService.getDashboardStats()
      setStats(updatedStats)

      console.log('[PetsTab] QR code unlinked successfully')
    } catch (error) {
      console.error('[PetsTab] Error unlinking QR code:', error)
      alert(`Failed to unlink QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Helper function to format age
  // Note: Backend now returns age in years, not months
  const formatAge = (age: number): string => {
    if (age === 0) {
      return '< 1 year'
    }
    if (age === 1) {
      return '1 year'
    }
    return `${age} years`
  }

  // Filter button helper
  const getFilterLabel = () => {
    switch (petFilter) {
      case 'linked': return 'With QR'
      case 'unlinked': return 'No QR'
      default: return 'All'
    }
  }

  const cycleFilter = () => {
    if (petFilter === 'all') setPetFilter('linked')
    else if (petFilter === 'linked') setPetFilter('unlinked')
    else setPetFilter('all')
  }

  // Multi-select handlers
  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => !prev)
    setSelectedPetIds(new Set())
  }, [])

  const togglePetSelection = useCallback((petId: number) => {
    setSelectedPetIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(petId)) {
        newSet.delete(petId)
      } else {
        newSet.add(petId)
      }
      return newSet
    })
  }, [])

  const selectAllPets = useCallback(() => {
    const allFilteredIds = new Set(filteredPets.map(p => p.id))
    setSelectedPetIds(allFilteredIds)
  }, [filteredPets])

  const deselectAllPets = useCallback(() => {
    setSelectedPetIds(new Set())
  }, [])

  // Bulk delete handlers
  const openBulkDeleteModal = useCallback(() => {
    if (selectedPetIds.size === 0) return
    setDeleteCountdown(10)
    setIsBulkDeleteModalOpen(true)
  }, [selectedPetIds.size])

  const closeBulkDeleteModal = useCallback(() => {
    setIsBulkDeleteModalOpen(false)
    setDeleteCountdown(10)
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (!isBulkDeleteModalOpen) return

    if (deleteCountdown <= 0) return

    const timer = setTimeout(() => {
      setDeleteCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isBulkDeleteModalOpen, deleteCountdown])

  const handleBulkDelete = async () => {
    if (selectedPetIds.size === 0) return

    try {
      setIsDeleting(true)

      // Delete pets one by one
      const petIdsArray = Array.from(selectedPetIds)
      for (const petId of petIdsArray) {
        await petService.deletePet(petId)
      }

      // Refresh data
      const updatedPets = await petService.getPets()
      setPets(updatedPets || [])

      const updatedStats = await userDashboardService.getDashboardStats()
      setStats(updatedStats)

      // Reset states
      setSelectedPetIds(new Set())
      setIsSelectMode(false)
      closeBulkDeleteModal()

      console.log(`[PetsTab] Bulk deleted ${petIdsArray.length} pets successfully`)
    } catch (error) {
      console.error('[PetsTab] Error bulk deleting pets:', error)
      alert(`Failed to delete pets: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      {/* Header with Search, Filter, and Add Button */}
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
              {getFilterLabel()}
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
            onClick={handleAddPet}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Pet
          </button>
        </div>
      </div>

      {/* Pet Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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
                {pets.filter(p => p.qr_code_id).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">With QR</p>
            </div>
          </div>
        </button>
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
                {pets.filter(p => !p.qr_code_id).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">No QR</p>
            </div>
          </div>
        </button>
      </div>

      {/* Selection Action Bar */}
      {isSelectMode && (
        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {selectedPetIds.size} of {filteredPets.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllPets}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Select All
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                onClick={deselectAllPets}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Deselect All
              </button>
            </div>
          </div>
          <button
            onClick={openBulkDeleteModal}
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
      )}

      {/* Pets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PetCardSkeleton />
          <PetCardSkeleton />
          <PetCardSkeleton />
        </div>
      ) : filteredPets.length === 0 ? (
        searchQuery || petFilter !== 'all' ? (
          // No results from search/filter
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-light text-gray-900 dark:text-white mb-2">
              No Pets Found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {searchQuery
                ? `No pets match "${searchQuery}". Try a different search term.`
                : `No pets match the "${getFilterLabel()}" filter.`}
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setPetFilter('all')
              }}
              className="mt-4 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          // No pets at all
          <NoPetsCard onAddPet={handleAddPet} />
        )
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet) => (
            <div key={pet.id} className="relative">
              {isSelectMode && (
                <button
                  onClick={() => togglePetSelection(pet.id)}
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
                onClick={isSelectMode ? () => togglePetSelection(pet.id) : undefined}
              >
                <PetCard
                  pet={pet}
                  onView={isSelectMode ? undefined : handleViewPet}
                  onEdit={isSelectMode ? undefined : handleEditPet}
                  onTogglePin={isSelectMode ? undefined : handleTogglePin}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* List Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {isSelectMode && (
              <div className="col-span-1 flex items-center">
                <button
                  onClick={selectedPetIds.size === filteredPets.length ? deselectAllPets : selectAllPets}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedPetIds.size === filteredPets.length && filteredPets.length > 0
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                  }`}
                >
                  {selectedPetIds.size === filteredPets.length && filteredPets.length > 0 && (
                    <CheckSquare className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}
            <div className={isSelectMode ? 'col-span-3' : 'col-span-4'}>Pet</div>
            <div className="col-span-2">Breed</div>
            <div className="col-span-2">Age</div>
            <div className="col-span-2">Status</div>
            <div className={isSelectMode ? 'col-span-2 text-right' : 'col-span-2 text-right'}>Actions</div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPets.map((pet) => (
              <div
                key={pet.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors items-center ${
                  selectedPetIds.has(pet.id) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''
                } ${isSelectMode ? 'cursor-pointer' : ''}`}
                onClick={isSelectMode ? () => togglePetSelection(pet.id) : undefined}
              >
                {/* Checkbox */}
                {isSelectMode && (
                  <div className="col-span-1 flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePetSelection(pet.id)
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
                        handleUnlinkQR(pet.id)
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
                        handleLinkQR(pet.id)
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
                      handleTogglePin(pet.id)
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
                      handleViewPet(pet.id)
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditPet(pet.id)
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
      )}

      {/* Modals */}
      <AddPetModal
        isOpen={isAddPetModalOpen}
        onClose={() => setIsAddPetModalOpen(false)}
        onSubmit={handleSubmitPet}
      />

      <ViewPetModal
        isOpen={isViewPetModalOpen}
        petId={selectedPetId}
        pet={selectedPet || undefined}
        onClose={() => {
          setIsViewPetModalOpen(false)
          setSelectedPetId(null)
        }}
        onEdit={handleEditPet}
      />

      <EditPetModal
        isOpen={isEditPetModalOpen}
        pet={selectedPet || null}
        onClose={() => {
          setIsEditPetModalOpen(false)
          setSelectedPetId(null)
        }}
        onSubmit={handleEditPetSubmit}
        onDelete={handleDeletePet}
      />

      {selectedPetId && (
        <LinkQRModal
          isOpen={isLinkQRModalOpen}
          petId={selectedPetId}
          petName={pets.find(p => p.id === selectedPetId)?.name || 'Pet'}
          onClose={() => {
            setIsLinkQRModalOpen(false)
            setSelectedPetId(null)
          }}
          onSuccess={handleLinkQRSuccess}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeBulkDeleteModal}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            {/* Close Button */}
            <button
              onClick={closeBulkDeleteModal}
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
                onClick={closeBulkDeleteModal}
                className="flex-1 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                autoFocus
              >
                Cancel
              </button>

              {/* Delete Button - Inactive until countdown finishes */}
              <button
                onClick={handleBulkDelete}
                disabled={deleteCountdown > 0 || isDeleting}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                  deleteCountdown > 0 || isDeleting
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
                ) : deleteCountdown > 0 ? (
                  `Delete (${deleteCountdown}s)`
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PetsTab
