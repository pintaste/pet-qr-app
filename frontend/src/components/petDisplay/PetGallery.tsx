/**
 * PetGallery component for displaying pet photos with navigation.
 * Includes main photo display, navigation arrows, thumbnail strip, and image counter.
 */

import React from 'react'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

/**
 * Props interface for PetGallery component.
 */
interface PetGalleryProps {
  /** Array of photo URLs to display */
  photos: string[]
  /** Currently selected image index */
  currentImageIndex: number
  /** Handler for navigating to previous image */
  onPreviousImage: () => void
  /** Handler for navigating to next image */
  onNextImage: () => void
  /** Handler for opening fullscreen gallery */
  onOpenFullscreen: (index: number) => void
  /** Whether to show navigation controls */
  showControls: boolean
  /** Handler for mouse entering gallery area */
  onMouseEnter: () => void
  /** Handler for mouse leaving gallery area */
  onMouseLeave: () => void
  /** Handler for thumbnail click */
  onThumbnailClick: (index: number) => void
  /** Pet's name for alt text */
  petName: string
}

/**
 * Gallery component for displaying pet photos with interactive navigation.
 *
 * Features:
 * - Main photo display with click-to-fullscreen
 * - Previous/next navigation arrows
 * - Thumbnail strip for direct image selection
 * - Image counter indicator
 * - Auto-hiding controls on mouse leave
 *
 * @param props - Component props
 * @returns JSX element for the pet gallery
 */
export const PetGallery: React.FC<PetGalleryProps> = ({
  photos,
  currentImageIndex,
  onPreviousImage,
  onNextImage,
  onOpenFullscreen,
  showControls,
  onMouseEnter,
  onMouseLeave,
  onThumbnailClick,
  petName
}) => {
  // Default photo if no photos provided
  const currentPhoto = photos[currentImageIndex] || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=250&fit=crop'

  return (
    <div
      className="pet-gallery relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Main Photo Display */}
      <div className="gallery-main relative w-full h-[250px] overflow-hidden rounded-t-3xl">
        <img
          src={currentPhoto}
          alt={`${petName} main photo`}
          className="gallery-main-image w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
          id="mainImage"
          onClick={() => onOpenFullscreen(currentImageIndex)}
        />

        {/* Expand Icon Button */}
        <button
          onClick={() => onOpenFullscreen(currentImageIndex)}
          className={`absolute bottom-3 right-3 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
            showControls ? 'opacity-70 hover:opacity-100' : 'opacity-0'
          }`}
          title="View fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Navigation Controls - Only show if multiple photos */}
        {photos.length > 1 && (
          <>
            {/* Previous Arrow */}
            <button
              onClick={onPreviousImage}
              className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                showControls ? 'opacity-60 hover:opacity-100' : 'opacity-0'
              }`}
              title="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next Arrow */}
            <button
              onClick={onNextImage}
              className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                showControls ? 'opacity-60 hover:opacity-100' : 'opacity-0'
              }`}
              title="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Image Counter */}
            <div className={`gallery-counter absolute top-3 right-3 bg-black bg-opacity-40 text-white px-2 py-1 rounded-xl text-xs font-medium backdrop-blur-sm z-10 transition-all duration-300 ${
              showControls ? 'opacity-70 hover:opacity-100' : 'opacity-0'
            }`}>
              <span id="currentImage">{currentImageIndex + 1}</span> / <span id="totalImages">{photos.length}</span>
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip - Only show if multiple photos */}
      {photos.length > 1 && (
        <div className="gallery-thumbnails flex gap-2 p-4 bg-white dark:bg-gray-800 overflow-x-auto rounded-b-3xl">
          {photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`${petName} photo ${index + 1}`}
              className={`gallery-thumb w-[60px] h-[60px] object-cover rounded-xl cursor-pointer transition-all duration-200 border-2 flex-shrink-0 ${
                index === currentImageIndex
                  ? 'border-gray-300 dark:border-gray-500 scale-105 opacity-100'
                  : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
              }`}
              onClick={() => onThumbnailClick(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PetGallery
