import React from 'react'
import { useNavigate } from 'react-router-dom'

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto max-w-md min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🐾</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

export default NotFoundPage