import React, { useState, useRef, useEffect } from 'react'
import { X, QrCode, Loader2, AlertCircle, CheckCircle, Camera, Keyboard, PawPrint, ChevronRight } from 'lucide-react'
import { qrService } from '@/services/qrService'
import { petService, Pet } from '@/services/petService'
import QrScanner from 'react-qr-scanner'

interface ActivateQRModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type InputMethod = 'manual' | 'camera'
type Step = 'input' | 'activating' | 'success' | 'link-pet'

/**
 * ActivateQRModal Component
 *
 * Modal for activating/claiming existing QR codes.
 * Improved UX with step-by-step flow and option to link pet after activation.
 */
export const ActivateQRModal: React.FC<ActivateQRModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Input states
  const [inputMethod, setInputMethod] = useState<InputMethod>('manual')
  const [qrCode, setQrCode] = useState('')
  const [pin, setPin] = useState('')

  // Flow states
  const [step, setStep] = useState<Step>('input')
  const [error, setError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  // Activated QR code data
  const [activatedQRId, setActivatedQRId] = useState<number | null>(null)

  // Pet linking states
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null)
  const [isLinking, setIsLinking] = useState(false)

  // Refs
  const qrInputRef = useRef<HTMLInputElement>(null)
  const pinInputRef = useRef<HTMLInputElement>(null)

  // Fetch user's pets when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPets()
    }
  }, [isOpen])

  // Auto-focus QR input when switching to manual
  useEffect(() => {
    if (inputMethod === 'manual' && !isCameraActive && step === 'input') {
      qrInputRef.current?.focus()
    }
  }, [inputMethod, isCameraActive, step])

  const fetchPets = async () => {
    try {
      const userPets = await petService.getPets()
      // Filter pets that don't have QR codes
      const availablePets = (userPets || []).filter(p => !p.qr_code_id)
      setPets(availablePets)
    } catch (err) {
      console.error('[ActivateQRModal] Error fetching pets:', err)
    }
  }

  const handleScan = (data: { text: string } | null) => {
    if (data && data.text) {
      console.log('[ActivateQRModal] QR code scanned:', data.text)
      // Extract QR code from URL if scanned from actual QR
      let scannedCode = data.text
      if (scannedCode.includes('/qr/')) {
        scannedCode = scannedCode.split('/qr/').pop() || scannedCode
      }
      setQrCode(scannedCode)
      setIsCameraActive(false)
      setInputMethod('manual')
      setError(null)
      // Focus PIN input after scanning
      setTimeout(() => pinInputRef.current?.focus(), 100)
    }
  }

  const handleScanError = (err: Error) => {
    // Only log to console, don't show errors during normal scanning
    // The QrScanner triggers errors constantly when no QR code is in frame
    console.log('[ActivateQRModal] QR scan info:', err.message)
  }

  const handleActivate = async () => {
    // Validate inputs
    if (!qrCode.trim()) {
      setError('Please enter a QR code')
      qrInputRef.current?.focus()
      return
    }

    if (!pin.trim()) {
      setError('Please enter the PIN')
      pinInputRef.current?.focus()
      return
    }

    if (pin.length !== 4) {
      setError('PIN must be exactly 4 digits')
      pinInputRef.current?.focus()
      return
    }

    setError(null)
    setStep('activating')

    try {
      console.log('[ActivateQRModal] Activating QR code:', qrCode)

      // Activate the QR code directly - the endpoint verifies the PIN
      const activateResult = await qrService.activateQRCode({
        qr_code: qrCode.trim().toUpperCase(),
        pin: pin.trim(),
      })

      console.log('[ActivateQRModal] QR code activated:', activateResult)
      setActivatedQRId(activateResult.id)
      setStep('success')

    } catch (err) {
      console.error('[ActivateQRModal] Failed to activate QR code:', err)
      // Extract error message from API response
      let errorMessage = 'Failed to activate QR code'
      if (err instanceof Error) {
        errorMessage = err.message
      }
      // Handle specific error cases
      if (errorMessage.includes('not found') || errorMessage.includes('Not Found')) {
        errorMessage = 'QR code not found. Please check the code and try again.'
      } else if (errorMessage.includes('Invalid PIN')) {
        errorMessage = 'Invalid PIN. Please check and try again.'
      } else if (errorMessage.includes('already assigned')) {
        errorMessage = 'This QR code is already assigned to a pet.'
      }
      setError(errorMessage)
      setStep('input')
    }
  }

  const handleLinkPet = async () => {
    if (!selectedPetId || !activatedQRId) return

    setIsLinking(true)
    setError(null)

    try {
      await petService.linkQRCode(selectedPetId, activatedQRId)
      console.log('[ActivateQRModal] QR code linked to pet:', selectedPetId)

      // Complete the flow
      onSuccess()
      handleClose()
    } catch (err) {
      console.error('[ActivateQRModal] Failed to link pet:', err)
      setError(err instanceof Error ? err.message : 'Failed to link pet')
      setIsLinking(false)
    }
  }

  const handleSkipLinking = () => {
    onSuccess()
    handleClose()
  }

  const handleClose = () => {
    if (step === 'activating' || isLinking) return

    // Reset all states
    setQrCode('')
    setPin('')
    setError(null)
    setStep('input')
    setIsCameraActive(false)
    setInputMethod('manual')
    setActivatedQRId(null)
    setSelectedPetId(null)
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'input') {
      handleActivate()
    }
  }

  const startCamera = async () => {
    setError(null)

    // Request camera permission explicitly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      // Stop the stream immediately - the QrScanner will start its own
      stream.getTracks().forEach(track => track.stop())
      setIsCameraActive(true)
    } catch (err) {
      console.error('[ActivateQRModal] Camera permission error:', err)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera access denied. Please allow camera permissions in your browser settings.')
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found on this device.')
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Camera is in use by another application.')
        } else {
          setError('Could not access camera. Please try manual entry.')
        }
      } else {
        setError('Could not access camera. Please try manual entry.')
      }
      setInputMethod('manual')
    }
  }

  const stopCamera = () => {
    setIsCameraActive(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {step === 'link-pet' ? 'Link to Pet' : 'Activate QR Code'}
          </h2>
          <button
            onClick={handleClose}
            disabled={step === 'activating' || isLinking}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Step: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Input Method Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => {
                    setInputMethod('manual')
                    stopCamera()
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                    inputMethod === 'manual'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Keyboard className="w-4 h-4" />
                  Type Code
                </button>
                <button
                  onClick={() => {
                    setInputMethod('camera')
                    startCamera()
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                    inputMethod === 'camera'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Scan QR
                </button>
              </div>

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
                    {/* Scan overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
                    </div>
                  </div>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Point camera at the QR code on your tag
                  </p>
                </div>
              )}

              {/* Manual Entry */}
              {(inputMethod === 'manual' || !isCameraActive) && (
                <div className="space-y-4">
                  {/* QR Code Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      QR Code
                    </label>
                    <div className="relative">
                      <input
                        ref={qrInputRef}
                        type="text"
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                        onKeyPress={handleKeyPress}
                        className="w-full px-3 py-2.5 pr-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-lg tracking-wider"
                        placeholder="QR123ABC456"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setInputMethod('camera')
                          startCamera()
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                        title="Scan QR Code"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* PIN Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      PIN (4 digits)
                    </label>
                    <input
                      ref={pinInputRef}
                      type="text"
                      inputMode="numeric"
                      value={pin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                        setPin(value)
                      }}
                      onKeyPress={handleKeyPress}
                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-lg tracking-[0.5em] text-center"
                      placeholder="••••"
                      maxLength={4}
                      autoComplete="off"
                    />
                  </div>

                  {/* Help text */}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Find the code and PIN printed on your QR tag
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step: Activating */}
          {step === 'activating' && (
            <div className="py-8 text-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Activating your QR code...</p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="space-y-4">
              <div className="py-4 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  QR Code Activated!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Code <span className="font-mono font-medium">{qrCode}</span> is now yours
                </p>
              </div>

              {/* Link to Pet Option */}
              {pets.length > 0 && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-3">
                    Link this QR code to a pet?
                  </p>
                  <button
                    onClick={() => setStep('link-pet')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <PawPrint className="w-4 h-4 text-indigo-500" />
                      Choose a pet
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step: Link Pet */}
          {step === 'link-pet' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Select a pet to link with this QR code:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPetId(pet.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      selectedPetId === pet.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex-shrink-0">
                      {pet.photos && pet.photos.length > 0 ? (
                        <img
                          src={pet.photos[0]}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PawPrint className="w-5 h-5 text-indigo-400" />
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {pet.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {pet.breed || 'No breed'}
                      </p>
                    </div>
                    {selectedPetId === pet.id && (
                      <CheckCircle className="w-5 h-5 text-indigo-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>

              {pets.length === 0 && (
                <div className="py-4 text-center">
                  <PawPrint className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No pets available to link
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          {step === 'input' && (
            <>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActivate}
                disabled={!qrCode.trim() || !pin.trim() || pin.length !== 4 || isCameraActive}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <QrCode className="w-4 h-4" />
                Activate
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              onClick={handleSkipLinking}
              className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {pets.length > 0 ? 'Skip for Now' : 'Done'}
            </button>
          )}

          {step === 'link-pet' && (
            <>
              <button
                onClick={() => setStep('success')}
                disabled={isLinking}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleLinkPet}
                disabled={!selectedPetId || isLinking}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  'Link Pet'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
