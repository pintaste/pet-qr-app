import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, User, Mail, Lock, UserPlus, Loader2, Eye, EyeOff, X, Shield, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { authService } from '@/services/authService'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

interface FormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  captchaAnswer: string
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  fullName?: string
  captchaAnswer?: string
  general?: string
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Simple captcha state
  const [captchaQuestion, setCaptchaQuestion] = useState({ question: '', answer: 0 })

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    captchaAnswer: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Generate simple math captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    const operation = Math.random() > 0.5 ? '+' : '-'
    const answer = operation === '+' ? num1 + num2 : num1 - num2
    setCaptchaQuestion({
      question: `${num1} ${operation} ${num2} = ?`,
      answer: answer
    })
  }

  // Initialize captcha when switching to register mode
  React.useEffect(() => {
    if (mode === 'register') {
      generateCaptcha()
    }
  }, [mode])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('auth.error.email_required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.error.invalid_email')
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('auth.error.password_required')
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.error.password_min_length')
    }

    // Register-specific validation
    if (mode === 'register') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = t('auth.error.name_required')
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = t('auth.error.password_required')
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('auth.error.passwords_not_match')
      }

      // Captcha validation
      if (!formData.captchaAnswer.trim()) {
        newErrors.captchaAnswer = t('auth.error.captcha_required', 'Please solve the math problem')
      } else if (parseInt(formData.captchaAnswer) !== captchaQuestion.answer) {
        newErrors.captchaAnswer = t('auth.error.captcha_incorrect', 'Incorrect answer, please try again')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      if (mode === 'login') {
        await authService.login({
          email: formData.email,
          password: formData.password
        })
      } else {
        await authService.register({
          email: formData.email,
          password: formData.password,
          name: formData.fullName
        })

        // Auto login after registration
        await authService.login({
          email: formData.email,
          password: formData.password
        })
      }

      // Close modal and navigate
      onClose()
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Auth error:', error)
      let errorMessage = t('common.error')

      if (error.message) {
        if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
          errorMessage = t('auth.error.invalid_credentials')
        } else if (error.message.includes('already exists') || error.message.includes('User with this email')) {
          errorMessage = t('auth.error.user_exists')
        } else {
          errorMessage = error.message
        }
      }

      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setFormData({ email: '', password: '', confirmPassword: '', fullName: '', captchaAnswer: '' })
    setErrors({})
  }

  const handleClose = () => {
    setFormData({ email: '', password: '', confirmPassword: '', fullName: '', captchaAnswer: '' })
    setErrors({})
    setMode(initialMode)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border-2 border-indigo-500 rounded-full mb-4">
                <Heart className="w-6 h-6 text-indigo-500" fill="currentColor" />
              </div>
              <h2 className="text-xl font-light text-gray-900 dark:text-white mb-1">
                {t('auth.title')}
              </h2>
              <p className="text-indigo-600 dark:text-indigo-400 text-sm uppercase tracking-wider">
                {t('auth.subtitle')}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Mode Tabs */}
            <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-2xl p-1">
              <button
                onClick={() => mode !== 'login' && toggleMode()}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 rounded-xl ${
                  mode === 'login'
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  {t('auth.login')}
                </div>
              </button>
              <button
                onClick={() => mode !== 'register' && toggleMode()}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 rounded-xl ${
                  mode === 'register'
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {t('auth.register')}
                </div>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* General Error */}
              {errors.general && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm">
                  {errors.general}
                </div>
              )}

              {/* Full Name (Register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all duration-300 ${
                        errors.fullName ? 'border-red-400 dark:border-red-600' : 'border-transparent focus:bg-white dark:focus:bg-gray-600'
                      }`}
                      placeholder="Enter your name"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
                  )}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all duration-300 ${
                      errors.email ? 'border-red-400 dark:border-red-600' : 'border-transparent focus:bg-white dark:focus:bg-gray-600'
                    }`}
                    placeholder={t('auth.email_placeholder')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-12 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all duration-300 ${
                      errors.password ? 'border-red-400 dark:border-red-600' : 'border-transparent focus:bg-white dark:focus:bg-gray-600'
                    }`}
                    placeholder={t('auth.password_placeholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password (Register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.confirm_password')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-12 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all duration-300 ${
                        errors.confirmPassword ? 'border-red-400 dark:border-red-600' : 'border-transparent focus:bg-white dark:focus:bg-gray-600'
                      }`}
                      placeholder={t('auth.confirm_password_placeholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Captcha (Register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.verification', 'Verification')}
                  </label>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Shield className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          value={formData.captchaAnswer}
                          onChange={(e) => handleInputChange('captchaAnswer', e.target.value)}
                          className={`w-full pl-10 pr-4 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all duration-300 ${
                            errors.captchaAnswer ? 'border-red-400 dark:border-red-600' : 'border-transparent focus:bg-white dark:focus:bg-gray-600'
                          }`}
                          placeholder={t('auth.captcha_placeholder', 'Enter answer')}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded-lg min-w-[80px] text-center">
                        {captchaQuestion.question}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          generateCaptcha()
                          handleInputChange('captchaAnswer', '')
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={t('auth.refresh_captcha', 'New question')}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {errors.captchaAnswer && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.captchaAnswer}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 border-2 border-indigo-500 bg-indigo-500 hover:bg-indigo-600 hover:border-indigo-600 disabled:bg-indigo-400 disabled:border-indigo-400 text-white py-4 px-6 rounded-2xl font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('auth.loading')}
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5" fill="currentColor" />
                    {mode === 'login' ? t('auth.login_button') : t('auth.register_button')}
                  </>
                )}
              </button>

              {/* SSO Options */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {t('auth.or', 'Or continue with')}
                  </span>
                </div>
              </div>

              {/* SSO Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // Placeholder for Google SSO
                    alert(t('auth.sso_coming_soon', 'SSO coming soon!'))
                  }}
                  className="flex items-center justify-center py-3 px-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 group"
                >
                  <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    G
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Placeholder for Facebook SSO
                    alert(t('auth.sso_coming_soon', 'SSO coming soon!'))
                  }}
                  className="flex items-center justify-center py-3 px-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 group"
                >
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    f
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Placeholder for Apple SSO
                    alert(t('auth.sso_coming_soon', 'SSO coming soon!'))
                  }}
                  className="flex items-center justify-center py-3 px-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 group"
                >
                  <div className="w-5 h-5 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black text-xs font-bold">
                    🍎
                  </div>
                </button>
              </div>

              {/* Forgot Password (Login only) */}
              {mode === 'login' && (
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-medium"
                  >
                    {t('auth.forgot_password')}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AuthModal