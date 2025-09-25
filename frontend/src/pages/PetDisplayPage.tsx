import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import { useQRAccessStore } from '@/stores/qrAccessStore'
import { useSecurityStore } from '@/stores/securityStore'
import { useSecurityMonitorStore, SUSPICIOUS_ACTIVITY_TYPES } from '@/stores/securityMonitorStore'
import { authService } from '@/services/authService'
import { Heart, LogOut, Trash2, RefreshCw, Shield, Download, Globe, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react'

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
  const { t, clearLanguagePreference } = useLanguage()
  const { clearVerification, isPetAccessible, getQRCodeForPetId } = useQRAccessStore()
  const { clearSecurityData } = useSecurityStore()
  const { logSuspiciousActivity, getSuspiciousActivities, exportSecurityLog } = useSecurityMonitorStore()


  const [petInfo, setPetInfo] = useState<PetInfo | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)

  console.log('PetDisplayPage component mounted with pet ID:', petId)

  // Keyboard navigation for fullscreen gallery
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFullscreenOpen) return

      switch (event.key) {
        case 'Escape':
          closeFullscreenGallery()
          break
        case 'ArrowLeft':
          handleFullscreenPrevious()
          break
        case 'ArrowRight':
          handleFullscreenNext()
          break
        default:
          break
      }
    }

    if (isFullscreenOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreenOpen, fullscreenImageIndex, petInfo?.photo_urls?.length])

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
        emergency_contact: petData.emergency_contact || {
          phone: '+1 (555) 123-4567',
          email: 'owner@example.com'
        },
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


  const handlePreviousImage = () => {
    const photoUrls = petInfo?.photo_urls || []
    if (!petInfo || photoUrls.length <= 1) return
    setCurrentImageIndex(prev => prev === 0 ? photoUrls.length - 1 : prev - 1)
  }

  const handleNextImage = () => {
    const photoUrls = petInfo?.photo_urls || []
    if (!petInfo || photoUrls.length <= 1) return
    setCurrentImageIndex(prev => prev === photoUrls.length - 1 ? 0 : prev + 1)
  }

  // Controls auto-hide functionality
  const resetControlsTimeout = () => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }
    setShowControls(true)
    const timeout = setTimeout(() => {
      setShowControls(false)
    }, 3000) // Hide after 3 seconds of inactivity
    setControlsTimeout(timeout)
  }

  const handleGalleryMouseEnter = () => {
    setShowControls(true)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
      setControlsTimeout(null)
    }
  }

  const handleGalleryMouseLeave = () => {
    setShowControls(false)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
      setControlsTimeout(null)
    }
  }

  const handleMouseMove = () => {
    if (isFullscreenOpen) {
      resetControlsTimeout()
    }
  }

  // Fullscreen gallery functions
  const openFullscreenGallery = (index: number) => {
    setFullscreenImageIndex(index)
    setIsFullscreenOpen(true)
    setShowControls(true)
    resetControlsTimeout()
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
  }

  const closeFullscreenGallery = () => {
    setIsFullscreenOpen(false)
    setShowControls(true)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
      setControlsTimeout(null)
    }
    // Restore body scroll
    document.body.style.overflow = 'unset'
  }

  const handleFullscreenPrevious = () => {
    const photoUrls = petInfo?.photo_urls || []
    if (!petInfo || photoUrls.length <= 1) return
    setFullscreenImageIndex(prev => prev === 0 ? photoUrls.length - 1 : prev - 1)
  }

  const handleFullscreenNext = () => {
    const photoUrls = petInfo?.photo_urls || []
    if (!petInfo || photoUrls.length <= 1) return
    setFullscreenImageIndex(prev => prev === photoUrls.length - 1 ? 0 : prev + 1)
  }

  // Download image with watermark
  const downloadImageWithWatermark = async (imageUrl: string, imageIndex: number) => {
    try {
      // Create canvas for adding watermark
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Load the image
      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      // Set canvas size to match image
      canvas.width = img.width
      canvas.height = img.height

      // Draw the original image
      ctx.drawImage(img, 0, 0)

      // Add watermark
      const watermarkText = `${petInfo?.name || 'Pet'} - PetID System`
      const fontSize = Math.max(20, Math.min(img.width / 20, img.height / 20))

      ctx.font = `${fontSize}px Arial`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.lineWidth = 2

      // Position watermark at bottom right
      const textWidth = ctx.measureText(watermarkText).width
      const x = img.width - textWidth - 20
      const y = img.height - 20

      // Draw watermark with stroke and fill
      ctx.strokeText(watermarkText, x, y)
      ctx.fillText(watermarkText, x, y)

      // Add QR code info as secondary watermark
      const qrText = `QR: ${qrCode || 'Unknown'}`
      ctx.font = `${fontSize * 0.7}px Arial`
      const qrTextWidth = ctx.measureText(qrText).width
      const qrX = img.width - qrTextWidth - 20
      const qrY = y - fontSize - 5

      ctx.strokeText(qrText, qrX, qrY)
      ctx.fillText(qrText, qrX, qrY)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${petInfo?.name || 'pet'}-photo-${imageIndex + 1}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.9)

    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image. Please try again.')
    }
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

  // Get the QR code for this pet
  const qrCode = getQRCodeForPetId(parseInt(petId!, 10))

  return (
    <>
      {/* Pet Card - Enhanced Design */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50 mb-8 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600">
        {/* Pet Gallery */}
        <div className="pet-gallery relative" onMouseEnter={handleGalleryMouseEnter} onMouseLeave={handleGalleryMouseLeave}>
          <div className="gallery-main relative w-full h-[250px] overflow-hidden rounded-t-3xl">
            <img
              src={currentPhoto}
              alt={`${petInfo.name} main photo`}
              className="gallery-main-image w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
              id="mainImage"
              onClick={() => openFullscreenGallery(currentImageIndex)}
            />
            {/* Expand icon hint - moved to bottom right with visibility control */}
            <button
              onClick={() => openFullscreenGallery(currentImageIndex)}
              className={`absolute bottom-3 right-3 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                showControls ? 'opacity-70 hover:opacity-100' : 'opacity-0'
              }`}
              title="View fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            {photos.length > 1 && (
              <>
                {/* Navigation Arrows - improved styling */}
                <button
                  onClick={handlePreviousImage}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                    showControls ? 'opacity-60 hover:opacity-100' : 'opacity-0'
                  }`}
                  title="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                    showControls ? 'opacity-60 hover:opacity-100' : 'opacity-0'
                  }`}
                  title="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                {/* Image Counter - improved styling with visibility control */}
                <div className={`gallery-counter absolute top-3 right-3 bg-black bg-opacity-40 text-white px-2 py-1 rounded-xl text-xs font-medium backdrop-blur-sm z-10 transition-all duration-300 ${
                  showControls ? 'opacity-70 hover:opacity-100' : 'opacity-0'
                }`}>
                  <span id="currentImage">{currentImageIndex + 1}</span> / <span id="totalImages">{photos.length}</span>
                </div>
              </>
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
                      ? 'border-gray-300 dark:border-gray-500 scale-105 opacity-100'
                      : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pet Details */}
        <div className="pet-details p-6 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80">
          <div className="pet-header flex justify-between items-start mb-4 gap-4">
            <div className="pet-title-section flex-1">
              <h2 className="pet-name text-[1.75rem] font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2 leading-tight tracking-wide">
                {petInfo.name}
              </h2>
              <p className="pet-breed text-gray-600 dark:text-gray-400 text-base font-medium mb-1 leading-relaxed">
                {petInfo.breed} • {Math.floor(petInfo.age / 12)} years old
              </p>
            </div>
            <button
              onClick={() => navigate(`/profile/${qrCode}`)}
              className="profile-btn-subtle relative p-2.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all duration-300 hover:scale-110 group flex-shrink-0 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md"
              id="profileBtn"
              title="View detailed profile"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>

              {/* Info icon with animation */}
              <svg className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>

              {/* Subtle pulse effect */}
              <div className="absolute inset-0 rounded-xl border-2 border-indigo-400/20 opacity-0 group-hover:opacity-100 animate-ping"></div>
            </button>
          </div>

          {petInfo.description && (
            <div className="pet-description-container mt-4 p-4 bg-gray-50/80 dark:bg-gray-700/30 rounded-2xl border border-gray-200/50 dark:border-gray-600/50">
              <p className="pet-description text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                {petInfo.description}
              </p>
            </div>
          )}
        </div>
      </div>


      {/* Action Buttons - Enhanced Layout */}
      <div className="action-buttons grid gap-4 mt-6 grid-cols-3">
        <button
          onClick={handleLocationShare}
          className="action-btn location-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-300 group shadow-sm hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-green-300/50 dark:hover:border-green-600/50"
        >
          <div className="flex flex-col items-center justify-center space-y-3 h-full pt-5 pb-3">
            <div className="btn-icon p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl group-hover:shadow-lg group-hover:shadow-green-500/25 transition-all duration-300 group-hover:scale-110">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="btn-content text-center">
              <span className="btn-title block text-sm font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                Location
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-300 transition-colors duration-300">
                Share Found
              </span>
            </div>
          </div>
        </button>

        {(petInfo.emergency_contact?.phone || true) && (
          <button
            onClick={handlePhoneCall}
            className="action-btn phone-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-300 group shadow-sm hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50"
          >
            <div className="flex flex-col items-center justify-center space-y-3 h-full pt-5 pb-3">
              <div className="btn-icon p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="btn-content text-center">
                <span className="btn-title block text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  Call Owner
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors duration-300">
                  Emergency
                </span>
              </div>
            </div>
          </button>
        )}

        <button
          onClick={handleStoreLink}
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

      {/* Development Tools - Clean & Bottom */}
      <div className="mt-8 p-5 bg-gradient-to-br from-gray-50/90 to-gray-100/50 dark:from-gray-800/90 dark:to-gray-700/50 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-gradient-to-br hover:from-gray-100/90 hover:to-gray-50/70 dark:hover:from-gray-700/90 dark:hover:to-gray-600/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
          <span className="text-gray-700 dark:text-gray-300 text-sm font-semibold tracking-wide">Development Tools</span>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
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

      {/* Fullscreen Image Gallery Modal */}
      {isFullscreenOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex items-center justify-center"
          onClick={closeFullscreenGallery}
          onMouseMove={handleMouseMove}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close button - with auto-hide */}
            <button
              onClick={closeFullscreenGallery}
              className={`absolute top-4 right-4 bg-black bg-opacity-40 hover:bg-opacity-70 text-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                showControls ? 'opacity-80 hover:opacity-100' : 'opacity-0'
              }`}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Download button - with auto-hide */}
            <button
              onClick={() => downloadImageWithWatermark(photos[fullscreenImageIndex], fullscreenImageIndex)}
              className={`absolute top-4 right-16 bg-black bg-opacity-40 hover:bg-opacity-70 text-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                showControls ? 'opacity-80 hover:opacity-100' : 'opacity-0'
              }`}
              title="Download with watermark"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Navigation arrows for fullscreen - with auto-hide */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFullscreenPrevious()
                    resetControlsTimeout()
                  }}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                    showControls ? 'opacity-70 hover:opacity-100' : 'opacity-0'
                  }`}
                  title="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFullscreenNext()
                    resetControlsTimeout()
                  }}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                    showControls ? 'opacity-70 hover:opacity-100' : 'opacity-0'
                  }`}
                  title="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image counter - with auto-hide */}
            {photos.length > 1 && (
              <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1.5 rounded-xl text-sm font-medium backdrop-blur-sm z-10 transition-all duration-300 ${
                showControls ? 'opacity-80' : 'opacity-0'
              }`}>
                <span>{fullscreenImageIndex + 1}</span> / <span>{photos.length}</span>
              </div>
            )}

            {/* Pet info overlay - with auto-hide */}
            <div className={`absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-xl backdrop-blur-sm z-10 max-w-xs transition-all duration-300 ${
              showControls ? 'opacity-80' : 'opacity-0'
            }`}>
              <h3 className="text-lg font-bold mb-1">{petInfo?.name}</h3>
              <p className="text-gray-300 text-xs">{petInfo?.breed} • {Math.floor((petInfo?.age || 0) / 12)} years old</p>
              {petInfo?.description && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{petInfo.description}</p>
              )}
            </div>

            {/* Main fullscreen image */}
            <img
              src={photos[fullscreenImageIndex]}
              alt={`${petInfo?.name} photo ${fullscreenImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
              onLoad={() => {
                // Optional: Add loading state management here
              }}
            />
          </div>
        </div>
      )}

    </>
  )
}

export default PetDisplayPage