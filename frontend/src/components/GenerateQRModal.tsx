import React, { useState, useEffect } from 'react'
import { X, QrCode, Loader2, AlertCircle } from 'lucide-react'
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
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
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
    // Validation
    if (selectedTenantId === null) {
      setError('Please select a tenant')
      return
    }

    setError(null)
    setIsGenerating(true)
    setGenerationProgress(0)

    // Start progress simulation
    const estimatedTime = Math.max(2000, quantity * 3) // ~3ms per QR code, minimum 2 seconds
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 95) return prev // Cap at 95% until complete
        return prev + (100 / (estimatedTime / 100))
      })
    }, 100)

    try {
      console.log('[GenerateQRModal] Generating QR codes:', {
        quantity,
        batchName,
        physicalFormat,
        selectedTenantId,
      })

      const result = await qrService.generateQRBatch({
        quantity: quantity,
        batch_id: batchName || undefined,
        physical_format: physicalFormat,
        auto_assign_pins: true,
        assigned_to_tenant_id: selectedTenantId,
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      console.log('[GenerateQRModal] Generated QR codes:', result)

      // Brief delay to show 100%
      setTimeout(() => {
        setIsGenerating(false)
        onSuccess()
        handleClose()
      }, 500)
    } catch (err) {
      clearInterval(progressInterval)
      setGenerationProgress(0)
      console.error('[GenerateQRModal] Failed to generate QR codes:', err)
      // Handle different error types
      let errorMessage = 'Failed to generate QR codes'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object') {
        // Handle error objects with detail or message properties
        const errObj = err as Record<string, any>
        if (errObj.detail) {
          errorMessage = typeof errObj.detail === 'string' ? errObj.detail : JSON.stringify(errObj.detail)
        } else if (errObj.message) {
          errorMessage = typeof errObj.message === 'string' ? errObj.message : JSON.stringify(errObj.message)
        }
      }
      setError(errorMessage)
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
      setSelectedTenantId(null)
      setGenerationProgress(0)
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Generate QR Codes
          </h2>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Quantity and Batch Name - 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                max="5000"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(5000, parseInt(e.target.value) || 1)))}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                placeholder="1-5000"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maximum: 5,000 per batch</p>
            </div>

            {/* Batch Name */}
            <div>
              <label
                htmlFor="batchName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Batch Name
              </label>
              <input
                id="batchName"
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                placeholder="e.g., Summer 2024"
              />
            </div>
          </div>

          {/* Physical Format */}
          <div>
            <label
              htmlFor="physicalFormat"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Physical Format
            </label>
            <select
              id="physicalFormat"
              value={physicalFormat}
              onChange={(e) => setPhysicalFormat(e.target.value)}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <option value="sticker">Sticker</option>
              <option value="tag">Tag</option>
              <option value="card">Card</option>
              <option value="keychain">Keychain</option>
            </select>
          </div>

          {/* Tenant Assignment */}
          <div>
            <label
              htmlFor="tenantId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Assign to Tenant <span className="text-red-500">*</span>
            </label>
            <select
              id="tenantId"
              value={selectedTenantId === null ? '' : selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value === '' ? null : parseInt(e.target.value))}
              disabled={isGenerating || isLoadingTenants}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <option value="">
                {isLoadingTenants ? 'Loading...' : 'Select a tenant...'}
              </option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.subdomain})
                </option>
              ))}
            </select>
          </div>

          {/* QR Code Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              QR Code Title
            </label>
            <div className="flex items-center gap-2 mb-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="titleType"
                  checked={!useCustomTitle}
                  onChange={() => setUseCustomTitle(false)}
                  disabled={isGenerating}
                  className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {selectedTenantId !== null ? 'Tenant Name' : 'Default'}
                </span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="titleType"
                  checked={useCustomTitle}
                  onChange={() => setUseCustomTitle(true)}
                  disabled={isGenerating}
                  className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Custom</span>
              </label>
            </div>
            {useCustomTitle && (
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm mb-2"
                placeholder="Enter custom title"
                maxLength={30}
              />
            )}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
              <span className="text-gray-500 dark:text-gray-400">Title:</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {getEffectiveTitle()}
              </span>
            </div>
          </div>

          {/* Summary - Compact grid */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-indigo-800 dark:text-indigo-200">
              <div>
                <span className="font-medium">Quantity:</span> {quantity}
              </div>
              <div>
                <span className="font-medium">Format:</span> {physicalFormat.charAt(0).toUpperCase() + physicalFormat.slice(1)}
              </div>
              {batchName && (
                <div className="col-span-2">
                  <span className="font-medium">Batch:</span> {batchName}
                </div>
              )}
              <div className="col-span-2">
                <span className="font-medium">Tenant:</span>{' '}
                {selectedTenantId === null ? (
                  <span className="text-indigo-600 dark:text-indigo-300">Universal</span>
                ) : (
                  <span className="text-purple-600 dark:text-purple-300">
                    {tenants.find(t => t.id === selectedTenantId)?.name || 'Selected'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || quantity < 1 || selectedTenantId === null}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {Math.round(generationProgress)}%
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
