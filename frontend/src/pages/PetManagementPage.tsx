import React, { useState, useEffect } from 'react'
import { Plus, Loader2, Search } from 'lucide-react'
import PetList from '@/components/PetList'
import PetForm from '@/components/PetForm'
import type { Pet, PetForm as PetFormData } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/services/api'

/**
 * Pet Management Page - Main dashboard for managing pets.
 *
 * Features:
 * - List all user's pets
 * - Create new pet
 * - Edit existing pet
 * - Delete pet
 * - View/download QR codes
 * - Search pets
 */
const PetManagementPage: React.FC = () => {
  const { user } = useAuthStore()
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPetForm, setShowPetForm] = useState(false)
  const [selectedPet, setSelectedPet] = useState<Pet | undefined>()
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  useEffect(() => {
    loadPets()
  }, [])

  const loadPets = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get<{ items: Pet[] }>('/pets/')
      setPets(response.items || [])
    } catch (error) {
      console.error('Failed to load pets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePet = () => {
    setSelectedPet(undefined)
    setFormMode('create')
    setShowPetForm(true)
  }

  const handleEditPet = (pet: Pet) => {
    setSelectedPet(pet)
    setFormMode('edit')
    setShowPetForm(true)
  }

  const handleDeletePet = async (petId: number) => {
    try {
      await apiClient.delete(`/pets/${petId}`)
      setPets(prev => prev.filter(p => p.id !== petId))
    } catch (error) {
      console.error('Failed to delete pet:', error)
      alert('Failed to delete pet. Please try again.')
    }
  }

  const handleViewQR = (pet: Pet) => {
    // TODO: Open QR code modal/page
    alert(`QR Code for ${pet.name} - Feature coming soon!`)
  }

  const handleSubmitPet = async (data: PetFormData) => {
    try {
      if (formMode === 'create') {
        const response = await apiClient.post<Pet>('/pets/', data)
        setPets(prev => [...prev, response])
      } else if (selectedPet) {
        const response = await apiClient.put<Pet>(`/pets/${selectedPet.id}`, data)
        setPets(prev => prev.map(p => (p.id === selectedPet.id ? response : p)))
      }
      setShowPetForm(false)
      setSelectedPet(undefined)
    } catch (error) {
      console.error('Failed to save pet:', error)
      throw new Error('Failed to save pet. Please try again.')
    }
  }

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.breed?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Pets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your pets and their QR code information
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search pets by name or breed..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Add Pet Button */}
          <button
            onClick={handleCreatePet}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Add Pet</span>
          </button>
        </div>

        {/* Stats Bar */}
        {!isLoading && pets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pets.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {pets.filter(p => p.isActive).length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">With QR Codes</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {pets.filter(p => p.photos && p.photos.length > 0).length}
              </p>
            </div>
          </div>
        )}

        {/* Pet List */}
        <PetList
          pets={filteredPets}
          onEdit={handleEditPet}
          onDelete={handleDeletePet}
          onViewQR={handleViewQR}
          isLoading={isLoading}
        />

        {/* Empty State for Search */}
        {!isLoading && filteredPets.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No pets found matching "{searchQuery}"
            </p>
          </div>
        )}

        {/* Pet Form Modal */}
        {showPetForm && (
          <PetForm
            isOpen={showPetForm}
            onClose={() => {
              setShowPetForm(false)
              setSelectedPet(undefined)
            }}
            onSubmit={handleSubmitPet}
            initialData={selectedPet}
            mode={formMode}
          />
        )}
      </div>
    </div>
  )
}

export default PetManagementPage
