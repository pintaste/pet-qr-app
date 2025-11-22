/**
 * Application Configuration
 *
 * Centralized configuration for all environment-specific and app-wide constants.
 * This file provides a single source of truth for configuration values.
 */

// =============================================================================
// API Configuration
// =============================================================================

/**
 * API endpoint configuration
 */
export const API_CONFIG = {
  /** Base URL for API requests */
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',

  /** API version prefix */
  VERSION: '/api/v1',

  /** Request timeout in milliseconds (5 minutes for large batch operations) */
  TIMEOUT: 300000,

  /** Default port for backend server */
  PORT: 8000,
} as const

/**
 * Get full API endpoint URL
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_CONFIG.BASE_URL}${API_CONFIG.VERSION}${cleanPath}`
}

// =============================================================================
// Pagination Configuration
// =============================================================================

/**
 * Default pagination settings
 */
export const PAGINATION_CONFIG = {
  /** Default items per page */
  DEFAULT_PAGE_SIZE: 20,

  /** QR codes per page options */
  QR_CODES_PER_PAGE: 100,

  /** Tenants per page */
  TENANTS_PER_PAGE: 100,

  /** Users per page */
  USERS_PER_PAGE: 50,

  /** Activity feed items */
  ACTIVITY_ITEMS: 20,

  /** Large fetch limit (for "get all" operations) */
  MAX_FETCH_LIMIT: 1000000,
} as const

// =============================================================================
// Timeout & Delay Configuration
// =============================================================================

/**
 * UI timing constants in milliseconds
 */
export const TIMING_CONFIG = {
  /** Short animation delay */
  ANIMATION_SHORT: 50,

  /** Medium animation delay */
  ANIMATION_MEDIUM: 300,

  /** Modal close delay after success */
  MODAL_CLOSE_DELAY: 500,

  /** Progress bar update interval */
  PROGRESS_UPDATE_INTERVAL: 100,

  /** Gallery controls auto-hide timeout */
  GALLERY_CONTROLS_TIMEOUT: 3000,

  /** Polling interval for bulk operations */
  BULK_OPERATION_POLL_INTERVAL: 1000,

  /** Test mode location delay */
  TEST_LOCATION_DELAY: 300,
} as const

/**
 * API timeout constants in milliseconds
 */
export const API_TIMEOUT_CONFIG = {
  /** Standard API request timeout */
  STANDARD: 30000,

  /** Long-running operation timeout */
  LONG_OPERATION: 300000,

  /** Geolocation request timeout */
  GEOLOCATION: 10000,

  /** Overpass API timeout (seconds) */
  OVERPASS_API_SECONDS: 25,
} as const

// =============================================================================
// Map & Location Configuration
// =============================================================================

/**
 * Map and location related constants
 */
export const LOCATION_CONFIG = {
  /** Search radius for nearby places (meters) */
  SEARCH_RADIUS: 2000,

  /** Default map zoom level */
  DEFAULT_ZOOM: 15,

  /** Zoomed map level when location selected */
  SELECTED_ZOOM: 17,

  /** Maximum places to fetch from API */
  MAX_PLACES_FETCH: 6,

  /** Initial places to display */
  INITIAL_PLACES_DISPLAY: 6,

  /** Earth radius in meters (for Haversine formula) */
  EARTH_RADIUS_METERS: 6371e3,
} as const

/**
 * Test location for development (Burnaby, BC)
 */
export const TEST_LOCATION = {
  lat: 49.2488,
  lng: -122.9805,
  address: '4700 Kingsway, Burnaby, BC V5H 4M1, Canada',
} as const

// =============================================================================
// Validation Configuration
// =============================================================================

/**
 * Input validation limits
 */
export const VALIDATION_CONFIG = {
  /** Pet name length */
  PET_NAME: {
    MIN: 1,
    MAX: 100,
  },

  /** Pet breed length */
  PET_BREED: {
    MIN: 1,
    MAX: 100,
  },

  /** Pet age in months */
  PET_AGE_MONTHS: {
    MIN: 0,
    MAX: 300,
  },

  /** Maximum photos per pet */
  MAX_PET_PHOTOS: 10,
} as const

// =============================================================================
// Image & QR Configuration
// =============================================================================

/**
 * Image and QR code settings
 */
export const IMAGE_CONFIG = {
  /** Default QR code size in pixels */
  QR_CODE_SIZE: 256,

  /** QR code display size in modals */
  QR_MODAL_SIZE: 400,

  /** JPEG download quality (0-1) */
  JPEG_QUALITY: 0.9,
} as const

// =============================================================================
// UI Configuration
// =============================================================================

/**
 * Z-index values for stacking context
 */
export const Z_INDEX_CONFIG = {
  /** Dropdown menus */
  DROPDOWN: 10,

  /** Modal overlays */
  MODAL: 50,

  /** Toast notifications */
  TOAST: 100,
} as const

/**
 * Tier display messages
 */
export const TIER_MESSAGES = {
  STANDARD: 'Up to 100 pets',
  ENTERPRISE: 'Unlimited pets',
} as const

// =============================================================================
// Demo & Test Configuration
// =============================================================================

/**
 * Demo and test values
 */
export const DEMO_CONFIG = {
  /** Demo QR code for testing */
  DEMO_QR_CODE: 'DEMO123',
} as const

// =============================================================================
// Export all configs as single object for convenience
// =============================================================================

export const APP_CONFIG = {
  api: API_CONFIG,
  pagination: PAGINATION_CONFIG,
  timing: TIMING_CONFIG,
  apiTimeout: API_TIMEOUT_CONFIG,
  location: LOCATION_CONFIG,
  testLocation: TEST_LOCATION,
  validation: VALIDATION_CONFIG,
  image: IMAGE_CONFIG,
  zIndex: Z_INDEX_CONFIG,
  tier: TIER_MESSAGES,
  demo: DEMO_CONFIG,
} as const

export default APP_CONFIG
