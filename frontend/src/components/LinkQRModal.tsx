/**
 * Link QR Code Modal Component
 *
 * Allows users to link an available QR code to their pet.
 */

import React, { useState, useEffect } from 'react'
import { X, QrCode, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { qrService } from '@/services/qrService'
import { petService } from '@/services/petService'

interface QRCodeOption {
  id: number
  code: string
  status: string
  created_at: string
}

interface LinkQRModalProps {
  isOpen: boolean
  petId: number
  petName: string
  onClose: () => void
  onSuccess: () => void
}

export const LinkQRModal: React.FC<LinkQRModalProps> = ({
  isOpen,
  petId,
  petName,
  onClose,
  onSuccess,
}) => {
  const [qrCodes, setQrCodes] = useState<QRCodeOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedQRId, setSelectedQRId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch available QR codes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableQRCodes()
      setSearchQuery('')
      setSelectedQRId(null)
      setError(null)
    }
  }, [isOpen])

  const fetchAvailableQRCodes = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await qrService.getAvailableQRCodes()
      setQrCodes(data || [])
    } catch (err) {
      console.error('Error fetching QR codes:', err)
      setError(err instanceof Error ? err.message : 'Failed to load QR codes')
      setQrCodes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkQR = async () => {
    if (!selectedQRId) return

    setIsLinking(true)
    setError(null)

    try {
      await petService.linkQRCode(petId, selectedQRId)

      // Success - refresh pet data and close modal
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error linking QR code:', err)
      setError(err instanceof Error ? err.message : 'Failed to link QR code')
    } finally {
      setIsLinking(false)
    }
  }

  const filteredQRCodes = qrCodes.filter((qr) =>
    qr.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-light text-gray-900 dark:text-white">
              Link QR Code
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Assign a QR code to <span className="font-medium text-gray-700 dark:text-gray-300">{petName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-600 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search QR codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            )}

            {/* No QR Codes */}
            {!isLoading && filteredQRCodes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mb-4">
                  <QrCode className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-light text-gray-900 dark:text-white mb-2">
                  No Available QR Codes
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  {searchQuery
                    ? 'No QR codes match your search. Try a different search term.'
                    : 'You don\'t have any unassigned QR codes. Purchase QR codes to link them to your pets.'}
                </p>
              </div>
            )}

            {/* QR Code List */}
            {!isLoading && filteredQRCodes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Select a QR code to link to {petName}:
                </p>
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                  {filteredQRCodes.map((qr) => (
                    <button
                      key={qr.id}
                      onClick={() => setSelectedQRId(qr.id)}
                      className={`relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        selectedQRId === qr.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-600'
                      }`}
                    >
                      <div className={`p-3 rounded-lg ${
                        selectedQRId === qr.id
                          ? 'bg-indigo-500'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <QrCode className={`w-6 h-6 ${
                          selectedQRId === qr.id
                            ? 'text-white'
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-mono font-semibold ${
                          selectedQRId === qr.id
                            ? 'text-indigo-900 dark:text-indigo-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {qr.code}
                        </p>
                        <p className={`text-xs ${
                          selectedQRId === qr.id
                            ? 'text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          Created: {new Date(qr.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedQRId === qr.id && (
                        <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            disabled={isLinking}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLinkQR}
            disabled={!selectedQRId || isLinking}
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLinking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Linking...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Link QR Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
