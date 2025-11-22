/**
 * Type definitions for Pet Display page components and hooks.
 * These types are used across the pet display feature for consistent
 * type safety and code organization.
 */

import { ElementType } from 'react'

/**
 * Complete pet information interface for display purposes.
 * Maps API response data to frontend display format.
 */
export interface PetInfo {
  /** Pet's name */
  name: string
  /** Pet's breed */
  breed: string
  /** Pet's age in years */
  age: number
  /** Pet's biological sex */
  sex: string
  /** Pet's size category (small, medium, large, etc.) */
  size: string
  /** Pet's primary color */
  color: string
  /** General description of the pet */
  description: string
  /** Array of personality traits */
  personality_traits: string[]
  /** URL of the pet's profile photo */
  profile_photo_url?: string
  /** Array of additional photo URLs */
  photo_urls: string[]
  /** Basic medical information object */
  basic_medical_info: Record<string, unknown>
  /** Emergency contact information */
  emergency_contact: {
    phone?: string
    email?: string
    [key: string]: unknown
  }
  /** Whether the pet is currently marked as lost */
  is_lost: boolean
  /** Last known location when pet was marked lost */
  last_known_location?: string

  // Extended Profile Information
  /** Distinctive markings or features */
  markings?: string
  /** Owner's name */
  owner_name?: string
  /** Secondary contact phone number */
  secondary_phone?: string
  /** Owner's email address */
  owner_email?: string
  /** General area where pet is located */
  location_area?: string
  /** Special message from owner to finder */
  special_message?: string
  /** Pet's temperament description */
  temperament?: string
  /** Pet's weight */
  weight?: string
  /** Microchip ID number */
  microchip_id?: string
  /** Spayed/neutered status */
  spayed_neutered?: string
  /** Known medical conditions */
  medical_conditions?: string
  /** Current medications */
  medications?: string
  /** Veterinarian's name */
  veterinarian?: string
  /** Vet clinic name */
  vet_clinic?: string
  /** Vet clinic address */
  vet_address?: string
  /** Emergency vet contact */
  emergency_vet?: string
  /** Pet's birthday */
  birthday?: string
  /** Description of collar worn */
  collar_description?: string
  /** Vaccination records */
  vaccinations?: string
}

/**
 * Simple coordinate type for latitude and longitude.
 */
export interface LocationCoords {
  /** Latitude coordinate */
  lat: number
  /** Longitude coordinate */
  lng: number
}

/**
 * Nearby place information for location sharing feature.
 * Represents public meeting locations like cafes, parks, libraries, etc.
 */
export interface NearbyPlace {
  /** Name of the place */
  name: string
  /** Type of establishment (cafe, park, library, etc.) */
  type: string
  /** Latitude coordinate */
  lat: number
  /** Longitude coordinate */
  lng: number
  /** Distance from user's current location in meters */
  distance: number
  /** Street address of the place */
  address: string
  /** React icon component for the place type */
  icon: ElementType
}

/**
 * Selected location with optional name and address.
 * Used when user selects a specific meeting point.
 */
export interface SelectedLocation extends LocationCoords {
  /** Optional name of the location */
  name?: string
  /** Optional street address */
  address?: string
}

/**
 * Status of location permission request.
 * - idle: Initial state, no request made
 * - requesting: Permission dialog shown to user
 * - granted: User allowed location access
 * - denied: User denied location access
 */
export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied'

/**
 * Map center coordinates as a tuple [latitude, longitude].
 * Used with mapping libraries that expect tuple format.
 */
export type MapCenter = [number, number]

/**
 * Return type for the usePetData hook.
 */
export interface UsePetDataReturn {
  /** Current pet information or null if not loaded */
  petInfo: PetInfo | null
  /** Loading state indicator */
  isLoading: boolean
  /** Error message if fetch failed */
  error: string
  /** Function to manually fetch pet information */
  fetchPetInfo: () => Promise<void>
}

/**
 * Parameters for the usePetData hook.
 */
export interface UsePetDataParams {
  /** Pet ID to fetch data for */
  petId: string | undefined
  /** React Router navigate function */
  navigate: (path: string, options?: { replace?: boolean }) => void
}

/**
 * Return type for the useGalleryControls hook.
 */
export interface UseGalleryControlsReturn {
  /** Current image index in the gallery */
  currentImageIndex: number
  /** Whether fullscreen mode is open */
  isFullscreenOpen: boolean
  /** Current image index in fullscreen mode */
  fullscreenImageIndex: number
  /** Whether to show navigation controls */
  showControls: boolean
  /** Navigate to previous image in gallery */
  handlePreviousImage: () => void
  /** Navigate to next image in gallery */
  handleNextImage: () => void
  /** Open fullscreen gallery at specified index */
  openFullscreenGallery: (index: number) => void
  /** Close fullscreen gallery */
  closeFullscreenGallery: () => void
  /** Navigate to previous image in fullscreen */
  handleFullscreenPrevious: () => void
  /** Navigate to next image in fullscreen */
  handleFullscreenNext: () => void
  /** Handler for mouse entering gallery area */
  handleGalleryMouseEnter: () => void
  /** Handler for mouse leaving gallery area */
  handleGalleryMouseLeave: () => void
  /** Handler for mouse movement in fullscreen */
  handleMouseMove: () => void
  /** Set the current image index directly */
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>
}

