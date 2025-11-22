import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { PawPrint, QrCode, Activity, Settings } from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import EmptyState from '@/components/dashboard/EmptyState'
import { userDashboardService, UserDashboardStats } from '@/services/userDashboardService'
import { AddPetModal, PetFormData } from '@/components/AddPetModal'
import { petService, Pet } from '@/services/petService'
import { PetCard, NoPetsCard, PetCardSkeleton } from '@/components/PetCard'
import { ViewPetModal } from '@/components/ViewPetModal'
import { EditPetModal } from '@/components/EditPetModal'
import { ActivateQRModal } from '@/components/ActivateQRModal'
import PetsTab from '@/pages/dashboards/tabs/PetsTab'
import QRCodesTab from '@/pages/dashboards/tabs/QRCodesTab'

type UserDashboardTab = 'overview' | 'pets' | 'qrcodes' | 'activity' | 'settings'

/**
 * Regular User Dashboard
 *
 * For pet owners to manage their pets, QR codes, and view activity.
 */
const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserDashboardTab>('overview')
  const [isPetsLoading, setIsPetsLoading] = useState(false)
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false)
  const [isViewPetModalOpen, setIsViewPetModalOpen] = useState(false)
  const [isEditPetModalOpen, setIsEditPetModalOpen] = useState(false)
  const [isActivateQRModalOpen, setIsActivateQRModalOpen] = useState(false)
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [stats, setStats] = useState<UserDashboardStats>({
    total_pets: 0,
    active_qr_codes: 0,
    total_scans: 0,
    recent_scans: 0,
  })

  // Fetch pets on component mount
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setIsPetsLoading(true)
        const pets = await petService.getPets()
        setPets(pets || [])
      } catch (err) {
        console.error('[UserDashboard] Error fetching pets:', err)
      } finally {
        setIsPetsLoading(false)
      }
    }

    fetchPets()
  }, [])

  const handleAddPet = useCallback(() => {
    setIsAddPetModalOpen(true)
  }, [])

  // Memoize sorted pets to prevent unnecessary re-renders
  const sortedPets = useMemo(() =>
    pets.sort((a, b) => {
      // Sort pinned pets first
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return 0
    }), [pets])

  // Memoize selected pet
  const selectedPet = useMemo(() =>
    selectedPetId ? pets.find(p => p.id === selectedPetId) : null,
    [selectedPetId, pets])

  const handleSubmitPet = async (petData: PetFormData) => {
    try {
      // Convert PetFormData to the format expected by the API
      const createPetData = {
        name: petData.name,
        breed: petData.breed,
        age_months: Math.round(petData.age * 12), // Convert years to months
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

      // Upload all photos if provided
      if (petData.photos && petData.photos.length > 0) {
        // Upload main photo first (the one marked as isMain)
        const mainPhoto = petData.photos.find((p) => p.isMain)
        if (mainPhoto) {
          await petService.uploadPetPhoto(newPet.id, mainPhoto.file)
        }

        // Upload remaining photos
        const otherPhotos = petData.photos.filter((p) => !p.isMain)
        for (const photo of otherPhotos) {
          await petService.uploadPetPhoto(newPet.id, photo.file)
        }
      } else if (petData.profile_photo) {
        // Fallback for backward compatibility
        await petService.uploadPetPhoto(newPet.id, petData.profile_photo)
      }

      // Refresh dashboard stats and pet list
      const updatedStats = await userDashboardService.getDashboardStats()
      setStats(updatedStats)

      // Refresh pets list
      const pets = await petService.getPets()
      setPets(pets || [])

      // Show success message (you can add a toast notification here)
      console.log('Pet added successfully:', newPet)
    } catch (error) {
      console.error('Error adding pet:', error)
      throw error // Re-throw to let the modal handle it
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
      // Convert form data to API format
      const updateData = {
        name: petData.name,
        breed: petData.breed,
        age_months: Math.round(petData.age * 12), // Convert years to months
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

      // Refresh pets list
      const pets = await petService.getPets()
      setPets(pets || [])

      // Refresh dashboard stats
      const updatedStats = await userDashboardService.getDashboardStats()
      setStats(updatedStats)

      console.log('Pet updated successfully')
    } catch (error) {
      console.error('Error updating pet:', error)
      throw error
    }
  }

  const handleDeletePet = async (petId: number) => {
    try {
      await petService.deletePet(petId)

      // Refresh pets list
      const pets = await petService.getPets()
      setPets(pets || [])

      // Refresh dashboard stats
      const updatedStats = await userDashboardService.getDashboardStats()
      setStats(updatedStats)

      console.log('Pet deleted successfully')
    } catch (error) {
      console.error('Error deleting pet:', error)
      throw error
    }
  }

  const handleActivateQR = () => {
    setIsActivateQRModalOpen(true)
  }

  const handleQRActivateSuccess = async () => {
    // Refresh stats after activation from overview page
    try {
      const dashboardStats = await userDashboardService.getDashboardStats()
      setStats(dashboardStats)
    } catch (error) {
      console.error('[UserDashboard] Error refreshing after QR activation:', error)
    }
  }

  const handleViewActivity = () => {
    console.log('View activity clicked')
    setActiveTab('activity')
  }

  const handleUpdateProfile = () => {
    console.log('Update profile clicked')
    setActiveTab('settings')
  }

  const handleTogglePin = async (petId: number) => {
    try {
      console.log('[UserDashboard] Toggling pin for pet:', petId)
      const updatedPet = await petService.togglePinPet(petId)
      console.log('[UserDashboard] Pet after toggle:', updatedPet)

      // Refresh pets list
      const pets = await petService.getPets()
      console.log('[UserDashboard] Refreshed pets:', pets)
      setPets(pets || [])
    } catch (error) {
      console.error('[UserDashboard] Error toggling pin:', error)
      // Show error to user
      alert(`Failed to toggle pin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={handleAddPet}
                  className="flex flex-col items-center gap-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PawPrint className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Pet</span>
                </button>
                <button
                  onClick={handleActivateQR}
                  className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <QrCode className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activate QR</span>
                </button>
                <button
                  onClick={handleViewActivity}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Activity</span>
                </button>
                <button
                  onClick={handleUpdateProfile}
                  className="flex flex-col items-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Update Profile</span>
                </button>
              </div>
            </div>

            {/* My Pets Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                My Pets
              </h2>

              {/* Pet Grid */}
              {isPetsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <PetCardSkeleton />
                  <PetCardSkeleton />
                  <PetCardSkeleton />
                </div>
              ) : pets.length === 0 ? (
                <NoPetsCard onAddPet={handleAddPet} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedPets.map((pet) => (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      onView={handleViewPet}
                      onEdit={handleEditPet}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                Recent Activity
              </h2>
              <EmptyState
                icon={Activity}
                title="No Recent Activity"
                description="QR code scans and pet updates will appear here"
              />
            </div>
          </div>
        )

      case 'pets':
        return (
          <PetsTab
            pets={pets}
            setPets={setPets}
            setStats={setStats}
            isLoading={isPetsLoading}
          />
        )

      case 'qrcodes':
        return (
          <QRCodesTab
            pets={pets}
            setPets={setPets}
            setStats={setStats}
          />
        )

      case 'activity':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <EmptyState
              icon={Activity}
              title="No Activity Data"
              description="Scan events and pet activity will appear here"
            />
          </div>
        )

      case 'settings':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-light text-gray-900 dark:text-white mb-4">
              Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Profile settings and preferences will be available here
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <DashboardLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as UserDashboardTab)}>
        {renderContent()}
      </DashboardLayout>

      {/* Add Pet Modal */}
      <AddPetModal
        isOpen={isAddPetModalOpen}
        onClose={() => setIsAddPetModalOpen(false)}
        onSubmit={handleSubmitPet}
      />

      {/* View Pet Modal */}
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

      {/* Edit Pet Modal */}
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

      {/* Activate QR Modal */}
      <ActivateQRModal
        isOpen={isActivateQRModalOpen}
        onClose={() => setIsActivateQRModalOpen(false)}
        onSuccess={handleQRActivateSuccess}
      />
    </>
  )
}

export default UserDashboard
