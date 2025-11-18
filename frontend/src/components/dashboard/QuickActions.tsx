import React from 'react'
import { Plus, QrCode, Download, BarChart3 } from 'lucide-react'

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  color: 'indigo' | 'green' | 'blue' | 'purple'
  onClick: () => void
}

interface QuickActionsProps {
  onAddPet: () => void
  onGenerateQR: () => void
  onDownloadQR: () => void
  onViewReports: () => void
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddPet,
  onGenerateQR,
  onDownloadQR,
  onViewReports,
}) => {
  const actions: QuickAction[] = [
    {
      id: 'add-pet',
      label: 'Add Pet',
      icon: Plus,
      color: 'indigo',
      onClick: onAddPet,
    },
    {
      id: 'generate-qr',
      label: 'Generate QR',
      icon: QrCode,
      color: 'green',
      onClick: onGenerateQR,
    },
    {
      id: 'download-qr',
      label: 'Download QR',
      icon: Download,
      color: 'blue',
      onClick: onDownloadQR,
    },
    {
      id: 'view-reports',
      label: 'View Reports',
      icon: BarChart3,
      color: 'purple',
      onClick: onViewReports,
    },
  ]

  const colorClasses = {
    indigo: 'border-indigo-500 bg-indigo-500 hover:bg-indigo-600',
    green: 'border-green-500 bg-green-500 hover:bg-green-600',
    blue: 'border-blue-500 bg-blue-500 hover:bg-blue-600',
    purple: 'border-purple-500 bg-purple-500 hover:bg-purple-600',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
      <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-white transition-all duration-300 hover:scale-[1.05] ${
                colorClasses[action.color]
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActions
