/**
 * Pet QR System - Shared Package
 *
 * This package contains shared types, validation schemas, and utilities
 * used across the frontend, backend, and other services.
 */

// Export all types
export * from './types'

// Export validation schemas and functions
export * from './validation'

// Export utility functions
export * from './utils'

// Re-export commonly used items for convenience
export {
  // Types
  type Pet,
  type QRCode,
  type Tenant,
  type TenantUser,
  type ScanEvent,
  type ApiResponse,
  type PaginatedResponse,
  type Language,
  type Theme,
} from './types'

export {
  // Validation
  schemas,
  isValidEmail,
  isValidPassword,
  isValidPin,
  isValidQRCode,
} from './validation'

export {
  // Utils
  utils,
  formatDate,
  formatDateTime,
  getPetDisplayName,
  getQRCodeDisplayStatus,
  generatePIN,
} from './utils'