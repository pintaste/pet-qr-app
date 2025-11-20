/**
 * Development Tools Widget
 *
 * Floating widget for testing and cache management during development.
 *
 * ⚠️ WARNING: REMOVE BEFORE PRODUCTION RELEASE ⚠️
 * This component is for development/testing only and should be removed
 * before deploying to production.
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useLanguage } from '../hooks/useLanguage'
import { useQRAccessStore } from '../stores/qrAccessStore'
import { useSecurityStore } from '../stores/securityStore'
import { useSecurityMonitorStore } from '../stores/securityMonitorStore'
import { authService } from '../services/authService'

interface DevToolsProps {
  /** Set to false to hide the widget (e.g., in production) */
  enabled?: boolean
}

export const DevTools: React.FC<DevToolsProps> = ({ enabled = true }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuthStore()
  const { clearLanguagePreference } = useLanguage()
  const { clearVerification } = useQRAccessStore()
  const { clearSecurityData } = useSecurityStore()
  const { getSuspiciousActivities, exportSecurityLog } = useSecurityMonitorStore()
  const navigate = useNavigate()

  // Don't render if disabled
  if (!enabled || import.meta.env.PROD) {
    return null
  }

  // Cache management functions
  const handleClearPinCache = () => {
    const demoQrCode = 'DEMO123'
    clearVerification(demoQrCode)
    alert('PIN verification cache cleared for DEMO123!')
    console.log('[DevTools] PIN verification cache cleared for', demoQrCode)
  }

  const handleClearSecurityData = () => {
    const demoQrCode = 'DEMO123'
    clearSecurityData(demoQrCode)
    alert('Security data (attempts, cooldowns, blocks) cleared for DEMO123!')
    console.log('[DevTools] Security data cleared for', demoQrCode)
  }

  const handleClearLanguageCache = () => {
    clearLanguagePreference()
    alert('Language preference cleared!')
    console.log('[DevTools] Language preference cleared')
  }

  const handleClearAllCache = () => {
    const demoQrCode = 'DEMO123'
    clearVerification(demoQrCode)
    clearSecurityData(demoQrCode)
    clearLanguagePreference()
    alert('All caches cleared! (PIN verification, security data for DEMO123, and language preference)')
    console.log('[DevTools] All caches cleared')
  }

  const handleViewSecurityLog = () => {
    const activities = getSuspiciousActivities()
    const logData = activities.map((activity: any) =>
      `${new Date(activity.timestamp).toISOString()} - ${activity.type} - QR: ${activity.qrCode || 'N/A'} - Pet: ${activity.petId || 'N/A'}`
    ).join('\n')

    const message = activities.length > 0
      ? `Security Activities (${activities.length} entries):\n\n${logData}`
      : 'No suspicious activities recorded'

    alert(message)
  }

  const handleExportSecurityLog = () => {
    const logData = exportSecurityLog()
    const blob = new Blob([logData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-log-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert('Security log exported successfully!')
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      alert('Logged out successfully!')
      console.log('[DevTools] User logged out')
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      alert('Logout failed. Check console for details.')
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        title="Development Tools"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-80 transform bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-orange-500 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Dev Tools</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-white hover:bg-white/20"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-sm text-white/90">
              ⚠️ Development Only
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Current User Info */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Current User
              </h3>
              {user ? (
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Role:</span>{' '}
                    <span className="font-mono text-xs">{user.role}</span>
                  </p>
                  {user.tenant_id && (
                    <p className="text-gray-600">
                      <span className="font-medium">Tenant ID:</span>{' '}
                      {user.tenant_id}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not logged in</p>
              )}
            </div>

            {/* Cache & Security Tools */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Cache & Security Tools
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleClearPinCache}
                  className="w-full rounded-lg bg-orange-100 px-4 py-3 text-left text-sm font-medium text-orange-800 transition-colors hover:bg-orange-200"
                >
                  Clear PIN Cache
                  <p className="mt-1 text-xs opacity-75">
                    Clear PIN verification for DEMO123
                  </p>
                </button>
                <button
                  onClick={handleClearSecurityData}
                  className="w-full rounded-lg bg-yellow-100 px-4 py-3 text-left text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-200"
                >
                  Clear Security Data
                  <p className="mt-1 text-xs opacity-75">
                    Clear attempts, cooldowns, blocks
                  </p>
                </button>
                <button
                  onClick={handleClearLanguageCache}
                  className="w-full rounded-lg bg-blue-100 px-4 py-3 text-left text-sm font-medium text-blue-800 transition-colors hover:bg-blue-200"
                >
                  Clear Language
                  <p className="mt-1 text-xs opacity-75">
                    Reset language preference
                  </p>
                </button>
                <button
                  onClick={handleClearAllCache}
                  className="w-full rounded-lg bg-red-100 px-4 py-3 text-left text-sm font-medium text-red-800 transition-colors hover:bg-red-200"
                >
                  Clear All Caches
                  <p className="mt-1 text-xs opacity-75">
                    Reset everything at once
                  </p>
                </button>
                <button
                  onClick={handleViewSecurityLog}
                  className="w-full rounded-lg bg-purple-100 px-4 py-3 text-left text-sm font-medium text-purple-800 transition-colors hover:bg-purple-200"
                >
                  View Security Log
                  <p className="mt-1 text-xs opacity-75">
                    Show security activities
                  </p>
                </button>
                <button
                  onClick={handleExportSecurityLog}
                  className="w-full rounded-lg bg-indigo-100 px-4 py-3 text-left text-sm font-medium text-indigo-800 transition-colors hover:bg-indigo-200"
                >
                  Export Security Log
                  <p className="mt-1 text-xs opacity-75">
                    Download as JSON file
                  </p>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Logout
                  <p className="mt-1 text-xs opacity-75">
                    Clear session and return home
                  </p>
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
              <div className="flex items-start">
                <svg
                  className="mr-2 h-5 w-5 flex-shrink-0 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800">
                    Development Only
                  </h4>
                  <p className="mt-1 text-xs text-red-700">
                    This widget must be removed before production deployment.
                    Check TASK.md for removal checklist.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <p className="text-center text-xs text-gray-500">
              Development Tools v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
