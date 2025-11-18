import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, UserPlus } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useQRAccessStore } from '@/stores/qrAccessStore'
import { qrService } from '@/services/qrService'

const QRStatusCheckPage: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [isLoading, setIsLoading] = useState(true)
  const [qrStatus, setQRStatus] = useState<{
    is_active: boolean
    is_assigned: boolean
    requires_pin: boolean
    pet_info: any
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkQRStatus = async () => {
      if (!qrCode) {
        navigate('/')
        return
      }

      try {
        setIsLoading(true)

        // Handle demo QR code
        if (qrCode === 'DEMO123') {
          const demoResponse = {
            code: 'DEMO123',
            is_active: true,
            is_assigned: true,
            requires_pin: true,
            pet_info: null // Will be handled by PetDisplayPage
          }
          setQRStatus(demoResponse)

          // Always go to PIN verification to get correct pet ID
          setTimeout(() => {
            navigate(`/verify/${qrCode}`, { replace: true })
          }, 1000)
        } else {
          const response = await qrService.checkQRStatus(qrCode)
          setQRStatus(response)

          // Auto-redirect based on QR status after a short delay
          setTimeout(() => {
            if (response.is_active && response.is_assigned) {
              // Case 1: QR code is activated and assigned to a pet
              // Always go to PIN verification to get correct pet ID
              navigate(`/verify/${qrCode}`, { replace: true })
            } else if (response.is_active && !response.is_assigned) {
              // Case 2: QR code is activated but not assigned - show registration prompt
              // Stay on this page to show registration guidance
            } else {
              // Case 3: QR code is not active - show contact dealer message
              // Stay on this page to show contact dealer message
            }
          }, 1000) // 1 second delay to show status
        }

      } catch (error) {
        console.error('Error checking QR status:', error)

        // Check if it's a 404 error (QR not found)
        if (error instanceof Error && (error.message.includes('404') || error.message.includes('QR code not found'))) {
          setError('qr_not_found')
        } else {
          setError('network_error')
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkQRStatus()
  }, [qrCode, navigate])

  const handleGoBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    // Always navigate to home since users might directly access QR URLs
    console.log('Going back to home')
    navigate('/')
  }

  const handleRegister = () => {
    // Navigate to registration page with QR code
    navigate(`/?register=true&qr=${qrCode}`)
  }

  const handleContactDealer = () => {
    // You might want to show a modal with contact information
    // or navigate to a contact page
    alert(t('qr.contactDealerInfo', 'Please contact your dealer or pet store for assistance with this QR code.'))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 relative">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">{t('common.back')}</span>
        </button>

        <div className="w-full max-w-md mx-auto px-4 min-h-screen flex flex-col justify-center py-8">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-2 tracking-wide">
                {t('qr.checking', 'Checking QR Code')}
              </h2>
              <p className="text-gray-500 dark:text-gray-500 text-sm uppercase tracking-wider">
                {t('qr.checkingDescription', 'Please wait while we verify this QR code...')}
              </p>
            </div>

            {/* QR Code info display */}
            <div className="mt-12 text-center">
              <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-4"></div>
              <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                {t('qrCodeId', 'QR Code')}: {qrCode?.slice(-8)}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 relative">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">{t('common.back')}</span>
        </button>

        <div className="w-full max-w-md mx-auto px-4 min-h-screen flex flex-col justify-center py-8">
          <div className="text-center">
            <div className="mb-8">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-4 tracking-wide">
                {error === 'qr_not_found'
                  ? t('qr.notFound', 'QR Code Not Found')
                  : t('qr.error', 'Connection Error')
                }
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                {error === 'qr_not_found'
                  ? t('qr.notFoundDescription', 'This QR code is not recognized. Please contact your dealer or pet store for assistance.')
                  : t('qr.errorDescription', 'Unable to connect to our servers. Please check your internet connection and try again.')
                }
              </p>

              <button
                onClick={error === 'qr_not_found' ? handleContactDealer : () => window.location.reload()}
                className="w-full py-3 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors duration-200"
              >
                {error === 'qr_not_found'
                  ? t('qr.contactDealer', 'Contact Dealer')
                  : t('common.tryAgain', 'Try Again')
                }
              </button>
            </div>

            {/* QR Code info display */}
            <div className="mt-12 text-center">
              <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-4"></div>
              <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                {t('qrCodeId', 'QR Code')}: {qrCode?.slice(-8)}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!qrStatus) {
    return null
  }

  // Case 1: QR is active and assigned - will auto-redirect to PIN verification
  if (qrStatus.is_active && qrStatus.is_assigned) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 relative">
        <div className="w-full max-w-md mx-auto px-4 min-h-screen flex flex-col justify-center py-8">
          <div className="text-center">
            <div className="mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-4 tracking-wide">
                {t('qr.activated', 'QR Code Activated')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                {t('qr.activatedDescription', 'This QR code is registered to a pet. Redirecting to PIN verification...')}
              </p>
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Case 2: QR is active but not assigned - show registration prompt
  if (qrStatus.is_active && !qrStatus.is_assigned) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 relative">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">{t('common.back')}</span>
        </button>

        <div className="w-full max-w-md mx-auto px-4 min-h-screen flex flex-col justify-center py-8">
          <div className="text-center">
            <div className="mb-8">
              <UserPlus className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-4 tracking-wide">
                {t('qr.needsRegistration', 'Registration Required')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                {t('qr.needsRegistrationDescription', 'This QR code is valid but needs to be registered to your pet. Please create an account to get started.')}
              </p>

              <button
                onClick={handleRegister}
                className="w-full py-3 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors duration-200 mb-4"
              >
                {t('qr.register', 'Register This QR Code')}
              </button>

              <button
                onClick={handleGoBack}
                className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200"
              >
                {t('common.goBack', 'Go Back')}
              </button>
            </div>

            {/* QR Code info display */}
            <div className="mt-12 text-center">
              <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-4"></div>
              <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                {t('qrCodeId', 'QR Code')}: {qrCode?.slice(-8)}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Case 3: QR is not active - show contact dealer message
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      {/* Back Button */}
      <button
        onClick={handleGoBack}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-gray-700 dark:text-gray-300"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:block">{t('common.back')}</span>
      </button>

      <div className="w-full max-w-md mx-auto px-4 min-h-screen flex flex-col justify-center py-8">
        <div className="text-center">
          <div className="mb-8">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-4 tracking-wide">
              {t('qr.notActivated', 'QR Code Not Activated')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 leading-relaxed">
              {t('qr.notActivatedDescription', 'This QR code has not been activated yet. Please contact your dealer or pet store to activate it before use.')}
            </p>

            <button
              onClick={handleContactDealer}
              className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200 mb-4"
            >
              {t('qr.contactDealer', 'Contact Dealer')}
            </button>

            <button
              onClick={handleGoBack}
              className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200"
            >
              {t('common.goBack', 'Go Back')}
            </button>
          </div>

          {/* QR Code info display */}
          <div className="mt-12 text-center">
            <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-4"></div>
            <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider">
              {t('qrCodeId', 'QR Code')}: {qrCode?.slice(-8)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRStatusCheckPage