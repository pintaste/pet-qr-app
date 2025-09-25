import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Heart,
  Shield,
  Stethoscope,
  Calendar,
  Tag,
  AlertCircle,
  User,
  MessageCircle
} from 'lucide-react'

interface PetProfileData {
  // Pet Identity
  petName: string
  petPhoto: string
  breed: string
  age: number
  sex: string
  color: string
  size: string
  markings?: string

  // Owner Contact
  ownerName: string
  primaryPhone: string
  secondaryPhone?: string
  email: string
  location: string

  // Special Message
  specialMessage: string
  temperament: string

  // Health Information
  weight: string
  microchipId?: string
  spayedNeutered: string
  medicalConditions?: string
  medications?: string

  // Veterinary Care
  veterinarian: string
  vetClinic: string
  vetAddress: string
  emergencyVet: string

  // Additional Details
  birthday: string
  collarDescription: string
  vaccinations: string
}

const ProfilePage: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>()
  const navigate = useNavigate()
  const [profileData, setProfileData] = useState<PetProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call with mock data
    setTimeout(() => {
      setProfileData({
        petName: "Max",
        petPhoto: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=faces",
        breed: "Golden Retriever",
        age: 36, // months
        sex: "Male",
        color: "Golden",
        size: "Large",
        markings: "White patch on chest, small scar on left ear",

        ownerName: "Sarah",
        primaryPhone: "+1 (555) 123-4567",
        secondaryPhone: "+1 (555) 987-6543",
        email: "sarah.j@email.com",
        location: "Downtown District",

        specialMessage: "If you find Max, please call me immediately. He's very friendly but can get anxious without his family. Thank you for helping bring him home!",
        temperament: "Friendly, energetic, good with children and other dogs",

        weight: "65 lbs (29.5 kg)",
        microchipId: "982000123456789",
        spayedNeutered: "Neutered",
        medicalConditions: "Mild hip dysplasia - needs daily medication",
        medications: "Glucosamine supplements daily",

        veterinarian: "Dr. Sarah Johnson",
        vetClinic: "Happy Pets Clinic",
        vetAddress: "123 Main St, Downtown",
        emergencyVet: "(555) 911-PETS - Downtown Animal Hospital",

        birthday: "March 15, 2021",
        collarDescription: "Blue leather collar with silver tags",
        vaccinations: "DHPP (Annual), Rabies (Valid until 2026), Bordetella (Updated 2024)"
      })
      setIsLoading(false)
    }, 1000)
  }, [qrCode])

  const handleCallPrimary = () => {
    if (profileData?.primaryPhone) {
      window.open(`tel:${profileData.primaryPhone}`)
    }
  }

  const handleCallSecondary = () => {
    if (profileData?.secondaryPhone) {
      window.open(`tel:${profileData.secondaryPhone}`)
    }
  }

  const handleEmail = () => {
    if (profileData?.email && profileData?.petName) {
      window.open(`mailto:${profileData.email}?subject=Found ${profileData.petName}&body=Hi, I found ${profileData.petName}. Please let me know how I can help get them back to you safely.`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Back Button */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
            Pet Profile
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[420px] p-4 space-y-6">

        {/* Pet Identity Section */}
        <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="text-center">
            <img
              src={profileData.petPhoto}
              alt={profileData.petName}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white dark:border-gray-700 shadow-lg"
            />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
              {profileData.petName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium">
              {profileData.breed} • {Math.floor(profileData.age / 12)} years old • {profileData.sex}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-500">Color:</span>
                <p className="font-medium text-gray-700 dark:text-gray-300">{profileData.color}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-500">Size:</span>
                <p className="font-medium text-gray-700 dark:text-gray-300">{profileData.size}</p>
              </div>
            </div>
            {profileData.markings && (
              <div className="mt-3">
                <span className="text-gray-500 dark:text-gray-500 text-sm">Distinctive markings:</span>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mt-1">{profileData.markings}</p>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-red-200/50 dark:border-red-700/50">
          <div className="flex items-center mb-4">
            <Phone className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Emergency Contact</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">Owner: {profileData.ownerName}</p>
                <p className="text-red-900 dark:text-red-100 font-medium">{profileData.primaryPhone}</p>
              </div>
              <button
                onClick={handleCallPrimary}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Call Now
              </button>
            </div>

            {profileData.secondaryPhone && (
              <div className="flex items-center justify-between pt-2 border-t border-red-200 dark:border-red-800">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">Backup</p>
                  <p className="text-red-900 dark:text-red-100 font-medium">{profileData.secondaryPhone}</p>
                </div>
                <button
                  onClick={handleCallSecondary}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Call
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-red-200 dark:border-red-800">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">Email</p>
                <p className="text-red-900 dark:text-red-100 font-medium">{profileData.email}</p>
              </div>
              <button
                onClick={handleEmail}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Special Message Section */}
        <div className="bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center mb-4">
            <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Special Message from Owner</h3>
          </div>
          <p className="text-blue-800 dark:text-blue-200 leading-relaxed mb-4">"{profileData.specialMessage}"</p>
          <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Temperament:</span> {profileData.temperament}
            </p>
          </div>
        </div>

        {/* Health Information Section */}
        <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center mb-4">
            <Stethoscope className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Health Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">Weight</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">{profileData.weight}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">Status</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">{profileData.spayedNeutered}</p>
              </div>
            </div>

            {profileData.microchipId && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">Microchip ID</p>
                <p className="font-medium text-gray-700 dark:text-gray-300 font-mono">{profileData.microchipId}</p>
              </div>
            )}

            {profileData.medicalConditions && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <span className="font-medium">Medical Conditions:</span> {profileData.medicalConditions}
                </p>
                {profileData.medications && (
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    <span className="font-medium">Medications:</span> {profileData.medications}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Veterinary Care Section */}
        <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Veterinary Care</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-500">Primary Veterinarian</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">{profileData.veterinarian}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.vetClinic}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.vetAddress}</p>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-500">24/7 Emergency</p>
              <p className="font-medium text-purple-600 dark:text-purple-400">{profileData.emergencyVet}</p>
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center mb-4">
            <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Details</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">Birthday</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">{profileData.birthday}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">Collar Description</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">{profileData.collarDescription}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">Vaccinations</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{profileData.vaccinations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Spacer */}
        <div className="pb-8"></div>
      </div>
    </div>
  )
}

export default ProfilePage