/**
 * Return type for the useLocationTracking hook.
 */
export interface UseLocationTrackingReturn {
  // States
  /** Current status of location permission */
  locationStatus: LocationStatus
  /** User's current location coordinates */
  userCurrentLocation: LocationCoords | null
  /** Whether location modal is visible */
  showLocationModal: boolean
  /** Formatted address of current location */
  currentLocationAddress: string
  /** Whether address is being fetched */
  fetchingAddress: boolean
  /** Map center coordinates as tuple */
  mapCenter: MapCenter | null
  /** Current map zoom level */
  mapZoom: number

  // Setters
  setLocationStatus: React.Dispatch<React.SetStateAction<LocationStatus>>
  setUserCurrentLocation: React.Dispatch<React.SetStateAction<LocationCoords | null>>
  setShowLocationModal: React.Dispatch<React.SetStateAction<boolean>>
  setCurrentLocationAddress: React.Dispatch<React.SetStateAction<string>>
  setFetchingAddress: React.Dispatch<React.SetStateAction<boolean>>
  setMapCenter: React.Dispatch<React.SetStateAction<MapCenter | null>>
  setMapZoom: React.Dispatch<React.SetStateAction<number>>

  // Handlers
  /** Request location permission and fetch nearby places */
  handleShareLocation: (
    fetchNearbyPlaces: (lat: number, lng: number) => Promise<void>,
    setDisplayedPlacesCount: React.Dispatch<React.SetStateAction<number>>
  ) => void
  /** Reverse geocode coordinates to address string */
  fetchAddressFromCoordinates: (lat: number, lng: number) => Promise<string>
}

/**
 * Return type for the useNearbyPlaces hook.
 */
export interface UseNearbyPlacesReturn {
  // States
  /** Array of nearby places */
  nearbyPlaces: NearbyPlace[]
  /** Whether places are being loaded */
  loadingPlaces: boolean
  /** Whether more places are being loaded */
  loadingMorePlaces: boolean
  /** Number of places currently displayed */
  displayedPlacesCount: number
  /** Currently selected meeting location */
  selectedLocation: SelectedLocation | null
  /** Whether expanded view is shown */
  showExpandedView: boolean

  // Setters
  setNearbyPlaces: React.Dispatch<React.SetStateAction<NearbyPlace[]>>
  setLoadingPlaces: React.Dispatch<React.SetStateAction<boolean>>
  setLoadingMorePlaces: React.Dispatch<React.SetStateAction<boolean>>
  setDisplayedPlacesCount: React.Dispatch<React.SetStateAction<number>>
  setSelectedLocation: React.Dispatch<React.SetStateAction<SelectedLocation | null>>
  setShowExpandedView: React.Dispatch<React.SetStateAction<boolean>>

  // Handlers
  /** Fetch nearby places from Overpass API */
  fetchNearbyPlaces: (lat: number, lng: number) => Promise<void>
  /** Handle selection of a nearby place */
  handleSelectNearbyPlace: (place: NearbyPlace) => void
  /** Load more places */
  handleLoadMorePlaces: () => Promise<void>
  /** Send selected location via SMS */
  handleSendLocationViaSMS: () => void
  /** Send selected location via email */
  handleSendLocationViaEmail: () => void

  // Helpers
  /** Calculate distance between two coordinates in meters */
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
  /** Get appropriate icon for place type */
  getPlaceIcon: (type: string) => ElementType
  /** Get fallback locations when API fails */
  getFallbackSafeLocations: (currentLat: number, currentLng: number) => NearbyPlace[]
}

/**
 * Configuration for useNearbyPlaces hook.
 */
export interface UseNearbyPlacesConfig {
  /** Pet information for sharing messages */
  petInfo: PetInfo | null
  /** User's current location */
  userCurrentLocation: LocationCoords | null
  /** Set map center function */
  setMapCenter: React.Dispatch<React.SetStateAction<MapCenter | null>>
  /** Set map zoom function */
  setMapZoom: React.Dispatch<React.SetStateAction<number>>
  /** Set location modal visibility */
  setShowLocationModal: React.Dispatch<React.SetStateAction<boolean>>
  /** Set contact modal visibility (optional) */
  setShowContactModal?: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * Overpass API element structure.
 */
export interface OverpassElement {
  /** Latitude for nodes */
  lat?: number
  /** Longitude for nodes */
  lon?: number
  /** Center coordinates for ways */
  center?: {
    lat: number
    lon: number
  }
  /** OSM tags */
  tags: {
    name?: string
    amenity?: string
    leisure?: string
    shop?: string
    'addr:housenumber'?: string
    'addr:street'?: string
    'addr:city'?: string
    'addr:state'?: string
    'addr:province'?: string
    highway?: string
    place?: string
  }
}
