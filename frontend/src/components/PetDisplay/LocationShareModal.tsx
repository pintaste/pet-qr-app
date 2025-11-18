import React from 'react'
import {
  X,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  MessageCircle,
  Mail,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

interface PetInfo {
  name: string
  emergency_contact?: {
    phone?: string
  }
  secondary_phone?: string
  owner_email?: string
}

interface Location {
  lat: number
  lng: number
  name?: string
  address?: string
}

interface NearbyPlace {
  lat: number
  lng: number
  name: string
  distance: number
  icon: React.ComponentType<{ className?: string }>
}

interface LocationShareModalProps {
  isOpen: boolean
  userCurrentLocation: Location | null
  selectedLocation: Location | null
  nearbyPlaces: NearbyPlace[]
  showExpandedView: boolean
  loadingPlaces: boolean
  displayedPlacesCount: number
  loadingMorePlaces: boolean
  fetchingAddress: boolean
  petInfo: PetInfo | null
  onClose: () => void
  onSelectLocation: (location: Location | null) => void
  onSelectNearbyPlace: (place: NearbyPlace) => void
  onToggleExpandedView: (show: boolean) => void
  onLoadMorePlaces: () => void
  onSendLocationViaSMS: () => void
  onSendLocationViaEmail: () => void
  onFetchAddress: (lat: number, lng: number) => Promise<string>
}

/**
 * Location Share Modal - Complex location sharing with map integration.
 *
 * Features:
 * - Interactive Leaflet map with user location
 * - Nearby places from OpenStreetMap
 * - Current location selection with address lookup
 * - Privacy-focused public venue recommendations
 * - SMS and email sharing options
 * - Collapsible UI for better UX
 * - Distance-based sorting
 */
const LocationShareModal: React.FC<LocationShareModalProps> = ({
  isOpen,
  userCurrentLocation,
  selectedLocation,
  nearbyPlaces,
  showExpandedView,
  loadingPlaces,
  displayedPlacesCount,
  loadingMorePlaces,
  fetchingAddress,
  petInfo,
  onClose,
  onSelectLocation,
  onSelectNearbyPlace,
  onToggleExpandedView,
  onLoadMorePlaces,
  onSendLocationViaSMS,
  onSendLocationViaEmail,
  onFetchAddress,
}) => {
  if (!isOpen || !userCurrentLocation) return null

  const handleGetCurrentLocation = async (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('获取我的位置 button clicked')

    // If current location is already selected, deselect it
    if (selectedLocation?.name === '我的当前位置') {
      onSelectLocation(null)
      onToggleExpandedView(true)
      return
    }

    try {
      const address = await onFetchAddress(userCurrentLocation.lat, userCurrentLocation.lng)
      const newLocation = {
        lat: userCurrentLocation.lat,
        lng: userCurrentLocation.lng,
        name: '我的当前位置',
        address: address,
      }
      console.log('Setting selected location with address:', newLocation)
      onSelectLocation(newLocation)
      onToggleExpandedView(false)
    } catch (error) {
      console.error('Error fetching address:', error)
      const newLocation = {
        lat: userCurrentLocation.lat,
        lng: userCurrentLocation.lng,
        name: '我的当前位置',
      }
      onSelectLocation(newLocation)
      onToggleExpandedView(false)
    }
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
                选择您要共享的位置
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                为了您的安全，建议选择公共场所
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
          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl h-48 md:h-60 relative overflow-hidden">
            <MapContainer
              center={[userCurrentLocation.lat, userCurrentLocation.lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              className="rounded-2xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User Location Marker */}
              <Marker position={[userCurrentLocation.lat, userCurrentLocation.lng]}>
                <Popup>您的当前位置</Popup>
              </Marker>

              {/* Selected Current Location Marker (Red Pin) */}
              {selectedLocation?.name === '我的当前位置' && (
                <Marker
                  position={[selectedLocation.lat, selectedLocation.lng]}
                  icon={L.icon({
                    iconUrl:
                      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl:
                      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                  })}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-medium text-red-600">已选择：我的当前位置</p>
                      {selectedLocation.address && (
                        <p className="text-xs text-gray-700 mt-1">
                          {selectedLocation.address}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">准备分享此位置</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Nearby Places Markers */}
              {nearbyPlaces.map((place, index) => (
                <Marker
                  key={index}
                  position={[place.lat, place.lng]}
                  eventHandlers={{
                    click: () => onSelectNearbyPlace(place),
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-medium">{place.name}</p>
                      <p className="text-xs text-gray-500">
                        {place.distance < 1000
                          ? `${place.distance}米`
                          : `${(place.distance / 1000).toFixed(1)}公里`}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Get Current Location Button */}
          <button
            onClick={handleGetCurrentLocation}
            className={`w-full mt-3 rounded-xl p-3 flex items-center justify-center space-x-2 transition-all duration-300 border ${
              selectedLocation?.name === '我的当前位置'
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-600'
                : 'bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50'
            }`}
          >
            <div
              className={
                selectedLocation?.name === '我的当前位置'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-blue-500 dark:text-blue-400'
              }
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-gray-900 dark:text-white">
                {fetchingAddress
                  ? '获取地址中...'
                  : selectedLocation?.name === '我的当前位置'
                  ? '我的当前位置'
                  : '获取我的位置'}
              </span>
              {selectedLocation?.name === '我的当前位置' && selectedLocation.address && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {selectedLocation.address} • 点击取消选择
                </p>
              )}
              {selectedLocation?.name === '我的当前位置' && !selectedLocation.address && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">点击取消选择</p>
              )}
            </div>
            {fetchingAddress && (
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
            {selectedLocation?.name === '我的当前位置' && !fetchingAddress && (
              <div className="text-green-600 dark:text-green-400">✓</div>
            )}
          </button>
        </div>

        {/* Content Below Map - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Selected Location Display - Show when collapsed and location is selected */}
          {selectedLocation &&
            !showExpandedView &&
            selectedLocation.name !== '我的当前位置' && (
              <div className="px-6 pb-3">
                <button
                  onClick={() => {
                    onSelectLocation(null)
                    onToggleExpandedView(true)
                  }}
                  className="w-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-600 rounded-xl p-3 mb-3 hover:from-green-200 hover:to-emerald-200 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-green-600 dark:text-green-400">
                      {(() => {
                        const nearbyPlace = nearbyPlaces.find(
                          (p) => p.name === selectedLocation.name
                        )
                        if (nearbyPlace && nearbyPlace.icon) {
                          const IconComponent = nearbyPlace.icon
                          return <IconComponent className="w-5 h-5" />
                        }
                        return <MapPin className="w-5 h-5" />
                      })()}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        已选择：{selectedLocation.name}
                      </p>
                      {(() => {
                        const nearbyPlace = nearbyPlaces.find(
                          (p) => p.name === selectedLocation.name
                        )
                        if (nearbyPlace) {
                          return (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              距离约{' '}
                              {nearbyPlace.distance < 1000
                                ? `${nearbyPlace.distance}米`
                                : `${(nearbyPlace.distance / 1000).toFixed(1)}公里`}{' '}
                              • 点击取消选择
                            </p>
                          )
                        }
                        return (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            点击取消选择
                          </p>
                        )
                      })()}
                    </div>
                    <div className="text-green-600 dark:text-green-400">✓</div>
                  </div>
                </button>
              </div>
            )}

          {/* Toggle Button for expanding/collapsing other options */}
          {selectedLocation && !showExpandedView && (
            <div className="px-6 pb-3">
              <button
                onClick={() => {
                  if (selectedLocation?.name === '我的当前位置') {
                    onSelectLocation(null)
                  }
                  onToggleExpandedView(true)
                }}
                className="w-full bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl p-3 flex items-center justify-center space-x-2 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  查看其他地点选项
                </span>
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
                      建议选择有监控、人流量大的公共场所，避免暴露住址
                    </p>
                  </div>
                </div>
              </div>

              {/* Places List */}
              <div className="px-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    附近安全地点
                  </h4>
                  <div className="flex items-center space-x-2">
                    {loadingPlaces && (
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
                        <span>搜索中...</span>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      未找到附近的公共场所
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      请稍后重试或手动选择地点
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 mb-4">
                  {nearbyPlaces.slice(0, displayedPlacesCount).map((place, index) => {
                    const IconComponent = place.icon
                    return (
                      <button
                        key={index}
                        onClick={() => onSelectNearbyPlace(place)}
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 text-left ${
                          selectedLocation?.name === place.name
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-600'
                            : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            selectedLocation?.name === place.name
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {place.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            距离约{' '}
                            {place.distance < 1000
                              ? `${place.distance}米`
                              : `${(place.distance / 1000).toFixed(1)}公里`}
                          </p>
                        </div>
                        {selectedLocation?.name === place.name && (
                          <div className="text-green-600 dark:text-green-400">✓</div>
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
                          <span>加载中...</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          <span>
                            加载更多地点 ({nearbyPlaces.length - displayedPlacesCount}+)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Show all locations message */}
                {nearbyPlaces.length > 0 &&
                  nearbyPlaces.length <= displayedPlacesCount &&
                  displayedPlacesCount > 6 && (
                    <div className="text-center mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        已显示全部 {nearbyPlaces.length} 个地点
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
                  onClick={onSendLocationViaSMS}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl p-4 flex items-center space-x-4 hover:scale-[1.03] hover:shadow-lg transition-all duration-300 shadow-sm"
                >
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold">发送交易地点</p>
                    <p className="text-xs opacity-90">
                      通过短信发送给{' '}
                      {petInfo?.emergency_contact?.phone || petInfo?.secondary_phone}
                    </p>
                  </div>
                </button>
              )}

              {/* Email Option */}
              {petInfo?.owner_email && (
                <button
                  onClick={onSendLocationViaEmail}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl p-4 flex items-center space-x-4 hover:scale-[1.03] hover:shadow-lg transition-all duration-300 shadow-sm"
                >
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold">发送交易地点</p>
                    <p className="text-xs opacity-90">通过邮件发送给 {petInfo.owner_email}</p>
                  </div>
                </button>
              )}
            </div>

            {/* Final Safety Note */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-200/50 dark:border-green-700/50 text-center">
              <p className="text-xs text-green-800 dark:text-green-200">
                <span className="font-medium">即将发送安全交易地点：{selectedLocation.name}</span>
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

export default LocationShareModal
