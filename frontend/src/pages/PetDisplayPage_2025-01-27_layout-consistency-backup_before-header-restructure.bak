import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import { useQRAccessStore } from '@/stores/qrAccessStore'
import { useAuthStore } from '@/stores/authStore'
import { useSecurityStore } from '@/stores/securityStore'
import { useSecurityMonitorStore, SUSPICIOUS_ACTIVITY_TYPES } from '@/stores/securityMonitorStore'
import { useTheme } from '@/hooks/useTheme'
import { qrService } from '@/services/qrService'
import { authService } from '@/services/authService'
import AuthModal from '@/components/AuthModal'
import { Heart, LogOut, Globe, Sun, Moon, User, Menu, LayoutDashboard, Trash2, RefreshCw, Shield, Download } from 'lucide-react'

interface PetInfo {
  name: string
  breed: string
  age: number
  sex: string
  size: string
  color: string
  description: string
  personality_traits: string[]
  profile_photo_url?: string
  photo_urls: string[]
  basic_medical_info: any
  emergency_contact: any
  is_lost: boolean
  last_known_location?: string
}

const PetDisplayPage: React.FC = () => {
  const { petId } = useParams<{ petId: string }>()
  const navigate = useNavigate()
  const { t, clearLanguagePreference, language, setLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { isQRVerified, clearVerification, isPetAccessible, getQRCodeForPetId } = useQRAccessStore()
  const { clearSecurityData } = useSecurityStore()
  const { isAuthenticated } = useAuthStore()
  const { logSuspiciousActivity, getSuspiciousActivities, exportSecurityLog } = useSecurityMonitorStore()

  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Language options
  const languages = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'zh', flag: '🇨🇳', name: '中文' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'fr', flag: '🇫🇷', name: 'Français' }
  ]

  const currentLang = languages.find(lang => lang.code === language) || languages[0]

  const [petInfo, setPetInfo] = useState<PetInfo | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  console.log('PetDisplayPage component mounted with pet ID:', petId)

  useEffect(() => {
    if (!petId) {
      // No pet ID provided, redirect to home
      navigate('/', { replace: true })
      return
    }

    // CRITICAL SECURITY CHECK: Verify access before allowing pet info fetch
    const petIdNum = parseInt(petId, 10)
    if (isNaN(petIdNum)) {
      console.warn('Invalid pet ID format:', petId)
      navigate('/', { replace: true })
      return
    }

    // Check if this pet ID is accessible (has verified QR)
    const hasAccess = isPetAccessible(petIdNum)
    if (!hasAccess) {
      console.warn('Access denied: Pet ID', petId, 'not accessible without QR verification')

      // Log suspicious direct access attempt
      logSuspiciousActivity({
        type: SUSPICIOUS_ACTIVITY_TYPES.DIRECT_PET_ACCESS,
        petId: petIdNum,
        metadata: {
          url: window.location.href,
          referrer: document.referrer || 'direct',
          timestamp: new Date().toISOString()
        }
      })

      // Get the QR code that should be verified for this pet
      const qrCode = getQRCodeForPetId(petIdNum)
      if (qrCode) {
        // Redirect to QR verification page
        navigate(`/qr/${qrCode}`, { replace: true })
      } else {
        // No QR code mapped, redirect to home
        navigate('/', { replace: true })
      }
      return
    }

    // Access granted - proceed with fetching pet info
    console.log('Access granted for pet ID:', petId)
    fetchPetInfo()
  }, [petId, navigate, isPetAccessible, getQRCodeForPetId])

  const fetchPetInfo = async () => {
    try {
      console.log('Fetching pet info for pet ID:', petId)
      setIsLoading(true)
      setError('')

      if (!petId) {
        setError('No pet ID provided')
        return
      }

      // Use the public pet API endpoint (no authentication required)
      const response = await fetch(`http://localhost:8000/api/v1/pets/public/${petId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Pet not found')
        } else {
          setError('Failed to load pet information')
        }
        return
      }

      const petData = await response.json()
      console.log('Fetched pet data:', petData)

      // Convert API data to our PetInfo interface
      const petInfo: PetInfo = {
        name: petData.name || 'Unknown',
        breed: petData.breed || 'Unknown',
        age: petData.age || 0,
        sex: petData.sex || 'Unknown',
        size: petData.size || 'Unknown',
        color: petData.color || 'Unknown',
        description: petData.description || '',
        personality_traits: petData.personality_traits || [],
        profile_photo_url: petData.profile_photo_url,
        photo_urls: petData.photo_urls || [],
        basic_medical_info: petData.basic_medical_info || {},
        emergency_contact: petData.emergency_contact || {},
        is_lost: petData.is_lost || false,
        last_known_location: petData.last_known_location
      }

      setPetInfo(petInfo)
    } catch (error) {
      console.error('Error fetching pet info:', error)
      setError('Failed to load pet information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index)
  }

  const handleLocationShare = () => {
    if (!navigator.geolocation) {
      alert(t('locationNotSupported', 'Geolocation is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const locationMessage = `Found at: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

        // Open default email/SMS with location
        const message = encodeURIComponent(
          `I found ${petInfo?.name}! ${locationMessage}\\n\\nQR Code: ${qrCode}`
        )

        if (petInfo?.emergency_contact?.phone) {
          window.open(`sms:${petInfo.emergency_contact.phone}?body=${message}`)
        } else if (petInfo?.emergency_contact?.email) {
          window.open(`mailto:${petInfo.emergency_contact.email}?subject=Found ${petInfo.name}&body=${message}`)
        }
      },
      (error) => {
        console.error('Location error:', error)
        alert(t('locationError', 'Unable to get your location. Please try again.'))
      }
    )
  }

  const handlePhoneCall = () => {
    if (petInfo?.emergency_contact?.phone) {
      window.open(`tel:${petInfo.emergency_contact.phone}`)
    }
  }

  const handleStoreLink = () => {
    // Open store link (configurable per tenant)
    window.open('https://example.com/store', '_blank')
  }

  const handleExit = () => {
    if (!qrCode) return

    // Clear the PIN verification cache for this QR code
    clearVerification(qrCode)
    console.log('PIN verification cleared for QR code:', qrCode)

    // Clear language preference so user needs to select language again
    clearLanguagePreference()
    console.log('Language preference cleared')

    // Navigate back to home page
    navigate('/')
  }

  // Development tools functions
  const handleClearPinCache = () => {
    // For demo, we clear the cache for DEMO123 QR code
    const demoQrCode = 'DEMO123'
    clearVerification(demoQrCode)
    alert('PIN verification cache cleared for DEMO123!')
    console.log('Development: PIN verification cache cleared for', demoQrCode)
  }

  const handleClearSecurityData = () => {
    // Clear security data for DEMO123 QR code
    const demoQrCode = 'DEMO123'
    clearSecurityData(demoQrCode)
    alert('Security data (attempts, cooldowns, blocks) cleared for DEMO123!')
    console.log('Development: Security data cleared for', demoQrCode)
  }

  const handleClearLanguageCache = () => {
    clearLanguagePreference()
    alert('Language preference cleared!')
    console.log('Development: Language preference cleared')
  }

  const handleClearAllCache = () => {
    const demoQrCode = 'DEMO123'
    clearVerification(demoQrCode)
    clearSecurityData(demoQrCode)
    clearLanguagePreference()
    alert('All caches cleared! (PIN verification, security data for DEMO123, and language preference)')
    console.log('Development: All caches cleared - PIN verification, security data, and language preference')
  }

  const handleViewSecurityLog = () => {
    const activities = getSuspiciousActivities()
    const logData = activities.map(activity =>
      `${new Date(activity.timestamp).toISOString()} - ${activity.type} - QR: ${activity.qrCode || 'N/A'} - Pet: ${activity.petId || 'N/A'}`
    ).join('\n')

    const message = activities.length > 0
      ? `Security Activities (${activities.length} entries):\n\n${logData}`
      : 'No suspicious activities recorded'

    alert(message)
  }

  const handleExportSecurityLog = () => {
    const logData = exportSecurityLog()
    const blob = new Blob([logData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-log-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert('Security log exported successfully!')
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      alert('Logged out successfully!')
      console.log('Development: User logged out')
      // Navigate back to landing page
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      alert('Logout failed. Check console for details.')
    }
  }

  if (isLoading) {
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

  if (error || !petInfo) {
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
            onClick={() => navigate('/')}
            className="border-2 border-indigo-500 bg-indigo-500 text-white px-6 py-3 font-medium rounded-lg transition-all duration-200 hover:bg-indigo-600 hover:border-indigo-600"
          >
            {t('goHome', 'Go Home')}
          </button>
        </div>
      </div>
    )
  }

  const photos = petInfo.photo_urls || []
  const currentPhoto = photos[currentImageIndex] || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=250&fit=crop'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header Icons - Floating Position */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Theme Toggle - Shows CURRENT theme */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
          title={theme === 'dark' ? 'Currently dark mode - click for light' : 'Currently light mode - click for dark'}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>

        {/* Language Switcher - Shows CURRENT language */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-1 p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
            title={`Current language: ${currentLang.name}`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">
              {currentLang.code}
            </span>
          </button>

          {showLanguageDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowLanguageDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-[140px]">
                {languages.map((lang, index) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLanguageDropdown(false)
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-3 text-left transition-all duration-200 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      lang.code === language ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                    } ${
                      index === 0 ? 'rounded-t-xl' : ''
                    } ${
                      index === languages.length - 1 ? 'rounded-b-xl' : ''
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Auth Button */}
        {!isAuthenticated ? (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
            title="Login"
          >
            <User className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
            title="Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Content - Clean Layout */}
      <div className="container mx-auto max-w-md px-4 pb-6 pt-4">


        {/* Pet Card - Enhanced Design */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 mb-8 backdrop-blur-sm">
        {/* Pet Gallery */}
        <div className="pet-gallery relative">
          <div className="gallery-main relative w-full h-[250px] overflow-hidden rounded-t-3xl">
            <img
              src={currentPhoto}
              alt={`${petInfo.name} main photo`}
              className="gallery-main-image w-full h-full object-cover transition-opacity duration-300"
              id="mainImage"
            />
            {photos.length > 1 && (
              <div className="gallery-counter absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-2xl text-sm font-medium backdrop-blur-md">
                <span id="currentImage">{currentImageIndex + 1}</span> / <span id="totalImages">{photos.length}</span>
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <div className="gallery-thumbnails flex gap-2 p-4 bg-white dark:bg-gray-800 overflow-x-auto rounded-b-3xl">
              {photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`${petInfo.name} photo ${index + 1}`}
                  className={`gallery-thumb w-[60px] h-[60px] object-cover rounded-xl cursor-pointer transition-all duration-200 border-2 flex-shrink-0 ${
                    index === currentImageIndex
                      ? 'border-indigo-500 scale-105'
                      : 'border-transparent hover:scale-105'
                  }`}
                  onClick={() => handleImageChange(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pet Details */}
        <div className="pet-details p-6">
          <div className="pet-header flex justify-between items-start mb-4 gap-4">
            <div className="pet-title-section flex-1">
              <h2 className="pet-name text-[1.75rem] font-bold text-gray-900 dark:text-white mb-1 leading-tight">
                {petInfo.name}
              </h2>
              <p className="pet-breed text-gray-600 dark:text-gray-400 text-base">
                {petInfo.breed} • {Math.floor(petInfo.age / 12)} years old
              </p>
            </div>
            <button
              onClick={() => navigate(`/profile/${qrCode}`)}
              className="profile-btn-subtle p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors flex-shrink-0"
              id="profileBtn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {petInfo.description && (
            <p className="pet-description text-gray-700 dark:text-gray-300 leading-relaxed text-base">
              {petInfo.description}
            </p>
          )}
        </div>
      </div>


      {/* Action Buttons - Enhanced Layout */}
      <div className="action-buttons grid grid-cols-3 gap-3">
        <button
          onClick={handleLocationShare}
          className="action-btn location-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group shadow-md border border-gray-100 dark:border-gray-700"
        >
          <div className="flex flex-col items-center justify-center space-y-2 h-full">
            <div className="btn-icon p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl group-hover:shadow-lg transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="btn-content text-center">
              <span className="btn-title block text-sm font-semibold text-gray-900 dark:text-white">
                Location
              </span>
            </div>
          </div>
        </button>

        {petInfo.emergency_contact?.phone && (
          <button
            onClick={handlePhoneCall}
            className="action-btn phone-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group shadow-md border border-gray-100 dark:border-gray-700"
          >
            <div className="flex flex-col items-center justify-center space-y-2 h-full">
              <div className="btn-icon p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl group-hover:shadow-lg transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="btn-content text-center">
                <span className="btn-title block text-sm font-semibold text-gray-900 dark:text-white">
                  Call
                </span>
              </div>
            </div>
          </button>
        )}

        <button
          onClick={handleStoreLink}
          className="action-btn store-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group shadow-md border border-gray-100 dark:border-gray-700"
        >
          <div className="flex flex-col items-center justify-center space-y-2 h-full">
            <div className="btn-icon p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl group-hover:shadow-lg transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="btn-content text-center">
              <span className="btn-title block text-sm font-semibold text-gray-900 dark:text-white">
                Buy Tag
              </span>
            </div>
          </div>
        </button>

        <button
          onClick={handleExit}
          className="action-btn exit-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group shadow-md border border-gray-100 dark:border-gray-700"
        >
          <div className="flex flex-col items-center justify-center space-y-2 h-full">
            <div className="btn-icon p-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl group-hover:shadow-lg transition-all duration-300">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="btn-content text-center">
              <span className="btn-title block text-sm font-semibold text-gray-900 dark:text-white">
                Exit
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Development Tools - Clean & Bottom */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Development Tools</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleClearPinCache}
            className="flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-800 dark:text-orange-200 text-sm rounded-md transition-colors"
            title="Clear PIN verification cache"
          >
            <Trash2 className="w-3 h-3" />
            Clear PIN
          </button>
          <button
            onClick={handleClearSecurityData}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm rounded-md transition-colors"
            title="Clear security data (attempts, cooldowns, blocks)"
          >
            <Trash2 className="w-3 h-3" />
            Clear Security
          </button>
          <button
            onClick={handleClearLanguageCache}
            className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm rounded-md transition-colors"
            title="Clear language preference"
          >
            <Globe className="w-3 h-3" />
            Clear Lang
          </button>
          <button
            onClick={handleClearAllCache}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-800 dark:text-red-200 text-sm rounded-md transition-colors"
            title="Clear all caches"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
          <button
            onClick={handleViewSecurityLog}
            className="flex items-center gap-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 text-sm rounded-md transition-colors"
            title="View security activities log"
          >
            <Shield className="w-3 h-3" />
            Security Log
          </button>
          <button
            onClick={handleExportSecurityLog}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-sm rounded-md transition-colors"
            title="Export security log as JSON"
          >
            <Download className="w-3 h-3" />
            Export Log
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md transition-colors"
            title="Logout current user"
          >
            <RefreshCw className="w-3 h-3" />
            Logout
          </button>
        </div>
      </div>

      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  )
}

export default PetDisplayPage