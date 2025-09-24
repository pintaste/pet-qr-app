import React from 'react'
import { Heart } from 'lucide-react'

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto max-w-md min-h-screen flex flex-col justify-center p-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-indigo-500 rounded-full mb-6">
            <Heart className="w-8 h-8 text-indigo-500" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-2 tracking-wide">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-500 text-sm uppercase tracking-wider">
            Pet Management
          </p>
        </div>

        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-500 text-sm leading-relaxed">
            Pet management dashboard will be implemented here.
          </p>
        </div>

        <div className="mt-12 text-center">
          <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-4"></div>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Dashboard features coming soon
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage