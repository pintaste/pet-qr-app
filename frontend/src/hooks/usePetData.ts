import { useState, useEffect } from 'react'
import { useQRAccessStore } from '@/stores/qrAccessStore'
import { useSecurityMonitorStore, SUSPICIOUS_ACTIVITY_TYPES } from '@/stores/securityMonitorStore'
import { PetInfo, UsePetDataReturn, UsePetDataParams } from '@/types/petDisplay.types'
import { getApiUrl } from '@/config'

/**
 * Custom hook for fetching and managing pet data with security checks.
 *
 * This hook handles:
 * - QR access verification before allowing data fetch
 * - Security monitoring for suspicious access attempts
 * - API data fetching and mapping to PetInfo interface
 * - Loading and error state management
 *
 * @param params - Hook parameters containing petId and navigate function
 * @returns Object containing pet info, loading state, error, and fetch function
 *
 * @example
 * ```tsx
 * const { petInfo, isLoading, error, fetchPetInfo } = usePetData({
 *   petId,
 *   navigate
 * })
 * ```
 */
export function usePetData({ petId, navigate }: UsePetDataParams): UsePetDataReturn {
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const { isPetAccessible, getQRCodeForPetId } = useQRAccessStore()
  const { logSuspiciousActivity } = useSecurityMonitorStore()

  /**
   * Fetches pet information from the API and maps it to PetInfo interface.
   *
   * @returns Promise that resolves when fetch is complete
   */
  const fetchPetInfo = async (): Promise<void> => {
    try {
      console.log('Fetching pet info for pet ID:', petId)
      setIsLoading(true)
      setError('')

      if (!petId) {
        setError('No pet ID provided')
        return
      }

      // Use the public pet API endpoint (no authentication required)
      const response = await fetch(getApiUrl(`/pets/public/${petId}`))

      if (!response.ok) {
        if (response.status === 404) {
          setError('Pet not found')
        } else {
          setError('Failed to load pet information')
        }
        return
      }

      const petData = await response.json()
      console.log('Fetched pet data:', petData)

      // Convert API data to our PetInfo interface
      const mappedPetInfo: PetInfo = {
        name: petData.name || 'Unknown',
        breed: petData.breed || 'Unknown',
        age: petData.age || 0,
        sex: petData.sex || 'Unknown',
        size: petData.size || 'Unknown',
        color: petData.color || 'Unknown',
        description: petData.description || '',
        personality_traits: petData.personality_traits || [],
        profile_photo_url: petData.profile_photo_url,
        photo_urls: petData.photo_urls || [],
        basic_medical_info: petData.basic_medical_info || {},
        emergency_contact: petData.emergency_contact || {
          phone: '+1 (555) 123-4567',
          email: 'owner@example.com'
        },
        is_lost: petData.is_lost || false,
        last_known_location: petData.last_known_location,

        // Extended Profile Information - Mock Data
        // Reason: These fields are placeholders until the backend provides extended profile data
        markings: 'White patch on chest, small scar on left ear',
        owner_name: 'Sarah',
        secondary_phone: '+1 (555) 987-6543',
        owner_email: 'sarah.j@email.com',
        location_area: 'Downtown District',
        special_message: 'If you find Max, please call me immediately. He\'s very friendly but can get anxious without his family. Thank you for helping bring him home!',
        temperament: 'Friendly, energetic, good with children and other dogs',
        weight: '65 lbs (29.5 kg)',
        microchip_id: '982000123456789',
        spayed_neutered: 'Neutered',
        medical_conditions: 'Mild hip dysplasia - needs daily medication',
        medications: 'Glucosamine supplements daily',
        veterinarian: 'Dr. Sarah Johnson',
        vet_clinic: 'Happy Pets Clinic',
        vet_address: '123 Main St, Downtown',
        emergency_vet: '(555) 911-PETS - Downtown Animal Hospital',
        birthday: 'March 15, 2021',
        collar_description: 'Blue leather collar with silver tags',
        vaccinations: 'DHPP (Annual), Rabies (Valid until 2026), Bordetella (Updated 2024)'
      }

      setPetInfo(mappedPetInfo)
    } catch (err) {
      console.error('Error fetching pet info:', err)
      setError('Failed to load pet information')
    } finally {
      setIsLoading(false)
    }
  }

  // Security check and data fetching effect
  useEffect(() => {
    if (!petId) {
      // No pet ID provided, redirect to home
      navigate('/', { replace: true })
      return
    }

    // CRITICAL SECURITY CHECK: Verify access before allowing pet info fetch
    const petIdNum = parseInt(petId, 10)
    if (isNaN(petIdNum)) {
      console.warn('Invalid pet ID format:', petId)
      navigate('/', { replace: true })
      return
    }

    // Check if this pet ID is accessible (has verified QR)
    const hasAccess = isPetAccessible(petIdNum)
    if (!hasAccess) {
      console.warn('Access denied: Pet ID', petId, 'not accessible without QR verification')

      // Log suspicious direct access attempt
      logSuspiciousActivity({
        type: SUSPICIOUS_ACTIVITY_TYPES.DIRECT_PET_ACCESS,
        petId: petIdNum,
        metadata: {
          url: window.location.href,
          referrer: document.referrer || 'direct',
          timestamp: new Date().toISOString()
        }
      })

      // Get the QR code that should be verified for this pet
      const qrCode = getQRCodeForPetId(petIdNum)
      if (qrCode) {
        // Redirect to QR verification page
        navigate(`/qr/${qrCode}`, { replace: true })
      } else {
        // No QR code mapped, redirect to home
        navigate('/', { replace: true })
      }
      return
    }

    // Access granted - proceed with fetching pet info
    console.log('Access granted for pet ID:', petId)
    fetchPetInfo()
  }, [petId, navigate, isPetAccessible, getQRCodeForPetId])

  return {
    petInfo,
    isLoading,
    error,
    fetchPetInfo
  }
}

export default usePetData
