/**
 * PetNotFound component for displaying error state when pet is not found.
 * Shows error message and navigation button to home.
 */

import React from 'react'
import { Heart } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

/**
 * Props interface for PetNotFound component.
 */
interface PetNotFoundProps {
  /** Error message to display */
  error: string
  /** Handler for navigating to home */
  onGoHome: () => void
}

/**
 * Error state component for when pet is not found.
 *
 * Features:
 * - Heart icon in error state
 * - Translated error messages
 * - Go Home navigation button
 * - Full screen centered layout
 *
 * @param props - Component props
 * @returns JSX element for the not found state
 */
export const PetNotFound: React.FC<PetNotFoundProps> = ({
  error,
  onGoHome
}) => {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col justify-center">
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-red-500 rounded-full mb-6">
          <Heart className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-2 tracking-wide">
          {t('petNotFound', 'Pet Not Found')}
        </h2>
        <p className="text-gray-500 dark:text-gray-500 text-sm uppercase tracking-wider mb-8">
          {error || t('petNotFoundDescription', 'This QR code is not associated with any pet.')}
        </p>
        <button
          onClick={onGoHome}
          className="border-2 border-indigo-500 bg-indigo-500 text-white px-6 py-3 font-medium rounded-lg transition-all duration-200 hover:bg-indigo-600 hover:border-indigo-600"
        >
          {t('goHome', 'Go Home')}
        </button>
      </div>
    </div>
  )
}

export default PetNotFound
