/**
 * Custom hook for managing nearby places state and Overpass API queries.
 * Handles fetching, displaying, and selecting public meeting locations.
 */

import { useState, useCallback, ElementType } from 'react'
import {
  School,
  ShoppingBag,
  Coffee,
  Building2,
  Cross,
  BookOpen,
  Shield,
  TreePine,
  MapPin
} from 'lucide-react'
import type {
  NearbyPlace,
  SelectedLocation,
  UseNearbyPlacesReturn,
  UseNearbyPlacesConfig,
  OverpassElement
} from '@/types/petDisplay.types'
import { LOCATION_CONSTANTS } from '@/utils/constants/petDisplayConstants'

/**
 * Hook for managing nearby places functionality.
 *
 * Provides:
 * - Fetching nearby places from Overpass API
 * - Place selection and deselection
 * - Location sharing via SMS/Email
 * - Distance calculations
 * - Place icon mapping
 *
 * @param config - Configuration object with dependencies
 * @returns {UseNearbyPlacesReturn} Nearby places state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   nearbyPlaces,
 *   loadingPlaces,
 *   fetchNearbyPlaces,
 *   handleSelectNearbyPlace,
 *   handleSendLocationViaSMS
 * } = useNearbyPlaces({
 *   petInfo,
 *   userCurrentLocation,
 *   setMapCenter,
 *   setMapZoom,
 *   setShowLocationModal
 * })
 * ```
 */
