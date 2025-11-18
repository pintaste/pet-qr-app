import React from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>

      <h3 className="text-lg font-light text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl border-2 border-indigo-500 transition-all duration-300 hover:scale-[1.05]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
