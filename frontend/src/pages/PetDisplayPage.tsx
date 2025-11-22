/**
 * PetDisplayPage - Public pet information display page
 *
 * This page displays pet information after QR code verification.
 * It uses extracted hooks and components for better maintainability.
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQRAccessStore } from '@/stores/qrAccessStore'

// Types
import type { NearbyPlace } from '@/types/petDisplay.types'

// Hooks
import { usePetData } from '@/hooks/usePetData'
import { useGalleryControls } from '@/hooks/useGalleryControls'
import { useLocationTracking } from '@/hooks/useLocationTracking'
import { useNearbyPlaces } from '@/hooks/useNearbyPlaces'

// Components
import {
  PetGallery,
  PetDetailsCard,
  PetActionButtons,
  PetDisplayLoader,
  PetNotFound,
  FullscreenGalleryModal,
  ContactOwnerModal,
  LocationSelectionModal
} from '@/components/petDisplay'

/**
 * Main component for displaying pet information from QR code scan.
 *
 * Features:
 * - Pet photo gallery with fullscreen mode
 * - Detailed pet information with expandable sections
 * - Contact owner functionality
 * - Safe location sharing for pet meetups
 *
 * @returns JSX element for the pet display page
 */
const PetDisplayPage: React.FC = () => {
  const { petId } = useParams<{ petId: string }>()
  const navigate = useNavigate()
  const { getQRCodeForPetId } = useQRAccessStore()

  // Local UI state
  const [showDetailedInfo, setShowDetailedInfo] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  // Initialize hooks
  const { petInfo, isLoading, error } = usePetData({
    petId,
    navigate
  })

  const galleryControls = useGalleryControls(petInfo?.photo_urls?.length || 0)

  const locationTracking = useLocationTracking()

  const nearbyPlaces = useNearbyPlaces({
    petInfo,
    userCurrentLocation: locationTracking.userCurrentLocation,
    setMapCenter: locationTracking.setMapCenter,
    setMapZoom: locationTracking.setMapZoom,
    setShowLocationModal: locationTracking.setShowLocationModal,
    setShowContactModal
  })

  // Handler functions - memoized with useCallback for performance

  /**
   * Handles contact owner button click.
   */
  const handleContactOwner = useCallback(() => {
    setShowContactModal(true)
  }, [])

  /**
   * Handles phone call action.
   */
  const handlePhoneCall = useCallback((phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`)
    }
  }, [])

  /**
   * Handles SMS action.
   */
  const handleSMS = useCallback((phone: string) => {
    if (phone && petInfo?.name) {
      const message = encodeURIComponent(`Hi! I found ${petInfo.name}. Please let me know how I can help get them back to you safely.`)
      window.open(`sms:${phone}?body=${message}`)
    }
  }, [petInfo?.name])

  /**
   * Handles email action.
   */
  const handleEmail = useCallback(() => {
    if (petInfo?.owner_email && petInfo?.name) {
      window.open(`mailto:${petInfo.owner_email}?subject=Found ${petInfo.name}&body=Hi, I found ${petInfo.name}. Please let me know how I can help get them back to you safely.`)
    }
  }, [petInfo?.owner_email, petInfo?.name])

  /**
   * Handles share location button click.
   * Wraps the location tracking hook's handler with nearby places fetch callback.
   */
  const handleShareLocation = useCallback(() => {
    locationTracking.handleShareLocation(
      nearbyPlaces.fetchNearbyPlaces,
      nearbyPlaces.setDisplayedPlacesCount
    )
  }, [locationTracking, nearbyPlaces.fetchNearbyPlaces, nearbyPlaces.setDisplayedPlacesCount])

  /**
   * Handles store link button click.
   */
  const handleStoreLink = useCallback(() => {
    window.open('https://example.com/store', '_blank')
  }, [])

  /**
   * Downloads image with watermark.
   */
  const downloadImageWithWatermark = useCallback(async (imageUrl: string, imageIndex: number) => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Add watermark
      const watermarkText = `${petInfo?.name || 'Pet'} - PetID System`
      const fontSize = Math.max(20, Math.min(img.width / 20, img.height / 20))

      ctx.font = `${fontSize}px Arial`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.lineWidth = 2

      const textWidth = ctx.measureText(watermarkText).width
      const x = img.width - textWidth - 20
      const y = img.height - 20

      ctx.strokeText(watermarkText, x, y)
      ctx.fillText(watermarkText, x, y)

      // Add QR code info
      const qrCode = petId ? getQRCodeForPetId(parseInt(petId, 10)) : null
      const qrText = `QR: ${qrCode || 'Unknown'}`
      ctx.font = `${fontSize * 0.7}px Arial`
      const qrTextWidth = ctx.measureText(qrText).width
      const qrX = img.width - qrTextWidth - 20
      const qrY = y - fontSize - 5

      ctx.strokeText(qrText, qrX, qrY)
      ctx.fillText(qrText, qrX, qrY)

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${petInfo?.name || 'pet'}-photo-${imageIndex + 1}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.9)

    } catch (err) {
      console.error('Error downloading image:', err)
      alert('Failed to download image. Please try again.')
    }
  }, [petId, petInfo?.name, getQRCodeForPetId])

  /**
   * Handles selecting current location in the location modal.
   */
  const handleSelectCurrentLocation = useCallback(async () => {
    if (!locationTracking.userCurrentLocation) return

    // If current location is already selected, deselect it
    if (nearbyPlaces.selectedLocation?.name === 'My Current Location') {
      nearbyPlaces.setSelectedLocation(null)
      nearbyPlaces.setShowExpandedView(true)
      locationTracking.setMapCenter([
        locationTracking.userCurrentLocation.lat,
        locationTracking.userCurrentLocation.lng
      ])
      locationTracking.setMapZoom(15)
      return
    }

    // Set loading state
    locationTracking.setFetchingAddress(true)

    try {
      const address = await locationTracking.fetchAddressFromCoordinates(
        locationTracking.userCurrentLocation.lat,
        locationTracking.userCurrentLocation.lng
      )

      nearbyPlaces.setSelectedLocation({
        lat: locationTracking.userCurrentLocation.lat,
        lng: locationTracking.userCurrentLocation.lng,
        name: 'My Current Location',
        address
      })
      locationTracking.setCurrentLocationAddress(address)
      nearbyPlaces.setShowExpandedView(false)
      locationTracking.setMapCenter([
        locationTracking.userCurrentLocation.lat,
        locationTracking.userCurrentLocation.lng
      ])
      locationTracking.setMapZoom(17)
    } catch (err) {
      console.error('Error fetching address:', err)
      nearbyPlaces.setSelectedLocation({
        lat: locationTracking.userCurrentLocation.lat,
        lng: locationTracking.userCurrentLocation.lng,
        name: 'My Current Location'
      })
      nearbyPlaces.setShowExpandedView(false)
      locationTracking.setMapCenter([
        locationTracking.userCurrentLocation.lat,
        locationTracking.userCurrentLocation.lng
      ])
      locationTracking.setMapZoom(17)
    } finally {
      locationTracking.setFetchingAddress(false)
    }
  }, [locationTracking, nearbyPlaces])

  /**
   * Handles deselecting location and resetting view.
   */
  const handleDeselectLocation = useCallback(() => {
    nearbyPlaces.setSelectedLocation(null)
    nearbyPlaces.setShowExpandedView(true)
    if (locationTracking.userCurrentLocation) {
      locationTracking.setMapCenter([
        locationTracking.userCurrentLocation.lat,
        locationTracking.userCurrentLocation.lng
      ])
      locationTracking.setMapZoom(15)
    }
  }, [locationTracking, nearbyPlaces])

  // Memoize photos array to prevent unnecessary re-renders
  const photos = useMemo(() => petInfo?.photo_urls || [], [petInfo?.photo_urls])

  // Loading state
  if (isLoading) {
    return <PetDisplayLoader />
  }

  // Error state
  if (error || !petInfo) {
    return (
      <PetNotFound
        error={error}
        onGoHome={() => navigate('/')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      {/* Pet Card - Enhanced Design */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50 mb-8 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600">
        {/* Pet Gallery */}
        <PetGallery
          photos={photos}
          currentImageIndex={galleryControls.currentImageIndex}
          onPreviousImage={galleryControls.handlePreviousImage}
          onNextImage={galleryControls.handleNextImage}
          onOpenFullscreen={galleryControls.openFullscreenGallery}
          showControls={galleryControls.showControls}
          onMouseEnter={galleryControls.handleGalleryMouseEnter}
          onMouseLeave={galleryControls.handleGalleryMouseLeave}
          onThumbnailClick={galleryControls.setCurrentImageIndex}
          petName={petInfo.name}
        />

        {/* Pet Details */}
        <PetDetailsCard
          petInfo={petInfo}
          showDetailedInfo={showDetailedInfo}
          onToggleDetailedInfo={() => setShowDetailedInfo(!showDetailedInfo)}
        />
      </div>

      {/* Action Buttons */}
      <PetActionButtons
        locationStatus={locationTracking.locationStatus}
        petName={petInfo.name}
        onContactOwner={handleContactOwner}
        onShareLocation={handleShareLocation}
        onStoreLink={handleStoreLink}
      />

      {/* Fullscreen Gallery Modal */}
      <FullscreenGalleryModal
        isOpen={galleryControls.isFullscreenOpen}
        photos={photos}
        currentImageIndex={galleryControls.fullscreenImageIndex}
        petInfo={petInfo}
        showControls={galleryControls.showControls}
        onClose={galleryControls.closeFullscreenGallery}
        onPrevious={galleryControls.handleFullscreenPrevious}
        onNext={galleryControls.handleFullscreenNext}
        onMouseMove={galleryControls.handleMouseMove}
        onDownload={downloadImageWithWatermark}
      />

      {/* Contact Owner Modal */}
      <ContactOwnerModal
        isOpen={showContactModal}
        petInfo={petInfo}
        onClose={() => setShowContactModal(false)}
        onPhoneCall={handlePhoneCall}
        onSMS={handleSMS}
        onEmail={handleEmail}
      />

      {/* Location Selection Modal */}
      <LocationSelectionModal
        isOpen={locationTracking.showLocationModal}
        userCurrentLocation={locationTracking.userCurrentLocation}
        selectedLocation={nearbyPlaces.selectedLocation}
        nearbyPlaces={nearbyPlaces.nearbyPlaces}
        loadingPlaces={nearbyPlaces.loadingPlaces}
        loadingMorePlaces={nearbyPlaces.loadingMorePlaces}
        displayedPlacesCount={nearbyPlaces.displayedPlacesCount}
        showExpandedView={nearbyPlaces.showExpandedView}
        fetchingAddress={locationTracking.fetchingAddress}
        mapCenter={locationTracking.mapCenter}
        mapZoom={locationTracking.mapZoom}
        petInfo={petInfo}
        onClose={() => locationTracking.setShowLocationModal(false)}
        onSelectPlace={(place: NearbyPlace) => nearbyPlaces.handleSelectNearbyPlace(place)}
        onLoadMorePlaces={nearbyPlaces.handleLoadMorePlaces}
        onSendViaSMS={nearbyPlaces.handleSendLocationViaSMS}
        onSendViaEmail={nearbyPlaces.handleSendLocationViaEmail}
        onSelectCurrentLocation={handleSelectCurrentLocation}
        onToggleExpandedView={nearbyPlaces.setShowExpandedView}
        onDeselectLocation={handleDeselectLocation}
      />
    </div>
  )
}

export default PetDisplayPage
