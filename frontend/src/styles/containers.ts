/**
 * Unified container width configurations for consistent responsive design
 */

export const containerStyles = {
  // Narrow container - For forms, login, verification pages
  // Mobile: full width with padding
  // Desktop: max 448px (Tailwind max-w-md)
  narrow: 'w-full max-w-md mx-auto px-4',

  // Medium container - For content display pages
  // Mobile: full width
  // Tablet: 640px (max-w-xl)
  // Desktop: 768px (max-w-2xl)
  medium: 'w-full max-w-xl md:max-w-2xl mx-auto px-4',

  // Wide container - For dashboard and management pages
  // Mobile: full width
  // Tablet: 1024px (max-w-4xl)
  // Desktop: 1280px (max-w-6xl)
  wide: 'w-full max-w-4xl lg:max-w-6xl mx-auto px-4',

  // Extra wide - For dashboard with many columns
  // Uses max-w-7xl (1280px)
  extraWide: 'w-full max-w-7xl mx-auto px-4',

  // Full width - No max width constraint
  full: 'w-full px-4',
} as const

export type ContainerType = keyof typeof containerStyles

/**
 * Get container class based on type
 */
export const getContainerClass = (type: ContainerType = 'narrow'): string => {
  return containerStyles[type]
}

/**
 * Page-specific container recommendations
 */
export const pageContainers = {
  // Auth & Onboarding
  landing: 'narrow',
  languageSelection: 'narrow',
  pinVerification: 'narrow',
  qrStatusCheck: 'narrow',
  notFound: 'narrow',

  // Content Display
  petDisplay: 'medium',

  // Management
  dashboard: 'extraWide',
} as const
