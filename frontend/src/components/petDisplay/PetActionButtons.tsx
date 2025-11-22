/**
 * PetActionButtons component for displaying action buttons on pet display page.
 * Includes Contact Owner, Share Location, and Buy Tag buttons.
 */

import React from 'react'
import { MapPin } from 'lucide-react'
import { LocationStatus } from '@/types/petDisplay.types'

/**
 * Props interface for PetActionButtons component.
 */
interface PetActionButtonsProps {
  /** Current location permission status */
  locationStatus: LocationStatus
  /** Pet's name for button context */
  petName: string
  /** Handler for contact owner button click */
  onContactOwner: () => void
  /** Handler for share location button click */
  onShareLocation: () => void
  /** Handler for store link button click */
  onStoreLink: () => void
}

/**
 * Action buttons component for pet display page.
 *
 * Features:
 * - Contact Owner button (phone icon with emergency label)
 * - Share Location button with loading state indicator
 * - Buy Tag button for store link
 *
 * @param props - Component props
 * @returns JSX element for the action buttons grid
 */
export const PetActionButtons: React.FC<PetActionButtonsProps> = ({
  locationStatus,
  onContactOwner,
  onShareLocation,
  onStoreLink
}) => {
  return (
    <div className="action-buttons grid gap-4 mt-6 grid-cols-3">
      {/* Contact Owner Button */}
      <button
        onClick={onContactOwner}
        className="action-btn phone-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-300 group shadow-sm hover:shadow-green-200/50 dark:hover:shadow-green-900/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-green-300/50 dark:hover:border-green-600/50"
      >
        <div className="flex flex-col items-center justify-center space-y-3 h-full pt-5 pb-3">
          <div className="btn-icon p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl group-hover:shadow-lg group-hover:shadow-green-500/25 transition-all duration-300 group-hover:scale-110">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="btn-content text-center">
            <span className="btn-title block text-sm font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
              Contact Owner
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-300 transition-colors duration-300">
              Emergency
            </span>
          </div>
        </div>
      </button>

      {/* Share Location Button */}
      <button
        onClick={onShareLocation}
        disabled={locationStatus === 'requesting'}
        className={`action-btn location-btn h-[120px] rounded-2xl p-3 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-300 group shadow-sm hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-orange-300/50 dark:hover:border-orange-600/50 ${
          locationStatus === 'requesting'
            ? 'bg-gray-100 dark:bg-gray-700/30 cursor-not-allowed opacity-70'
            : 'bg-white dark:bg-gray-800'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3 h-full pt-5 pb-3">
          <div className={`btn-icon p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
            locationStatus === 'requesting'
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500'
              : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white group-hover:shadow-lg group-hover:shadow-orange-500/25'
          }`}>
            {locationStatus === 'requesting' ? (
              <div className="animate-spin w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full"></div>
            ) : (
              <MapPin className="w-6 h-6" />
            )}
          </div>
          <div className="btn-content text-center">
            <span className={`btn-title block text-sm font-semibold transition-colors duration-300 ${
              locationStatus === 'requesting'
                ? 'text-gray-500 dark:text-gray-400'
                : 'text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400'
            }`}>
              {locationStatus === 'requesting' ? 'Getting...' : 'Share Location'}
            </span>
            <span className={`text-xs transition-colors duration-300 ${
              locationStatus === 'requesting'
                ? 'text-gray-400 dark:text-gray-500'
                : 'text-gray-500 dark:text-gray-400 group-hover:text-orange-500 dark:group-hover:text-orange-300'
            }`}>
              {locationStatus === 'requesting' ? 'Please wait' : 'Send Location'}
            </span>
          </div>
        </div>
      </button>

      {/* Buy Tag / Store Link Button */}
      <button
        onClick={onStoreLink}
        className="action-btn store-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-300 group shadow-sm hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300/50 dark:hover:border-purple-600/50"
      >
        <div className="flex flex-col items-center justify-center space-y-3 h-full pt-5 pb-3">
          <div className="btn-icon p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="btn-content text-center">
            <span className="btn-title block text-sm font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
              Buy Tag
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-300 transition-colors duration-300">
              Get Yours
            </span>
          </div>
        </div>
      </button>
    </div>
  )
}

export default PetActionButtons
