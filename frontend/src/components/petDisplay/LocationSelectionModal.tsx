/**
 * LocationSelectionModal component for selecting and sharing meeting locations.
 * Uses Google Maps to display nearby places and allows users to share location via SMS or email.
 */

import React, { Suspense, lazy } from 'react'
import { X, MapPin, ChevronDown, ChevronUp, AlertTriangle, MessageCircle, Mail } from 'lucide-react'
import { PetInfo, NearbyPlace, SelectedLocation, MapCenter, LocationCoords } from '@/types/petDisplay.types'

// Lazy load the map component
const LocationMapModal = lazy(() => import('@/components/LocationMapModal').then(module => ({ default: module.LocationMapModal })))

interface LocationSelectionModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** User's current location coordinates */
  userCurrentLocation: LocationCoords | null
  /** Currently selected location */
  selectedLocation: SelectedLocation | null
  /** Array of nearby places */
  nearbyPlaces: NearbyPlace[]
  /** Whether places are being loaded */
  loadingPlaces: boolean
  /** Whether more places are being loaded */
  loadingMorePlaces: boolean
  /** Number of places currently displayed */
  displayedPlacesCount: number
  /** Whether expanded view is shown */
  showExpandedView: boolean
  /** Whether address is being fetched */
  fetchingAddress: boolean
  /** Map center coordinates */
  mapCenter: MapCenter | null
  /** Current map zoom level */
  mapZoom: number
  /** Pet information */
  petInfo: PetInfo | null
  /** Close the modal */
  onClose: () => void
  /** Handle place selection */
  onSelectPlace: (place: NearbyPlace) => void
  /** Load more places */
  onLoadMorePlaces: () => Promise<void>
  /** Send location via SMS */
  onSendViaSMS: () => void
  /** Send location via email */
  onSendViaEmail: () => void
  /** Select current location */
  onSelectCurrentLocation: () => void
  /** Toggle expanded view */
  onToggleExpandedView: (show: boolean) => void
  /** Deselect location and reset view */
  onDeselectLocation: () => void
}

/**
 * Modal for selecting a safe meeting location and sharing it via SMS or email.
 *
 * @param props - Component properties
 * @returns Rendered location selection modal or null if closed
 */
