import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import type { Language } from '@/types'

interface LanguageOption {
  code: Language
  flag: string
  name: string
}

const languages: LanguageOption[] = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' }
]

const LanguageSelectionPage: React.FC = () => {
  const navigate = useNavigate()
  const { language, hasSelectedLanguage, setLanguage, t } = useLanguage()

  // Check URL parameters and handle automatic redirects on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const qrCode = urlParams.get('qr')
    const langParam = urlParams.get('lang') as Language

    // If both QR code and language are specified, auto-navigate
    if (qrCode && langParam && ['en', 'zh', 'es', 'fr'].includes(langParam)) {
      setLanguage(langParam)
      navigate(`/qr/${qrCode}`)
      return
    }

    // If user has already selected a language before and there's a QR code, skip language selection
    if (hasSelectedLanguage && qrCode) {
      navigate(`/qr/${qrCode}`)
      return
    }

    // If user has selected a language before but no QR code, go to home
    if (hasSelectedLanguage && !qrCode) {
      navigate('/')
      return
    }

    // Otherwise, show language selection (first time visit or forced language selection)
  }, [navigate, setLanguage, hasSelectedLanguage])

  const handleLanguageSelect = (languageCode: Language) => {
    setLanguage(languageCode)

    // Navigate to QR scanning/PIN entry based on URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const qrCode = urlParams.get('qr')

    if (qrCode) {
      navigate(`/qr/${qrCode}`)
    } else {
      // Stay on language selection page or go to home for development
      navigate('/')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 min-h-screen flex flex-col justify-center py-8 bg-white dark:bg-gray-900">
      <div className="language-selection w-full">
        <div className="text-center mb-12">
          <h1
            className="text-2xl font-light text-gray-900 dark:text-white mb-2 tracking-wide"
            id="selectLanguageTitle"
          >
            {t('language.title', 'Select Language')}
          </h1>
          <p className="text-gray-500 dark:text-gray-500 text-sm uppercase tracking-wider">
            Choose your preferred language
          </p>
        </div>

        <div className="language-grid grid grid-cols-1 gap-3 mb-8">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`
                language-btn flex items-center justify-center gap-3 py-4 px-6
                border transition-all duration-200 rounded-lg
                ${
                  language === lang.code
                    ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-lg'
                    : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }
                text-lg font-medium
              `}
              data-lang={lang.code}
            >
              <span className="text-xl">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>

        {/* Skip language selection option */}
        <div className="text-center">
          <button
            onClick={() => handleLanguageSelect('en')}
            className="text-sm text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 uppercase tracking-wider transition-colors"
          >
            Continue in English
          </button>
        </div>
      </div>
    </div>
  )
}

export default LanguageSelectionPage