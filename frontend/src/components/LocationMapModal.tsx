import React, { useState } from 'react'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import { Plus, Minus } from 'lucide-react'
import { NearbyPlace } from '@/types/petDisplay.types'

interface LocationMapModalProps {
  userCurrentLocation: { lat: number; lng: number }
  selectedLocation: { lat: number; lng: number; name?: string; address?: string } | null
  nearbyPlaces: NearbyPlace[]
  mapCenter: [number, number] | null
  mapZoom: number
  onSelectNearbyPlace: (place: NearbyPlace) => void
}

// Google Maps API key from environment variable
// Get your API key from: https://console.cloud.google.com/google/maps-apis
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export const LocationMapModal: React.FC<LocationMapModalProps> = ({
  userCurrentLocation,
  selectedLocation,
  nearbyPlaces,
  mapCenter,
  mapZoom,
  onSelectNearbyPlace
}) => {
  const [currentZoom, setCurrentZoom] = useState(mapZoom)
  const [currentCenter, setCurrentCenter] = useState(
    mapCenter
      ? { lat: mapCenter[0], lng: mapCenter[1] }
      : { lat: userCurrentLocation.lat, lng: userCurrentLocation.lng }
  )

  if (!userCurrentLocation || !userCurrentLocation.lat || !userCurrentLocation.lng) {
    return <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl h-48 md:h-60 flex items-center justify-center">
      <p className="text-gray-500">加载中...</p>
    </div>
  }

  const handleZoomIn = () => {
    setCurrentZoom(prev => Math.min(prev + 1, 21)) // Max zoom is 21
  }

  const handleZoomOut = () => {
    setCurrentZoom(prev => Math.max(prev - 1, 1)) // Min zoom is 1
  }

  // Update center when mapCenter prop changes
  React.useEffect(() => {
    if (mapCenter) {
      setCurrentCenter({ lat: mapCenter[0], lng: mapCenter[1] })
    }
  }, [mapCenter])

  // Update zoom when mapZoom prop changes
  React.useEffect(() => {
    setCurrentZoom(mapZoom)
  }, [mapZoom])

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl h-48 md:h-60 relative overflow-hidden">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          center={currentCenter}
          zoom={currentZoom}
          mapId="pet-qr-location-map"
          disableDefaultUI={true}
          clickableIcons={false}
          gestureHandling="greedy"
          onCenterChanged={(e) => setCurrentCenter(e.detail.center)}
          onZoomChanged={(e) => setCurrentZoom(e.detail.zoom)}
        >
          {/* Current location marker (blue) */}
          <AdvancedMarker
            position={{ lat: userCurrentLocation.lat, lng: userCurrentLocation.lng }}
          >
            <Pin
              background="#3B82F6"
              borderColor="#1E40AF"
              glyphColor="#FFFFFF"
            />
          </AdvancedMarker>

          {/* Selected current location marker (red) */}
          {selectedLocation?.name === '我的当前位置' && (
            <AdvancedMarker
              position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            >
              <Pin
                background="#EF4444"
                borderColor="#B91C1C"
                glyphColor="#FFFFFF"
              />
            </AdvancedMarker>
          )}

          {/* Nearby places markers */}
          {nearbyPlaces.map((place, index) => {
            const isSelected = selectedLocation?.name === place.name && selectedLocation?.name !== '我的当前位置'
            return (
              <AdvancedMarker
                key={index}
                position={{ lat: place.lat, lng: place.lng }}
                onClick={() => onSelectNearbyPlace(place)}
              >
                <Pin
                  background={isSelected ? "#10B981" : "#6B7280"}
                  borderColor={isSelected ? "#047857" : "#374151"}
                  glyphColor="#FFFFFF"
                />
              </AdvancedMarker>
            )
          })}
        </Map>
      </APIProvider>

      {/* Zoom Controls */}
      <div className="absolute right-3 bottom-3 flex flex-col gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 shadow-lg transition-colors"
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 shadow-lg transition-colors"
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
    </div>
  )
}
