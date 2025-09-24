/**
 * Shared TypeScript types for Pet QR System.
 * These types are used across frontend, backend, and other services.
 */

// Base Types
export type UUID = string
export type ISODateString = string
export type Language = 'en' | 'zh' | 'es' | 'fr'
export type Theme = 'light' | 'dark'

// Tenant Types
export interface Tenant {
  id: number
  name: string
  subdomain: string
  customDomain?: string
  tier: 'standard' | 'enterprise'
  settings: TenantSettings
  isActive: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface TenantSettings {
  theme: ThemeConfig
  features: FeatureFlags
  branding: BrandingConfig
}

export interface ThemeConfig {
  primary: string
  secondary: string
  background?: string
  surface?: string
  text?: string
  logo?: string
  fonts?: FontConfig
}

export interface FontConfig {
  family: string
  weights: number[]
}

export interface FeatureFlags {
  analytics: boolean
  export: boolean
  customDomain: boolean
  sms: boolean
}

export interface BrandingConfig {
  logo?: string
  favicon?: string
  companyName?: string
  supportEmail?: string
}

// User Types
export interface GlobalUser {
  id: number
  email: string
  passwordHash: string
  tenantId?: number
  role: 'super_admin' | 'tenant_admin' | 'user'
  isActive: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface TenantUser {
  id: number
  email: string
  passwordHash: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  language: Language
  privacySettings: PrivacySettings
  isActive: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
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
  sex?: 'male' | 'female'
  color?: string
  size?: 'small' | 'medium' | 'large' | 'extra_large'
  weight?: string
  microchipId?: string
  isSpayedNeutered: boolean
  birthday?: ISODateString
  description?: string
  photos: string[]
  medicalInfo: MedicalInfo
  ownerId: number
  isActive: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface MedicalInfo {
  vaccinations?: string
  vet?: string
  emergencyContact?: string
  conditions?: string
  medications?: string
  bloodType?: string
  weight?: string
}

// QR Code Types
export interface QRCode {
  id: number
  code: string
  pin: string
  petId?: number
  status: QRCodeStatus
  batchId?: string
  printData?: PrintData
  activatedAt?: ISODateString
  createdAt: ISODateString
}

export type QRCodeStatus = 'inactive' | 'active' | 'expired'

export interface PrintData {
  printDate: ISODateString
  factory: string
  batch: string
  quantity?: number
}

// Scan Event Types
export interface ScanEvent {
  id: number
  qrCodeId: number
  ipAddress?: string
  userAgent?: string
  locationData?: LocationData
  scannedAt: ISODateString
}

export interface LocationData {
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  country?: string
}

// Support Types
export interface SupportTicket {
  id: number
  userId?: number
  subject: string
  message: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: ISODateString
  updatedAt: ISODateString
}

export type TicketStatus = 'open' | 'in_progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'

// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  detail: string
  errorCode?: string
  statusCode?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// Form Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}

export interface PetCreateRequest {
  name: string
  breed?: string
  age?: number
  sex?: 'male' | 'female'
  color?: string
  size?: 'small' | 'medium' | 'large' | 'extra_large'
  weight?: string
  microchipId?: string
  isSpayedNeutered: boolean
  birthday?: ISODateString
  description?: string
  medicalInfo?: Partial<MedicalInfo>
}

export interface PetUpdateRequest extends Partial<PetCreateRequest> {
  id: number
}

export interface QRCodeGenerateRequest {
  quantity: number
  batchId?: string
  printData?: Partial<PrintData>
}

export interface QRCodeActivateRequest {
  qrCode: string
  pin: string
  petId: number
}

export interface PINVerificationRequest {
  qrCode: string
  pin: string
}

// Dashboard Types
export interface DashboardStats {
  totalQRCodes: number
  activeQRCodes: number
  inactiveQRCodes: number
  totalPets: number
  totalScans: number
  scansToday: number
  scansTrend: TrendData[]
  topScannedPets: PetScanStats[]
}

export interface TrendData {
  date: ISODateString
  value: number
}

export interface PetScanStats {
  pet: Pet
  scanCount: number
  lastScanned?: ISODateString
}

// Authentication Types
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface JWTPayload {
  sub: string
  email: string
  tenantId?: number
  role: string
  exp: number
  iat: number
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface RequestState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

// Language Types
export interface LanguageOption {
  code: Language
  name: string
  flag: string
}

// Export all types
export type * from './index'