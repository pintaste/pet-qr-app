import React from 'react'
import { Trash2, Globe, Shield, Download, RefreshCw } from 'lucide-react'

interface DevToolsProps {
  onClearPinCache: () => void
  onClearSecurityData: () => void
  onClearLanguageCache: () => void
  onClearAllCache: () => void
  onViewSecurityLog: () => void
  onExportSecurityLog: () => void
  onLogout: () => void
}

/**
 * Development Tools - Debug panel for clearing caches and viewing logs.
 *
 * Features:
 * - Clear PIN verification cache
 * - Clear security data
 * - Clear language preference
 * - Clear all caches
 * - View security log
 * - Export security log
 * - Logout
 */
const DevTools: React.FC<DevToolsProps> = ({
  onClearPinCache,
  onClearSecurityData,
  onClearLanguageCache,
  onClearAllCache,
  onViewSecurityLog,
  onExportSecurityLog,
  onLogout,
}) => {
  return (
    <div className="mt-8 p-5 bg-gradient-to-br from-gray-50/90 to-gray-100/50 dark:from-gray-800/90 dark:to-gray-700/50 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-gradient-to-br hover:from-gray-100/90 hover:to-gray-50/70 dark:hover:from-gray-700/90 dark:hover:to-gray-600/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
        <span className="text-gray-700 dark:text-gray-300 text-sm font-semibold tracking-wide">
          Development Tools
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onClearPinCache}
          className="flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-800 dark:text-orange-200 text-sm rounded-md transition-colors"
          title="Clear PIN verification cache"
        >
          <Trash2 className="w-3 h-3" />
          Clear PIN
        </button>
        <button
          onClick={onClearSecurityData}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm rounded-md transition-colors"
          title="Clear security data (attempts, cooldowns, blocks)"
        >
          <Trash2 className="w-3 h-3" />
          Clear Security
        </button>
        <button
          onClick={onClearLanguageCache}
          className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm rounded-md transition-colors"
          title="Clear language preference"
        >
          <Globe className="w-3 h-3" />
          Clear Lang
        </button>
        <button
          onClick={onClearAllCache}
          className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-800 dark:text-red-200 text-sm rounded-md transition-colors"
          title="Clear all caches"
        >
          <Trash2 className="w-3 h-3" />
          Clear All
        </button>
        <button
          onClick={onViewSecurityLog}
          className="flex items-center gap-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 text-sm rounded-md transition-colors"
          title="View security activities log"
        >
          <Shield className="w-3 h-3" />
          Security Log
        </button>
        <button
          onClick={onExportSecurityLog}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-sm rounded-md transition-colors"
          title="Export security log as JSON"
        >
          <Download className="w-3 h-3" />
          Export Log
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md transition-colors"
          title="Logout current user"
        >
          <RefreshCw className="w-3 h-3" />
          Logout
        </button>
      </div>
    </div>
  )
}

export default DevTools
