import { useState, useEffect, useCallback } from 'react'
import { UseGalleryControlsReturn } from '@/types/petDisplay.types'

/**
 * Custom hook for managing gallery navigation and fullscreen controls.
 *
 * This hook handles:
 * - Image navigation (previous/next) for both gallery and fullscreen modes
 * - Keyboard navigation (arrow keys, escape)
 * - Fullscreen open/close functionality
 * - Auto-hide controls functionality
 * - Mouse event handlers for control visibility
 *
 * @param totalImages - Total number of images in the gallery
 * @returns Object containing all gallery control states and handlers
 *
 * @example
 * ```tsx
 * const {
 *   currentImageIndex,
 *   isFullscreenOpen,
 *   handleNextImage,
 *   openFullscreenGallery,
 *   // ... other controls
 * } = useGalleryControls(petInfo?.photo_urls?.length || 0)
 * ```
 */
export function useGalleryControls(totalImages: number): UseGalleryControlsReturn {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<number | null>(null)

  /**
   * Resets the auto-hide timeout for controls.
   * Controls will be shown immediately and hidden after 3 seconds of inactivity.
   */
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }
    setShowControls(true)
    const timeout = window.setTimeout(() => {
      setShowControls(false)
    }, 3000) // Hide after 3 seconds of inactivity
    setControlsTimeout(timeout)
  }, [controlsTimeout])

  /**
   * Navigate to the previous image in the gallery.
   */
  const handlePreviousImage = useCallback(() => {
    if (totalImages <= 1) return
    setCurrentImageIndex(prev => prev === 0 ? totalImages - 1 : prev - 1)
  }, [totalImages])

  /**
   * Navigate to the next image in the gallery.
   */
  const handleNextImage = useCallback(() => {
    if (totalImages <= 1) return
    setCurrentImageIndex(prev => prev === totalImages - 1 ? 0 : prev + 1)
  }, [totalImages])

  /**
   * Navigate to the previous image in fullscreen mode.
   */
  const handleFullscreenPrevious = useCallback(() => {
    if (totalImages <= 1) return
    setFullscreenImageIndex(prev => prev === 0 ? totalImages - 1 : prev - 1)
  }, [totalImages])

  /**
   * Navigate to the next image in fullscreen mode.
   */
  const handleFullscreenNext = useCallback(() => {
    if (totalImages <= 1) return
    setFullscreenImageIndex(prev => prev === totalImages - 1 ? 0 : prev + 1)
  }, [totalImages])

  /**
   * Opens the fullscreen gallery at the specified image index.
   *
   * @param index - The image index to open in fullscreen
   */
  const openFullscreenGallery = useCallback((index: number) => {
    setFullscreenImageIndex(index)
    setIsFullscreenOpen(true)
    setShowControls(true)
    resetControlsTimeout()
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
  }, [resetControlsTimeout])

  /**
   * Closes the fullscreen gallery and restores normal scroll behavior.
   */
  const closeFullscreenGallery = useCallback(() => {
    setIsFullscreenOpen(false)
    setShowControls(true)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
      setControlsTimeout(null)
    }
    // Restore body scroll
    document.body.style.overflow = 'unset'
  }, [controlsTimeout])

  /**
   * Handler for when mouse enters the gallery area.
   * Shows controls and clears any hide timeout.
   */
  const handleGalleryMouseEnter = useCallback(() => {
    setShowControls(true)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
      setControlsTimeout(null)
    }
  }, [controlsTimeout])

  /**
   * Handler for when mouse leaves the gallery area.
   * Hides controls and clears any timeout.
   */
  const handleGalleryMouseLeave = useCallback(() => {
    setShowControls(false)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
      setControlsTimeout(null)
    }
  }, [controlsTimeout])

  /**
   * Handler for mouse movement in fullscreen mode.
   * Resets the auto-hide timeout to show controls.
   */
  const handleMouseMove = useCallback(() => {
    if (isFullscreenOpen) {
      resetControlsTimeout()
    }
  }, [isFullscreenOpen, resetControlsTimeout])

  // Keyboard navigation for fullscreen gallery
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFullscreenOpen) return

      switch (event.key) {
        case 'Escape':
          closeFullscreenGallery()
          break
        case 'ArrowLeft':
          handleFullscreenPrevious()
          break
        case 'ArrowRight':
          handleFullscreenNext()
          break
        default:
          break
      }
    }

    if (isFullscreenOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreenOpen, handleFullscreenPrevious, handleFullscreenNext, closeFullscreenGallery])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [controlsTimeout])

  return {
    currentImageIndex,
    isFullscreenOpen,
    fullscreenImageIndex,
    showControls,
    handlePreviousImage,
    handleNextImage,
    openFullscreenGallery,
    closeFullscreenGallery,
    handleFullscreenPrevious,
    handleFullscreenNext,
    handleGalleryMouseEnter,
    handleGalleryMouseLeave,
    handleMouseMove,
    setCurrentImageIndex
  }
}

export default useGalleryControls
