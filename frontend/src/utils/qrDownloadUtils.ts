/**
 * QR Code Download Utilities
 *
 * Utility functions for downloading QR codes as individual images or bulk ZIP files.
 * Contains shared canvas drawing logic to eliminate code duplication.
 */

import QRCodeLib from 'qrcode'
import JSZip from 'jszip'

// =============================================================================
// Types & Interfaces
// =============================================================================

/**
 * QR code data interface for download functions
 */
export interface QRCodeForDownload {
  code: string
  pin: string
  batch_id?: string | null
}

/**
 * Frame style for QR code rendering
 */
export type QRFrameStyle = 'scanner' | 'rounded'

/**
 * Configuration for QR canvas rendering
 */
export interface QRCanvasConfig {
  qrSize: number
  padding: number
  footerHeight: number
  cornerLength: number
  cornerOffset: number
  borderRadius: number
  lineWidth: number
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Default configuration for QR canvas
 */
const DEFAULT_CANVAS_CONFIG: QRCanvasConfig = {
  qrSize: 300,
  padding: 40,
  footerHeight: 80,
  cornerLength: 40,
  cornerOffset: 8,
  borderRadius: 20,
  lineWidth: 4,
}

/**
 * Colors used in QR code rendering
 */
const QR_COLORS = {
  dark: '#000000',
  light: '#ffffff',
  frame: '#000000',
  pin: '#4f46e5',
} as const

// =============================================================================
// Core Generation Functions
// =============================================================================

/**
 * Generate QR code data URL using the QRCode library
 *
 * @param code - The QR code string
 * @param size - Size of the QR code in pixels
 * @param margin - Margin around the QR code
 * @returns Promise resolving to data URL
 */
export const generateQRDataUrl = async (
  code: string,
  size: number = 300,
  margin: number = 1
): Promise<string> => {
  const qrUrl = `${window.location.origin}/qr/${code}`
  return QRCodeLib.toDataURL(qrUrl, {
    width: size,
    margin,
    color: {
      dark: QR_COLORS.dark,
      light: QR_COLORS.light,
    },
  })
}

/**
 * Generate QR code image URL for display (alias for backward compatibility)
 *
 * @param code - QR code string
 * @param size - Size of the QR code image
 * @returns Data URL of the QR code image
 */
export const generateQRImageUrl = async (code: string, size: number = 256): Promise<string> => {
  return generateQRDataUrl(code, size, 2)
}

// =============================================================================
// Canvas Drawing Functions (Shared Logic)
// =============================================================================

/**
 * Load an image from a data URL
 *
 * @param dataUrl - The image data URL
 * @returns Promise resolving to HTMLImageElement
 */
const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Draw scanner-style corners (viewfinder brackets)
 *
 * @param ctx - Canvas 2D context
 * @param qrX - X position of QR code
 * @param qrY - Y position of QR code
 * @param qrSize - Size of QR code
 * @param config - Canvas configuration
 */
const drawScannerCorners = (
  ctx: CanvasRenderingContext2D,
  qrX: number,
  qrY: number,
  qrSize: number,
  config: QRCanvasConfig
): void => {
  const { cornerLength, cornerOffset } = config

  // Top-left corner
  ctx.beginPath()
  ctx.moveTo(qrX - cornerOffset, qrY - cornerOffset + cornerLength)
  ctx.lineTo(qrX - cornerOffset, qrY - cornerOffset)
  ctx.lineTo(qrX - cornerOffset + cornerLength, qrY - cornerOffset)
  ctx.stroke()

  // Top-right corner
  ctx.beginPath()
  ctx.moveTo(qrX + qrSize + cornerOffset - cornerLength, qrY - cornerOffset)
  ctx.lineTo(qrX + qrSize + cornerOffset, qrY - cornerOffset)
  ctx.lineTo(qrX + qrSize + cornerOffset, qrY - cornerOffset + cornerLength)
  ctx.stroke()

  // Bottom-left corner
  ctx.beginPath()
  ctx.moveTo(qrX - cornerOffset, qrY + qrSize + cornerOffset - cornerLength)
  ctx.lineTo(qrX - cornerOffset, qrY + qrSize + cornerOffset)
  ctx.lineTo(qrX - cornerOffset + cornerLength, qrY + qrSize + cornerOffset)
  ctx.stroke()

  // Bottom-right corner
  ctx.beginPath()
  ctx.moveTo(qrX + qrSize + cornerOffset - cornerLength, qrY + qrSize + cornerOffset)
  ctx.lineTo(qrX + qrSize + cornerOffset, qrY + qrSize + cornerOffset)
  ctx.lineTo(qrX + qrSize + cornerOffset, qrY + qrSize + cornerOffset - cornerLength)
  ctx.stroke()
}

/**
 * Draw rounded border frame
 *
 * @param ctx - Canvas 2D context
 * @param qrX - X position of QR code
 * @param qrY - Y position of QR code
 * @param qrSize - Size of QR code
 * @param config - Canvas configuration
 */
const drawRoundedBorder = (
  ctx: CanvasRenderingContext2D,
  qrX: number,
  qrY: number,
  qrSize: number,
  config: QRCanvasConfig
): void => {
  const { borderRadius, cornerOffset } = config
  ctx.beginPath()
  ctx.roundRect(
    qrX - cornerOffset,
    qrY - cornerOffset,
    qrSize + cornerOffset * 2,
    qrSize + cornerOffset * 2,
    borderRadius
  )
  ctx.stroke()
}

/**
 * Draw footer with code and PIN
 *
 * @param ctx - Canvas 2D context
 * @param code - QR code string
 * @param pin - PIN string
 * @param footerY - Y position for footer
 * @param canvasWidth - Width of canvas for centering
 */
const drawFooter = (
  ctx: CanvasRenderingContext2D,
  code: string,
  pin: string,
  footerY: number,
  canvasWidth: number
): void => {
  // Draw code
  ctx.fillStyle = QR_COLORS.dark
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(code, canvasWidth / 2, footerY)

  // Draw PIN
  ctx.fillStyle = QR_COLORS.pin
  ctx.font = 'bold 24px monospace'
  ctx.fillText(`PIN: ${pin}`, canvasWidth / 2, footerY + 35)
}

/**
 * Compose a complete QR code image with frame and footer
 *
 * @param qrDataUrl - The QR code as data URL
 * @param code - QR code string
 * @param pin - PIN string
 * @param style - Frame style
 * @param config - Canvas configuration
 * @returns Promise resolving to complete image data URL
 */
export const composeQRWithFrame = async (
  qrDataUrl: string,
  code: string,
  pin: string,
  style: QRFrameStyle = 'scanner',
  config: QRCanvasConfig = DEFAULT_CANVAS_CONFIG
): Promise<string> => {
  const { qrSize, padding, footerHeight, lineWidth } = config

  // Create canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  canvas.width = qrSize + padding * 2
  canvas.height = qrSize + padding * 2 + footerHeight

  // Fill white background
  ctx.fillStyle = QR_COLORS.light
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw QR code
  const qrImage = await loadImage(qrDataUrl)
  const qrX = padding
  const qrY = padding
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

  // Draw style-specific frame
  ctx.strokeStyle = QR_COLORS.frame
  ctx.lineWidth = lineWidth

  if (style === 'scanner') {
    drawScannerCorners(ctx, qrX, qrY, qrSize, config)
  } else {
    drawRoundedBorder(ctx, qrX, qrY, qrSize, config)
  }

  // Draw footer
  const footerY = qrY + qrSize + padding
  drawFooter(ctx, code, pin, footerY, canvas.width)

  return canvas.toDataURL('image/png')
}

// =============================================================================
// Download Functions
// =============================================================================

/**
 * Download a single QR code as PNG image with styled frame
 *
 * @param qr - QR code data
 * @param style - Frame style ('scanner' for viewfinder brackets, 'rounded' for rounded border)
 */
export const downloadSingleQR = async (
  qr: QRCodeForDownload,
  style: QRFrameStyle = 'scanner'
): Promise<void> => {
  try {
    // Generate QR code as data URL
    const qrDataUrl = await generateQRDataUrl(qr.code)

    // Compose complete image with frame
    const finalDataUrl = await composeQRWithFrame(qrDataUrl, qr.code, qr.pin, style)

    // Download the image
    const link = document.createElement('a')
    link.href = finalDataUrl
    link.download = `PetQR-${qr.code}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('[qrDownloadUtils] Error downloading QR:', error)
    throw error
  }
}

/**
 * Download multiple QR codes as a ZIP file
 *
 * @param qrCodes - Array of QR codes to download
 * @param style - Frame style ('scanner' for viewfinder brackets, 'rounded' for rounded border)
 * @param batchFilter - Optional batch filter for filename
 * @param onProgress - Optional callback for progress updates (0-100)
 */
export const downloadBulkQR = async (
  qrCodes: QRCodeForDownload[],
  style: QRFrameStyle = 'scanner',
  batchFilter?: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (qrCodes.length === 0) return

  try {
    const zip = new JSZip()

    for (let i = 0; i < qrCodes.length; i++) {
      const qr = qrCodes[i]

      // Generate QR code as data URL
      const qrDataUrl = await generateQRDataUrl(qr.code)

      // Compose complete image with frame
      const finalDataUrl = await composeQRWithFrame(qrDataUrl, qr.code, qr.pin, style)

      // Convert to base64 and add to zip
      const base64Data = finalDataUrl.split(',')[1]
      zip.file(`PetQR-${qr.code}.png`, base64Data, { base64: true })

      // Report progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / qrCodes.length) * 100))
      }
    }

    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(content)
    link.download = `PetQR-Batch-${batchFilter || 'All'}-${style}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('[qrDownloadUtils] Error bulk downloading QR codes:', error)
    throw error
  }
}
