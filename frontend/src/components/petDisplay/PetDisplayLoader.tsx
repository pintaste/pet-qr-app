/**
 * PetDisplayLoader component for displaying loading state.
 * Simple loading spinner with text indicator.
 */

import React from 'react'
import { useLanguage } from '@/hooks/useLanguage'

/**
 * Loading component for pet display page.
 *
 * Features:
 * - Centered spinner animation
 * - Translated loading text
 * - Full screen height layout
 *
 * @returns JSX element for the loading state
 */
export const PetDisplayLoader: React.FC = () => {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          <span className="text-gray-500 dark:text-gray-500 text-sm uppercase tracking-wider">
            {t('loading', 'Loading')}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PetDisplayLoader