export function useNearbyPlaces(config: UseNearbyPlacesConfig): UseNearbyPlacesReturn {
  const {
    petInfo,
    userCurrentLocation,
    setMapCenter,
    setMapZoom,
    setShowLocationModal,
    setShowContactModal
  } = config

  // Nearby places states
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [loadingMorePlaces, setLoadingMorePlaces] = useState(false)
  const [displayedPlacesCount, setDisplayedPlacesCount] = useState(LOCATION_CONSTANTS.INITIAL_DISPLAY_COUNT)
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [showExpandedView, setShowExpandedView] = useState(true)

  /** Earth radius in meters for distance calculations */
  const EARTH_RADIUS_METERS = 6371e3

  /**
   * Calculates distance between two geographic coordinates using Haversine formula.
   *
   * @param lat1 - Latitude of first point
   * @param lng1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lng2 - Longitude of second point
   * @returns Distance in meters, rounded to nearest integer
   */
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = EARTH_RADIUS_METERS
    const phi1 = lat1 * Math.PI / 180
    const phi2 = lat2 * Math.PI / 180
    const deltaPhi = (lat2 - lat1) * Math.PI / 180
    const deltaLambda = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return Math.round(R * c) // Return meters, rounded
  }, [])

  /**
   * Gets the appropriate icon component for a place type.
   *
   * @param type - Place type string (e.g., 'cafe', 'park', 'library')
   * @returns Icon component for the place type
   */
  const getPlaceIcon = useCallback((type: string): ElementType => {
    const iconMap: { [key: string]: ElementType } = {
      school: School,
      university: School,
      college: School,
      shopping_mall: ShoppingBag,
      mall: ShoppingBag,
      cafe: Coffee,
      restaurant: Coffee,
      fast_food: Coffee,
      bank: Building2,
      hospital: Cross,
      pharmacy: Cross,
      library: BookOpen,
      post_office: Building2,
      police: Shield,
      park: TreePine,
      playground: TreePine,
      supermarket: ShoppingBag,
      department_store: ShoppingBag
    }
    return iconMap[type] || MapPin
  }, [])

  /**
   * Gets fallback safe locations when API fails.
   *
   * @param currentLat - User's current latitude
   * @param currentLng - User's current longitude
   * @returns Array of generic safe locations
   */
  const getFallbackSafeLocations = useCallback((currentLat: number, currentLng: number): NearbyPlace[] => {
    return [
      {
        lat: currentLat + 0.005,
        lng: currentLng + 0.003,
        name: 'Nearby Park',
        type: 'park',
        icon: TreePine,
        distance: 500,
        address: ''
      },
      {
        lat: currentLat + 0.008,
        lng: currentLng - 0.002,
        name: 'Shopping Center',
        type: 'shopping_mall',
        icon: ShoppingBag,
        distance: 800,
        address: ''
      },
      {
        lat: currentLat - 0.003,
        lng: currentLng + 0.006,
        name: 'Coffee Shop',
        type: 'cafe',
        icon: Coffee,
        distance: 300,
        address: ''
      },
      {
        lat: currentLat + 0.002,
        lng: currentLng - 0.004,
        name: 'Public Library',
        type: 'library',
        icon: BookOpen,
        distance: 200,
        address: ''
      }
    ]
  }, [])

  /**
   * Fetches nearby public places from Overpass API.
   * Falls back to mock data or generic locations on failure.
   *
   * @param lat - User's latitude
   * @param lng - User's longitude
   */
  const fetchNearbyPlaces = useCallback(async (lat: number, lng: number) => {
    console.log('fetchNearbyPlaces called with:', { lat, lng })
    setLoadingPlaces(true)

    try {
      // Use mock data for faster development
      const USE_MOCK_DATA = true

      if (USE_MOCK_DATA) {
        // Return mock nearby places data immediately
        const mockPlaces: NearbyPlace[] = [
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
            name: "McDonald's",
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

      // Real API call (slower)
      const query = `
        [out:json][timeout:${LOCATION_CONSTANTS.API_TIMEOUT}];
        (
          node["amenity"~"^(school|university|college|shopping_mall|cafe|restaurant|fast_food|bank|hospital|pharmacy|library|post_office|police)$"](around:${LOCATION_CONSTANTS.SEARCH_RADIUS},${lat},${lng});
          way["amenity"~"^(school|university|college|shopping_mall|cafe|restaurant|fast_food|bank|hospital|pharmacy|library|post_office|police)$"](around:${LOCATION_CONSTANTS.SEARCH_RADIUS},${lat},${lng});
          node["leisure"~"^(park|playground)$"](around:${LOCATION_CONSTANTS.SEARCH_RADIUS},${lat},${lng});
          way["leisure"~"^(park|playground)$"](around:${LOCATION_CONSTANTS.SEARCH_RADIUS},${lat},${lng});
          node["shop"~"^(mall|supermarket|department_store)$"](around:${LOCATION_CONSTANTS.SEARCH_RADIUS},${lat},${lng});
          way["shop"~"^(mall|supermarket|department_store)$"](around:${LOCATION_CONSTANTS.SEARCH_RADIUS},${lat},${lng});
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

      // Process returned data
      const places: NearbyPlace[] = data.elements
        .filter((element: OverpassElement) => element.tags && element.tags.name)
        .map((element: OverpassElement) => {
          const elementLat = element.lat || element.center?.lat
          const elementLng = element.lon || element.center?.lon

          if (!elementLat || !elementLng) return null

          // Calculate distance
          const distance = calculateDistance(lat, lng, elementLat, elementLng)

          // Extract address info (English format: street number, street name, city)
          const tags = element.tags
          let address = ''

          // Build address string - English format
          const addressParts: string[] = []

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
            addressParts.push(tags['addr:state'] || tags['addr:province'] || '')
          }

          // If no detailed address, try other info
          if (addressParts.length === 0) {
            if (tags.highway) addressParts.push(tags.highway)
            if (tags.place) addressParts.push(tags.place)
          }

          address = addressParts.length > 0 ? addressParts.join(', ') : ''

          return {
            name: element.tags.name || 'Unknown Place',
            type: element.tags.amenity || element.tags.leisure || element.tags.shop || 'place',
            lat: elementLat,
            lng: elementLng,
            distance: distance,
            address: address,
            icon: getPlaceIcon(element.tags.amenity || element.tags.leisure || element.tags.shop || '')
          }
        })
        .filter((place: NearbyPlace | null): place is NearbyPlace => place !== null)
        .sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance)
        .slice(0, LOCATION_CONSTANTS.MAX_PLACES)

      setNearbyPlaces(places)
    } catch (error) {
      console.error('Error fetching nearby places:', error)
      // If API fails, provide fallback safe location suggestions
      const fallbackPlaces = getFallbackSafeLocations(lat, lng)
      setNearbyPlaces(fallbackPlaces)
    } finally {
      setLoadingPlaces(false)
    }
  }, [calculateDistance, getPlaceIcon, getFallbackSafeLocations])

  /**
   * Handles selection of a nearby place as meeting location.
   * Toggles selection if clicking same place again.
   *
   * @param place - The nearby place to select
   */
  const handleSelectNearbyPlace = useCallback((place: NearbyPlace) => {
    // If clicking the same place, deselect it
    if (selectedLocation?.name === place.name) {
      setSelectedLocation(null)
      setShowExpandedView(true) // Show other options when deselecting
      // Reset map view to show all places
      if (userCurrentLocation) {
        setMapCenter([userCurrentLocation.lat, userCurrentLocation.lng])
        setMapZoom(LOCATION_CONSTANTS.DEFAULT_ZOOM)
      }
      return
    }

    setSelectedLocation({
      lat: place.lat,
      lng: place.lng,
      name: place.name
    })
    // Auto-hide other elements when location selected
    setShowExpandedView(false)

    // Zoom in and center map on selected location
    setMapCenter([place.lat, place.lng])
    setMapZoom(LOCATION_CONSTANTS.SELECTED_ZOOM)
  }, [selectedLocation, userCurrentLocation, setMapCenter, setMapZoom])

  /**
   * Loads more places by increasing the displayed count.
   * Fetches additional data if needed.
   */
  const handleLoadMorePlaces = useCallback(async () => {
    setLoadingMorePlaces(true)

    try {
      // Increase display count
      const newCount = displayedPlacesCount + LOCATION_CONSTANTS.INITIAL_DISPLAY_COUNT
      setDisplayedPlacesCount(newCount)

      // If current places count is insufficient, try to fetch more data
      if (nearbyPlaces.length < newCount && userCurrentLocation) {
        await fetchNearbyPlaces(userCurrentLocation.lat, userCurrentLocation.lng)
      }
    } catch (error) {
      console.error('Error loading more places:', error)
    } finally {
      setLoadingMorePlaces(false)
    }
  }, [displayedPlacesCount, nearbyPlaces.length, userCurrentLocation, fetchNearbyPlaces])

  /**
   * Sends selected location via SMS to pet owner.
   */
  const handleSendLocationViaSMS = useCallback(() => {
    if (!selectedLocation) return

    const locationName = selectedLocation.name || 'Designated Location'
    const locationMessage = `I found ${petInfo?.name}! Suggested meeting place for pickup: ${locationName} - https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`
    const encodedMessage = encodeURIComponent(locationMessage)

    // Send via primary phone SMS
    if (petInfo?.emergency_contact?.phone) {
      window.open(`sms:${petInfo.emergency_contact.phone}?body=${encodedMessage}`)
    } else if (petInfo?.secondary_phone) {
      window.open(`sms:${petInfo.secondary_phone}?body=${encodedMessage}`)
    }

    setShowLocationModal(false)
    if (setShowContactModal) {
      setShowContactModal(false)
    }
    alert('Meeting location sent via SMS!')
  }, [selectedLocation, petInfo, setShowLocationModal, setShowContactModal])

  /**
   * Sends selected location via email to pet owner.
   */
  const handleSendLocationViaEmail = useCallback(() => {
    if (!selectedLocation || !petInfo?.owner_email) return

    const locationName = selectedLocation.name || 'Designated Location'
    const locationMessage = `I found ${petInfo.name}!\n\nSuggested safe public meeting place for pickup:\nLocation: ${locationName}\nMap Link: https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}\n\nLooking forward to meeting you!`
    const subject = `Found ${petInfo.name} - Suggested Meeting Location`

    window.open(`mailto:${petInfo.owner_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(locationMessage)}`)

    setShowLocationModal(false)
    if (setShowContactModal) {
      setShowContactModal(false)
    }
    alert('Meeting location sent via email!')
  }, [selectedLocation, petInfo, setShowLocationModal, setShowContactModal])

  return {
    // States
    nearbyPlaces,
    loadingPlaces,
    loadingMorePlaces,
    displayedPlacesCount,
    selectedLocation,
    showExpandedView,

    // Setters
    setNearbyPlaces,
    setLoadingPlaces,
    setLoadingMorePlaces,
    setDisplayedPlacesCount,
    setSelectedLocation,
    setShowExpandedView,

    // Handlers
    fetchNearbyPlaces,
    handleSelectNearbyPlace,
    handleLoadMorePlaces,
    handleSendLocationViaSMS,
    handleSendLocationViaEmail,

    // Helpers
    calculateDistance,
    getPlaceIcon,
    getFallbackSafeLocations
  }
}

export default useNearbyPlaces
