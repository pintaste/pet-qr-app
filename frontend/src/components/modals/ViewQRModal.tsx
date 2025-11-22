/**
 * ViewQRModal Component
 *
 * Modal for viewing QR code details including the QR image, PIN, status, and batch info.
 */

import React, { useEffect, useState } from 'react'
import {
  QrCode,
  X,
  Loader2,
  Copy,
  ExternalLink,
  Download
} from 'lucide-react'
import { QRCodeData } from '@/components/QRCard'
import { generateQRImageUrl, downloadSingleQR } from '@/utils/qrDownloadUtils'

interface ViewQRModalProps {
  isOpen: boolean
  qr: QRCodeData | null
  onClose: () => void
}

/**
 * Modal component for displaying QR code details
 */
export const ViewQRModal: React.FC<ViewQRModalProps> = ({
  isOpen,
  qr,
  onClose
}) => {
  const [qrImageUrl, setQrImageUrl] = useState<string>('')

  // Generate QR code image when modal opens
  useEffect(() => {
    const generateImage = async () => {
      if (isOpen && qr) {
        try {
          const dataUrl = await generateQRImageUrl(qr.code)
          setQrImageUrl(dataUrl)
        } catch (error) {
          console.error('Error generating QR code image:', error)
          setQrImageUrl('')
        }
      } else {
        setQrImageUrl('')
      }
    }
    generateImage()
  }, [isOpen, qr])

  if (!isOpen || !qr) return null

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/qr/${qr.code}`)
  }

  const handleOpenInNewTab = () => {
    window.open(`${window.location.origin}/qr/${qr.code}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            QR Code Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* QR Code Display */}
          <div className="flex justify-center p-3 bg-white rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-center">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt={`QR Code ${qr.code}`}
                  className="w-32 h-32 mx-auto"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              )}
              <p className="font-mono font-bold text-sm text-gray-900 dark:text-white mt-2">{qr.code}</p>
            </div>
          </div>

          {/* Details - Compact grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-gray-500 dark:text-gray-400">PIN</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{qr.pin}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-gray-500 dark:text-gray-400">Status</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                qr.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                qr.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
              }`}>{qr.status}</span>
            </div>
            {qr.batch_id && (
              <div className="col-span-2 flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <span className="text-gray-500 dark:text-gray-400">Batch</span>
                <span className="font-mono text-gray-900 dark:text-white truncate ml-2">{qr.batch_id}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-gray-500 dark:text-gray-400">Created</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(qr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-gray-500 dark:text-gray-400">Pet</span>
              <span className="text-gray-900 dark:text-white">
                {qr.pet_id ? `#${qr.pet_id}` : '-'}
              </span>
            </div>
          </div>

          {/* Copy URL - Inline */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/qr/${qr.code}`}
              className="flex-1 px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white"
            />
            <button
              onClick={handleCopyUrl}
              className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded transition-colors"
              title="Copy URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer - Compact download buttons */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => downloadSingleQR(qr, 'scanner')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Scanner
            </button>
            <button
              onClick={() => downloadSingleQR(qr, 'rounded')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Rounded
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewQRModal
