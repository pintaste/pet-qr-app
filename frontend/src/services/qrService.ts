import { apiClient } from './api'

interface QRVerificationRequest {
  qr_code: string
  pin: string
}

interface QRVerificationResponse {
  success: boolean
  status: 'verified' | 'invalid'
  pet_id?: number
  message?: string
  pet_info?: any
}

interface PetInfo {
  qr_code_id: number
  pet_id: number
  pet_name: string
  pet_breed: string
  pet_age_months: number
  pet_photos: string[]
  pet_description: string
  pet_medical_info: any
  owner_id: number
  contact_info: any
  status: string
}

interface QRCode {
  id: number
  code: string
  status: string
  pet_id?: number
  batch_name?: string
  activated_at?: string
  created_at: string
  image?: string
  url?: string
}

interface QRBatchRequest {
  count: number
  batch_name?: string
}

interface QRBatchResponse {
  qr_codes: QRCode[]
  message: string
}

interface QRActivationRequest {
  qr_code: string
  pin: string
  pet_id?: number
}

interface QRStatusResponse {
  code: string
  is_active: boolean
  is_assigned: boolean
  requires_pin: boolean
  pet_info: any | null
}

class QRService {
  async checkQRStatus(qrCode: string): Promise<QRStatusResponse> {
    return await apiClient.get<QRStatusResponse>(`/api/v1/qr-codes/${qrCode}`)
  }

  async verifyQRPin(request: QRVerificationRequest): Promise<QRVerificationResponse> {
    return await apiClient.post<QRVerificationResponse>('/api/v1/qr/verify', request)
  }

  async getPetInfoByQR(qrCode: string): Promise<PetInfo> {
    return await apiClient.get<PetInfo>(`/api/qr/${qrCode}/pet`)
  }

  async generateQRBatch(request: QRBatchRequest): Promise<QRBatchResponse> {
    return await apiClient.post<QRBatchResponse>('/api/qr/generate-batch', request)
  }

  async activateQRCode(request: QRActivationRequest): Promise<QRCode> {
    return await apiClient.post<QRCode>('/api/qr/activate', request)
  }

  async getQRCodes(params?: {
    skip?: number
    limit?: number
    status?: string
    batch_name?: string
  }): Promise<QRCode[]> {
    const queryParams: Record<string, string> = {}

    if (params?.skip !== undefined) queryParams.skip = params.skip.toString()
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString()
    if (params?.status) queryParams.status = params.status
    if (params?.batch_name) queryParams.batch_name = params.batch_name

    return await apiClient.get<QRCode[]>('/api/qr', queryParams)
  }

  async getQRCode(qrCodeId: number): Promise<QRCode> {
    return await apiClient.get<QRCode>(`/api/qr/${qrCodeId}`)
  }

  async updateQRCode(qrCodeId: number, updates: Partial<QRCode>): Promise<QRCode> {
    return await apiClient.put<QRCode>(`/api/qr/${qrCodeId}`, updates)
  }

  async deleteQRCode(qrCodeId: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/qr/${qrCodeId}`)
  }

  async recordScanEvent(qrCode: string, data?: {
    location?: string
    user_agent?: string
  }): Promise<void> {
    try {
      await apiClient.post('/api/qr/scan-event', {
        qr_code: qrCode,
        location: data?.location,
        user_agent: data?.user_agent || navigator.userAgent,
        ip_address: '', // Will be set by backend
      })
    } catch {
      // Don't let scan recording failures break the main flow
    }
  }

  // Generate QR code URL for display/sharing
  generateQRUrl(qrCode: string, baseUrl?: string): string {
    const base = baseUrl || window.location.origin
    return `${base}/qr/${qrCode}`
  }

  // Download QR code as image
  async downloadQRImage(qrCode: QRCode, filename?: string): Promise<void> {
    if (!qrCode.image) {
      throw new Error('QR code image not available')
    }

    // Convert base64 to blob
    const response = await fetch(qrCode.image)
    const blob = await response.blob()

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `qr-code-${qrCode.code}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const qrService = new QRService()
export { QRService }