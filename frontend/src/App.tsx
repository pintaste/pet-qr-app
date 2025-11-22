import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'

// Layout Components
import Layout from '@/components/Layout'
import AuthModal from '@/components/AuthModal'
import { DevTools } from '@/components/DevTools'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Pages
import LandingPage from '@/pages/LandingPage'
import LanguageSelectionPage from '@/pages/LanguageSelectionPage'
import PINVerificationPage from '@/pages/PINVerificationPage'
import PetDisplayPage from '@/pages/PetDisplayPage'
import DashboardPage from '@/pages/DashboardPage'
import NotFoundPage from '@/pages/NotFoundPage'
import QRStatusCheckPage from '@/pages/QRStatusCheckPage'

// Wrapper component for PetDisplayPage that handles AuthModal
const PetDisplayPageWithLayout: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <>
      <Layout onOpenAuthModal={() => setIsAuthModalOpen(true)}>
        <PetDisplayPage />
      </Layout>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </>
  )
}

function App() {
  const { theme } = useTheme()
  const { language } = useLanguage()

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen transition-colors duration-300 ${theme}`}
        data-theme={theme}
        data-language={language}
      >
        {/* Development Tools - Remove before production */}
        <DevTools enabled={import.meta.env.DEV} />

        <Routes>
        {/* Landing Page - Clean entry point without header */}
        <Route path="/" element={<LandingPage />} />
        {/* Language Selection - For QR code scanning flow */}
        <Route path="/language" element={<LanguageSelectionPage />} />
        {/* QR Status Check - First step after language selection */}
        <Route path="/qr/:qrCode" element={
          <Layout>
            <QRStatusCheckPage />
          </Layout>
        } />
        {/* PIN Verification - After QR status is confirmed as active */}
        <Route path="/verify/:qrCode" element={
          <Layout>
            <PINVerificationPage />
          </Layout>
        } />
        {/* Legacy route for PIN verification */}
        <Route path="/pin/:qrCode" element={
          <Layout>
            <PINVerificationPage />
          </Layout>
        } />
        <Route path="/pet/:petId" element={<PetDisplayPageWithLayout />} />

        {/* Protected Routes - Dashboard has its own layout */}
        <Route path="/dashboard/*" element={<DashboardPage />} />

        {/* 404 */}
        <Route path="*" element={
          <Layout>
            <NotFoundPage />
          </Layout>
        } />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App