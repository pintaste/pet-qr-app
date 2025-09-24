/**
 * Shared TypeScript types for the Pet QR System.
 */

// Theme Types
export type Theme = 'light' | 'dark'

export interface ThemeConfig {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  logo?: string
  fonts?: FontConfig
}

export interface FontConfig {
  family: string
  weights: number[]
}

// Language Types
export type Language = 'en' | 'zh' | 'es' | 'fr'

export interface LanguageOption {
  code: Language
  name: string
  flag: string
}

// User Types
export interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  language: Language
  privacySettings: PrivacySettings
  isActive: boolean
  createdAt: string
}

export interface PrivacySettings {
  showEmail: boolean
  showPhone: boolean
}

// Pet Types
export interface Pet {
  id: number
  name: string
  breed?: string
  age?: number
  sex?: string
  color?: string
  size?: string
  weight?: string
  microchipId?: string
  isSpayedNeutered: boolean
  birthday?: string
  description?: string
  photos: string[]
  medicalInfo: MedicalInfo
  ownerId: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MedicalInfo {
  vaccinations?: string
  vet?: string
  emergencyContact?: string
  conditions?: string
  medications?: string
  bloodType?: string
}

// QR Code Types
export interface QRCode {
  id: number
  code: string
  pin: string
  petId?: number
  status: 'inactive' | 'active' | 'expired'
  batchId?: string
  printData?: PrintData
  activatedAt?: string
  createdAt: string
}

export interface PrintData {
  printDate: string
  factory: string
  batch: string
}

// Tenant Types
export interface Tenant {
  id: number
  name: string
  subdomain: string
  customDomain?: string
  tier: 'standard' | 'enterprise'
  settings: TenantSettings
  isActive: boolean
  createdAt: string
}

export interface TenantSettings {
  theme: ThemeConfig
  features: FeatureFlags
  branding: BrandingConfig
}

export interface FeatureFlags {
  analytics: boolean
  export: boolean
  customDomain: boolean
}

export interface BrandingConfig {
  logo?: string
  favicon?: string
  companyName?: string
  supportEmail?: string
}

// Scan Event Types
export interface ScanEvent {
  id: number
  qrCodeId: number
  ipAddress?: string
  userAgent?: string
  locationData?: LocationData
  scannedAt: string
}

export interface LocationData {
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  country?: string
}

// API Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  detail: string
  errorCode?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone?: string
}

export interface PetForm {
  name: string
  breed?: string
  age?: number
  sex?: string
  color?: string
  size?: string
  weight?: string
  microchipId?: string
  isSpayedNeutered: boolean
  birthday?: string
  description?: string
  medicalInfo: Partial<MedicalInfo>
}

export interface PINVerificationForm {
  pin: string
}

// Dashboard Types
export interface DashboardStats {
  totalQRCodes: number
  activeQRCodes: number
  totalScans: number
  scansTrend: TrendData[]
  topPets: Pet[]
}

export interface TrendData {
  date: string
  value: number
}

// Support Types
export interface SupportTicket {
  id: number
  userId?: number
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface RequestState<T> {
  data: T | null
  loading: boolean
  error: string | null
}