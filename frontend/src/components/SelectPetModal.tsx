/**
 * Select Pet Modal Component
 *
 * Allows users to select a pet to link to a QR code.
 */

import React, { useState, useEffect } from 'react'
import { X, PawPrint, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { petService, Pet } from '@/services/petService'

interface SelectPetModalProps {
  isOpen: boolean
  qrCodeId: number
  qrCode: string
  onClose: () => void
  onSuccess: () => void
}

export const SelectPetModal: React.FC<SelectPetModalProps> = ({
  isOpen,
  qrCodeId,
  qrCode,
  onClose,
  onSuccess,
}) => {
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch pets when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPets()
      setSearchQuery('')
      setSelectedPetId(null)
      setError(null)
    }
  }, [isOpen])

  const fetchPets = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const allPets = await petService.getPets()
      // Filter to pets without QR codes
      const availablePets = allPets.filter(pet => !pet.qr_code_id)
      setPets(availablePets)
    } catch (err) {
      console.error('Error fetching pets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load pets')
      setPets([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkPet = async () => {
    if (!selectedPetId) return

    setIsLinking(true)
    setError(null)

    try {
      await petService.linkQRCode(selectedPetId, qrCodeId)

      // Success - refresh data and close modal
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error linking pet to QR code:', err)
      setError(err instanceof Error ? err.message : 'Failed to link pet')
    } finally {
      setIsLinking(false)
    }
  }

  const filteredPets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.breed?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-light text-gray-900 dark:text-white">
              Link to Pet
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select a pet for QR code <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{qrCode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-600 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search pets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            )}

            {/* No Pets */}
            {!isLoading && filteredPets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mb-4">
                  <PawPrint className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-light text-gray-900 dark:text-white mb-2">
                  No Available Pets
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  {searchQuery
                    ? 'No pets match your search. Try a different search term.'
                    : 'All your pets already have QR codes linked. Add a new pet first.'}
                </p>
              </div>
            )}

            {/* Pet List */}
            {!isLoading && filteredPets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Select a pet to link:
                </p>
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                  {filteredPets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => setSelectedPetId(pet.id)}
                      className={`relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        selectedPetId === pet.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-600'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${
                        selectedPetId === pet.id
                          ? 'ring-2 ring-indigo-500'
                          : ''
                      }`}>
                        {pet.photos && pet.photos.length > 0 ? (
                          <img
                            src={pet.photos[0]}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            selectedPetId === pet.id
                              ? 'bg-indigo-500'
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}>
                            <PawPrint className={`w-6 h-6 ${
                              selectedPetId === pet.id
                                ? 'text-white'
                                : 'text-gray-400 dark:text-gray-500'
                            }`} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${
                          selectedPetId === pet.id
                            ? 'text-indigo-900 dark:text-indigo-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {pet.name}
                        </p>
                        <p className={`text-sm ${
                          selectedPetId === pet.id
                            ? 'text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {pet.breed || 'Unknown breed'}
                        </p>
                      </div>
                      {selectedPetId === pet.id && (
                        <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            disabled={isLinking}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLinkPet}
            disabled={!selectedPetId || isLinking}
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLinking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Linking...
              </>
            ) : (
              <>
                <PawPrint className="w-4 h-4" />
                Link Pet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
