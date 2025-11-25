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

import React, { useState, useMemo, useCallback } from 'react'
import { Search } from 'lucide-react'
import { NoPetsCard, PetCardSkeleton } from '@/components/PetCard'
import { AddPetModal, PetFormData } from '@/components/AddPetModal'
import { ViewPetModal } from '@/components/ViewPetModal'
import { EditPetModal } from '@/components/EditPetModal'
import { LinkQRModal } from '@/components/LinkQRModal'
import { PetStatsCards } from '@/components/user/PetStatsCards'
import { PetFilters } from '@/components/user/PetFilters'
import { PetSelectionBar } from '@/components/user/PetSelectionBar'
import { PetGridView } from '@/components/user/PetGridView'
import { PetListView } from '@/components/user/PetListView'
import { BulkDeleteModal } from '@/components/user/BulkDeleteModal'
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

  // Filter button helper
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

  // Get filter label for empty state
  const getFilterLabel = () => {
    switch (petFilter) {
      case 'linked': return 'With QR'
      case 'unlinked': return 'No QR'
      default: return 'All'
    }
  }

  return (
    <div>
      {/* Header with Search, Filter, and Add Button */}
      <PetFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        petFilter={petFilter}
        cycleFilter={cycleFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isSelectMode={isSelectMode}
        toggleSelectMode={toggleSelectMode}
        onAddPet={handleAddPet}
      />

      {/* Pet Stats Summary */}
      <PetStatsCards
        pets={pets}
        petFilter={petFilter}
        setPetFilter={setPetFilter}
      />

      {/* Selection Action Bar */}
      {isSelectMode && (
        <PetSelectionBar
          selectedPetIds={selectedPetIds}
          filteredPets={filteredPets}
          onSelectAll={selectAllPets}
          onDeselectAll={deselectAllPets}
          onBulkDelete={openBulkDeleteModal}
        />
      )}

      {/* Pets Grid/List */}
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
        <PetGridView
          pets={filteredPets}
          isSelectMode={isSelectMode}
          selectedPetIds={selectedPetIds}
          onTogglePetSelection={togglePetSelection}
          onViewPet={handleViewPet}
          onEditPet={handleEditPet}
          onTogglePin={handleTogglePin}
        />
      ) : (
        // List View
        <PetListView
          pets={filteredPets}
          isSelectMode={isSelectMode}
          selectedPetIds={selectedPetIds}
          onTogglePetSelection={togglePetSelection}
          onSelectAll={selectAllPets}
          onDeselectAll={deselectAllPets}
          onViewPet={handleViewPet}
          onEditPet={handleEditPet}
          onTogglePin={handleTogglePin}
          onLinkQR={handleLinkQR}
          onUnlinkQR={handleUnlinkQR}
        />
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
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        selectedPetIds={selectedPetIds}
        pets={pets}
        countdown={deleteCountdown}
        setCountdown={setDeleteCountdown}
        isDeleting={isDeleting}
        onClose={closeBulkDeleteModal}
        onConfirm={handleBulkDelete}
      />
    </div>
  )
}

export default PetsTab
