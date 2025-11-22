import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { PawPrint, QrCode, Activity, Settings, Filter } from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import StatsCard from '@/components/dashboard/StatsCard'
import EmptyState from '@/components/dashboard/EmptyState'
import { StatsCardSkeleton } from '@/components/dashboard/LoadingSkeleton'
import { userDashboardService, UserDashboardStats } from '@/services/userDashboardService'
import { AddPetModal, PetFormData } from '@/components/AddPetModal'
import { petService, Pet } from '@/services/petService'
import { PetCard, NoPetsCard, PetCardSkeleton } from '@/components/PetCard'
import { ViewPetModal } from '@/components/ViewPetModal'
import { EditPetModal } from '@/components/EditPetModal'
import { QRCard, NoQRCodesCard, QRCardSkeleton, QRCodeData } from '@/components/QRCard'
import { ViewQRModal } from '@/components/ViewQRModal'
import { ActivateQRModal } from '@/components/ActivateQRModal'
import { qrService } from '@/services/qrService'

type UserDashboardTab = 'overview' | 'qrcodes' | 'activity' | 'settings'

/**
 * Regular User Dashboard
 *
 * For pet owners to manage their pets, QR codes, and view activity.
 */
const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserDashboardTab>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [isPetsLoading, setIsPetsLoading] = useState(false)
  const [isQRsLoading, setIsQRsLoading] = useState(false)
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false)
  const [isViewPetModalOpen, setIsViewPetModalOpen] = useState(false)
  const [isEditPetModalOpen, setIsEditPetModalOpen] = useState(false)
  const [isActivateQRModalOpen, setIsActivateQRModalOpen] = useState(false)
  const [isViewQRModalOpen, setIsViewQRModalOpen] = useState(false)
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null)
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null)
  const [qrFilter, setQrFilter] = useState<'all' | 'linked' | 'unlinked'>('all')
  const [pets, setPets] = useState<Pet[]>([])
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([])
  const [stats, setStats] = useState<UserDashboardStats>({
    total_pets: 0,
    active_qr_codes: 0,
    total_scans: 0,
    recent_scans: 0,
  })

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true)
        const dashboardStats = await userDashboardService.getDashboardStats()
        setStats(dashboardStats)
      } catch (err) {
        console.error('Error fetching user dashboard stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

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

  // Fetch QR codes when QR tab is active
  useEffect(() => {
    const fetchQRCodes = async () => {
      if (activeTab !== 'qrcodes') return

      try {
        setIsQRsLoading(true)
        const codes = await qrService.getQRCodes()
        console.log('[UserDashboard] Fetched QR codes:', codes)

        // Map to QRCodeData format and enrich with pet names
        const enrichedCodes: QRCodeData[] = codes.map((qr) => {
          const pet = pets.find(p => p.id === qr.pet_id)
          return {
            ...qr,
            pet_name: pet?.name,
          } as QRCodeData
        })

        setQRCodes(enrichedCodes)
      } catch (err) {
        console.error('[UserDashboard] Error fetching QR codes:', err)
      } finally {
        setIsQRsLoading(false)
      }
    }

    fetchQRCodes()
  }, [activeTab, pets])

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

  // Memoize filtered QR codes
  const filteredQRCodes = useMemo(() =>
    qrCodes.filter((qr) => {
      if (qrFilter === 'linked') return qr.pet_id !== undefined && qr.pet_id !== null
      if (qrFilter === 'unlinked') return !qr.pet_id
      return true // 'all'
    }), [qrCodes, qrFilter])

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

  const handleViewQR = (qr: QRCodeData) => {
    setSelectedQR(qr)
    setIsViewQRModalOpen(true)
  }

  const handleDownloadQR = async (qr: QRCodeData) => {
    try {
      console.log('[UserDashboard] Downloading QR code:', qr.code)
      await qrService.downloadQRImage(qr, `qr-code-${qr.code}.png`)
    } catch (error) {
      console.error('[UserDashboard] Error downloading QR code:', error)
      alert(`Failed to download QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEditQR = (qr: QRCodeData) => {
    console.log('[UserDashboard] Edit QR code:', qr)
    // TODO: Implement edit QR code modal
  }

  const handleDeleteQR = async (qr: QRCodeData) => {
    if (!confirm(`Are you sure you want to delete QR code ${qr.code}?`)) {
      return
    }

    try {
      console.log('[UserDashboard] Deleting QR code:', qr.code)
      await qrService.deleteQRCode(qr.id)

      // Refresh QR codes list
      const codes = await qrService.getQRCodes()
      const enrichedCodes: QRCodeData[] = codes.map((qr) => {
        const pet = pets.find(p => p.id === qr.pet_id)
        return {
          ...qr,
          pet_name: pet?.name,
        } as QRCodeData
      })
      setQRCodes(enrichedCodes)
    } catch (error) {
      console.error('[UserDashboard] Error deleting QR code:', error)
      alert(`Failed to delete QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleQRActivateSuccess = async () => {
    console.log('[UserDashboard] QR code activated successfully')

    // Refresh QR codes list
    try {
      const codes = await qrService.getQRCodes()
      const enrichedCodes: QRCodeData[] = codes.map((qr) => {
        const pet = pets.find(p => p.id === qr.pet_id)
        return {
          ...qr,
          pet_name: pet?.name,
        } as QRCodeData
      })
      setQRCodes(enrichedCodes)

      // Refresh stats
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading ? (
                <>
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                </>
              ) : (
                <>
                  <StatsCard
                    title="Total Pets"
                    value={stats.total_pets}
                    subtitle="Registered pets"
                    icon={PawPrint}
                    color="indigo"
                  />
                  <StatsCard
                    title="Active QR Codes"
                    value={stats.active_qr_codes}
                    subtitle="Assigned codes"
                    icon={QrCode}
                    color="green"
                    onClick={() => setActiveTab('qrcodes')}
                  />
                  <StatsCard
                    title="Total Scans"
                    value={stats.total_scans}
                    subtitle="All time"
                    icon={Activity}
                    color="blue"
                  />
                  <StatsCard
                    title="Recent Scans"
                    value={stats.recent_scans}
                    subtitle="This month"
                    icon={Activity}
                    color="purple"
                  />
                </>
              )}
            </div>

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

      case 'qrcodes':
        return (
          <div>
            {/* Header with Filter and Generate Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My QR Codes</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your QR codes and link them to pets
                </p>
              </div>

              <div className="flex gap-3">
                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => {
                      // Cycle through filters
                      if (qrFilter === 'all') setQrFilter('linked')
                      else if (qrFilter === 'linked') setQrFilter('unlinked')
                      else setQrFilter('all')
                    }}
                  >
                    <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {qrFilter === 'all' ? 'All' : qrFilter === 'linked' ? 'Linked' : 'Unlinked'}
                    </span>
                  </button>
                </div>

                {/* Activate QR Button */}
                <button
                  onClick={handleActivateQR}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  Activate QR Code
                </button>
              </div>
            </div>

            {/* QR Codes Grid */}
            {isQRsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <QRCardSkeleton />
                <QRCardSkeleton />
                <QRCardSkeleton />
              </div>
            ) : filteredQRCodes.length === 0 ? (
              <NoQRCodesCard onGenerate={handleActivateQR} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQRCodes.map((qr) => (
                  <QRCard
                    key={qr.id}
                    qr={qr}
                    onView={handleViewQR}
                    onDownload={handleDownloadQR}
                    onEdit={handleEditQR}
                    onDelete={handleDeleteQR}
                  />
                ))}
              </div>
            )}
          </div>
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

      {/* View QR Modal */}
      <ViewQRModal
        isOpen={isViewQRModalOpen}
        qr={selectedQR}
        onClose={() => {
          setIsViewQRModalOpen(false)
          setSelectedQR(null)
        }}
        onDownload={handleDownloadQR}
      />
    </>
  )
}

export default UserDashboard
