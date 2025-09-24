import React from 'react'
import { useParams } from 'react-router-dom'
import { Heart } from 'lucide-react'

const ProfilePage: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto max-w-md min-h-screen flex flex-col justify-center p-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-indigo-500 rounded-full mb-6">
            <Heart className="w-8 h-8 text-indigo-500" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-2 tracking-wide">
            Pet Profile
          </h1>
          <p className="text-gray-500 dark:text-gray-500 text-sm uppercase tracking-wider">
            Detailed Information
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">QR Code:</p>
            <p className="font-medium text-indigo-600 dark:text-indigo-400">{qrCode}</p>
          </div>

          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-500 text-sm leading-relaxed">
              This page will show detailed pet profile information.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-4"></div>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Profile details coming soon
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage