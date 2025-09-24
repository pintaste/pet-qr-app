import React, { useState, useRef, useEffect } from 'react'
import { X, Camera, Upload, Loader2 } from 'lucide-react'
import QrScanner from 'qr-scanner'

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (result: string) => void
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera')
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasCamera, setHasCamera] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  // Initialize camera scanner
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') return

    const initCamera = async () => {
      try {
        setIsScanning(true)
        setError(null)

        if (videoRef.current) {
          scannerRef.current = new QrScanner(
            videoRef.current,
            (result) => {
              onScanSuccess(result.data)
              handleClose()
            },
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: 'environment'
            }
          )

          await scannerRef.current.start()
          setIsScanning(false)
        }
      } catch (err) {
        console.error('Camera initialization failed:', err)
        setError('Camera access denied or not available')
        setHasCamera(false)
        setActiveTab('upload')
        setIsScanning(false)
      }
    }

    initCamera()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy()
        scannerRef.current = null
      }
    }
  }, [isOpen, activeTab, onScanSuccess])

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.destroy()
      scannerRef.current = null
    }
    setError(null)
    setIsScanning(false)
    onClose()
  }

  const processFile = async (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    try {
      setIsScanning(true)
      setError(null)

      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true
      })

      onScanSuccess(result.data)
      handleClose()
    } catch (err) {
      console.error('QR scan failed:', err)
      setError('No QR code found in the image')
    } finally {
      setIsScanning(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) {
      await processFile(files[0])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scan QR Code
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('camera')}
            disabled={!hasCamera}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'camera'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            } ${!hasCamera ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            Camera
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {activeTab === 'camera' && hasCamera && (
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Position the QR code within the camera view
              </p>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {isDragOver ? 'Drop QR code image here' : 'Upload QR code image'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {isDragOver
                    ? 'Release to upload the image'
                    : 'Click to select or drag and drop a file from your device'
                  }
                </p>
                {isScanning && (
                  <div className="mt-4 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm">Scanning...</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Make sure the QR code is clearly visible and well-lit
          </p>
        </div>
      </div>
    </div>
  )
}

export default QRScannerModal