import React, { useState, useRef } from 'react'
import { X, QrCode, Loader2, AlertCircle, CheckCircle, Camera, Upload, Keyboard } from 'lucide-react'
import { qrService } from '@/services/qrService'
import QrScanner from 'react-qr-scanner'

interface ActivateQRModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type InputMethod = 'manual' | 'camera' | 'upload'

/**
 * ActivateQRModal Component
 *
 * Modal for activating/claiming existing QR codes.
 * Supports three input methods:
 * 1. Manual entry (type QR code)
 * 2. Camera scan (scan with device camera)
 * 3. Image upload (upload QR code image from device)
 */
export const ActivateQRModal: React.FC<ActivateQRModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [inputMethod, setInputMethod] = useState<InputMethod>('manual')
  const [qrCode, setQrCode] = useState('')
  const [pin, setPin] = useState('')
  const [isActivating, setIsActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleScan = (data: { text: string } | null) => {
    if (data && data.text) {
      console.log('[ActivateQRModal] QR code scanned:', data.text)
      setQrCode(data.text)
      setIsCameraActive(false)
      setInputMethod('manual') // Switch to manual to show the scanned code
      setError(null)
    }
  }

  const handleScanError = (err: Error) => {
    console.error('[ActivateQRModal] QR scan error:', err)
    setError('Failed to scan QR code. Please try again or enter manually.')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Create image element to read QR code
      const reader = new FileReader()
      reader.onload = async (_event) => {
        // Use jsQR or similar library to decode QR from image
        // For now, we'll show error that this needs additional library
        setError('Image upload QR scanning requires additional setup. Please use camera or manual entry.')

        // TODO: Integrate jsQR library for image-based QR decoding
        // const imageSrc = _event.target?.result as string
        // const code = await decodeQRFromImage(imageSrc)
        // if (code) {
        //   setQrCode(code)
        //   setInputMethod('manual')
        // }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('[ActivateQRModal] Error reading image:', err)
      setError('Failed to read image. Please try again.')
    }
  }

  const handleActivate = async () => {
    // Validate inputs
    if (!qrCode.trim()) {
      setError('Please enter a QR code')
      return
    }

    if (!pin.trim()) {
      setError('Please enter the PIN')
      return
    }

    if (pin.length < 4) {
      setError('PIN must be at least 4 characters')
      return
    }

    setError(null)
    setIsActivating(true)

    try {
      console.log('[ActivateQRModal] Activating QR code:', qrCode)

      // First verify the QR code and PIN
      const verifyResult = await qrService.verifyQRPin({
        qr_code: qrCode.trim(),
        pin: pin.trim(),
      })

      if (!verifyResult.success) {
        setError(verifyResult.message || 'Invalid QR code or PIN')
        setIsActivating(false)
        return
      }

      // If verified, activate the QR code (assign to current user)
      const activateResult = await qrService.activateQRCode({
        qr_code: qrCode.trim(),
        pin: pin.trim(),
      })

      console.log('[ActivateQRModal] QR code activated:', activateResult)

      setSuccess(true)

      // Show success message briefly, then close and refresh
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('[ActivateQRModal] Failed to activate QR code:', err)
      setError(err instanceof Error ? err.message : 'Failed to activate QR code')
      setIsActivating(false)
    }
  }

  const handleClose = () => {
    if (!isActivating) {
      setQrCode('')
      setPin('')
      setError(null)
      setSuccess(false)
      setIsCameraActive(false)
      setInputMethod('manual')
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isActivating && !success) {
      handleActivate()
    }
  }

  const startCamera = () => {
    setIsCameraActive(true)
    setError(null)
  }

  const stopCamera = () => {
    setIsCameraActive(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <QrCode className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Activate QR Code
          </h2>
          <button
            onClick={handleClose}
            disabled={isActivating}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">
                  QR Code Activated!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  The QR code has been added to your account.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!success && (
            <>
              {/* Input Method Selection */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => {
                    setInputMethod('manual')
                    stopCamera()
                  }}
                  disabled={isActivating}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    inputMethod === 'manual'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Keyboard className="w-4 h-4" />
                  <span className="text-sm">Manual</span>
                </button>
                <button
                  onClick={() => {
                    setInputMethod('camera')
                    startCamera()
                  }}
                  disabled={isActivating}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    inputMethod === 'camera'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">Camera</span>
                </button>
                <button
                  onClick={() => {
                    setInputMethod('upload')
                    stopCamera()
                    fileInputRef.current?.click()
                  }}
                  disabled={isActivating}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    inputMethod === 'upload'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload</span>
                </button>
              </div>

              {/* Hidden file input for upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Camera Scanner */}
              {inputMethod === 'camera' && isCameraActive && (
                <div className="space-y-3">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                    <QrScanner
                      delay={300}
                      onError={handleScanError}
                      onScan={handleScan}
                      style={{ width: '100%' }}
                      constraints={{
                        video: { facingMode: 'environment' }
                      }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Position the QR code within the camera frame
                  </p>
                  <button
                    onClick={stopCamera}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
              )}

              {/* Manual Entry / Upload Result */}
              {(inputMethod === 'manual' || inputMethod === 'upload') && !isCameraActive && (
                <>
                  {/* Instructions */}
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <p className="text-sm text-indigo-900 dark:text-indigo-100">
                      {inputMethod === 'manual'
                        ? 'Enter the QR code and PIN from your physical QR tag to activate it.'
                        : 'Upload an image of your QR code, then enter the PIN to activate it.'}
                    </p>
                  </div>

                  {/* QR Code Input */}
                  <div>
                    <label
                      htmlFor="qrCode"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      QR Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="qrCode"
                      type="text"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isActivating}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                      placeholder="Enter QR code (e.g., QR123456)"
                      autoFocus={inputMethod === 'manual'}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      The code printed on your QR tag
                    </p>
                  </div>

                  {/* PIN Input */}
                  <div>
                    <label
                      htmlFor="pin"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      PIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="pin"
                      type="text"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isActivating}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                      placeholder="Enter PIN"
                      maxLength={10}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      The PIN printed on your QR tag (4-10 characters)
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <strong>Note:</strong> Once activated, this QR code will be permanently assigned to your account.
                      You can then link it to one of your pets.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!success && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              disabled={isActivating}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleActivate}
              disabled={isActivating || !qrCode.trim() || !pin.trim() || isCameraActive}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  Activate QR Code
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
