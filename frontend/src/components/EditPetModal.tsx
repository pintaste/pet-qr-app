/**
 * Edit Pet Modal Component
 *
 * Modal for editing existing pet information.
 */

import React, { useState, useEffect, useRef } from 'react'
import { X, Trash2, Star, Plus, QrCode, Link as LinkIcon, AlertTriangle } from 'lucide-react'
import { Pet } from '@/services/petService'
import { LinkQRModal } from './LinkQRModal'

interface EditPetFormData {
  name: string
  breed: string
  age: number // Age in years (will be converted to months)
  description?: string
  microchip_id?: string
  spayed_neutered?: string
  medical_conditions?: string
  medications?: string
  allergies?: string
  veterinarian?: string
  vet_clinic?: string
  vet_phone?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  photos?: Array<{
    url: string
    isMain: boolean
    isExisting: boolean
  }>
}

interface EditPetModalProps {
  isOpen: boolean
  pet: Pet | null
  onClose: () => void
  onSubmit: (petId: number, data: EditPetFormData) => Promise<void>
  onDelete?: (petId: number) => Promise<void>
}

export const EditPetModal: React.FC<EditPetModalProps> = ({
  isOpen,
  pet,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [formData, setFormData] = useState<EditPetFormData>({
    name: '',
    breed: '',
    age: 0,
    description: '',
    microchip_id: '',
    spayed_neutered: '',
    medical_conditions: '',
    medications: '',
    allergies: '',
    veterinarian: '',
    vet_clinic: '',
    vet_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    photos: [],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLinkQRModalOpen, setIsLinkQRModalOpen] = useState(false)

  // Populate form when pet changes
  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || '',
        breed: pet.breed || '',
        age: pet.age ? Math.round(pet.age / 12) : 0, // Convert months to years
        description: pet.description || '',
        microchip_id: pet.medical_info?.microchip_id || '',
        spayed_neutered: pet.medical_info?.spayed_neutered || '',
        medical_conditions: pet.medical_info?.medical_conditions || '',
        medications: pet.medical_info?.medications || '',
        allergies: pet.medical_info?.allergies || '',
        veterinarian: pet.medical_info?.veterinarian || '',
        vet_clinic: pet.medical_info?.vet_clinic || '',
        vet_phone: pet.medical_info?.vet_phone || '',
        emergency_contact_name: pet.contact_info?.emergency_contact_name || '',
        emergency_contact_phone: pet.contact_info?.emergency_contact_phone || '',
        photos: pet.photos?.map((url, index) => ({
          url,
          isMain: index === 0,
          isExisting: true,
        })) || [],
      })
      setError(null)
    }
  }, [pet])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pet) return

    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit(pet.id, formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemovePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos?.filter((_, i) => i !== index),
    })
  }

  const handleSetMainPhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos?.map((photo, i) => ({
        ...photo,
        isMain: i === index,
      })),
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      setNewPhotos([...newPhotos, ...fileArray])

      // Add preview URLs to photos array
      fileArray.forEach((file) => {
        const previewUrl = URL.createObjectURL(file)
        setFormData({
          ...formData,
          photos: [
            ...(formData.photos || []),
            { url: previewUrl, isMain: false, isExisting: false }
          ]
        })
      })
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleDelete = async () => {
    if (!pet || !onDelete) return

    // Check if pet has QR code linked
    if (pet.qr_code_id) {
      setError('Please unlink the QR code before deleting this pet.')
      setShowDeleteConfirm(false)
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await onDelete(pet.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pet')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !pet) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-light text-gray-900 dark:text-white">
            Edit {pet.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-600 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-100 mb-1">Error</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    {error.includes('unlink') && pet.qr_code_id && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        QR Code ID: {pet.qr_code_id} must be unlinked first
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Max"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Breed *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Golden Retriever"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Age (years) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="25"
                    step="0.5"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Spayed/Neutered
                  </label>
                  <select
                    value={formData.spayed_neutered}
                    onChange={(e) => setFormData({ ...formData, spayed_neutered: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tell us about your pet..."
                />
              </div>
            </div>

            {/* QR Code Status */}
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
                  <p className={`font-semibold text-sm ${
                    pet.qr_code_id
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {pet.qr_code_id ? 'QR Code Linked' : 'No QR Code Linked'}
                  </p>
                  <p className={`text-xs ${
                    pet.qr_code_id
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {pet.qr_code_id
                      ? `QR Code ID: ${pet.qr_code_id}`
                      : 'Bind a QR code to enable public pet profile'}
                  </p>
                </div>
                {pet.qr_code_id ? (
                  <LinkIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLinkQRModalOpen(true)}
                    className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Link QR
                  </button>
                )}
              </div>
            </div>

            {/* Photos */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                Photos
              </h3>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="grid grid-cols-3 gap-3">
                {/* Existing Photos */}
                {formData.photos && formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.url}
                      alt={`Pet photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetMainPhoto(index)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          photo.isMain
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white/90 text-gray-700 hover:bg-yellow-500 hover:text-white'
                        }`}
                        title="Set as main photo"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="p-1.5 bg-white/90 hover:bg-red-500 text-gray-700 hover:text-white rounded-lg transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {photo.isMain && (
                      <div className="absolute top-2 left-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium shadow-lg">
                          <Star className="w-3 h-3" />
                          <span>Main</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Upload Button */}
                {(!formData.photos || formData.photos.length < 10) && (
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Add Photo
                    </span>
                  </button>
                )}
              </div>

              {(!formData.photos || formData.photos.length === 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-3">
                  No photos uploaded yet. Click the button above to add photos.
                </p>
              )}

              {formData.photos && formData.photos.length >= 10 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-3">
                  Maximum 10 photos allowed
                </p>
              )}
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                Medical Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Microchip ID
                  </label>
                  <input
                    type="text"
                    value={formData.microchip_id}
                    onChange={(e) => setFormData({ ...formData, microchip_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 982000123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medical Conditions
                  </label>
                  <textarea
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Any medical conditions or health issues..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medications
                  </label>
                  <textarea
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Current medications and dosage..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allergies
                  </label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Known allergies..."
                  />
                </div>
              </div>
            </div>

            {/* Veterinarian Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                Veterinarian Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Veterinarian Name
                  </label>
                  <input
                    type="text"
                    value={formData.veterinarian}
                    onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Dr. Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    value={formData.vet_clinic}
                    onChange={(e) => setFormData({ ...formData, vet_clinic: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Happy Paws Veterinary Clinic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clinic Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.vet_phone}
                    onChange={(e) => setFormData({ ...formData, vet_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., +1-555-0100"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                Emergency Contact
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., +1-555-0100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {/* Delete Button - Left Side */}
            {onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Pet
              </button>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Are you sure?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Empty spacer when no delete button */}
            {!onDelete && <div></div>}

            {/* Right Side Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Link QR Modal */}
      {pet && (
        <LinkQRModal
          isOpen={isLinkQRModalOpen}
          petId={pet.id}
          petName={pet.name}
          onClose={() => setIsLinkQRModalOpen(false)}
          onSuccess={() => {
            // Refresh by closing modal - parent will handle refresh
            setIsLinkQRModalOpen(false)
            onClose()
          }}
        />
      )}
    </div>
  )
}
