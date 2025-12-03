import React, { useState, useEffect } from 'react'
import { X, Download, Copy, Check, LinkIcon, Calendar, QrCode as QrIcon } from 'lucide-react'
import { QRCodeData } from './QRCard'
import { generateQRImageUrl } from '@/utils/qrDownloadUtils'

interface ViewQRModalProps {
  isOpen: boolean
  qr: QRCodeData | null
  onClose: () => void
  onDownload?: (qr: QRCodeData) => void
}

/**
 * ViewQRModal Component
 *
 * Modal for viewing QR code details and downloading the QR code image.
 */
export const ViewQRModal: React.FC<ViewQRModalProps> = ({
  isOpen,
  qr,
  onClose,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isLoadingImage, setIsLoadingImage] = useState(false)

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

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
    }
  }, [isOpen])

  if (!isOpen || !qr) return null

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(qr.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleCopyPIN = async () => {
    try {
      await navigator.clipboard.writeText(qr.pin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy PIN:', error)
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload(qr)
    }
  }

  const isLinked = !!qr.pet_id

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
                    // Fallback if image fails to load
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect width="256" height="256" fill="%23f3f4f6"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="20"%3EQR Code%3C/text%3E%3C/svg%3E'
                  }}
                />
              )}
            </div>
          </div>

          {/* Status Badge */}
          {isLinked && qr.pet_name && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <LinkIcon className="w-5 h-5" />
                <span className="font-semibold">
                  Linked to: <span className="font-bold">{qr.pet_name}</span>
                </span>
              </div>
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
                    onClick={handleCopyCode}
                    className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
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
                    onClick={handleCopyPIN}
                    className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                    title="Copy PIN"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
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
                    qr.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {qr.status}
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
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  )
}
