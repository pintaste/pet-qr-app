/**
 * Shared utility functions for Pet QR System.
 */

import type { Language, QRCode, Pet, ScanEvent } from '../types'

// Date utilities
export const formatDate = (date: string | Date, locale: string = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateTime = (date: string | Date, locale: string = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatTime = (date: string | Date, locale: string = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const getRelativeTime = (date: string | Date, locale: string = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return formatDate(d, locale)
}

// String utilities
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const generateRandomString = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Number utilities
export const formatNumber = (num: number, locale: string = 'en-US'): string => {
  return num.toLocaleString(locale)
}

export const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`
}

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

// Object utilities
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) result[key] = obj[key]
  })
  return result
}

export const deepMerge = (target: any, source: any): any => {
  if (source === null || typeof source !== 'object') return source
  if (target === null || typeof target !== 'object') return source

  const result = { ...target }

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        result[key] = deepMerge(target[key], source[key])
      } else {
        result[key] = source[key]
      }
    }
  }

  return result
}

// QR Code utilities
export const generateQRCodeUrl = (code: string, baseUrl: string = ''): string => {
  return `${baseUrl}/qr/${code}`
}

export const generatePIN = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export const isValidPIN = (pin: string): boolean => {
  return /^\d{4}$/.test(pin)
}

export const isQRCodeActive = (qrCode: QRCode): boolean => {
  return qrCode.status === 'active' && qrCode.petId !== null
}

export const getQRCodeDisplayStatus = (qrCode: QRCode): string => {
  switch (qrCode.status) {
    case 'active':
      return 'Active'
    case 'inactive':
      return 'Pending Activation'
    case 'expired':
      return 'Expired'
    default:
      return 'Unknown'
  }
}

// Pet utilities
export const getPetAge = (birthday: string | Date): number => {
  const birth = typeof birthday === 'string' ? new Date(birthday) : birthday
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1
  }

  return age
}

export const getPetDisplayName = (pet: Pet): string => {
  return pet.name || 'Unnamed Pet'
}

export const getPetBreedDisplay = (pet: Pet): string => {
  if (!pet.breed) return 'Mixed Breed'
  return pet.breed
}

export const getPetAgeDisplay = (pet: Pet): string => {
  if (!pet.birthday && !pet.age) return 'Age Unknown'

  const age = pet.age || getPetAge(pet.birthday!)
  if (age === 0) return 'Less than 1 year old'
  if (age === 1) return '1 year old'
  return `${age} years old`
}

// Analytics utilities
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const getTrendDirection = (data: number[]): 'up' | 'down' | 'stable' => {
  if (data.length < 2) return 'stable'

  const recent = data.slice(-3)
  const sum = recent.reduce((a, b) => a + b, 0)
  const avg = sum / recent.length
  const last = recent[recent.length - 1]

  if (last > avg * 1.1) return 'up'
  if (last < avg * 0.9) return 'down'
  return 'stable'
}

export const aggregateScansByDate = (scans: ScanEvent[]): Record<string, number> => {
  return scans.reduce((acc, scan) => {
    const date = new Date(scan.scannedAt).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/
  return phoneRegex.test(phone)
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Language utilities
export const getLanguageDirection = (language: Language): 'ltr' | 'rtl' => {
  const rtlLanguages: Language[] = [] // Add RTL languages if needed
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr'
}

export const getLanguageDisplayName = (language: Language): string => {
  const names: Record<Language, string> = {
    en: 'English',
    zh: '中文',
    es: 'Español',
    fr: 'Français',
  }
  return names[language] || language
}

// Error utilities
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.detail) return error.detail
  return 'An unexpected error occurred'
}

export const isNetworkError = (error: any): boolean => {
  return error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')
}

// Storage utilities
export const safeLocalStorage = {
  get: (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage errors
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore storage errors
    }
  },
}

// Export all utilities as a convenience object
export const utils = {
  // Date
  formatDate,
  formatDateTime,
  formatTime,
  getRelativeTime,

  // String
  capitalizeFirst,
  truncateText,
  slugify,
  generateRandomString,

  // Number
  formatNumber,
  formatCurrency,
  formatPercentage,

  // Array
  groupBy,
  sortBy,
  uniqueBy,

  // Object
  omit,
  pick,
  deepMerge,

  // QR Code
  generateQRCodeUrl,
  generatePIN,
  isValidPIN,
  isQRCodeActive,
  getQRCodeDisplayStatus,

  // Pet
  getPetAge,
  getPetDisplayName,
  getPetBreedDisplay,
  getPetAgeDisplay,

  // Analytics
  calculateGrowthRate,
  getTrendDirection,
  aggregateScansByDate,

  // Validation
  isValidEmail,
  isValidPhone,
  isValidUrl,

  // Language
  getLanguageDirection,
  getLanguageDisplayName,

  // Error
  getErrorMessage,
  isNetworkError,

  // Storage
  safeLocalStorage,
}