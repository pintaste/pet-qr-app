import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useImpersonationStore } from '@/stores/impersonationStore'

interface ImpersonationBannerProps {
  onStopImpersonation: () => void
}

/**
 * Impersonation Banner Component
 *
 * Displays a prominent warning banner when an admin is impersonating another user.
 * Shows the impersonated user's email and provides a button to exit impersonation.
 */
const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  onStopImpersonation,
}) => {
  const { isImpersonating, impersonatedUser } = useImpersonationStore()

  if (!isImpersonating || !impersonatedUser) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Warning Icon and Message */}
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold text-sm">IMPERSONATING:</span>
              <span className="text-sm">{impersonatedUser.email}</span>
              <span className="text-xs opacity-75">
                (Role: {impersonatedUser.role})
              </span>
            </div>
          </div>

          {/* Exit Button */}
          <button
            onClick={onStopImpersonation}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Impersonation</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImpersonationBanner
