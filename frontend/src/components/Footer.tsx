import React from 'react'

interface FooterProps {
  variant?: 'default' | 'minimal'
}

const Footer: React.FC<FooterProps> = ({ variant = 'default' }) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="max-w-md mx-auto bg-white dark:bg-gray-900">
      <div className="py-4 px-8">
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            © {currentYear} PetID
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer