import React from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { containerStyles, ContainerType } from '@/styles/containers'

interface LayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  headerVariant?: 'default' | 'minimal'
  showAuthButton?: boolean
  showFooter?: boolean
  footerVariant?: 'default' | 'minimal'
  containerType?: ContainerType
  onOpenAuthModal?: () => void
}

const Layout: React.FC<LayoutProps> = ({
  children,
  showHeader = true,
  headerVariant = 'default',
  showAuthButton = true,
  showFooter = true,
  footerVariant = 'default',
  containerType,
  onOpenAuthModal
}) => {
  const isMinimal = headerVariant === 'minimal'
  const location = useLocation()

  // Auto-detect container type based on route if not specified
  const getContainerType = (): ContainerType => {
    if (containerType) return containerType

    if (location.pathname.startsWith('/pet/')) return 'medium'
    if (location.pathname.startsWith('/dashboard')) return 'extraWide'
    return 'narrow'
  }

  const containerClass = containerStyles[getContainerType()]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Full-width Header */}
      {showHeader && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className={containerStyles[getContainerType()]}>
            <Header
              variant={headerVariant}
              showAuthButton={showAuthButton}
              onOpenAuthModal={onOpenAuthModal}
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className={containerClass}>
        <main className={`relative flex-1 ${showHeader ? 'pt-4' : 'pt-0'}`}>
          <div className={`${
            isMinimal ? 'pb-4' : 'pb-4 sm:pb-6'
          } transition-all duration-300`}>
            {children}
          </div>
        </main>

        {showFooter && (
          <Footer variant={footerVariant} />
        )}
      </div>
    </div>
  )
}

export default Layout