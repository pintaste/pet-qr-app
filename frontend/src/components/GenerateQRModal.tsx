import React, { useState, useEffect } from 'react'
import { X, QrCode, Loader2, AlertCircle, Globe, Building2 } from 'lucide-react'
import { qrService } from '@/services/qrService'
import { superAdminService, type Tenant } from '@/services/superAdminService'

interface GenerateQRModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * GenerateQRModal Component
 *
 * Modal for generating new QR codes (Super Admin only).
 * Allows assigning QR codes to specific tenants or creating universal codes.
 */
export const GenerateQRModal: React.FC<GenerateQRModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState(1)
  const [batchName, setBatchName] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [useCustomTitle, setUseCustomTitle] = useState(false)
  const [physicalFormat, setPhysicalFormat] = useState('sticker')
  const [qrStyle, setQrStyle] = useState<'scanner' | 'rounded'>('scanner')
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch tenants when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTenants()
    }
  }, [isOpen])

  const fetchTenants = async () => {
    try {
      setIsLoadingTenants(true)
      const fetchedTenants = await superAdminService.listTenants()
      setTenants(fetchedTenants)
    } catch (err) {
      console.error('[GenerateQRModal] Failed to fetch tenants:', err)
      setError('Failed to load tenants list')
    } finally {
      setIsLoadingTenants(false)
    }
  }

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    try {
      console.log('[GenerateQRModal] Generating QR codes:', {
        quantity,
        batchName,
        physicalFormat,
      })

      const result = await qrService.generateQRBatch({
        quantity: quantity,
        batch_id: batchName || undefined,
        physical_format: physicalFormat,
        auto_assign_pins: true,
        assigned_to_tenant_id: selectedTenantId,
      })

      console.log('[GenerateQRModal] Generated QR codes:', result)

      onSuccess()
      handleClose()
    } catch (err) {
      console.error('[GenerateQRModal] Failed to generate QR codes:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate QR codes')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      setQuantity(1)
      setBatchName('')
      setCustomTitle('')
      setUseCustomTitle(false)
      setPhysicalFormat('sticker')
      setQrStyle('scanner')
      setSelectedTenantId(null)
      setError(null)
      onClose()
    }
  }

  // Get the effective title for display
  const getEffectiveTitle = () => {
    if (useCustomTitle && customTitle.trim()) {
      return customTitle.trim()
    }
    if (selectedTenantId !== null) {
      const tenant = tenants.find(t => t.id === selectedTenantId)
      return tenant ? tenant.name : 'Pet QR System'
    }
    return 'Pet QR System'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <QrCode className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Generate QR Codes
          </h2>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              disabled={isGenerating}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter number of QR codes (1-100)"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              How many QR codes would you like to generate? (Max: 100)
            </p>
          </div>

          {/* Batch Name (Optional) */}
          <div>
            <label
              htmlFor="batchName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Batch Name <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              id="batchName"
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              disabled={isGenerating}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g., Summer 2024"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Optional name to help you organize your QR codes
            </p>
          </div>

          {/* Physical Format */}
          <div>
            <label
              htmlFor="physicalFormat"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Physical Format
            </label>
            <select
              id="physicalFormat"
              value={physicalFormat}
              onChange={(e) => setPhysicalFormat(e.target.value)}
              disabled={isGenerating}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="sticker">Sticker</option>
              <option value="tag">Tag</option>
              <option value="card">Card</option>
              <option value="keychain">Keychain</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select the physical format for your QR codes
            </p>
          </div>

          {/* QR Code Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              QR Code Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Scanner Style */}
              <button
                type="button"
                onClick={() => setQrStyle('scanner')}
                disabled={isGenerating}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  qrStyle === 'scanner'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {/* Scanner style preview */}
                <div className="w-16 h-16 mx-auto mb-2 relative">
                  <div className="absolute inset-2 bg-gray-300 dark:bg-gray-600"></div>
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-gray-800 dark:border-gray-200"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-gray-800 dark:border-gray-200"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-gray-800 dark:border-gray-200"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-gray-800 dark:border-gray-200"></div>
                </div>
                <span className={`text-xs font-medium ${
                  qrStyle === 'scanner'
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Scanner
                </span>
                {qrStyle === 'scanner' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full"></div>
                )}
              </button>

              {/* Rounded Style */}
              <button
                type="button"
                onClick={() => setQrStyle('rounded')}
                disabled={isGenerating}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  qrStyle === 'rounded'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {/* Rounded style preview */}
                <div className="w-16 h-16 mx-auto mb-2 relative">
                  <div className="absolute inset-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="absolute inset-0 border-2 border-gray-800 dark:border-gray-200 rounded-lg"></div>
                </div>
                <span className={`text-xs font-medium ${
                  qrStyle === 'rounded'
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Rounded
                </span>
                {qrStyle === 'rounded' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full"></div>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Choose the frame style for downloaded QR codes
            </p>
          </div>

          {/* Tenant Assignment */}
          <div>
            <label
              htmlFor="tenantId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Assign to Tenant <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <select
              id="tenantId"
              value={selectedTenantId === null ? '' : selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value === '' ? null : parseInt(e.target.value))}
              disabled={isGenerating || isLoadingTenants}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingTenants ? 'Loading tenants...' : '🌐 Universal (All Tenants)'}
              </option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  🏢 {tenant.name} ({tenant.subdomain})
                </option>
              ))}
            </select>
            <div className="mt-1 flex items-start gap-2">
              {selectedTenantId === null ? (
                <>
                  <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    Universal QR codes can be activated by any tenant
                  </p>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    These QR codes can only be activated by the selected tenant
                  </p>
                </>
              )}
            </div>
          </div>

          {/* QR Code Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              QR Code Title
            </label>
            <div className="space-y-3">
              {/* Toggle between auto and custom */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="titleType"
                    checked={!useCustomTitle}
                    onChange={() => setUseCustomTitle(false)}
                    disabled={isGenerating}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedTenantId !== null ? 'Use Tenant Name' : 'Default (Pet QR System)'}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="titleType"
                    checked={useCustomTitle}
                    onChange={() => setUseCustomTitle(true)}
                    disabled={isGenerating}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Custom Title</span>
                </label>
              </div>

              {/* Custom title input */}
              {useCustomTitle && (
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter custom title for QR codes"
                  maxLength={30}
                />
              )}

              {/* Preview */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-xs text-gray-500 dark:text-gray-400">Preview:</span>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {getEffectiveTitle()}
                </span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This title will appear on the downloaded QR code image
            </p>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
              Summary
            </h4>
            <ul className="space-y-1 text-sm text-indigo-800 dark:text-indigo-200">
              <li>
                <span className="font-medium">Quantity:</span> {quantity} QR code{quantity !== 1 ? 's' : ''}
              </li>
              {batchName && (
                <li>
                  <span className="font-medium">Batch:</span> {batchName}
                </li>
              )}
              <li>
                <span className="font-medium">Format:</span> {physicalFormat.charAt(0).toUpperCase() + physicalFormat.slice(1)}
              </li>
              <li>
                <span className="font-medium">Assignment:</span>{' '}
                {selectedTenantId === null ? (
                  <span className="text-indigo-600 dark:text-indigo-300">🌐 Universal (All Tenants)</span>
                ) : (
                  <span className="text-purple-600 dark:text-purple-300">
                    🏢 {tenants.find(t => t.id === selectedTenantId)?.name || 'Selected Tenant'}
                  </span>
                )}
              </li>
              <li>
                <span className="font-medium">Title:</span>{' '}
                <span className="text-indigo-600 dark:text-indigo-300">{getEffectiveTitle()}</span>
              </li>
              <li>
                <span className="font-medium">Style:</span>{' '}
                <span className={qrStyle === 'scanner' ? 'text-indigo-600 dark:text-indigo-300' : 'text-purple-600 dark:text-purple-300'}>
                  {qrStyle === 'scanner' ? 'Scanner' : 'Rounded'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || quantity < 1}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5" />
                Generate {quantity > 1 ? `${quantity} Codes` : 'Code'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
