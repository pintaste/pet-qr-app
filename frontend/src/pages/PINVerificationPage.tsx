import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import { useQRAccessStore } from '@/stores/qrAccessStore'
import { useSecurityStore, MAX_ATTEMPTS, COOLDOWN_TIMES, BLOCK_AFTER_ATTEMPTS } from '@/stores/securityStore'

const PINVerificationPage: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { markQRAsVerified, isQRVerified, getVerifiedPetId } = useQRAccessStore()
  const { getSecurityData, incrementAttempts } = useSecurityStore()

  const [pin, setPin] = useState(['', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaProblem, setCaptchaProblem] = useState({ question: '', answer: 0 })

  // Get current security data for this QR code
  const securityData = qrCode ? getSecurityData(qrCode) : null
  const attempts = securityData?.attempts || 0
  const cooldownUntil = securityData?.cooldownUntil || null
  const isBlocked = securityData?.isBlocked || false

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Security constants
  const MAX_ATTEMPTS = 3
  const COOLDOWN_TIMES = [30, 60, 300] // 30s, 1min, 5min
  const BLOCK_AFTER_ATTEMPTS = 6

  // Generate simple captcha
  const generateCaptcha = useCallback(() => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    setCaptchaProblem({
      question: `${num1} + ${num2} = ?`,
      answer: num1 + num2
    })
    setCaptchaAnswer('')
  }, [])

  // Handle auto-verification from cache
  const handleAutoVerifyFromCache = useCallback(() => {
    if (!qrCode) return

    console.log('Auto-verifying cached PIN for QR code:', qrCode)

    const cachedPetId = getVerifiedPetId(qrCode)
    if (cachedPetId) {
      console.log('Found cached pet ID, navigating to pet:', cachedPetId)
      navigate(`/pet/${cachedPetId}`, { replace: true })
    } else {
      console.log('No valid cached pet ID found, staying on PIN verification')
    }
  }, [qrCode, getVerifiedPetId, navigate])

  // Check if in cooldown period
  const isInCooldown = useCallback(() => {
    if (!cooldownUntil) return false
    const now = Date.now()
    if (now < cooldownUntil) {
      setCooldownTime(Math.ceil((cooldownUntil - now) / 1000))
      return true
    } else {
      setCooldownUntil(null)
      setCooldownTime(0)
      return false
    }
  }, [cooldownUntil])

  // Start cooldown period
  const startCooldown = useCallback((attemptNumber: number) => {
    const cooldownIndex = Math.min(Math.floor((attemptNumber - 1) / MAX_ATTEMPTS), COOLDOWN_TIMES.length - 1)
    const cooldownSeconds = COOLDOWN_TIMES[cooldownIndex]
    const until = Date.now() + (cooldownSeconds * 1000)
    setCooldownUntil(until)
    setCooldownTime(cooldownSeconds)
  }, [MAX_ATTEMPTS, COOLDOWN_TIMES])

  // Define handleVerify first with useCallback
  const handleVerify = useCallback(async () => {
    if (!isComplete || isVerifying || isBlocked) {
      console.log('Skipping verification - isComplete:', isComplete, 'isVerifying:', isVerifying, 'isBlocked:', isBlocked)
      return
    }

    // Check cooldown
    if (isInCooldown()) {
      setError(t('pin.cooldown', `Please wait ${cooldownTime} seconds before trying again`))
      return
    }

    // Check captcha if required
    if (captchaRequired && parseInt(captchaAnswer) !== captchaProblem.answer) {
      setError(t('pin.captcha_error', 'Incorrect captcha answer'))
      return
    }

    console.log('Starting PIN verification...')
    setIsVerifying(true)
    setError('')

    try {
      const pinString = pin.join('')
      console.log('Sending PIN verification request:', { qr_code: qrCode, pin: pinString })

      // API call to verify QR code + PIN
      const response = await fetch('/api/v1/qr-codes/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_code: qrCode,
          pin: pinString,
        }),
      })

      console.log('API response status:', response.status)
      const result = await response.json()
      console.log('API response data:', result)

      if (response.ok && result.success && result.status === 'verified') {
        console.log('PIN verified successfully! Marking QR as verified and navigating...')

        // Get pet ID from verification result
        const petId = result.pet_id

        // Mark QR code as verified in the access store
        if (qrCode && petId) {
          markQRAsVerified(qrCode, petId)
        }

        if (!petId) {
          setError('No pet associated with this QR code')
          clearPin()
          return
        }

        // Small delay to ensure state is updated
        setTimeout(() => {
          console.log('Executing navigation to:', `/pet/${petId}`)
          navigate(`/pet/${petId}`, { replace: true })
        }, 100)
        return
      } else {
        console.log('PIN verification failed:', result)

        // Increment attempt counter
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        // Check if user should be blocked
        if (newAttempts >= BLOCK_AFTER_ATTEMPTS) {
          setIsBlocked(true)
          setError(t('pin.blocked', 'Too many failed attempts. Access blocked.'))
          clearPin()
          return
        }

        // Start cooldown after every MAX_ATTEMPTS failures
        if (newAttempts % MAX_ATTEMPTS === 0) {
          startCooldown(newAttempts)
          setError(t('pin.cooldown_started', `Too many failed attempts. Please wait ${COOLDOWN_TIMES[Math.min(Math.floor((newAttempts - 1) / MAX_ATTEMPTS), COOLDOWN_TIMES.length - 1)]} seconds.`))
        } else {
          setError(t('pin.error', `Incorrect PIN. ${MAX_ATTEMPTS - (newAttempts % MAX_ATTEMPTS)} attempts remaining.`))
        }

        // Require captcha after 2 failed attempts
        if (newAttempts >= 2 && !captchaRequired) {
          setCaptchaRequired(true)
          generateCaptcha()
        } else if (captchaRequired) {
          generateCaptcha() // Generate new captcha after each failed attempt
        }

        clearPin()
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('Network error. Please check your connection.')
      clearPin()
    } finally {
      console.log('Verification complete, setting isVerifying to false')
      setIsVerifying(false)
    }
  }, [isComplete, isVerifying, pin, qrCode, navigate, t, markQRAsVerified, attempts, captchaRequired, captchaAnswer, captchaProblem, isBlocked, isInCooldown, cooldownTime, startCooldown, generateCaptcha, MAX_ATTEMPTS, BLOCK_AFTER_ATTEMPTS, COOLDOWN_TIMES])

  const clearPin = useCallback(() => {
    setPin(['', '', '', ''])
    setIsComplete(false)
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    // Focus on first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }

    // Generate initial captcha (though not shown until needed)
    generateCaptcha()

    // Check if PIN is already verified for this QR code
    if (qrCode && isQRVerified(qrCode)) {
      console.log('PIN already verified for this QR code, auto-verifying...')
      // Auto-verify by making API call to get pet_id
      handleAutoVerifyFromCache()
    }
  }, [generateCaptcha, qrCode, isQRVerified, handleAutoVerifyFromCache])

  // Cooldown timer effect
  useEffect(() => {
    if (!cooldownUntil || cooldownTime <= 0) return

    const timer = setInterval(() => {
      const now = Date.now()
      const remaining = Math.ceil((cooldownUntil - now) / 1000)

      if (remaining <= 0) {
        setCooldownUntil(null)
        setCooldownTime(0)
        clearInterval(timer)
      } else {
        setCooldownTime(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownUntil, cooldownTime])

  useEffect(() => {
    // Check if PIN is complete
    const isCompletePin = pin.every(digit => digit !== '')
    setIsComplete(isCompletePin)

    if (isCompletePin && !isVerifying) {
      console.log('PIN is complete, starting auto-verification...')
      // Auto-verify when all digits are entered (with small delay to avoid rapid calls)
      const timer = setTimeout(() => {
        console.log('Auto-verification timer triggered')
        handleVerify()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [pin, isVerifying, handleVerify])

  const handleInputChange = (index: number, value: string) => {
    // Only allow single digits
    if (value.length > 1) return

    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Clear error when user starts typing again
    if (error) {
      setError('')
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digits = pastedData.replace(/\D/g, '').slice(0, 4).split('')

    if (digits.length === 4) {
      setPin(digits)
      inputRefs.current[3]?.focus()
    }
  }


  const handleRetry = () => {
    clearPin()
    setError('')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto max-w-md min-h-screen flex flex-col justify-center p-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-2 tracking-wide">
            {t('pin.title', 'Enter PIN')}
          </h2>
          <p className="text-gray-500 dark:text-gray-500 text-sm uppercase tracking-wider">
            {t('pin.description', 'Enter the 4-digit PIN for this pet')}
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`
                w-16 h-16 text-center text-2xl font-bold rounded-2xl
                glass-morphism transition-all duration-300
                ${digit
                  ? 'border-2 border-indigo-400 enhanced-glow text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/30'
                  : 'border border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300'
                }
                ${error ? 'border-red-400 animate-pulse bg-red-50/50 dark:bg-red-900/30' : ''}
                focus:outline-none focus:border-2 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/30 focus:scale-110
                hover:scale-105 hover:shadow-lg
              `}
              data-index={index}
              disabled={isVerifying}
            />
          ))}
        </div>

        {/* Security Status Display */}
        {(attempts > 0 || cooldownTime > 0 || isBlocked) && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              {isBlocked && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <span>🚫</span>
                  <span className="font-semibold">Access Blocked - Too many failed attempts</span>
                </div>
              )}
              {cooldownTime > 0 && (
                <div className="flex items-center gap-2">
                  <span>⏰</span>
                  <span>Please wait {cooldownTime} seconds before trying again</span>
                </div>
              )}
              {attempts > 0 && !isBlocked && cooldownTime === 0 && (
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Failed attempts: {attempts}/{BLOCK_AFTER_ATTEMPTS}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Captcha */}
        {captchaRequired && !isBlocked && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="text-center mb-3">
              <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                🤖 Anti-Robot Verification
              </span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg font-mono font-bold text-blue-900 dark:text-blue-100">
                {captchaProblem.question}
              </span>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="w-20 px-3 py-2 text-center border rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="?"
                disabled={isVerifying}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={!isComplete || isVerifying}
          className={`
            w-full py-4 px-6 font-medium text-lg transition-all duration-200 rounded-lg
            ${!isComplete || isVerifying
              ? 'border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
              : 'border-2 border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600 hover:border-indigo-600 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isVerifying ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Verifying...</span>
            </div>
          ) : (
            isComplete ? 'Verify PIN' : 'Enter PIN'
          )}
        </button>


        {/* QR Code info display */}
        <div className="mt-12 text-center">
          <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-4"></div>
          <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider">
            {t('qrCodeId', 'QR Code')}: {qrCode?.slice(-8)}
          </p>
        </div>

      </div>
    </div>
  )
}

export default PINVerificationPage