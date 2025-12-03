/**
 * Pet Analytics Cards Component
 *
 * Displays pet-related metrics:
 * - Species distribution
 * - Top breeds
 * - Photo coverage percentage
 */

import React from 'react'
import {
  Dog,
  Cat,
  Activity,
  Award,
  Image,
} from 'lucide-react'
import { PetAnalytics } from '@/services/superAdminService'
import { ProgressRing } from './ChartComponents'

interface PetAnalyticsCardsProps {
  petAnalytics: PetAnalytics | null
}

export const PetAnalyticsCards: React.FC<PetAnalyticsCardsProps> = ({ petAnalytics }) => {
  if (!petAnalytics) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Species Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Dog className="w-5 h-5 text-orange-500" />
          Pet Species
        </h3>
        <div className="space-y-3">
          {Object.entries(petAnalytics.species_distribution).map(([species, count]) => (
            <div key={species} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {species.toLowerCase() === 'dog' ? (
                  <Dog className="w-4 h-4 text-orange-400" />
                ) : species.toLowerCase() === 'cat' ? (
                  <Cat className="w-4 h-4 text-purple-400" />
                ) : (
                  <Activity className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{species}</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
            </div>
          ))}
          {Object.keys(petAnalytics.species_distribution).length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No pet data</p>
          )}
        </div>
      </div>

      {/* Top Breeds */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Top Breeds
        </h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {Object.entries(petAnalytics.breed_distribution).slice(0, 8).map(([breed, count]) => (
            <div key={breed} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate pr-2">{breed}</span>
              <span className="font-medium text-gray-900 dark:text-white text-sm">{count}</span>
            </div>
          ))}
          {Object.keys(petAnalytics.breed_distribution).length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No breed data</p>
          )}
        </div>
      </div>

      {/* Pet Photo Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Image className="w-5 h-5 text-pink-500" />
          Photo Coverage
        </h3>
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <ProgressRing
              percentage={petAnalytics.summary.photo_percentage}
              size={80}
              color="text-pink-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {petAnalytics.summary.photo_percentage}%
              </span>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          {petAnalytics.summary.pets_with_photos} of {petAnalytics.summary.total_pets} pets have photos
        </div>
      </div>
    </div>
  )
}
