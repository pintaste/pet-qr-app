import React, { useState, useEffect } from 'react'
import { X, Download, Copy, Check, LinkIcon, Calendar, QrCode as QrIcon, PawPrint, Loader2 } from 'lucide-react'
import { TenantQRCode } from '@/services/tenantAdminService'
import { generateQRImageUrl, downloadSingleQR } from '@/utils/qrDownloadUtils'

// ===== VIEW QR CODE MODAL =====
interface ViewTenantQRModalProps {
  isOpen: boolean
  qr: TenantQRCode | null
  onClose: () => void
}

export const ViewTenantQRModal: React.FC<ViewTenantQRModalProps> = ({
  isOpen,
  qr,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<'code' | 'pin' | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Generate QR code image URL when modal opens
  useEffect(() => {
    const loadQRImage = async () => {
      if (isOpen && qr) {
        setIsLoadingImage(true)
        try {
          const url = await generateQRImageUrl(qr.code, 400)
          setImageUrl(url)
        } catch (error) {
          console.error('Error generating QR image:', error)
          setImageUrl('')
        } finally {
          setIsLoadingImage(false)
        }
      } else {
        setImageUrl('')
      }
    }
    loadQRImage()
  }, [isOpen, qr])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopiedField(null)
    }
  }, [isOpen])

  if (!isOpen || !qr) return null

  const handleCopy = async (text: string, field: 'code' | 'pin') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadSingleQR({ code: qr.code, pin: qr.pin, batch_id: qr.batch_id })
    } catch (error) {
      console.error('Failed to download QR:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <QrIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            QR Code Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code Image */}
          <div className="flex justify-center">
            <div className="relative bg-white p-6 rounded-2xl shadow-lg">
              {isLoadingImage ? (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse">
                  <QrIcon className="w-16 h-16 text-gray-400" />
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt={`QR Code ${qr.code}`}
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect width="256" height="256" fill="%23f3f4f6"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="20"%3EQR Code%3C/text%3E%3C/svg%3E'
                  }}
                />
              )}
            </div>
          </div>

          {/* Linked Pet Info */}
          {qr.pet_name && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <LinkIcon className="w-5 h-5" />
                <span className="font-semibold">
                  Linked to: <span className="font-bold">{qr.pet_name}</span>
                </span>
              </div>
              {qr.user_email && (
                <p className="text-sm text-green-700 dark:text-green-400 mt-1 ml-7">
                  Owner: {qr.user_email}
                </p>
              )}
            </div>
          )}

          {/* QR Code Information */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
              {/* Code */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  QR Code
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg font-mono text-gray-900 dark:text-white">
                    {qr.code}
                  </code>
                  <button
                    onClick={() => handleCopy(qr.code, 'code')}
                    className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                    title="Copy code"
                  >
                    {copiedField === 'code' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* PIN */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  PIN
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg font-mono text-gray-900 dark:text-white">
                    {qr.pin}
                  </code>
                  <button
                    onClick={() => handleCopy(qr.pin, 'pin')}
                    className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                    title="Copy PIN"
                  >
                    {copiedField === 'pin' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Status
                </label>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    qr.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : qr.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {qr.status.charAt(0).toUpperCase() + qr.status.slice(1)}
                </span>
              </div>

              {/* Created Date */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Created
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(qr.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Batch ID */}
              {qr.batch_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    Batch ID
                  </label>
                  <code className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm font-mono text-gray-900 dark:text-white">
                    {qr.batch_id}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download QR Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== LINK TO PET MODAL =====
interface LinkToPetModalProps {
  isOpen: boolean
  qr: TenantQRCode | null
  onClose: () => void
  onSuccess: () => void
}

export const LinkToPetModal: React.FC<LinkToPetModalProps> = ({
  isOpen,
  qr,
  onClose,
  onSuccess,
}) => {
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !qr) return null

  const handleLink = async () => {
    setIsLinking(true)
    setError(null)
    try {
      // TODO: Implement actual link to pet API call
      // This would typically open a pet selector or accept a pet ID
      console.log('Link QR to pet:', qr.code)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated delay
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link QR code to pet')
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <PawPrint className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Link to Pet
          </h2>
          <button
            onClick={onClose}
            disabled={isLinking}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">QR Code:</p>
            <p className="font-mono font-semibold text-gray-900 dark:text-white">{qr.code}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400">
            This feature will allow you to link this QR code to a pet in your store.
            Pet selection functionality coming soon.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLinking}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={isLinking}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isLinking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <PawPrint className="w-5 h-5" />
                Link to Pet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
