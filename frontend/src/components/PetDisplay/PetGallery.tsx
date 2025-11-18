import React from 'react'
import { Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'

interface PetGalleryProps {
  photos: string[]
  currentIndex: number
  petName: string
  showControls: boolean
  onImageClick: (index: number) => void
  onPrevious: () => void
  onNext: () => void
  onOpenFullscreen: (index: number) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

/**
 * Pet Gallery Component - Image carousel with navigation.
 *
 * Features:
 * - Main image display with navigation arrows
 * - Thumbnail strip below main image
 * - Auto-hiding controls
 * - Fullscreen view button
 * - Image counter
 */
const PetGallery: React.FC<PetGalleryProps> = ({
  photos,
  currentIndex,
  petName,
  showControls,
  onImageClick,
  onPrevious,
  onNext,
  onOpenFullscreen,
  onMouseEnter,
  onMouseLeave,
}) => {
  const currentPhoto =
    photos[currentIndex] ||
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=250&fit=crop'

  return (
    <div className="pet-gallery relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="gallery-main relative w-full h-[250px] overflow-hidden rounded-t-3xl">
        <img
          src={currentPhoto}
          alt={`${petName} main photo`}
          className="gallery-main-image w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
          id="mainImage"
          onClick={() => onOpenFullscreen(currentIndex)}
        />
        {/* Expand icon hint - moved to bottom right with visibility control */}
        <button
          onClick={() => onOpenFullscreen(currentIndex)}
          className={`absolute bottom-3 right-3 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
            showControls ? 'opacity-70 hover:opacity-100' : 'opacity-0'
          }`}
          title="View fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        {photos.length > 1 && (
          <>
            {/* Navigation Arrows - improved styling */}
            <button
              onClick={onPrevious}
              className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                showControls ? 'opacity-60 hover:opacity-100' : 'opacity-0'
              }`}
              title="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onNext}
              className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10 ${
                showControls ? 'opacity-60 hover:opacity-100' : 'opacity-0'
              }`}
              title="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {/* Image Counter - improved styling with visibility control */}
            <div
              className={`gallery-counter absolute top-3 right-3 bg-black bg-opacity-40 text-white px-2 py-1 rounded-xl text-xs font-medium backdrop-blur-sm z-10 transition-all duration-300 ${
                showControls ? 'opacity-70 hover:opacity-100' : 'opacity-0'
              }`}
            >
              <span id="currentImage">{currentIndex + 1}</span> /{' '}
              <span id="totalImages">{photos.length}</span>
            </div>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="gallery-thumbnails flex gap-2 p-4 bg-white dark:bg-gray-800 overflow-x-auto rounded-b-3xl">
          {photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`${petName} photo ${index + 1}`}
              className={`gallery-thumb w-[60px] h-[60px] object-cover rounded-xl cursor-pointer transition-all duration-200 border-2 flex-shrink-0 ${
                index === currentIndex
                  ? 'border-gray-300 dark:border-gray-500 scale-105 opacity-100'
                  : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
              }`}
              onClick={() => onImageClick(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PetGallery
