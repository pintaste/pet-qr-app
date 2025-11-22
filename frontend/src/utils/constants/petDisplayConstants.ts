/**
 * Constants for the PetDisplayPage and related components.
 * Centralizes configuration values for location features, gallery controls,
 * and place type mappings.
 */

import { ElementType } from 'react'
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

/**
 * Location-related constants for geolocation and map features.
 */
export const LOCATION_CONSTANTS: {
  GEOLOCATION_TIMEOUT: number
  API_TIMEOUT: number
  SEARCH_RADIUS: number
  DEFAULT_ZOOM: number
  SELECTED_ZOOM: number
  MAX_PLACES: number
  INITIAL_DISPLAY_COUNT: number
  TEST_MODE_DELAY: number
  MODAL_OPEN_DELAY: number
} = {
  /** Timeout for geolocation request in milliseconds */
  GEOLOCATION_TIMEOUT: 10000,
  /** Timeout for Overpass API request in seconds */
  API_TIMEOUT: 25,
  /** Search radius for nearby places in meters */
  SEARCH_RADIUS: 2000,
  /** Default map zoom level showing area overview */
  DEFAULT_ZOOM: 15,
  /** Zoomed-in level when a specific location is selected */
  SELECTED_ZOOM: 17,
  /** Maximum number of places to fetch from API */
  MAX_PLACES: 6,
  /** Initial number of places to display */
  INITIAL_DISPLAY_COUNT: 6,
  /** Simulated delay for test mode location in milliseconds */
  TEST_MODE_DELAY: 300,
  /** Delay before opening location modal in milliseconds */
  MODAL_OPEN_DELAY: 50
}

/**
 * Gallery control constants for fullscreen image viewer.
 */
export const GALLERY_CONSTANTS = {
  /** Timeout before hiding controls in milliseconds */
  CONTROLS_HIDE_TIMEOUT: 3000,
  /** Z-index for fullscreen overlay */
  FULLSCREEN_Z_INDEX: 50,
  /** Z-index for gallery controls */
  CONTROLS_Z_INDEX: 10,
  /** Image quality for downloaded JPEG (0-1) */
  DOWNLOAD_QUALITY: 0.9
} as const

/**
 * Test location for development and testing purposes.
 * Coordinates: Burnaby, BC (near SFU)
 */
export const TEST_LOCATION = {
  /** Latitude of test location */
  lat: 49.2488,
  /** Longitude of test location */
  lng: -122.9805,
  /** Human-readable description */
  description: 'Burnaby, BC (8888 University Dr W, Burnaby, BC V5A 1S6, Canada)'
} as const

/**
 * Mapping of place types to their corresponding Lucide icon components.
 * Used to display appropriate icons for different establishment types.
 */
export const PLACE_TYPE_ICONS: { [key: string]: ElementType } = {
  // Educational institutions
  school: School,
  university: School,
  college: School,

  // Shopping
  shopping_mall: ShoppingBag,
  mall: ShoppingBag,
  supermarket: ShoppingBag,
  department_store: ShoppingBag,

  // Food & Beverage
  cafe: Coffee,
  restaurant: Coffee,
  fast_food: Coffee,

  // Public services
  bank: Building2,
  post_office: Building2,
  police: Shield,

  // Healthcare
  hospital: Cross,
  pharmacy: Cross,

  // Culture & Recreation
  library: BookOpen,
  park: TreePine,
  playground: TreePine
} as const

/**
 * Default icon for places without a specific type mapping.
 */
export const DEFAULT_PLACE_ICON = MapPin

/**
 * Get the appropriate icon component for a place type.
 * Falls back to MapPin if type is not recognized.
 *
 * @param type - The place type string (e.g., 'cafe', 'park', 'library')
 * @returns React element type for the icon
 */
export const getPlaceTypeIcon = (type: string): ElementType => {
  return PLACE_TYPE_ICONS[type] || DEFAULT_PLACE_ICON
}

/**
 * Amenity types to search for in Overpass API queries.
 * These represent safe public meeting locations.
 */
export const SEARCHABLE_AMENITY_TYPES = [
  'school',
  'university',
  'college',
  'shopping_mall',
  'cafe',
  'restaurant',
  'fast_food',
  'bank',
  'hospital',
  'pharmacy',
  'library',
  'post_office',
  'police'
] as const

/**
 * Leisure types to search for in Overpass API queries.
 */
export const SEARCHABLE_LEISURE_TYPES = ['park', 'playground'] as const

/**
 * Shop types to search for in Overpass API queries.
 */
export const SEARCHABLE_SHOP_TYPES = [
  'mall',
  'supermarket',
  'department_store'
] as const

/**
 * Earth radius in meters for distance calculations.
 */
export const EARTH_RADIUS_METERS = 6371e3
