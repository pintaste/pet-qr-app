import React from 'react'

interface PetInfo {
  emergency_contact?: {
    phone?: string
  }
}

interface ActionButtonsProps {
  petInfo: PetInfo | null
  onContactOwner: () => void
  onLocationShare: () => void
  onStoreLink: () => void
}

/**
 * Action Buttons - Main action buttons for pet display.
 *
 * Features:
 * - Contact owner button (call/SMS/email)
 * - Location sharing button
 * - Buy tag button (store link)
 * - Responsive grid layout
 * - Gradient hover effects
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  petInfo,
  onContactOwner,
  onLocationShare,
  onStoreLink,
}) => {
  return (
    <div className="action-buttons grid gap-4 mt-6 grid-cols-3">
      {(petInfo?.emergency_contact?.phone || true) && (
        <button
          onClick={onContactOwner}
          className="action-btn phone-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-300 group shadow-sm hover:shadow-green-200/50 dark:hover:shadow-green-900/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-green-300/50 dark:hover:border-green-600/50"
        >
          <div className="flex flex-col items-center justify-center space-y-3 h-full pt-5 pb-3">
            <div className="btn-icon p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl group-hover:shadow-lg group-hover:shadow-green-500/25 transition-all duration-300 group-hover:scale-110">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
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
      )}

      <button
        onClick={onLocationShare}
        className="action-btn location-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-300 group shadow-sm hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50"
      >
        <div className="flex flex-col items-center justify-center space-y-3 h-full pt-5 pb-3">
          <div className="btn-icon p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div className="btn-content text-center">
            <span className="btn-title block text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              Location
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors duration-300">
              Share Found
            </span>
          </div>
        </div>
      </button>

      <button
        onClick={onStoreLink}
        className="action-btn store-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-300 group shadow-sm hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300/50 dark:hover:border-purple-600/50"
      >
        <div className="flex flex-col items-center justify-center space-y-3 h-full pt-5 pb-3">
          <div className="btn-icon p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
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

export default ActionButtons
