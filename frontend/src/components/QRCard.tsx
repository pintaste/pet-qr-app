import React, { useEffect, useState } from 'react'
import { QrCode, LinkIcon, Calendar, Download, Eye, Edit, Trash2, Pin, Link2, Unlink } from 'lucide-react'
import { generateQRDataUrl } from '@/utils/qrDownloadUtils'

export interface QRCodeData {
  id: number
  code: string
  pin: string
  pet_id?: number
  pet_name?: string
  status: string
  batch_id?: string
  activated_at?: string
  created_at: string
  updated_at?: string
}

interface QRCardProps {
  qr: QRCodeData
  onView?: (qr: QRCodeData) => void
  onDownload?: (qr: QRCodeData) => void
  onEdit?: (qr: QRCodeData) => void
  onDelete?: (qr: QRCodeData) => void
  onLink?: () => void
  onUnlink?: () => void
  onClick?: (qr: QRCodeData) => void
}

/**
 * QRCard Component
 *
 * Displays a QR code in a card format with status, linked pet info, and action buttons.
 */
export const QRCard: React.FC<QRCardProps> = ({
  qr,
  onView,
  onDownload,
  onEdit,
  onDelete,
  onLink,
  onUnlink,
  onClick,
}) => {
  const [qrImageUrl, setQrImageUrl] = useState<string>('')
  const isLinked = !!qr.pet_id

  // Generate QR code image on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await generateQRDataUrl(qr.code, 120)
        setQrImageUrl(dataUrl)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }
    generateQR()
  }, [qr.code])

  // Format created date
  const createdDate = new Date(qr.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Status badge color
  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  }

  const statusColor = statusColors[qr.status as keyof typeof statusColors] || statusColors.inactive

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
        isLinked
          ? 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(qr)}
    >
      {/* Card Content */}
      <div className="p-6">
        {/* Header with QR Code Image and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Actual QR Code Image */}
            <div
              className={`rounded-xl overflow-hidden border-2 ${
                isLinked
                  ? 'border-indigo-200 dark:border-indigo-700'
                  : 'border-gray-200 dark:border-gray-600'
              }`}
            >
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt={`QR Code ${qr.code}`}
                  className="w-16 h-16"
                />
              ) : (
                <div className={`w-16 h-16 flex items-center justify-center ${
                  isLinked
                    ? 'bg-indigo-100 dark:bg-indigo-900/30'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <QrCode
                    className={`w-8 h-8 ${
                      isLinked
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm font-mono">
                {qr.code}
              </h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusColor} mt-1`}>
                {qr.status}
              </span>
            </div>
          </div>

          {/* Linked Badge */}
          {isLinked && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
              <LinkIcon className="w-4 h-4" />
              <span>Linked</span>
            </div>
          )}
        </div>

        {/* Pet Info (if linked) */}
        {isLinked && qr.pet_name && (
          <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                Linked to: <span className="font-bold">{qr.pet_name}</span>
              </span>
            </div>
          </div>
        )}

        {/* QR Details */}
        <div className="space-y-2 mb-4">
          {/* PIN */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">PIN:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {qr.pin}
            </span>
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Created:</span>
            <span className="text-gray-700 dark:text-gray-300">{createdDate}</span>
          </div>

          {/* Batch ID */}
          {qr.batch_id && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">Batch:</span>
              <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">
                {qr.batch_id}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onView(qr)
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
          )}

          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDownload(qr)
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 text-sm font-medium"
              title="Download QR Code"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(qr)
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 text-sm font-medium"
              title="Edit QR Code"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(qr)
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors duration-200 text-sm font-medium"
              title="Delete QR Code"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {onLink && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLink()
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg transition-colors duration-200 text-sm font-medium"
              title="Link to Pet"
            >
              <Link2 className="w-4 h-4" />
            </button>
          )}

          {onUnlink && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onUnlink()
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg transition-colors duration-200 text-sm font-medium"
              title="Unlink from Pet"
            >
              <Unlink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * NoQRCodesCard Component
 *
 * Empty state card shown when no QR codes exist.
 */
export const NoQRCodesCard: React.FC<{ onGenerate?: () => void }> = ({ onGenerate }) => {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <QrCode className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No QR Codes Yet
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
        You haven't activated any QR codes yet. Activate your first QR code to start linking your pets.
      </p>
      {onGenerate && (
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors duration-200"
        >
          <QrCode className="w-5 h-5" />
          Activate QR Code
        </button>
      )}
    </div>
  )
}

/**
 * QRCardSkeleton Component
 *
 * Loading skeleton for QR cards.
 */
export const QRCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  )
}
