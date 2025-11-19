/**
 * View Pet Details Modal Component
 *
 * Displays comprehensive pet information in a beautiful modal view - matches PetDisplayPage design.
 */

import React, { useEffect, useState } from 'react'
import {
  X,
  Phone,
  User,
  AlertCircle,
  Edit,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  QrCode,
  Link as LinkIcon,
} from 'lucide-react'
import { Pet } from '@/services/petService'
import { LinkQRModal } from './LinkQRModal'

interface ViewPetModalProps {
  isOpen: boolean
  petId: number | null
  onClose: () => void
  onEdit?: (petId: number) => void
  pet?: Pet
}

export const ViewPetModal: React.FC<ViewPetModalProps> = ({
  isOpen,
  petId,
  onClose,
  onEdit,
  pet,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showDetailedInfo, setShowDetailedInfo] = useState(false)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0)
  const [isLinkQRModalOpen, setIsLinkQRModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0)
      setShowDetailedInfo(false)
    }
  }, [isOpen, petId])

  if (!isOpen || !pet) return null

  const formatAge = (ageMonths: number): string => {
    const years = Math.floor(ageMonths / 12)
    const months = ageMonths % 12
    if (years === 0) {
      return `${ageMonths} month${ageMonths !== 1 ? 's' : ''} old`
    }
    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''} old`
    }
    return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''} old`
  }

  const photos = pet.photos && pet.photos.length > 0
    ? pet.photos
    : ['https://via.placeholder.com/600x400?text=No+Photo']

  const currentPhoto = photos[currentImageIndex]

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % photos.length)
  }

  const openFullscreenGallery = (index: number) => {
    setFullscreenImageIndex(index)
    setIsFullscreenOpen(true)
  }

  const closeFullscreenGallery = () => {
    setIsFullscreenOpen(false)
  }

  const handleFullscreenPrevious = () => {
    setFullscreenImageIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const handleFullscreenNext = () => {
    setFullscreenImageIndex((prev) => (prev + 1) % photos.length)
  }

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header with Close Button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all duration-200 backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[90vh]">
            {/* Pet Card - Enhanced Design */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden">
              {/* Pet Gallery */}
              <div className="pet-gallery relative">
                <div className="gallery-main relative w-full h-[300px] overflow-hidden">
                  <img
                    src={currentPhoto}
                    alt={`${pet.name} main photo`}
                    className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
                    onClick={() => openFullscreenGallery(currentImageIndex)}
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/600x400?text=No+Photo'
                    }}
                  />

                  {/* Expand icon hint */}
                  <button
                    onClick={() => openFullscreenGallery(currentImageIndex)}
                    className="absolute bottom-3 right-3 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                    title="View fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {photos.length > 1 && (
                    <>
                      {/* Navigation Arrows */}
                      <button
                        onClick={handlePreviousImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                        title="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                        title="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Image Counter */}
                      <div className="absolute top-3 right-3 bg-black/40 text-white px-2 py-1 rounded-xl text-xs font-medium backdrop-blur-sm">
                        {currentImageIndex + 1} / {photos.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {photos.length > 1 && (
                  <div className="gallery-thumbnails flex gap-2 p-4 bg-white dark:bg-gray-800 overflow-x-auto">
                    {photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`${pet.name} photo ${index + 1}`}
                        className={`w-[60px] h-[60px] object-cover rounded-xl cursor-pointer transition-all duration-200 border-2 flex-shrink-0 ${
                          index === currentImageIndex
                            ? 'border-gray-300 dark:border-gray-500 scale-105 opacity-100'
                            : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/60x60?text=No+Photo'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Pet Details */}
              <div className="pet-details p-6 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80">
                <div className="pet-header flex justify-between items-start mb-4 gap-4">
                  <div className="pet-title-section flex-1">
                    <h2 className="pet-name text-[1.75rem] font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2 leading-tight tracking-wide">
                      {pet.name}
                    </h2>
                    <p className="pet-breed text-gray-600 dark:text-gray-400 text-base font-medium mb-1 leading-relaxed">
                      {pet.breed} • {formatAge(pet.age)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(pet.id)
                          onClose()
                        }}
                        className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500"
                        title="Edit Pet"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                      className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all duration-300 hover:scale-110 group border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500"
                      title={showDetailedInfo ? "Hide detailed information" : "Show detailed information"}
                    >
                      {showDetailedInfo ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* QR Code Status - Prominent Display */}
                <div className={`p-4 rounded-xl border-2 ${
                  pet.qr_code_id
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      pet.qr_code_id
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                    }`}>
                      <QrCode className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${
                        pet.qr_code_id
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {pet.qr_code_id ? 'QR Code Linked' : 'No QR Code Linked'}
                      </p>
                      <p className={`text-sm ${
                        pet.qr_code_id
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {pet.qr_code_id
                          ? `QR Code ID: ${pet.qr_code_id}`
                          : 'This pet does not have a QR code assigned yet'}
                      </p>
                    </div>
                    {pet.qr_code_id ? (
                      <LinkIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <button
                        onClick={() => setIsLinkQRModalOpen(true)}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Link QR Code
                      </button>
                    )}
                  </div>
                </div>

                {pet.description && (
                  <>
                    <div className="divider my-5 h-px bg-gray-100 dark:bg-gray-700/50"></div>
                    <p className="pet-description text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                      {pet.description}
                    </p>
                  </>
                )}

                {/* Detailed Information - Inside Container */}
                {showDetailedInfo && (
                  <div className="detailed-info-sections space-y-6 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Health Information Section */}
                    {(pet.medical_info?.microchip_id || pet.medical_info?.spayed_neutered || pet.medical_info?.medical_conditions || pet.medical_info?.medications || pet.medical_info?.allergies) && (
                      <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        <div className="flex items-center mb-4">
                          <Stethoscope className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Health Information</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {(pet.medical_info?.microchip_id || pet.medical_info?.spayed_neutered) && (
                            <div className="grid grid-cols-2 gap-4">
                              {pet.medical_info?.microchip_id && (
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-500">Microchip ID</p>
                                  <p className="font-medium text-gray-700 dark:text-gray-300 font-mono text-sm">{pet.medical_info.microchip_id}</p>
                                </div>
                              )}
                              {pet.medical_info?.spayed_neutered && (
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-500">Status</p>
                                  <p className="font-medium text-gray-700 dark:text-gray-300 capitalize">{pet.medical_info.spayed_neutered}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {(pet.medical_info?.medical_conditions || pet.medical_info?.medications || pet.medical_info?.allergies) && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <div className="flex items-center mb-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                                <span className="font-medium text-yellow-800 dark:text-yellow-200">Medical Alert</span>
                              </div>
                              {pet.medical_info?.medical_conditions && (
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-1">
                                  <span className="font-medium">Conditions:</span> {pet.medical_info.medical_conditions}
                                </p>
                              )}
                              {pet.medical_info?.medications && (
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-1">
                                  <span className="font-medium">Medications:</span> {pet.medical_info.medications}
                                </p>
                              )}
                              {pet.medical_info?.allergies && (
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                  <span className="font-medium">Allergies:</span> {pet.medical_info.allergies}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Veterinary Care Section */}
                    {(pet.medical_info?.veterinarian || pet.medical_info?.vet_clinic || pet.medical_info?.vet_phone) && (
                      <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        <div className="flex items-center mb-4">
                          <User className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Veterinary Care</h3>
                        </div>

                        <div className="space-y-2">
                          {pet.medical_info?.veterinarian && (
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-500">Primary Veterinarian</p>
                              <p className="font-medium text-gray-700 dark:text-gray-300">{pet.medical_info.veterinarian}</p>
                            </div>
                          )}
                          {pet.medical_info?.vet_clinic && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{pet.medical_info.vet_clinic}</p>
                          )}
                          {pet.medical_info?.vet_phone && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{pet.medical_info.vet_phone}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Emergency Contact Section */}
                    {(pet.contact_info?.emergency_contact_name || pet.contact_info?.emergency_contact_phone) && (
                      <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        <div className="flex items-center mb-4">
                          <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emergency Contact</h3>
                        </div>

                        <div className="space-y-2">
                          {pet.contact_info?.emergency_contact_name && (
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-500">Contact Name</p>
                              <p className="font-medium text-gray-700 dark:text-gray-300">{pet.contact_info.emergency_contact_name}</p>
                            </div>
                          )}
                          {pet.contact_info?.emergency_contact_phone && (
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-500">Contact Phone</p>
                              <p className="font-medium text-gray-700 dark:text-gray-300">{pet.contact_info.emergency_contact_phone}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-500 mb-1">Created</p>
                          <p className="text-gray-900 dark:text-white">
                            {new Date(pet.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-500 mb-1">Last Updated</p>
                          <p className="text-gray-900 dark:text-white">
                            {new Date(pet.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Gallery Modal */}
      {isFullscreenOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex items-center justify-center"
          onClick={closeFullscreenGallery}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button
              onClick={closeFullscreenGallery}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation arrows for fullscreen */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFullscreenPrevious()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10"
                  title="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFullscreenNext()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10"
                  title="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            {photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1.5 rounded-xl text-sm font-medium backdrop-blur-sm z-10">
                <span>{fullscreenImageIndex + 1}</span> / <span>{photos.length}</span>
              </div>
            )}

            {/* Pet info overlay */}
            <div className="absolute bottom-4 left-4 bg-black/50 text-white p-3 rounded-xl backdrop-blur-sm z-10 max-w-xs">
              <h3 className="text-lg font-bold mb-1">{pet.name}</h3>
              <p className="text-gray-300 text-xs">{pet.breed} • {formatAge(pet.age)}</p>
              {pet.description && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{pet.description}</p>
              )}
            </div>

            {/* Main fullscreen image */}
            <img
              src={photos[fullscreenImageIndex]}
              alt={`${pet.name} - Photo ${fullscreenImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/800x600?text=No+Photo'
              }}
            />
          </div>
        </div>
      )}

      {/* Link QR Modal */}
      {pet && (
        <LinkQRModal
          isOpen={isLinkQRModalOpen}
          petId={pet.id}
          petName={pet.name}
          onClose={() => setIsLinkQRModalOpen(false)}
          onSuccess={() => {
            // Refresh by closing and reopening or notify parent
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
