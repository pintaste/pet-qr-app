import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook for managing header visibility across the application.
 * Follows the demo pattern where header starts hidden on QR routes
 * and shows after PIN verification.
 */
export const useHeader = () => {
  const location = useLocation()
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  useEffect(() => {
    // Header visibility logic based on route
    const isQRRoute = location.pathname.startsWith('/qr/')
    const isLanguageRoute = location.pathname === '/language'
    const isPetDisplayRoute = location.pathname.startsWith('/pet/')

    // Hide header on initial QR and language routes
    if (isQRRoute || isLanguageRoute) {
      setIsHeaderVisible(false)
    }
    // Show header on pet display route (after PIN verification)
    else if (isPetDisplayRoute) {
      setIsHeaderVisible(true)
    }
    // Show by default on other routes
    else {
      setIsHeaderVisible(true)
    }
  }, [location.pathname])

  const showHeader = () => setIsHeaderVisible(true)
  const hideHeader = () => setIsHeaderVisible(false)
  const toggleHeader = () => setIsHeaderVisible(prev => !prev)

  return {
    isHeaderVisible,
    showHeader,
    hideHeader,
    toggleHeader
  }
}