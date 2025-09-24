import React, { useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import type { Language } from '@/types'

interface LanguageSwitcherProps {
  compact?: boolean
  position?: 'top-right' | 'top-left' | 'inline'
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  position = 'inline'
}) => {
  const { language, setLanguage, languages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find(lang => lang.code === language)

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    setIsOpen(false)
  }

  const positionClasses = {
    'top-right': 'absolute top-4 right-4',
    'top-left': 'absolute top-4 left-4',
    'inline': 'relative'
  }

  return (
    <div className={`${positionClasses[position]} z-10`}>
      <div className="relative">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-3 py-2
            bg-white/90 dark:bg-gray-800/90
            backdrop-blur-sm
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-sm
            hover:bg-white dark:hover:bg-gray-800
            transition-all duration-200
            text-gray-700 dark:text-gray-300
            ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}
          `}
        >
          {compact ? (
            <Globe className="w-4 h-4" />
          ) : (
            <>
              <span className="text-lg">{currentLanguage?.flag}</span>
              <span className="text-sm font-medium hidden sm:block">
                {currentLanguage?.name}
              </span>
              <span className="text-sm font-medium sm:hidden">
                {currentLanguage?.code.toUpperCase()}
              </span>
            </>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className="absolute top-full mt-2 right-0 z-20 min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as Language)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left
                    hover:bg-gray-50 dark:hover:bg-gray-700
                    transition-colors duration-150
                    ${language === lang.code
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{lang.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {lang.code.toUpperCase()}
                    </span>
                  </div>
                  {language === lang.code && (
                    <div className="ml-auto w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default LanguageSwitcher