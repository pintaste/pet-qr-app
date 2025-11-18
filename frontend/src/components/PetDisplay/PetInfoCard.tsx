import React from 'react'
import { MessageCircle, Stethoscope, Shield, Tag, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface PetInfo {
  name: string
  breed: string
  age: number
  description?: string
  special_message?: string
  temperament?: string
  weight?: string
  microchip_id?: string
  spayed_neutered?: string
  medical_conditions?: string
  medications?: string
  markings?: string
  veterinarian?: string
  vet_clinic?: string
  vet_address?: string
  emergency_vet?: string
  birthday?: string
  collar_description?: string
  vaccinations?: string
}

interface PetInfoCardProps {
  petInfo: PetInfo
  showDetailedInfo: boolean
  onToggleDetailedInfo: () => void
}

/**
 * Pet Info Card - Displays detailed pet information.
 *
 * Features:
 * - Pet name, breed, and age
 * - Description
 * - Expandable detailed information
 * - Special message from owner
 * - Health information
 * - Veterinary care details
 * - Additional details (birthday, collar, vaccinations)
 */
const PetInfoCard: React.FC<PetInfoCardProps> = ({
  petInfo,
  showDetailedInfo,
  onToggleDetailedInfo,
}) => {
  return (
    <div className="pet-details p-6 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80">
      <div className="pet-header flex justify-between items-start mb-4 gap-4">
        <div className="pet-title-section flex-1">
          <h2 className="pet-name text-[1.75rem] font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2 leading-tight tracking-wide">
            {petInfo.name}
          </h2>
          <p className="pet-breed text-gray-600 dark:text-gray-400 text-base font-medium mb-1 leading-relaxed">
            {petInfo.breed} • {Math.floor(petInfo.age / 12)} years old
          </p>
        </div>

        <button
          onClick={onToggleDetailedInfo}
          className="profile-toggle-btn relative p-2.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all duration-300 hover:scale-110 group flex-shrink-0 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md"
          title={showDetailedInfo ? 'Hide detailed information' : 'Show detailed information'}
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>

          {/* Toggle icon with animation */}
          <div className="relative z-10 transition-transform duration-300">
            {showDetailedInfo ? (
              <ChevronUp className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <ChevronDown className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            )}
          </div>

          {/* Subtle pulse effect */}
          <div className="absolute inset-0 rounded-xl border-2 border-indigo-400/20 opacity-0 group-hover:opacity-100 animate-ping"></div>
        </button>
      </div>

      {petInfo.description && (
        <>
          <div className="divider my-5 h-px bg-gray-100 dark:bg-gray-700/50"></div>
          <p className="pet-description text-gray-700 dark:text-gray-300 leading-relaxed text-base">
            {petInfo.description}
          </p>
        </>
      )}

      {/* Detailed Information - Inside Container */}
      {showDetailedInfo && (
        <div className="detailed-info-sections space-y-6 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Special Message Section */}
          {petInfo.special_message && (
            <div className="bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center mb-4">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Special Message from Owner
                </h3>
              </div>
              <p className="text-blue-800 dark:text-blue-200 leading-relaxed mb-4">
                "{petInfo.special_message}"
              </p>
              {petInfo.temperament && (
                <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-medium">Temperament:</span> {petInfo.temperament}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Health Information Section */}
          <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="flex items-center mb-4">
              <Stethoscope className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Health Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                {petInfo.weight && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Weight</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      {petInfo.weight}
                    </p>
                  </div>
                )}
                {petInfo.spayed_neutered && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Status</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      {petInfo.spayed_neutered}
                    </p>
                  </div>
                )}
              </div>

              {petInfo.microchip_id && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Microchip ID</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300 font-mono">
                    {petInfo.microchip_id}
                  </p>
                </div>
              )}

              {petInfo.markings && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Distinctive Markings
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {petInfo.markings}
                  </p>
                </div>
              )}

              {(petInfo.medical_conditions || petInfo.medications) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      Medical Alert
                    </span>
                  </div>
                  {petInfo.medical_conditions && (
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <span className="font-medium">Conditions:</span>{' '}
                      {petInfo.medical_conditions}
                    </p>
                  )}
                  {petInfo.medications && (
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                      <span className="font-medium">Medications:</span> {petInfo.medications}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Veterinary Care Section */}
          {(petInfo.veterinarian || petInfo.emergency_vet) && (
            <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Veterinary Care
                </h3>
              </div>

              <div className="space-y-4">
                {petInfo.veterinarian && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Primary Veterinarian
                    </p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      {petInfo.veterinarian}
                    </p>
                    {petInfo.vet_clinic && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {petInfo.vet_clinic}
                      </p>
                    )}
                    {petInfo.vet_address && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {petInfo.vet_address}
                      </p>
                    )}
                  </div>
                )}

                {petInfo.emergency_vet && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-500">24/7 Emergency</p>
                    <p className="font-medium text-purple-600 dark:text-purple-400">
                      {petInfo.emergency_vet}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Details Section */}
          {(petInfo.birthday || petInfo.collar_description || petInfo.vaccinations) && (
            <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
              <div className="flex items-center mb-4">
                <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Additional Details
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {petInfo.birthday && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Birthday</p>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        {petInfo.birthday}
                      </p>
                    </div>
                  )}

                  {petInfo.collar_description && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Collar Description
                      </p>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        {petInfo.collar_description}
                      </p>
                    </div>
                  )}

                  {petInfo.vaccinations && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Vaccinations</p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {petInfo.vaccinations}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PetInfoCard
