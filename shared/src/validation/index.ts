/**
 * Shared validation schemas using Zod.
 * These schemas ensure consistent validation across frontend and backend.
 */

import { z } from 'zod'
import type { Language, QRCodeStatus, TicketStatus, TicketPriority } from '../types'

// Base schemas
export const emailSchema = z.string().email('Invalid email format')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format').optional()
export const uuidSchema = z.string().uuid('Invalid UUID format')
export const urlSchema = z.string().url('Invalid URL format')

// Language schema
export const languageSchema = z.enum(['en', 'zh', 'es', 'fr']) as z.ZodType<Language>

// Theme schemas
export const themeConfigSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  background: z.string().optional(),
  surface: z.string().optional(),
  text: z.string().optional(),
  logo: z.string().optional(),
  fonts: z.object({
    family: z.string(),
    weights: z.array(z.number()),
  }).optional(),
})

export const featureFlagsSchema = z.object({
  analytics: z.boolean(),
  export: z.boolean(),
  customDomain: z.boolean(),
  sms: z.boolean(),
})

export const brandingConfigSchema = z.object({
  logo: z.string().optional(),
  favicon: z.string().optional(),
  companyName: z.string().optional(),
  supportEmail: emailSchema.optional(),
})

export const tenantSettingsSchema = z.object({
  theme: themeConfigSchema,
  features: featureFlagsSchema,
  branding: brandingConfigSchema,
})

// User schemas
export const privacySettingsSchema = z.object({
  showEmail: z.boolean(),
  showPhone: z.boolean(),
})

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: phoneSchema,
})

export const tenantUserSchema = z.object({
  email: emailSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: phoneSchema,
  address: z.string().optional(),
  language: languageSchema,
  privacySettings: privacySettingsSchema,
})

// Pet schemas
export const medicalInfoSchema = z.object({
  vaccinations: z.string().optional(),
  vet: z.string().optional(),
  emergencyContact: z.string().optional(),
  conditions: z.string().optional(),
  medications: z.string().optional(),
  bloodType: z.string().optional(),
  weight: z.string().optional(),
})

export const petCreateRequestSchema = z.object({
  name: z.string().min(1, 'Pet name is required'),
  breed: z.string().optional(),
  age: z.number().int().min(0).max(50).optional(),
  sex: z.enum(['male', 'female']).optional(),
  color: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'extra_large']).optional(),
  weight: z.string().optional(),
  microchipId: z.string().optional(),
  isSpayedNeutered: z.boolean().default(false),
  birthday: z.string().datetime().optional(),
  description: z.string().optional(),
  medicalInfo: medicalInfoSchema.optional(),
})

export const petUpdateRequestSchema = petCreateRequestSchema.partial().extend({
  id: z.number().int().positive(),
})

// QR Code schemas
export const qrCodeStatusSchema = z.enum(['inactive', 'active', 'expired']) as z.ZodType<QRCodeStatus>

export const printDataSchema = z.object({
  printDate: z.string().datetime(),
  factory: z.string(),
  batch: z.string(),
  quantity: z.number().int().positive().optional(),
})

export const qrCodeGenerateRequestSchema = z.object({
  quantity: z.number().int().positive().max(10000, 'Maximum 10,000 QR codes per batch'),
  batchId: z.string().optional(),
  printData: printDataSchema.partial().optional(),
})

export const pinVerificationRequestSchema = z.object({
  qrCode: z.string().min(1, 'QR code is required'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits'),
})

export const qrCodeActivateRequestSchema = z.object({
  qrCode: z.string().min(1, 'QR code is required'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits'),
  petId: z.number().int().positive(),
})

// Location schemas
export const locationDataSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export const scanEventSchema = z.object({
  qrCodeId: z.number().int().positive(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  locationData: locationDataSchema.optional(),
})

// Support schemas
export const ticketStatusSchema = z.enum(['open', 'in_progress', 'closed']) as z.ZodType<TicketStatus>
export const ticketPrioritySchema = z.enum(['low', 'medium', 'high']) as z.ZodType<TicketPriority>

export const supportTicketCreateSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject too long'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  priority: ticketPrioritySchema.default('medium'),
})

export const supportTicketUpdateSchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  message: z.string().min(1).max(5000).optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
})

// Tenant schemas
export const tenantCreateSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain too long')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  customDomain: z.string().optional(),
  tier: z.enum(['standard', 'enterprise']).default('standard'),
  settings: tenantSettingsSchema.optional(),
})

export const tenantUpdateSchema = tenantCreateSchema.partial().extend({
  id: z.number().int().positive(),
})

// Pagination schemas
export const paginationQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  size: z.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// Search schemas
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  filter: z.string().optional(),
})

// File upload schemas
export const imageUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
})

// Export validation helpers
export const validateEmail = (email: string) => emailSchema.safeParse(email)
export const validatePassword = (password: string) => passwordSchema.safeParse(password)
export const validatePin = (pin: string) => z.string().regex(/^\d{4}$/).safeParse(pin)
export const validateQRCode = (code: string) => z.string().min(1).safeParse(code)

// Common validation functions
export const isValidEmail = (email: string): boolean => validateEmail(email).success
export const isValidPassword = (password: string): boolean => validatePassword(password).success
export const isValidPin = (pin: string): boolean => validatePin(pin).success
export const isValidQRCode = (code: string): boolean => validateQRCode(code).success

// Export all schemas
export const schemas = {
  // Auth
  loginRequest: loginRequestSchema,
  registerRequest: registerRequestSchema,

  // Users
  tenantUser: tenantUserSchema,
  privacySettings: privacySettingsSchema,

  // Pets
  petCreateRequest: petCreateRequestSchema,
  petUpdateRequest: petUpdateRequestSchema,
  medicalInfo: medicalInfoSchema,

  // QR Codes
  qrCodeGenerateRequest: qrCodeGenerateRequestSchema,
  qrCodeActivateRequest: qrCodeActivateRequestSchema,
  pinVerificationRequest: pinVerificationRequestSchema,

  // Support
  supportTicketCreate: supportTicketCreateSchema,
  supportTicketUpdate: supportTicketUpdateSchema,

  // Tenants
  tenantCreate: tenantCreateSchema,
  tenantUpdate: tenantUpdateSchema,
  tenantSettings: tenantSettingsSchema,

  // Misc
  locationData: locationDataSchema,
  scanEvent: scanEventSchema,
  paginationQuery: paginationQuerySchema,
  searchQuery: searchQuerySchema,
  imageUpload: imageUploadSchema,
}