import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { useHeader } from '@/hooks/useHeader'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import AuthModal from '@/components/AuthModal'
import { Heart, Globe, Sun, Moon, User, LogOut, Menu, X } from 'lucide-react'
import type { Language } from '@/types'

interface HeaderProps {
  showAuthButton?: boolean
  variant?: 'default' | 'minimal'
  onOpenAuthModal?: () => void
}

const Header: React.FC<HeaderProps> = ({
  showAuthButton = true,
  variant = 'default',
  onOpenAuthModal
}) => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { isHeaderVisible } = useHeader()
  const { isAuthenticated, user } = useAuthStore()
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)

  const handleLogout = async () => {
    try {
      await authService.logout()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleUserIconClick = () => {
    if (isAuthenticated) {
      setShowUserModal(true)
    } else if (onOpenAuthModal) {
      onOpenAuthModal()
    } else {
      setShowAuthModal(true)
    }
  }

  const handleDashboard = () => {
    setShowUserModal(false)
    navigate('/dashboard')
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  const languages = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'zh', flag: '🇨🇳', name: '中文' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
  ]

  const currentLang = languages.find(lang => lang.code === language) || languages[0]

  const headerClasses = `
    w-full
    ${isHeaderVisible ? 'block' : 'hidden'}
  `

  const headerStyle = {
    '--primary-color': '#6366F1',
    '--bg-primary': theme === 'dark' ? '#1F2937' : '#FFFFFF',
    '--border-color': theme === 'dark' ? '#374151' : '#E5E7EB',
    '--text-primary': theme === 'dark' ? '#F9FAFB' : '#1F2937',
    '--text-secondary': theme === 'dark' ? '#D1D5DB' : '#6B7280',
    '--bg-secondary': theme === 'dark' ? '#111827' : '#F9FAFB'
  } as React.CSSProperties

  if (variant === 'minimal') {
    return (
      <div className={headerClasses} style={headerStyle}>
        <header className="flex justify-between items-center p-4 transition-all duration-300">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 text-2xl font-bold transition-all duration-200 hover:scale-105 text-gradient"
          >
            <Heart className="w-6 h-6" fill="currentColor" />
            <span>PetID</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg glass-button"
              style={{ color: 'var(--text-primary)' }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>
      </div>
    )
  }

  return (
    <div className={headerClasses} style={headerStyle}>
      <header className="flex justify-between items-center p-4 transition-all duration-300">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 text-2xl font-bold transition-all duration-200 hover:scale-105 text-gradient"
        >
          <Heart className="w-6 h-6" fill="currentColor" />
          <span>PetID</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1 p-2 rounded-xl transition-all duration-200 text-sm font-medium hover:scale-105 hover:shadow-lg glass-button"
              style={{ color: 'var(--text-primary)' }}
              title="Select Language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentLang.code.toUpperCase()}
              </span>
            </button>

            {showLanguageDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLanguageDropdown(false)}
                />
                <div
                  className="absolute right-0 top-full mt-1 rounded-xl shadow-lg z-[1000] min-w-[140px] border transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {languages.map((lang, index) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as Language)
                        setShowLanguageDropdown(false)
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-3 text-left transition-all duration-200 text-sm font-medium ${
                        index === 0 ? 'rounded-t-xl' : ''
                      } ${
                        index === languages.length - 1 ? 'rounded-b-xl' : ''
                      }`}
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>{lang.flag}</span>
                      <span>
                        {lang.name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg glass-button"
            style={{ color: 'var(--text-primary)' }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {showAuthButton && (
            <button
              onClick={handleUserIconClick}
              className="p-2 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg glass-button"
              style={{ color: 'var(--text-primary)' }}
              title={isAuthenticated ? 'User Account' : 'Login'}
            >
              <User className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg glass-button"
            style={{ color: 'var(--text-primary)' }}
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Menu Overlay */}
      {showMenu && (
        <div
          className={`fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-[1000] transition-all duration-300 ease-in-out`}
          style={{ backdropFilter: 'blur(5px)' }}
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Side Menu */}
      <div
        className={`fixed top-0 h-screen w-full sm:w-[280px] z-[1001] transition-all duration-300 ease-in-out shadow-lg border-l ${
          showMenu ? 'right-0' : '-right-full'
        }`}
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderLeftColor: 'var(--border-color)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="p-8">
          <div
            className="flex justify-between items-center mb-8 pb-4 border-b"
            style={{ borderBottomColor: 'var(--border-color)' }}
          >
            <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              Menu
            </h3>
            <button
              onClick={() => setShowMenu(false)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>

          <nav>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => setShowMenu(false)}
                >
                  <Heart className="w-5 h-5 group-hover:text-indigo-500" />
                  <span className="font-medium">Home</span>
                </a>
              </li>
              <li>
                <a
                  href="/dashboard"
                  className="flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => setShowMenu(false)}
                >
                  <User className="w-5 h-5 group-hover:text-indigo-500" />
                  <span className="font-medium">Dashboard</span>
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => setShowMenu(false)}
                >
                  <Globe className="w-5 h-5 group-hover:text-indigo-500" />
                  <span className="font-medium">About</span>
                </a>
              </li>
              <li>
                <a
                  href="/support"
                  className="flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => setShowMenu(false)}
                >
                  <User className="w-5 h-5 group-hover:text-indigo-500" />
                  <span className="font-medium">Support</span>
                </a>
              </li>

              {isAuthenticated && user && (
                <li className="border-t pt-6 mt-6" style={{ borderTopColor: 'var(--border-color)' }}>
                  <div className="px-4 py-2 text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Logged in as: {user.email}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-4 px-4 py-4 w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
                  >
                    <LogOut className="w-5 h-5 group-hover:text-red-500" />
                    <span className="font-medium">Logout</span>
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>

      {/* User Modal for Authenticated Users */}
      {showUserModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowUserModal(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 rounded-lg shadow-2xl z-50 p-6"
            style={{
              backgroundColor: 'var(--bg-primary)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Account
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center py-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--primary-color)', opacity: 0.1 }}
                >
                  <User className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
                </div>
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{user?.email}</h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Logged in</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDashboard}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors font-medium hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'white'
                  }}
                >
                  <User className="w-5 h-5" />
                  <span>Go to Dashboard</span>
                </button>

                <div className="border-t pt-3" style={{ borderTopColor: 'var(--border-color)' }}>
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowUserModal(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Auth Modal - Only show if no external handler is provided */}
      {!onOpenAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />
      )}
    </div>
  )
}

export default Header