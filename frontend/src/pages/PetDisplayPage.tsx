import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import { useQRAccessStore } from '@/stores/qrAccessStore'
import { useSecurityStore } from '@/stores/securityStore'
import { useSecurityMonitorStore, SUSPICIOUS_ACTIVITY_TYPES } from '@/stores/securityMonitorStore'
import { authService } from '@/services/authService'
import { Heart, Trash2, RefreshCw, Shield, Download, Globe, MessageCircle, Stethoscope, Tag, AlertTriangle, ChevronDown, ChevronUp, MapPin, School, ShoppingBag, Coffee, TreePine, Building2, Cross, BookOpen } from 'lucide-react'
import L from 'leaflet'

// Extracted components
import FullscreenGallery from '@/components/PetDisplay/FullscreenGallery'
import ContactOwnerModal from '@/components/PetDisplay/ContactOwnerModal'
import LocationShareModal from '@/components/PetDisplay/LocationShareModal'
import PetGallery from '@/components/PetDisplay/PetGallery'

// Fix Leaflet marker icons in bundled environment
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

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
  const [showExpandedView, setShowExpandedView] = useState(true) // Toggle for showing/hiding unselected elements
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [displayedPlacesCount, setDisplayedPlacesCount] = useState(6) // Show 6 places initially
  const [loadingMorePlaces, setLoadingMorePlaces] = useState(false)

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
    // 测试模式：使用 Burnaby, BC 的坐标 (8888 University Dr W, Burnaby, BC V5A 1S6, Canada)
    const TEST_MODE = true // 设置为 false 使用真实位置

    if (TEST_MODE) {
      setLocationStatus('requesting')

      // 模拟异步位置获取
      setTimeout(async () => {
        const testLocation = { lat: 49.2488, lng: -122.9805 } // Burnaby, BC 坐标
        setLocationStatus('granted')
        setUserCurrentLocation(testLocation)
        setDisplayedPlacesCount(6) // Reset to show 6 places initially

        // 获取附近的公共场所
        await fetchNearbyPlaces(testLocation.lat, testLocation.lng)

        setShowLocationModal(true)
      }, 1000) // 模拟 1 秒的加载时间

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
        setLocationStatus('granted')
        setUserCurrentLocation({ lat: latitude, lng: longitude })
        setDisplayedPlacesCount(6) // Reset to show 6 places initially

        // 获取附近的公共场所
        await fetchNearbyPlaces(latitude, longitude)

        setShowLocationModal(true)
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
      return;
    }

    setSelectedLocation({
      lat: place.lat,
      lng: place.lng,
      name: place.name
    });
    // Auto-hide other elements when location selected
    setShowExpandedView(false);
  }

  // 获取附近的真实公共场所
  const fetchNearbyPlaces = async (lat: number, lng: number) => {
    setLoadingPlaces(true)
    try {
      // 使用 Google Places API 的近似替代方案
      // 由于没有直接的Google Places API key，我们使用 OpenStreetMap 的 Overpass API
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

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch nearby places')
      }

      const data = await response.json()

      // 处理返回的数据
      const places = data.elements
        .filter((element: any) => element.tags && element.tags.name) // 只要有名字的场所
        .map((element: any) => {
          const elementLat = element.lat || element.center?.lat
          const elementLng = element.lon || element.center?.lon

          if (!elementLat || !elementLng) return null

          // 计算距离
          const distance = calculateDistance(lat, lng, elementLat, elementLng)

          return {
            name: element.tags.name,
            type: element.tags.amenity || element.tags.leisure || element.tags.shop || 'place',
            lat: elementLat,
            lng: elementLng,
            distance: distance,
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
          const { road, neighbourhood, suburb, city, state } = data.address
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

  // Get the QR code for this pet
  const qrCode = getQRCodeForPetId(parseInt(petId!, 10))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      {/* Pet Card - Enhanced Design */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50 mb-8 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600">
        {/* Pet Gallery */}
        <PetGallery
          photos={photos}
          currentIndex={currentImageIndex}
          petName={petInfo.name}
          showControls={showControls}
          onImageClick={setCurrentImageIndex}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
          onOpenFullscreen={openFullscreenGallery}
          onMouseEnter={handleGalleryMouseEnter}
          onMouseLeave={handleGalleryMouseLeave}
        />

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
          onClick={handleLocationShare}
          className="action-btn location-btn h-[120px] bg-white dark:bg-gray-800 rounded-2xl p-3 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-300 group shadow-sm hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50"
        >
          <div className="flex flex-col items-center justify-center space-y-3 h-full pt-5 pb-3">
            <div className="btn-icon p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
      <FullscreenGallery
        isOpen={isFullscreenOpen}
        photos={photos}
        currentIndex={fullscreenImageIndex}
        petInfo={petInfo}
        showControls={showControls}
        onClose={closeFullscreenGallery}
        onPrevious={() => {
          handleFullscreenPrevious()
          resetControlsTimeout()
        }}
        onNext={() => {
          handleFullscreenNext()
          resetControlsTimeout()
        }}
        onDownload={downloadImageWithWatermark}
        onMouseMove={handleMouseMove}
      />

      {/* Contact Owner Modal */}
      <ContactOwnerModal
        isOpen={showContactModal}
        petInfo={petInfo}
        locationStatus={locationStatus}
        onClose={() => setShowContactModal(false)}
        onPhoneCall={handlePhoneCall}
        onSMS={handleSMS}
        onEmail={handleEmail}
        onShareLocation={handleShareLocation}
      />

      {/* Location Selection Modal */}
      <LocationShareModal
        isOpen={showLocationModal}
        userCurrentLocation={userCurrentLocation}
        selectedLocation={selectedLocation}
        nearbyPlaces={nearbyPlaces}
        showExpandedView={showExpandedView}
        loadingPlaces={loadingPlaces}
        displayedPlacesCount={displayedPlacesCount}
        loadingMorePlaces={loadingMorePlaces}
        petInfo={petInfo}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={setSelectedLocation}
        onSelectNearbyPlace={handleSelectNearbyPlace}
        onToggleExpandedView={setShowExpandedView}
        onLoadMorePlaces={handleLoadMorePlaces}
        onSendLocationViaSMS={handleSendLocationViaSMS}
        onSendLocationViaEmail={handleSendLocationViaEmail}
        onFetchAddress={fetchAddressFromCoordinates}
      />
    </div>
  )
}

export default PetDisplayPage
