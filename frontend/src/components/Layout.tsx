import React from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  headerVariant?: 'default' | 'minimal'
  showAuthButton?: boolean
  showFooter?: boolean
  footerVariant?: 'default' | 'minimal'
}

const Layout: React.FC<LayoutProps> = ({
  children,
  showHeader = true,
  headerVariant = 'default',
  showAuthButton = true,
  showFooter = true,
  footerVariant = 'default'
}) => {
  const isMinimal = headerVariant === 'minimal'
  const location = useLocation()

  // Check if this is a pet display page
  const isPetDisplayPage = location.pathname.startsWith('/pet/')

  // Use responsive container for pet display pages
  const containerClass = isPetDisplayPage
    ? 'mx-auto max-w-[420px] md:max-w-[440px] lg:max-w-[480px]'
    : 'mx-auto max-w-[420px]'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Main Container */}
      <div className={containerClass}>
        <div className="min-h-screen bg-white dark:bg-gray-900 overflow-hidden">

          {showHeader && (
            <div className="w-full">
              <Header
                variant={headerVariant}
                showAuthButton={showAuthButton}
              />
            </div>
          )}

          <main className={`relative flex-1 ${showHeader ? '' : 'pt-0'}`}>
            <div className={`${
              isMinimal ? 'pl-4 pr-4 pb-4' : 'pl-4 pr-4 pb-4 sm:pl-6 sm:pr-6 sm:pb-6'
            } transition-all duration-300`}>
              {children}
            </div>
          </main>

          {showFooter && (
            <Footer variant={footerVariant} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Layout