import React, { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Check, Heart, Stethoscope, FileText, AlertCircle } from 'lucide-react'
import type { Pet, PetForm as PetFormData } from '@/types'

interface PetFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PetFormData) => Promise<void>
  initialData?: Pet
  mode: 'create' | 'edit'
}

type FormStep = 'basic' | 'medical' | 'emergency'

interface FormErrors {
  name?: string
  breed?: string
  age?: string
  general?: string
}

/**
 * Multi-step pet form for creating and editing pet profiles.
 *
 * Steps:
 * 1. Basic Info: name, breed, age, sex, color, size, weight
 * 2. Medical Info: vaccinations, microchip, spayed/neutered, conditions
 * 3. Emergency: vet info, emergency contact
 */
const PetForm: React.FC<PetFormProps> = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState<PetFormData>({
    name: initialData?.name || '',
    breed: initialData?.breed || '',
    age: initialData?.age || undefined,
    sex: initialData?.sex || '',
    color: initialData?.color || '',
    size: initialData?.size || '',
    weight: initialData?.weight || '',
    microchipId: initialData?.microchipId || '',
    isSpayedNeutered: initialData?.isSpayedNeutered || false,
    birthday: initialData?.birthday || '',
    description: initialData?.description || '',
    medicalInfo: {
      vaccinations: initialData?.medicalInfo?.vaccinations || '',
      vet: initialData?.medicalInfo?.vet || '',
      emergencyContact: initialData?.medicalInfo?.emergencyContact || '',
      conditions: initialData?.medicalInfo?.conditions || '',
      medications: initialData?.medicalInfo?.medications || '',
    },
  })

  if (!isOpen) return null

  const validateBasicInfo = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Pet name is required'
    }

    if (formData.age && (formData.age < 0 || formData.age > 360)) {
      newErrors.age = 'Age must be between 0 and 360 months'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 'basic') {
      if (!validateBasicInfo()) return
      setCurrentStep('medical')
    } else if (currentStep === 'medical') {
      setCurrentStep('emergency')
    }
  }

  const handleBack = () => {
    if (currentStep === 'emergency') {
      setCurrentStep('medical')
    } else if (currentStep === 'medical') {
      setCurrentStep('basic')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateBasicInfo()) {
      setCurrentStep('basic')
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to save pet' })
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: keyof PetFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const updateMedicalField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: { ...prev.medicalInfo, [field]: value }
    }))
  }

  const steps = [
    { id: 'basic', label: 'Basic Info', icon: Heart },
    { id: 'medical', label: 'Medical', icon: Stethoscope },
    { id: 'emergency', label: 'Emergency', icon: FileText },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Add New Pet' : 'Edit Pet'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = index < currentStepIndex

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:block ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          {/* Basic Info Step */}
          {currentStep === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pet Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.name
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all`}
                  placeholder="e.g., Max, Luna, Bella"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Breed
                  </label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={e => updateField('breed', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                    placeholder="e.g., Labrador"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Age (months)
                  </label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={e => updateField('age', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.age
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all`}
                    placeholder="e.g., 24"
                    min="0"
                    max="360"
                  />
                  {errors.age && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.age}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sex
                  </label>
                  <select
                    value={formData.sex}
                    onChange={e => updateField('sex', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size
                  </label>
                  <select
                    value={formData.size}
                    onChange={e => updateField('size', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  >
                    <option value="">Select...</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                    <option value="Extra Large">Extra Large</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={e => updateField('color', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                    placeholder="e.g., Golden"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={e => updateField('weight', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                    placeholder="e.g., 25 kg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => updateField('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  placeholder="Tell us about your pet's personality, habits, etc."
                />
              </div>
            </div>
          )}

          {/* Medical Info Step */}
          {currentStep === 'medical' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Microchip ID
                </label>
                <input
                  type="text"
                  value={formData.microchipId}
                  onChange={e => updateField('microchipId', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all font-mono"
                  placeholder="e.g., 982000123456789"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="spayedNeutered"
                  checked={formData.isSpayedNeutered}
                  onChange={e => updateField('isSpayedNeutered', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="spayedNeutered" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Spayed/Neutered
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vaccinations
                </label>
                <textarea
                  value={formData.medicalInfo.vaccinations}
                  onChange={e => updateMedicalField('vaccinations', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  placeholder="List all vaccinations and dates"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medical Conditions
                </label>
                <textarea
                  value={formData.medicalInfo.conditions}
                  onChange={e => updateMedicalField('conditions', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  placeholder="Any allergies, chronic conditions, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medications
                </label>
                <textarea
                  value={formData.medicalInfo.medications}
                  onChange={e => updateMedicalField('medications', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  placeholder="Current medications and dosage"
                />
              </div>
            </div>
          )}

          {/* Emergency Contact Step */}
          {currentStep === 'emergency' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Veterinarian Name & Clinic
                </label>
                <input
                  type="text"
                  value={formData.medicalInfo.vet}
                  onChange={e => updateMedicalField('vet', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  placeholder="e.g., Dr. Smith at Happy Pets Clinic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.medicalInfo.emergencyContact}
                  onChange={e => updateMedicalField('emergencyContact', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  placeholder="Phone number or email"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Tip:</strong> This information will be displayed when someone scans your pet's QR code, so they can quickly contact you in case your pet is found.
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Footer with Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 'basic'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 'basic'
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>

            {currentStep !== 'emergency' ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {mode === 'create' ? 'Create Pet' : 'Save Changes'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PetForm
