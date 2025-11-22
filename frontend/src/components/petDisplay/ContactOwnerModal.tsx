/**
 * ContactOwnerModal component for displaying contact options to reach the pet owner.
 * Provides phone, SMS, and email contact methods with safety notes.
 */

import React from 'react'
import { X, Phone, MessageCircle, Mail, AlertTriangle } from 'lucide-react'
import { PetInfo } from '@/types/petDisplay.types'

interface ContactOwnerModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Pet information containing contact details */
  petInfo: PetInfo | null
  /** Close the modal */
  onClose: () => void
  /** Handle phone call action */
  onPhoneCall: (phone: string) => void
  /** Handle SMS action */
  onSMS: (phone: string) => void
  /** Handle email action */
  onEmail: () => void
}

/**
 * Modal component for contacting the pet owner via phone, SMS, or email.
 *
 * @param props - Component properties
 * @returns Rendered contact modal or null if closed
 */
export const ContactOwnerModal: React.FC<ContactOwnerModalProps> = ({
  isOpen,
  petInfo,
  onClose,
  onPhoneCall,
  onSMS,
  onEmail
}) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-end justify-center md:items-center"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 w-full max-w-[420px] md:max-w-md shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-out overflow-hidden
          ${isOpen ? 'translate-y-0 md:scale-100' : 'translate-y-full md:scale-95'}
          rounded-t-2xl md:rounded-3xl
          max-h-[85vh] md:max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle - Mobile Only */}
        <div className="flex justify-center py-2 md:hidden">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 pb-3 md:pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent md:text-xl">
                Contact {petInfo?.owner_name || 'Owner'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {petInfo?.location_area && `Location: ${petInfo.location_area}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-4">
          {/* Primary Contact Methods - Grid Layout */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Emergency Call */}
            {(petInfo?.emergency_contact?.phone || petInfo?.emergency_contact) && (
              <button
                onClick={() => {
                  onPhoneCall(petInfo?.emergency_contact?.phone || '+1 (555) 123-4567')
                  onClose()
                }}
                className="bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl p-4 flex flex-col items-center space-y-3 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 h-24"
              >
                <div className="text-red-500 dark:text-red-400">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Emergency Call</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Call Now</p>
                </div>
              </button>
            )}

            {/* SMS */}
            {(petInfo?.emergency_contact?.phone || petInfo?.emergency_contact) && (
              <button
                onClick={() => {
                  onSMS(petInfo?.emergency_contact?.phone || '+1 (555) 123-4567')
                  onClose()
                }}
                className="bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl p-4 flex flex-col items-center space-y-3 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 h-24"
              >
                <div className="text-green-500 dark:text-green-400">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Send SMS</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Text Message</p>
                </div>
              </button>
            )}

            {/* Email */}
            {petInfo?.owner_email && (
              <button
                onClick={() => {
                  onEmail()
                  onClose()
                }}
                className="bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl p-4 flex flex-col items-center space-y-3 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 h-24"
              >
                <div className="text-blue-500 dark:text-blue-400">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Send Email</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Detailed Info</p>
                </div>
              </button>
            )}
          </div>

          {/* Secondary Phone (if exists) */}
          {petInfo?.secondary_phone && (
            <>
              <div className="h-px bg-gray-100 dark:bg-gray-700/50 my-4"></div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Backup Contact</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium text-gray-900 dark:text-white">{petInfo.secondary_phone}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        onPhoneCall(petInfo.secondary_phone || '')
                        onClose()
                      }}
                      className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onSMS(petInfo.secondary_phone || '')
                        onClose()
                      }}
                      className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Safety Note */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200/50 dark:border-amber-700/50 mt-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <span className="font-medium">For emergencies, call directly.</span> For non-urgent matters, SMS or email is recommended.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactOwnerModal
