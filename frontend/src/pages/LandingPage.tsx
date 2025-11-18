import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Heart, QrCode, User, Zap, Shield, Globe, Settings } from 'lucide-react'
import QRScannerModal from '@/components/QRScannerModal'
import AuthModal from '@/components/AuthModal'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/hooks/useLanguage'
import { useAuthStore } from '@/stores/authStore'
import { containerStyles } from '@/styles/containers'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { hasSelectedLanguage, t } = useLanguage()
  const { isAuthenticated, user } = useAuthStore()
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')

  // Check for URL parameters to auto-open auth modal
  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setAuthModalMode('register')
      setIsAuthModalOpen(true)
      // Clean up URL
      navigate('/', { replace: true })
    }
  }, [searchParams, navigate])

  const handleQRScanSuccess = (qrData: string) => {
    // Extract QR code from URL if it's a full URL, otherwise use as-is
    let qrCode = qrData

    // Check if the scanned data is a full URL containing /qr/
    const urlMatch = qrData.match(/\/qr\/([^/?]+)/)
    if (urlMatch) {
      qrCode = urlMatch[1]
    }

    // If user has already selected a language, skip language selection and go directly to QR validation
    if (hasSelectedLanguage) {
      navigate(`/qr/${encodeURIComponent(qrCode)}`)
    } else {
      // First time user, navigate to language selection
      navigate(`/language?qr=${encodeURIComponent(qrCode)}`)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      {/* Language Switcher */}
      <LanguageSwitcher position="top-right" compact />

      {/* Main Content */}
      <div className={`${containerStyles.narrow} min-h-screen flex flex-col justify-center py-8`}>

        {/* Logo Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-indigo-500 rounded-full mb-6">
            <Heart className="w-8 h-8 text-indigo-500" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-wide">
            PetID
          </h1>
          <p className="text-indigo-600 dark:text-indigo-400 text-sm uppercase tracking-wider">
            {t('landing.tagline', 'Smart Pet Protection')}
          </p>
        </div>

        {/* Hero Description */}
        <div className="text-center mb-16">
          <h2 className="text-xl font-light text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
            {t('landing.title', 'Never lose your beloved pet again')}
          </h2>
          <p className="text-gray-500 dark:text-gray-500 text-sm leading-relaxed">
            {t('landing.features.qr', 'Instant QR code identification')}<br />
            {t('landing.features.gps', 'GPS location sharing')}<br />
            {t('landing.features.emergency', 'Emergency contacts')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-16">
          {/* Primary Demo Button */}
          <button
            onClick={() => {
              if (hasSelectedLanguage) {
                navigate('/qr/DEMO123')
              } else {
                navigate('/language?qr=DEMO123')
              }
            }}
            className="w-full border-2 border-indigo-500 bg-indigo-500 text-white py-4 px-6 transition-all duration-200 hover:bg-indigo-600 hover:border-indigo-600 rounded-lg shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-3">
              <Heart className="w-5 h-5" fill="currentColor" />
              <span className="font-medium">{t('landing.button.tryDemo', 'Try Demo')}</span>
            </div>
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsQRScannerOpen(true)}
              className="border-2 border-blue-500 text-blue-600 dark:text-blue-400 py-3 px-4 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <QrCode className="w-5 h-5" />
                <span className="text-xs font-medium">{t('landing.button.scanQR', 'Scan QR')}</span>
              </div>
            </button>

{/* Login/Dashboard Button - changes based on auth state */}
            <button
              onClick={() => isAuthenticated ? navigate('/dashboard') : setIsAuthModalOpen(true)}
              className={`border-2 py-3 px-4 transition-all duration-200 rounded-lg ${
                isAuthenticated
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  : 'border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <Settings className="w-5 h-5" />
                    <span className="text-xs font-medium">{t('landing.button.dashboard', 'Dashboard')}</span>
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    <span className="text-xs font-medium">{t('landing.button.login', 'Login')}</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-8 text-center mb-16">
          <div className="space-y-3">
            <div className="flex justify-center">
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider">
              {t('landing.feature.instant', 'Instant')}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-center">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider">
              {t('landing.feature.secure', 'Secure')}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-center">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider">
              {t('landing.feature.global', 'Global')}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            {t('landing.footer', '© 2024 PetID. All rights reserved.')}
          </p>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  )
}

export default LandingPage