import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import { useQRAccessStore } from '@/stores/qrAccessStore'
import { useSecurityStore } from '@/stores/securityStore'
import { useSecurityMonitorStore, SUSPICIOUS_ACTIVITY_TYPES } from '@/stores/securityMonitorStore'
import { authService } from '@/services/authService'
import { Heart, Trash2, RefreshCw, Shield, Download, Globe, ChevronLeft, ChevronRight, X, Maximize2, Phone, Mail, MessageCircle, Stethoscope, Tag, AlertTriangle, ChevronDown, ChevronUp, MapPin, School, ShoppingBag, Coffee, TreePine, Building2, Cross, BookOpen } from 'lucide-react'

// Lazy load the map component to avoid Leaflet initialization issues
const LocationMapModal = lazy(() => import('@/components/LocationMapModal').then(module => ({ default: module.LocationMapModal })))

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

  // Extended Profile Information
  markings?: string
  owner_name?: string
  secondary_phone?: string
  owner_email?: string
  location_area?: string
  special_message?: string
  temperament?: string
  weight?: string
  microchip_id?: string
  spayed_neutered?: string
  medical_conditions?: string
  medications?: string
  veterinarian?: string
  vet_clinic?: string
  vet_address?: string
  emergency_vet?: string
  birthday?: string
  collar_description?: string
  vaccinations?: string
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
  const [controlsTimeout, setControlsTimeout] = useState<number | null>(null)
  const [showDetailedInfo, setShowDetailedInfo] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [userCurrentLocation, setUserCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, name?: string, address?: string} | null>(null)
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string>('')
  const [fetchingAddress, setFetchingAddress] = useState(false)
  const [showExpandedView, setShowExpandedView] = useState(true) // Toggle for showing/hiding unselected elements
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [displayedPlacesCount, setDisplayedPlacesCount] = useState(6) // Show 6 places initially
  const [loadingMorePlaces, setLoadingMorePlaces] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
  const [mapZoom, setMapZoom] = useState(15)

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
        last_known_location: petData.last_known_location,

        // Extended Profile Information - Mock Data
        markings: 'White patch on chest, small scar on left ear',
        owner_name: 'Sarah',
        secondary_phone: '+1 (555) 987-6543',
        owner_email: 'sarah.j@email.com',
        location_area: 'Downtown District',
        special_message: 'If you find Max, please call me immediately. He\'s very friendly but can get anxious without his family. Thank you for helping bring him home!',
        temperament: 'Friendly, energetic, good with children and other dogs',
        weight: '65 lbs (29.5 kg)',
        microchip_id: '982000123456789',
        spayed_neutered: 'Neutered',
        medical_conditions: 'Mild hip dysplasia - needs daily medication',
        medications: 'Glucosamine supplements daily',
        veterinarian: 'Dr. Sarah Johnson',
        vet_clinic: 'Happy Pets Clinic',
        vet_address: '123 Main St, Downtown',
        emergency_vet: '(555) 911-PETS - Downtown Animal Hospital',
        birthday: 'March 15, 2021',
        collar_description: 'Blue leather collar with silver tags',
        vaccinations: 'DHPP (Annual), Rabies (Valid until 2026), Bordetella (Updated 2024)'
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

  const handleContactOwner = () => {
    setShowContactModal(true)
  }

  const handlePhoneCall = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`)
    }
  }

  const handleSMS = (phone: string) => {
    if (phone && petInfo?.name) {
      const message = encodeURIComponent(`Hi! I found ${petInfo.name}. Please let me know how I can help get them back to you safely.`)
      window.open(`sms:${phone}?body=${message}`)
    }
  }

  const handleShareLocation = () => {
    console.log('handleShareLocation called')

    // 测试模式：使用 Burnaby, BC 的坐标 (8888 University Dr W, Burnaby, BC V5A 1S6, Canada)
    const TEST_MODE = true // 设置为 false 使用真实位置

    if (TEST_MODE) {
      console.log('Using TEST_MODE for location')
      setLocationStatus('requesting')

      // 模拟异步位置获取
      setTimeout(async () => {
        try {
          console.log('Setting test location...')
          const testLocation = { lat: 49.2488, lng: -122.9805 } // Burnaby, BC 坐标

          console.log('Fetching nearby places...')
          // 获取附近的公共场所
          await fetchNearbyPlaces(testLocation.lat, testLocation.lng)

          // Set all states together after async operation completes
          console.log('All data fetched, updating states...')
          setLocationStatus('granted')
          setUserCurrentLocation(testLocation)
          setDisplayedPlacesCount(6) // Reset to show 6 places initially

          // Use setTimeout to ensure state updates have been processed
          setTimeout(() => {
            console.log('Opening location modal...')
            console.log('userCurrentLocation should be:', testLocation)
            setShowLocationModal(true)
            console.log('showLocationModal set to true')
          }, 50)
        } catch (error) {
          console.error('Error in test mode location sharing:', error)
          setLocationStatus('denied')
          alert('获取附近地点时出错，请稍后重试。')
        }
      }, 300) // 模拟 0.3 秒的加载时间 - 提供即时反馈

      return
    }

    // 生产模式：使用真实地理位置
    if (!navigator.geolocation) {
      alert('需要获取您的位置来推荐附近的安全交易地点。')
      return
    }

    setLocationStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // 获取附近的公共场所
        await fetchNearbyPlaces(latitude, longitude)

        // Set all states together after async operation completes
        setLocationStatus('granted')
        setUserCurrentLocation({ lat: latitude, lng: longitude })
        setDisplayedPlacesCount(6) // Reset to show 6 places initially

        // Use setTimeout to ensure state updates have been processed
        setTimeout(() => {
          setShowLocationModal(true)
        }, 50)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus('denied')

        let errorMessage = '无法获取您的位置。'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += '请允许位置访问以推荐附近的安全地点。'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += '位置信息不可用。'
            break
          case error.TIMEOUT:
            errorMessage += '位置请求超时。'
            break
          default:
            errorMessage += '发生未知错误。'
            break
        }
        alert(errorMessage)
      }
    )
  }

  const handleSendLocationViaSMS = () => {
    if (!selectedLocation) return

    const locationName = selectedLocation.name || '指定地点'
    const locationMessage = `我发现了${petInfo?.name}！建议在这里会面取宠物：${locationName} - https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`
    const encodedMessage = encodeURIComponent(locationMessage)

    // Send via primary phone SMS
    if (petInfo?.emergency_contact?.phone) {
      window.open(`sms:${petInfo.emergency_contact.phone}?body=${encodedMessage}`)
    } else if (petInfo?.secondary_phone) {
      window.open(`sms:${petInfo.secondary_phone}?body=${encodedMessage}`)
    }

    setShowLocationModal(false)
    setShowContactModal(false)
    alert('交易地点已通过短信发送！')
  }

  const handleSendLocationViaEmail = () => {
    if (!selectedLocation || !petInfo?.owner_email) return

    const locationName = selectedLocation.name || '指定地点'
    const locationMessage = `我发现了${petInfo.name}！\n\n建议在这个安全的公共场所会面取宠物：\n地点：${locationName}\n地图链接：https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}\n\n期待与您会面！`
    const subject = `发现了 ${petInfo.name} - 建议交易地点`

    window.open(`mailto:${petInfo.owner_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(locationMessage)}`)

    setShowLocationModal(false)
    setShowContactModal(false)
    alert('交易地点已通过邮件发送！')
  }

  // 附近公共场所选择
  const handleSelectNearbyPlace = (place: any) => {
    // If clicking the same place, deselect it
    if (selectedLocation?.name === place.name) {
      setSelectedLocation(null);
      setShowExpandedView(true); // Show other options when deselecting
      // Reset map view to show all places
      if (userCurrentLocation) {
        setMapCenter([userCurrentLocation.lat, userCurrentLocation.lng]);
        setMapZoom(15);
      }
      return;
    }

    setSelectedLocation({
      lat: place.lat,
      lng: place.lng,
      name: place.name
    });
    // Auto-hide other elements when location selected
    setShowExpandedView(false);

    // Zoom in and center map on selected location
    setMapCenter([place.lat, place.lng]);
    setMapZoom(17); // Zoom closer to see the selected location
  }

  // 获取附近的真实公共场所
  const fetchNearbyPlaces = async (lat: number, lng: number) => {
    console.log('fetchNearbyPlaces called with:', { lat, lng })
    setLoadingPlaces(true)

    try {
      // 使用快速模拟数据（生产环境可切换到真实API）
      const USE_MOCK_DATA = true // 设置为true使用模拟数据（快速）

      if (USE_MOCK_DATA) {
        // 立即返回模拟的附近地点数据
        const mockPlaces = [
          {
            name: 'Burnaby Public Library',
            type: 'library',
            lat: lat + 0.005,
            lng: lng + 0.003,
            distance: 600,
            address: '6100 Willingdon Ave, Burnaby, BC',
            icon: BookOpen
          },
          {
            name: 'Starbucks Coffee',
            type: 'cafe',
            lat: lat + 0.008,
            lng: lng - 0.002,
            distance: 900,
            address: '9000 University Crescent, Burnaby, BC',
            icon: Coffee
          },
          {
            name: 'Lougheed Town Centre',
            type: 'shopping_mall',
            lat: lat - 0.003,
            lng: lng + 0.006,
            distance: 800,
            address: '9855 Austin Rd, Burnaby, BC',
            icon: ShoppingBag
          },
          {
            name: 'Central Park',
            type: 'park',
            lat: lat + 0.010,
            lng: lng + 0.008,
            distance: 1400,
            address: '3883 Imperial St, Burnaby, BC',
            icon: TreePine
          },
          {
            name: 'Burnaby Hospital',
            type: 'hospital',
            lat: lat - 0.006,
            lng: lng - 0.004,
            distance: 1100,
            address: '3935 Kincaid St, Burnaby, BC',
            icon: Cross
          },
          {
            name: 'McDonald\'s',
            type: 'fast_food',
            lat: lat + 0.004,
            lng: lng - 0.007,
            distance: 1000,
            address: '4700 Kingsway, Burnaby, BC',
            icon: Coffee
          }
        ].sort((a, b) => a.distance - b.distance)

        console.log('Using mock data, places:', mockPlaces.length)
        setNearbyPlaces(mockPlaces)
        setLoadingPlaces(false)
        return
      }

      // 真实API调用（较慢）
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"~"^(school|university|college|shopping_mall|cafe|restaurant|fast_food|bank|hospital|pharmacy|library|post_office|police)$"](around:2000,${lat},${lng});
          way["amenity"~"^(school|university|college|shopping_mall|cafe|restaurant|fast_food|bank|hospital|pharmacy|library|post_office|police)$"](around:2000,${lat},${lng});
          node["leisure"~"^(park|playground)$"](around:2000,${lat},${lng});
          way["leisure"~"^(park|playground)$"](around:2000,${lat},${lng});
          node["shop"~"^(mall|supermarket|department_store)$"](around:2000,${lat},${lng});
          way["shop"~"^(mall|supermarket|department_store)$"](around:2000,${lat},${lng});
        );
        out center meta;
      `

      console.log('Fetching from Overpass API...')
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain'
        }
      })

      console.log('Overpass API response status:', response.status)
      if (!response.ok) {
        throw new Error(`Failed to fetch nearby places: ${response.status}`)
      }

      const data = await response.json()
      console.log('Overpass API data received, elements:', data.elements?.length || 0)

      // 处理返回的数据
      const places = data.elements
        .filter((element: any) => element.tags && element.tags.name) // 只要有名字的场所
        .map((element: any) => {
          const elementLat = element.lat || element.center?.lat
          const elementLng = element.lon || element.center?.lon

          if (!elementLat || !elementLng) return null

          // 计算距离
          const distance = calculateDistance(lat, lng, elementLat, elementLng)

          // 提取地址信息（符合英语国家格式：street number, street name, city）
          const tags = element.tags
          let address = ''

          // 构建地址字符串 - 英语格式
          const addressParts = []

          // Street number + Street name (e.g., "123 Main Street")
          if (tags['addr:housenumber'] && tags['addr:street']) {
            addressParts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`)
          } else if (tags['addr:street']) {
            addressParts.push(tags['addr:street'])
          }

          // City (e.g., "Vancouver")
          if (tags['addr:city']) {
            addressParts.push(tags['addr:city'])
          }

          // State/Province (e.g., "BC")
          if (tags['addr:state'] || tags['addr:province']) {
            addressParts.push(tags['addr:state'] || tags['addr:province'])
          }

          // 如果没有详细地址，尝试使用其他信息
          if (addressParts.length === 0) {
            if (tags.highway) addressParts.push(tags.highway)
            if (tags.place) addressParts.push(tags.place)
          }

          address = addressParts.length > 0 ? addressParts.join(', ') : ''

          return {
            name: element.tags.name,
            type: element.tags.amenity || element.tags.leisure || element.tags.shop || 'place',
            lat: elementLat,
            lng: elementLng,
            distance: distance,
            address: address,
            icon: getPlaceIcon(element.tags.amenity || element.tags.leisure || element.tags.shop)
          }
        })
        .filter((place: any) => place !== null) // 移除无效数据
        .sort((a: any, b: any) => a.distance - b.distance) // 按距离排序
        .slice(0, 6) // 只取前6个最近的

      setNearbyPlaces(places)
    } catch (error) {
      console.error('Error fetching nearby places:', error)
      // 如果API失败，提供备用的安全地点建议
      const fallbackPlaces = getFallbackSafeLocations(lat, lng)
      setNearbyPlaces(fallbackPlaces)
    } finally {
      setLoadingPlaces(false)
    }
  }

  // 计算两点间距离（单位：米）
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3 // 地球半径（米）
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lng2-lng1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return Math.round(R * c) // 返回米数，四舍五入
  }

  // 根据场所类型返回对应图标
  const getPlaceIcon = (type: string) => {
    const iconComponents: {[key: string]: React.ElementType} = {
      'school': School,
      'university': School,
      'college': School,
      'shopping_mall': ShoppingBag,
      'mall': ShoppingBag,
      'cafe': Coffee,
      'restaurant': Coffee,
      'fast_food': Coffee,
      'bank': Building2,
      'hospital': Cross,
      'pharmacy': Cross,
      'library': BookOpen,
      'post_office': Building2,
      'police': Shield,
      'park': TreePine,
      'playground': TreePine,
      'supermarket': ShoppingBag,
      'department_store': ShoppingBag
    }
    return iconComponents[type] || MapPin
  }

  // 备用安全地点（当API失败时）
  const getFallbackSafeLocations = (currentLat: number, currentLng: number) => {
    return [
      {
        lat: currentLat + 0.005,
        lng: currentLng + 0.003,
        name: '附近公园',
        type: 'park',
        icon: '🏞️',
        distance: 500
      },
      {
        lat: currentLat + 0.008,
        lng: currentLng - 0.002,
        name: '购物中心',
        type: 'shopping_mall',
        icon: '🏬',
        distance: 800
      },
      {
        lat: currentLat - 0.003,
        lng: currentLng + 0.006,
        name: '星巴克咖啡',
        type: 'cafe',
        icon: '☕',
        distance: 300
      },
      {
        lat: currentLat + 0.002,
        lng: currentLng - 0.004,
        name: '地铁站',
        type: 'station',
        icon: '🚇',
        distance: 200
      }
    ]
  }

  // 逆地理编码获取地址
  const fetchAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh-CN,zh,en`
      )
      const data = await response.json()

      if (data && data.display_name) {
        // 处理返回的地址信息，提取主要部分
        const address = data.display_name
        const addressParts = address.split(', ')

        // 尝试获取更简洁的地址信息
        if (data.address) {
          const { road, neighbourhood, suburb, city, state, country } = data.address
          const simplifiedParts = [road, neighbourhood || suburb, city, state]
            .filter(Boolean)
            .slice(0, 3) // 只取前3个有效部分

          if (simplifiedParts.length > 0) {
            return simplifiedParts.join(', ')
          }
        }

        // 如果没有详细地址信息，返回前几个部分
        return addressParts.slice(0, 3).join(', ')
      }

      return '地址获取失败'
    } catch (error) {
      console.error('获取地址失败:', error)
      return '地址获取失败'
    }
  }

  // 加载更多地点
  const handleLoadMorePlaces = async () => {
    setLoadingMorePlaces(true)

    try {
      // 增加显示数量
      const newCount = displayedPlacesCount + 6
      setDisplayedPlacesCount(newCount)

      // 如果当前地点数量不够，尝试获取更多数据
      if (nearbyPlaces.length < newCount && userCurrentLocation) {
        await fetchNearbyPlaces(userCurrentLocation.lat, userCurrentLocation.lng)
      }
    } catch (error) {
      console.error('Error loading more places:', error)
    } finally {
      setLoadingMorePlaces(false)
    }
  }

  const handleEmail = () => {
    if (petInfo?.owner_email && petInfo?.name) {
      window.open(`mailto:${petInfo.owner_email}?subject=Found ${petInfo.name}&body=Hi, I found ${petInfo.name}. Please let me know how I can help get them back to you safely.`)
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
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
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
              onClick={() => setShowDetailedInfo(!showDetailedInfo)}
              className="profile-toggle-btn relative p-2.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all duration-300 hover:scale-110 group flex-shrink-0 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md"
              title={showDetailedInfo ? "Hide detailed information" : "Show detailed information"}
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>

              {/* Toggle icon with animation */}
              <div className="relative z-10 transition-transform duration-300">
                {showDetailedInfo ? (
                  <ChevronUp className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <ChevronDown className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                )}
              </div>

              {/* Subtle pulse effect */}
              <div className="absolute inset-0 rounded-xl border-2 border-indigo-400/20 opacity-0 group-hover:opacity-100 animate-ping"></div>
            </button>
          </div>

          {petInfo.description && (
            <>
              <div className="divider my-5 h-px bg-gray-100 dark:bg-gray-700/50"></div>
              <p className="pet-description text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                {petInfo.description}
              </p>
            </>
          )}

          {/* Detailed Information - Inside Container */}
          {showDetailedInfo && (
            <div className="detailed-info-sections space-y-6 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">

              {/* Special Message Section */}
              {petInfo.special_message && (
                <div className="bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                  <div className="flex items-center mb-4">
                    <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Special Message from Owner</h3>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed mb-4">"{petInfo.special_message}"</p>
                  {petInfo.temperament && (
                    <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Temperament:</span> {petInfo.temperament}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Health Information Section */}
              <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <div className="flex items-center mb-4">
                  <Stethoscope className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Health Information</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    {petInfo.weight && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Weight</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{petInfo.weight}</p>
                      </div>
                    )}
                    {petInfo.spayed_neutered && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Status</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{petInfo.spayed_neutered}</p>
                      </div>
                    )}
                  </div>

                  {petInfo.microchip_id && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Microchip ID</p>
                      <p className="font-medium text-gray-700 dark:text-gray-300 font-mono">{petInfo.microchip_id}</p>
                    </div>
                  )}

                  {petInfo.markings && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Distinctive Markings</p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{petInfo.markings}</p>
                    </div>
                  )}

                  {(petInfo.medical_conditions || petInfo.medications) && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">Medical Alert</span>
                      </div>
                      {petInfo.medical_conditions && (
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <span className="font-medium">Conditions:</span> {petInfo.medical_conditions}
                        </p>
                      )}
                      {petInfo.medications && (
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                          <span className="font-medium">Medications:</span> {petInfo.medications}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Veterinary Care Section */}
              {(petInfo.veterinarian || petInfo.emergency_vet) && (
                <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <div className="flex items-center mb-4">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Veterinary Care</h3>
                  </div>

                  <div className="space-y-4">
                    {petInfo.veterinarian && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Primary Veterinarian</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{petInfo.veterinarian}</p>
                        {petInfo.vet_clinic && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{petInfo.vet_clinic}</p>
                        )}
                        {petInfo.vet_address && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{petInfo.vet_address}</p>
                        )}
                      </div>
                    )}

                    {petInfo.emergency_vet && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-500">24/7 Emergency</p>
                        <p className="font-medium text-purple-600 dark:text-purple-400">{petInfo.emergency_vet}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Details Section */}
              {(petInfo.birthday || petInfo.collar_description || petInfo.vaccinations) && (
                <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <div className="flex items-center mb-4">
                    <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Details</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {petInfo.birthday && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-500">Birthday</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{petInfo.birthday}</p>
                        </div>
                      )}

                      {petInfo.collar_description && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-500">Collar Description</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{petInfo.collar_description}</p>
                        </div>
                      )}

                      {petInfo.vaccinations && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-500">Vaccinations</p>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{petInfo.vaccinations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Action Buttons - Enhanced Layout */}
      <div className="action-buttons grid gap-4 mt-6 grid-cols-3">
        {(petInfo.emergency_contact?.phone || true) && (
          <button
            onClick={handleContactOwner}
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
        )}

        <button
          onClick={() => {
            console.log('分享位置 button clicked!')
            console.log('locationStatus:', locationStatus)
            handleShareLocation()
          }}
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
                {locationStatus === 'requesting' ? '获取位置...' : '分享位置'}
              </span>
              <span className={`text-xs transition-colors duration-300 ${
                locationStatus === 'requesting'
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-orange-500 dark:group-hover:text-orange-300'
              }`}>
                {locationStatus === 'requesting' ? '请稍等' : '发送位置'}
              </span>
            </div>
          </div>
        </button>

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

      {/* Contact Owner Modal - Responsive Design */}
      {showContactModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-end justify-center md:items-center"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className={`bg-white dark:bg-gray-800 w-full max-w-[420px] md:max-w-md shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-out overflow-hidden
              ${showContactModal ? 'translate-y-0 md:scale-100' : 'translate-y-full md:scale-95'}
              rounded-t-2xl md:rounded-3xl
              max-h-[85vh] md:max-h-[90vh]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle - Mobile Only */}
            <div className="flex justify-center py-2 md:hidden">
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-6 pb-3 md:pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent md:text-xl">
                    联系 {petInfo?.owner_name || '主人'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {petInfo?.location_area && `位置: ${petInfo.location_area}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-6 pb-4">
              {/* Primary Contact Methods - Grid Layout */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Emergency Call */}
                {(petInfo?.emergency_contact?.phone || petInfo?.emergency_contact) && (
                  <button
                    onClick={() => {
                      handlePhoneCall(petInfo?.emergency_contact?.phone || '+1 (555) 123-4567')
                      setShowContactModal(false)
                    }}
                    className="bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl p-4 flex flex-col items-center space-y-3 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 h-24"
                  >
                    <div className="text-red-500 dark:text-red-400">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">紧急呼叫</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">立即联系</p>
                    </div>
                  </button>
                )}

                {/* SMS */}
                {(petInfo?.emergency_contact?.phone || petInfo?.emergency_contact) && (
                  <button
                    onClick={() => {
                      handleSMS(petInfo?.emergency_contact?.phone || '+1 (555) 123-4567')
                      setShowContactModal(false)
                    }}
                    className="bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl p-4 flex flex-col items-center space-y-3 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 h-24"
                  >
                    <div className="text-green-500 dark:text-green-400">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">发送短信</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">文字联系</p>
                    </div>
                  </button>
                )}

                {/* Email */}
                {petInfo?.owner_email && (
                  <button
                    onClick={() => {
                      handleEmail()
                      setShowContactModal(false)
                    }}
                    className="bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl p-4 flex flex-col items-center space-y-3 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 h-24"
                  >
                    <div className="text-blue-500 dark:text-blue-400">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">发送邮件</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">详细信息</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Secondary Phone (if exists) */}
              {petInfo?.secondary_phone && (
                <>
                  <div className="h-px bg-gray-100 dark:bg-gray-700/50 my-4"></div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">备用联系方式</p>
                    <div className="flex items-center justify-between">
                      <p className="text-base font-medium text-gray-900 dark:text-white">{petInfo.secondary_phone}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            handlePhoneCall(petInfo.secondary_phone || '')
                            setShowContactModal(false)
                          }}
                          className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            handleSMS(petInfo.secondary_phone || '')
                            setShowContactModal(false)
                          }}
                          className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Safety Note */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200/50 dark:border-amber-700/50">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <span className="font-medium">紧急情况请直接呼叫</span>，非紧急情况建议短信或邮件联系
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Selection Modal - Responsive Design */}
      {showLocationModal && userCurrentLocation && userCurrentLocation.lat && userCurrentLocation.lng && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end justify-center md:items-center"
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className={`bg-white dark:bg-gray-800 w-full max-w-[420px] md:max-w-lg shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-out overflow-hidden
              ${showLocationModal ? 'translate-y-0 md:scale-100' : 'translate-y-full md:scale-95'}
              rounded-t-2xl md:rounded-3xl
              max-h-[85vh] md:max-h-[90vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle - Mobile Only */}
            <div className="flex justify-center py-2 md:hidden">
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-6 pb-3 md:pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent md:text-xl">
                    选择您要共享的位置
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    为了您的安全，建议选择公共场所
                  </p>
                </div>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

            </div>

            {/* Map Container - Top */}
            <div className="px-6 pb-4">
              <Suspense fallback={<div className="bg-gray-100 dark:bg-gray-700 rounded-2xl h-48 md:h-60 flex items-center justify-center">
                <p className="text-gray-500">加载地图中...</p>
              </div>}>
                <LocationMapModal
                  userCurrentLocation={userCurrentLocation}
                  selectedLocation={selectedLocation}
                  nearbyPlaces={nearbyPlaces}
                  mapCenter={mapCenter}
                  mapZoom={mapZoom}
                  onSelectNearbyPlace={handleSelectNearbyPlace}
                />
              </Suspense>

              {/* Get Current Location Button */}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  console.log('获取我的位置 button clicked');

                  // If current location is already selected, deselect it
                  if (selectedLocation?.name === '我的当前位置') {
                    setSelectedLocation(null);
                    setShowExpandedView(true); // Show other options when deselecting
                    // Reset map view
                    setMapCenter([userCurrentLocation.lat, userCurrentLocation.lng]);
                    setMapZoom(15);
                    return;
                  }

                  // 设置加载状态
                  setFetchingAddress(true);

                  try {
                    // 获取地址信息
                    const address = await fetchAddressFromCoordinates(
                      userCurrentLocation.lat,
                      userCurrentLocation.lng
                    );

                    const newLocation = {
                      lat: userCurrentLocation.lat,
                      lng: userCurrentLocation.lng,
                      name: '我的当前位置',
                      address: address
                    };
                    console.log('Setting selected location with address:', newLocation);
                    setSelectedLocation(newLocation);
                    setCurrentLocationAddress(address);
                    // Auto-hide other elements when location selected
                    setShowExpandedView(false);
                    // Zoom in on current location
                    setMapCenter([userCurrentLocation.lat, userCurrentLocation.lng]);
                    setMapZoom(17);
                  } catch (error) {
                    console.error('Error fetching address:', error);
                    // 即使地址获取失败，也设置位置
                    const newLocation = {
                      lat: userCurrentLocation.lat,
                      lng: userCurrentLocation.lng,
                      name: '我的当前位置'
                    };
                    setSelectedLocation(newLocation);
                    // Auto-hide other elements when location selected
                    setShowExpandedView(false);
                    // Zoom in on current location
                    setMapCenter([userCurrentLocation.lat, userCurrentLocation.lng]);
                    setMapZoom(17);
                  } finally {
                    setFetchingAddress(false);
                  }
                }}
                className={`w-full mt-3 rounded-xl p-3 flex items-center justify-center space-x-2 transition-all duration-300 border ${
                  selectedLocation?.name === '我的当前位置'
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-600'
                    : 'bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50'
                }`}
              >
                <div className={selectedLocation?.name === '我的当前位置'
                  ? "text-green-600 dark:text-green-400"
                  : "text-blue-500 dark:text-blue-400"}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {fetchingAddress ? '获取地址中...' :
                     selectedLocation?.name === '我的当前位置' ? '我的当前位置' : '获取我的位置'}
                  </span>
                  {selectedLocation?.name === '我的当前位置' && selectedLocation.address && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {selectedLocation.address} • 点击取消选择
                    </p>
                  )}
                  {selectedLocation?.name === '我的当前位置' && !selectedLocation.address && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      点击取消选择
                    </p>
                  )}
                </div>
                {fetchingAddress && (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                )}
                {selectedLocation?.name === '我的当前位置' && !fetchingAddress && (
                  <div className="text-green-600 dark:text-green-400">
                    ✓
                  </div>
                )}
              </button>
            </div>

            {/* Content Below Map - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Selected Location Display - Show when collapsed and location is selected */}
              {selectedLocation && !showExpandedView && selectedLocation.name !== '我的当前位置' && (
                <div className="px-6 pb-3">
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                      setShowExpandedView(true);
                      // Zoom out when deselecting
                      if (userCurrentLocation) {
                        setMapCenter([userCurrentLocation.lat, userCurrentLocation.lng]);
                        setMapZoom(15);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-600 rounded-xl p-3 mb-3 hover:from-green-200 hover:to-emerald-200 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-green-600 dark:text-green-400">
                        {(() => {
                          const nearbyPlace = nearbyPlaces.find(p => p.name === selectedLocation.name);
                          if (nearbyPlace && nearbyPlace.icon) {
                            const IconComponent = nearbyPlace.icon;
                            return <IconComponent className="w-5 h-5" />;
                          }
                          return <MapPin className="w-5 h-5" />;
                        })()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">已选择：{selectedLocation.name}</p>
                        {(() => {
                          const nearbyPlace = nearbyPlaces.find(p => p.name === selectedLocation.name);
                          if (nearbyPlace) {
                            return (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {nearbyPlace.distance < 1000 ? `${nearbyPlace.distance}米` : `${(nearbyPlace.distance/1000).toFixed(1)}公里`}
                                {nearbyPlace.address && ` • ${nearbyPlace.address}`}
                                {' • 点击取消选择'}
                              </p>
                            );
                          }
                          return (
                            <p className="text-xs text-gray-600 dark:text-gray-400">点击取消选择</p>
                          );
                        })()}
                      </div>
                      <div className="text-green-600 dark:text-green-400">
                        ✓
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Toggle Button for expanding/collapsing other options */}
              {selectedLocation && !showExpandedView && (
                <div className="px-6 pb-3">
                  <button
                    onClick={() => {
                      // Deselect any selected location when viewing other options
                      setSelectedLocation(null);
                      setShowExpandedView(true);
                      // Zoom out when deselecting
                      if (userCurrentLocation) {
                        setMapCenter([userCurrentLocation.lat, userCurrentLocation.lng]);
                        setMapZoom(15);
                      }
                    }}
                    className="w-full bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl p-3 flex items-center justify-center space-x-2 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">查看其他地点选项</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}

              {/* Collapsible content - Safety Warning and Places List */}
              {showExpandedView && (
                <>
                  {/* Safety Warning */}
                  <div className="px-6 pb-3">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200/50 dark:border-amber-700/50">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          建议选择有监控、人流量大的公共场所，避免暴露住址
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Places List */}
                  <div className="px-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">附近安全地点</h4>
                      <div className="flex items-center space-x-2">
                        {loadingPlaces && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
                            <span>搜索中...</span>
                          </div>
                        )}
                        {selectedLocation && (
                          <button
                            onClick={() => setShowExpandedView(false)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {!loadingPlaces && nearbyPlaces.length === 0 && (
                      <div className="text-center py-6">
                        <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">未找到附近的公共场所</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">请稍后重试或手动选择地点</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 mb-4">
                      {nearbyPlaces.slice(0, displayedPlacesCount).map((place, index) => {
                        const IconComponent = place.icon
                        return (
                          <button
                            key={index}
                            onClick={() => handleSelectNearbyPlace(place)}
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 text-left ${
                              selectedLocation?.name === place.name
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-600'
                                : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${
                              selectedLocation?.name === place.name
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{place.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {place.distance < 1000 ? `${place.distance}米` : `${(place.distance/1000).toFixed(1)}公里`}
                                {place.address && ` • ${place.address}`}
                              </p>
                            </div>
                            {selectedLocation?.name === place.name && (
                              <div className="text-green-600 dark:text-green-400">
                                ✓
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Load More Button */}
                    {nearbyPlaces.length > displayedPlacesCount && (
                      <div className="flex justify-center mb-4">
                        <button
                          onClick={handleLoadMorePlaces}
                          disabled={loadingMorePlaces}
                          className="px-4 py-2 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {loadingMorePlaces ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                              <span>加载中...</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              <span>加载更多地点 ({nearbyPlaces.length - displayedPlacesCount}+)</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Show all locations message */}
                    {nearbyPlaces.length > 0 && nearbyPlaces.length <= displayedPlacesCount && displayedPlacesCount > 6 && (
                      <div className="text-center mb-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          已显示全部 {nearbyPlaces.length} 个地点
                        </p>
                      </div>
                    )}
                  </div>

                </>
              )}

              {/* Gradient hint for scroll content */}
              {selectedLocation && (
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
              )}
            </div>

            {/* Fixed Bottom Share Buttons - Show when location is selected */}
            {selectedLocation && (
              <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800 px-6 py-4">
                <div className="grid grid-cols-1 gap-3 mb-3">
                  {/* SMS Option */}
                  {(petInfo?.emergency_contact?.phone || petInfo?.secondary_phone) && (
                    <button
                      onClick={handleSendLocationViaSMS}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl p-4 flex items-center space-x-4 hover:scale-[1.03] hover:shadow-lg transition-all duration-300 shadow-sm"
                    >
                      <div className="p-2.5 bg-white/20 rounded-xl">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold">发送交易地点</p>
                        <p className="text-xs opacity-90">
                          通过短信发送给 {petInfo?.emergency_contact?.phone || petInfo?.secondary_phone}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Email Option */}
                  {petInfo?.owner_email && (
                    <button
                      onClick={handleSendLocationViaEmail}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl p-4 flex items-center space-x-4 hover:scale-[1.03] hover:shadow-lg transition-all duration-300 shadow-sm"
                    >
                      <div className="p-2.5 bg-white/20 rounded-xl">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold">发送交易地点</p>
                        <p className="text-xs opacity-90">
                          通过邮件发送给 {petInfo.owner_email}
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Final Safety Note */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-200/50 dark:border-green-700/50 text-center">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    <span className="font-medium">即将发送安全交易地点：{selectedLocation.name}</span>
                    {selectedLocation.address && (
                      <span className="block mt-1 text-green-700 dark:text-green-300">
                        {selectedLocation.address}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PetDisplayPage
