/**
 * Add Pet Modal Component
 *
 * Form for creating a new pet profile with comprehensive pet information.
 */

import React, { useState } from 'react'
import { X, Upload, AlertCircle, Star, Trash2 } from 'lucide-react'

interface AddPetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (petData: PetFormData) => Promise<void>
}

export interface PhotoFile {
  file: File
  preview: string
  isMain: boolean
}

export interface PetFormData {
  name: string
  species: string
  breed: string
  age: number
  sex: 'male' | 'female'
  size: 'small' | 'medium' | 'large' | 'extra_large'
  color: string
  weight?: string
  markings?: string
  microchip_id?: string
  spayed_neutered?: 'yes' | 'no' | 'unknown'
  description?: string
  personality_traits?: string[]
  medical_conditions?: string
  medications?: string
  allergies?: string
  veterinarian?: string
  vet_clinic?: string
  vet_phone?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  photos?: PhotoFile[]
  profile_photo?: File // Main photo for backward compatibility
}

export const AddPetModal: React.FC<AddPetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<PhotoFile[]>([])

  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    species: 'dog',
    breed: '',
    age: 0,
    sex: 'male',
    size: 'medium',
    color: '',
    personality_traits: [],
  })

  if (!isOpen) return null

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newPhotos: PhotoFile[] = []
      const fileArray = Array.from(files)

      // Limit to 10 photos total
      const availableSlots = 10 - photos.length
      const filesToProcess = fileArray.slice(0, availableSlots)

      let processedCount = 0
      filesToProcess.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          newPhotos.push({
            file,
            preview: reader.result as string,
            isMain: photos.length === 0 && newPhotos.length === 0, // First photo is main by default
          })
          processedCount++

          if (processedCount === filesToProcess.length) {
            setPhotos((prev) => [...prev, ...newPhotos])
          }
        }
        reader.readAsDataURL(file)
      })

      // Reset the input
      e.target.value = ''
    }
  }

  const handleSetMainPhoto = (index: number) => {
    setPhotos((prev) =>
      prev.map((photo, i) => ({
        ...photo,
        isMain: i === index,
      }))
    )
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const newPhotos = prev.filter((_, i) => i !== index)
      // If we removed the main photo, set the first one as main
      if (prev[index].isMain && newPhotos.length > 0) {
        newPhotos[0].isMain = true
      }
      return newPhotos
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.breed || formData.age < 0) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Prepare form data with photos
      const mainPhoto = photos.find((p) => p.isMain)
      const submitData = {
        ...formData,
        photos,
        profile_photo: mainPhoto?.file, // Main photo for backward compatibility
      }

      await onSubmit(submitData)
      onClose()
      // Reset form
      setFormData({
        name: '',
        species: 'dog',
        breed: '',
        age: 0,
        sex: 'male',
        size: 'medium',
        color: '',
        personality_traits: [],
      })
      setPhotos([])
      setCurrentStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add pet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add New Pet
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Step {currentStep} of 3
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>

              {/* Photo Gallery Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Pet Photos (Max 10)
                </label>

                {/* Photo Grid */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group"
                    >
                      <img
                        src={photo.preview}
                        alt={`Pet photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Main Photo Badge */}
                      {photo.isMain && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full flex items-center gap-1 shadow-lg">
                          <Star className="w-3 h-3 fill-current" />
                          Main
                        </div>
                      )}

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!photo.isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainPhoto(index)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-lg transition-colors"
                            title="Set as main photo"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg transition-colors"
                          title="Remove photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Upload Button (show if less than 10 photos) */}
                  {photos.length < 10 && (
                    <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {photos.length === 0 ? (
                    'Upload photos of your pet. The first photo will be set as the main photo (头像).'
                  ) : (
                    <>Click the star icon to set a photo as the main photo (头像). {photos.length}/10 photos uploaded.</>
                  )}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pet Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Max, Luna, Charlie"
                />
              </div>

              {/* Species */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Species <span className="text-red-500">*</span>
                </label>
                <select
                  name="species"
                  value={formData.species}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Breed <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Golden Retriever, Siamese, Mixed"
                />
              </div>

              {/* Age & Sex */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Age (years) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sex <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Size & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="small">Small (0-20 lbs)</option>
                    <option value="medium">Medium (21-50 lbs)</option>
                    <option value="large">Large (51-100 lbs)</option>
                    <option value="extra_large">Extra Large (100+ lbs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Brown, Black & White"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Medical Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Medical Information
              </h3>

              {/* Microchip ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Microchip ID
                </label>
                <input
                  type="text"
                  name="microchip_id"
                  value={formData.microchip_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="15-digit microchip number"
                />
              </div>

              {/* Spayed/Neutered */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spayed/Neutered
                </label>
                <select
                  name="spayed_neutered"
                  value={formData.spayed_neutered || 'unknown'}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              {/* Medical Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medical Conditions
                </label>
                <textarea
                  name="medical_conditions"
                  value={formData.medical_conditions || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="List any medical conditions, allergies, or special needs"
                />
              </div>

              {/* Medications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Medications
                </label>
                <textarea
                  name="medications"
                  value={formData.medications || ''}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="List current medications and dosages"
                />
              </div>

              {/* Veterinarian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Veterinarian Name
                </label>
                <input
                  type="text"
                  name="veterinarian"
                  value={formData.veterinarian || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Dr. Smith"
                />
              </div>

              {/* Vet Clinic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Veterinary Clinic
                </label>
                <input
                  type="text"
                  name="vet_clinic"
                  value={formData.vet_clinic || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Pet Care Veterinary Hospital"
                />
              </div>

              {/* Vet Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vet Clinic Phone
                </label>
                <input
                  type="tel"
                  name="vet_phone"
                  value={formData.vet_phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          )}

          {/* Step 3: Additional Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Additional Details
              </h3>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe your pet's personality, habits, and special characteristics"
                />
              </div>

              {/* Markings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Distinctive Markings
                </label>
                <input
                  type="text"
                  name="markings"
                  value={formData.markings || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., White patch on chest, black spot on ear"
                />
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="(555) 987-6543"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : prevStep}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding Pet...' : 'Add Pet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
