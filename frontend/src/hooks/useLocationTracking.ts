/**
 * Custom hook for managing location tracking state and geolocation permissions.
 * Handles requesting location permission, storing user coordinates, and reverse geocoding.
 */

import { useState, useCallback } from 'react'
import type {
  LocationStatus,
  LocationCoords,
  MapCenter,
  UseLocationTrackingReturn
} from '@/types/petDisplay.types'
import {
  LOCATION_CONSTANTS,
  TEST_LOCATION
} from '@/utils/constants/petDisplayConstants'

/**
 * Hook for managing location tracking functionality.
 * 
 * Provides state management for:
 * - Location permission status
 * - User's current coordinates
 * - Map center and zoom level
 * - Address reverse geocoding
 * 
 * @returns {UseLocationTrackingReturn} Location tracking state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   locationStatus,
 *   userCurrentLocation,
 *   handleShareLocation,
 *   fetchAddressFromCoordinates
 * } = useLocationTracking()
 * 
 * // Trigger location sharing with nearby places fetch
 * handleShareLocation(fetchNearbyPlaces, setDisplayedPlacesCount)
 * ```
 */
export function useLocationTracking(): UseLocationTrackingReturn {
  // Location states
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [userCurrentLocation, setUserCurrentLocation] = useState<LocationCoords | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string>('')
  const [fetchingAddress, setFetchingAddress] = useState(false)
  const [mapCenter, setMapCenter] = useState<MapCenter | null>(null)
  const [mapZoom, setMapZoom] = useState(LOCATION_CONSTANTS.DEFAULT_ZOOM)

  /**
   * Fetches address from coordinates using Nominatim reverse geocoding.
   * 
   * @param lat - Latitude coordinate
   * @param lng - Longitude coordinate
   * @returns Promise resolving to formatted address string
   */
  const fetchAddressFromCoordinates = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh-CN,zh,en`
      )
      const data = await response.json()

      if (data && data.display_name) {
        // Process returned address, extract main parts
        const address = data.display_name
        const addressParts = address.split(', ')

        // Try to get simplified address info
        if (data.address) {
          const { road, neighbourhood, suburb, city, state } = data.address
          const simplifiedParts = [road, neighbourhood || suburb, city, state]
            .filter(Boolean)
            .slice(0, 3) // Only take first 3 valid parts

          if (simplifiedParts.length > 0) {
            return simplifiedParts.join(', ')
          }
        }

        // If no detailed address info, return first few parts
        return addressParts.slice(0, 3).join(', ')
      }

      return 'Address retrieval failed'
    } catch (error) {
      console.error('Failed to get address:', error)
      return 'Address retrieval failed'
    }
  }, [])

  /**
   * Handles the location sharing request.
   * In test mode, uses predefined coordinates.
   * In production mode, requests real geolocation permission.
   * 
   * @param fetchNearbyPlaces - Function to fetch nearby places
   * @param setDisplayedPlacesCount - Function to set displayed places count
   */
  const handleShareLocation = useCallback((
    fetchNearbyPlaces: (lat: number, lng: number) => Promise<void>,
    setDisplayedPlacesCount: React.Dispatch<React.SetStateAction<number>>
  ) => {
    console.log('handleShareLocation called')

    // Test mode: use Burnaby, BC coordinates
    const TEST_MODE = true // Set to false for production

    if (TEST_MODE) {
      console.log('Using TEST_MODE for location')
      setLocationStatus('requesting')

      // Simulate async location fetch
      setTimeout(async () => {
        try {
          console.log('Setting test location...')
          const testLocation = { lat: TEST_LOCATION.lat, lng: TEST_LOCATION.lng }

          console.log('Fetching nearby places...')
          // Fetch nearby public places
          await fetchNearbyPlaces(testLocation.lat, testLocation.lng)

          // Set all states together after async operation completes
          console.log('All data fetched, updating states...')
          setLocationStatus('granted')
          setUserCurrentLocation(testLocation)
          setDisplayedPlacesCount(LOCATION_CONSTANTS.INITIAL_DISPLAY_COUNT)

          // Use setTimeout to ensure state updates have been processed
          setTimeout(() => {
            console.log('Opening location modal...')
            console.log('userCurrentLocation should be:', testLocation)
            setShowLocationModal(true)
            console.log('showLocationModal set to true')
          }, LOCATION_CONSTANTS.MODAL_OPEN_DELAY)
        } catch (error) {
          console.error('Error in test mode location sharing:', error)
          setLocationStatus('denied')
          alert('Error fetching nearby places, please try again.')
        }
      }, LOCATION_CONSTANTS.TEST_MODE_DELAY)

      return
    }

    // Production mode: use real geolocation
    if (!navigator.geolocation) {
      alert('Location access is required to recommend nearby safe meeting places.')
      return
    }

    setLocationStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Fetch nearby public places
        await fetchNearbyPlaces(latitude, longitude)

        // Set all states together after async operation completes
        setLocationStatus('granted')
        setUserCurrentLocation({ lat: latitude, lng: longitude })
        setDisplayedPlacesCount(LOCATION_CONSTANTS.INITIAL_DISPLAY_COUNT)

        // Use setTimeout to ensure state updates have been processed
        setTimeout(() => {
          setShowLocationModal(true)
        }, LOCATION_CONSTANTS.MODAL_OPEN_DELAY)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus('denied')

        let errorMessage = 'Unable to get your location. '
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access to recommend nearby safe places.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.'
            break
          default:
            errorMessage += 'An unknown error occurred.'
            break
        }
        alert(errorMessage)
      }
    )
  }, [])

  return {
    // States
    locationStatus,
    userCurrentLocation,
    showLocationModal,
    currentLocationAddress,
    fetchingAddress,
    mapCenter,
    mapZoom,

    // Setters
    setLocationStatus,
    setUserCurrentLocation,
    setShowLocationModal,
    setCurrentLocationAddress,
    setFetchingAddress,
    setMapCenter,
    setMapZoom,

    // Handlers
    handleShareLocation,
    fetchAddressFromCoordinates
  }
}

export default useLocationTracking
