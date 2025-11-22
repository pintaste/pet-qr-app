/**
 * FullscreenGalleryModal component for displaying pet photos in fullscreen mode.
 * Provides navigation controls, download functionality, and pet info overlay.
 */

import React from 'react'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { PetInfo } from '@/types/petDisplay.types'

interface FullscreenGalleryModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Array of photo URLs */
  photos: string[]
  /** Current image index in fullscreen mode */
  currentImageIndex: number
  /** Pet information for overlay display */
  petInfo: PetInfo | null
  /** Whether to show navigation controls */
  showControls: boolean
  /** Close the modal */
  onClose: () => void
  /** Navigate to previous image */
  onPrevious: () => void
  /** Navigate to next image */
  onNext: () => void
  /** Handle mouse movement for controls visibility */
  onMouseMove: () => void
  /** Download current image with watermark */
  onDownload: (imageUrl: string, imageIndex: number) => void
}

/**
 * Full screen image viewer modal with navigation and download controls.
 *
 * @param props - Component properties
 * @returns Rendered fullscreen gallery modal or null if closed
 */
export const FullscreenGalleryModal: React.FC<FullscreenGalleryModalProps> = ({
  isOpen,
  photos,
  currentImageIndex,
  petInfo,
  showControls,
  onClose,
  onPrevious,
  onNext,
  onMouseMove,
  onDownload
}) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex items-center justify-center"
      onClick={onClose}
      onMouseMove={onMouseMove}
    >
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Close button - with auto-hide */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 bg-black bg-opacity-40 hover:bg-opacity-70 text-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
            showControls ? 'opacity-80 hover:opacity-100' : 'opacity-0'
          }`}
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Download button - with auto-hide */}
        <button
          onClick={() => onDownload(photos[currentImageIndex], currentImageIndex)}
          className={`absolute top-4 right-16 bg-black bg-opacity-40 hover:bg-opacity-70 text-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
            showControls ? 'opacity-80 hover:opacity-100' : 'opacity-0'
          }`}
          title="Download with watermark"
        >
          <Download className="w-5 h-5" />
        </button>

        {/* Navigation arrows for fullscreen - with auto-hide */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPrevious()
              }}
              className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                showControls ? 'opacity-70 hover:opacity-100' : 'opacity-0'
              }`}
              title="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNext()
              }}
              className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                showControls ? 'opacity-70 hover:opacity-100' : 'opacity-0'
              }`}
              title="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image counter - with auto-hide */}
        {photos.length > 1 && (
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1.5 rounded-xl text-sm font-medium backdrop-blur-sm z-10 transition-all duration-300 ${
            showControls ? 'opacity-80' : 'opacity-0'
          }`}>
            <span>{currentImageIndex + 1}</span> / <span>{photos.length}</span>
          </div>
        )}

        {/* Pet info overlay - with auto-hide */}
        <div className={`absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-xl backdrop-blur-sm z-10 max-w-xs transition-all duration-300 ${
          showControls ? 'opacity-80' : 'opacity-0'
        }`}>
          <h3 className="text-lg font-bold mb-1">{petInfo?.name}</h3>
          <p className="text-gray-300 text-xs">{petInfo?.breed} • {Math.floor((petInfo?.age || 0) / 12)} years old</p>
          {petInfo?.description && (
            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{petInfo.description}</p>
          )}
        </div>

        {/* Main fullscreen image */}
        <img
          src={photos[currentImageIndex]}
          alt={`${petInfo?.name} photo ${currentImageIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}

export default FullscreenGalleryModal
