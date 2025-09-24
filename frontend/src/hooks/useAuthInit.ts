import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'

export function useAuthInit() {
  const [isInitialized, setIsInitialized] = useState(false)
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore()

  useEffect(() => {
    const initializeAuth = async () => {
      // Wait for Zustand to rehydrate from localStorage
      await new Promise(resolve => setTimeout(resolve, 100))

      // Get fresh state after rehydration
      const currentState = useAuthStore.getState()

      // If no token exists, just mark as initialized
      if (!currentState.accessToken) {
        setIsInitialized(true)
        return
      }

      try {
        // Try to fetch current user to verify token is valid
        await authService.getCurrentUser()
      } catch (error) {
        // Token might be expired, try to refresh
        try {
          await authService.refreshToken()
          // Try to fetch user data again after refresh
          await authService.getCurrentUser()
        } catch (refreshError) {
          // Refresh failed, clear auth state
          clearAuth()
        }
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, []) // Remove dependencies to run only once

  return { isInitialized }
}