export const LocationSelectionModal: React.FC<LocationSelectionModalProps> = ({
  isOpen,
  userCurrentLocation,
  selectedLocation,
  nearbyPlaces,
  loadingPlaces,
  loadingMorePlaces,
  displayedPlacesCount,
  showExpandedView,
  fetchingAddress,
  mapCenter,
  mapZoom,
  petInfo,
  onClose,
  onSelectPlace,
  onLoadMorePlaces,
  onSendViaSMS,
  onSendViaEmail,
  onSelectCurrentLocation,
  onToggleExpandedView,
  onDeselectLocation
}) => {
  if (!isOpen || !userCurrentLocation || !userCurrentLocation.lat || !userCurrentLocation.lng) {
    return null
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end justify-center md:items-center"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 w-full max-w-[420px] md:max-w-lg shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-out overflow-hidden
          ${isOpen ? 'translate-y-0 md:scale-100' : 'translate-y-full md:scale-95'}
          rounded-t-2xl md:rounded-3xl
          max-h-[85vh] md:max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle - Mobile Only */}
        <div className="flex justify-center py-2 md:hidden">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 pb-3 md:pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent md:text-xl">
                Select Meeting Location
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose a safe public place for the meetup
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Map Container - Top */}
        <div className="px-6 pb-4">
          <Suspense fallback={
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl h-48 md:h-60 flex items-center justify-center">
              <p className="text-gray-500">Loading map...</p>
            </div>
          }>
            <LocationMapModal
              userCurrentLocation={userCurrentLocation}
              selectedLocation={selectedLocation}
              nearbyPlaces={nearbyPlaces}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              onSelectNearbyPlace={onSelectPlace}
            />
          </Suspense>

          {/* Get Current Location Button */}
          <button
            onClick={onSelectCurrentLocation}
            className={`w-full mt-3 rounded-xl p-3 flex items-center justify-center space-x-2 transition-all duration-300 border ${
              selectedLocation?.name === 'My Current Location'
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-600'
                : 'bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50'
            }`}
          >
            <div className={selectedLocation?.name === 'My Current Location'
              ? "text-green-600 dark:text-green-400"
              : "text-blue-500 dark:text-blue-400"}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-gray-900 dark:text-white">
                {fetchingAddress ? 'Getting address...' :
                 selectedLocation?.name === 'My Current Location' ? 'My Current Location' : 'Use My Location'}
              </span>
              {selectedLocation?.name === 'My Current Location' && selectedLocation.address && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {selectedLocation.address} - Click to deselect
                </p>
              )}
              {selectedLocation?.name === 'My Current Location' && !selectedLocation.address && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Click to deselect
                </p>
              )}
            </div>
            {fetchingAddress && (
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
            {selectedLocation?.name === 'My Current Location' && !fetchingAddress && (
              <div className="text-green-600 dark:text-green-400">
                <span>&#10003;</span>
              </div>
            )}
          </button>
        </div>

        {/* Content Below Map - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Selected Location Display - Show when collapsed and location is selected */}
          {selectedLocation && !showExpandedView && selectedLocation.name !== 'My Current Location' && (
            <div className="px-6 pb-3">
              <button
                onClick={onDeselectLocation}
                className="w-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-600 rounded-xl p-3 mb-3 hover:from-green-200 hover:to-emerald-200 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-green-600 dark:text-green-400">
                    {(() => {
                      const nearbyPlace = nearbyPlaces.find(p => p.name === selectedLocation.name)
                      if (nearbyPlace && nearbyPlace.icon) {
                        const IconComponent = nearbyPlace.icon
                        return <IconComponent className="w-5 h-5" />
                      }
                      return <MapPin className="w-5 h-5" />
                    })()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Selected: {selectedLocation.name}</p>
                    {(() => {
                      const nearbyPlace = nearbyPlaces.find(p => p.name === selectedLocation.name)
                      if (nearbyPlace) {
                        return (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {nearbyPlace.distance < 1000 ? `${nearbyPlace.distance}m` : `${(nearbyPlace.distance/1000).toFixed(1)}km`}
                            {nearbyPlace.address && ` - ${nearbyPlace.address}`}
                            {' - Click to deselect'}
                          </p>
                        )
                      }
                      return (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Click to deselect</p>
                      )
                    })()}
                  </div>
                  <div className="text-green-600 dark:text-green-400">
                    <span>&#10003;</span>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Toggle Button for expanding/collapsing other options */}
          {selectedLocation && !showExpandedView && (
            <div className="px-6 pb-3">
              <button
                onClick={onDeselectLocation}
                className="w-full bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl p-3 flex items-center justify-center space-x-2 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">View other location options</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* Collapsible content - Safety Warning and Places List */}
          {showExpandedView && (
            <>
              {/* Safety Warning */}
              <div className="px-6 pb-3">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200/50 dark:border-amber-700/50">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      Choose a public place with surveillance and high foot traffic. Avoid sharing your home address.
                    </p>
                  </div>
                </div>
              </div>

              {/* Places List */}
              <div className="px-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Nearby Safe Places</h4>
                  <div className="flex items-center space-x-2">
                    {loadingPlaces && (
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
                        <span>Searching...</span>
                      </div>
                    )}
                    {selectedLocation && (
                      <button
                        onClick={() => onToggleExpandedView(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>

                {!loadingPlaces && nearbyPlaces.length === 0 && (
                  <div className="text-center py-6">
                    <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No nearby public places found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Please try again later or select manually</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 mb-4">
                  {nearbyPlaces.slice(0, displayedPlacesCount).map((place, index) => {
                    const IconComponent = place.icon
                    return (
                      <button
                        key={index}
                        onClick={() => onSelectPlace(place)}
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 text-left ${
                          selectedLocation?.name === place.name
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-600'
                            : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          selectedLocation?.name === place.name
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{place.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {place.distance < 1000 ? `${place.distance}m` : `${(place.distance/1000).toFixed(1)}km`}
                            {place.address && ` - ${place.address}`}
                          </p>
                        </div>
                        {selectedLocation?.name === place.name && (
                          <div className="text-green-600 dark:text-green-400">
                            <span>&#10003;</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Load More Button */}
                {nearbyPlaces.length > displayedPlacesCount && (
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={onLoadMorePlaces}
                      disabled={loadingMorePlaces}
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loadingMorePlaces ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          <span>Load More Places ({nearbyPlaces.length - displayedPlacesCount}+)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Show all locations message */}
                {nearbyPlaces.length > 0 && nearbyPlaces.length <= displayedPlacesCount && displayedPlacesCount > 6 && (
                  <div className="text-center mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Showing all {nearbyPlaces.length} places
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Gradient hint for scroll content */}
          {selectedLocation && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
          )}
        </div>

        {/* Fixed Bottom Share Buttons - Show when location is selected */}
        {selectedLocation && (
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800 px-6 py-4">
            <div className="grid grid-cols-1 gap-3 mb-3">
              {/* SMS Option */}
              {(petInfo?.emergency_contact?.phone || petInfo?.secondary_phone) && (
                <button
                  onClick={onSendViaSMS}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl p-4 flex items-center space-x-4 hover:scale-[1.03] hover:shadow-lg transition-all duration-300 shadow-sm"
                >
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold">Send Meeting Location</p>
                    <p className="text-xs opacity-90">
                      Via SMS to {petInfo?.emergency_contact?.phone || petInfo?.secondary_phone}
                    </p>
                  </div>
                </button>
              )}

              {/* Email Option */}
              {petInfo?.owner_email && (
                <button
                  onClick={onSendViaEmail}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl p-4 flex items-center space-x-4 hover:scale-[1.03] hover:shadow-lg transition-all duration-300 shadow-sm"
                >
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold">Send Meeting Location</p>
                    <p className="text-xs opacity-90">
                      Via email to {petInfo.owner_email}
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Final Safety Note */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-200/50 dark:border-green-700/50 text-center">
              <p className="text-xs text-green-800 dark:text-green-200">
                <span className="font-medium">Sending safe meeting location: {selectedLocation.name}</span>
                {selectedLocation.address && (
                  <span className="block mt-1 text-green-700 dark:text-green-300">
                    {selectedLocation.address}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationSelectionModal
