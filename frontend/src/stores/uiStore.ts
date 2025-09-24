import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Modal {
  isOpen: boolean
  type: string | null
  data: any
}

interface UIState {
  // Theme and preferences
  theme: 'light' | 'dark' | 'system'
  language: string

  // Modals and overlays
  modal: Modal
  sideMenuOpen: boolean

  // Loading states
  globalLoading: boolean

  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }>

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: string) => void

  openModal: (type: string, data?: any) => void
  closeModal: () => void

  setSideMenuOpen: (open: boolean) => void
  toggleSideMenu: () => void

  setGlobalLoading: (loading: boolean) => void

  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      language: 'en',

      modal: {
        isOpen: false,
        type: null,
        data: null,
      },
      sideMenuOpen: false,

      globalLoading: false,

      notifications: [],

      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme })
      },

      setLanguage: (language: string) => {
        set({ language })
      },

      openModal: (type: string, data?: any) => {
        set({
          modal: {
            isOpen: true,
            type,
            data: data || null,
          }
        })
      },

      closeModal: () => {
        set({
          modal: {
            isOpen: false,
            type: null,
            data: null,
          }
        })
      },

      setSideMenuOpen: (open: boolean) => {
        set({ sideMenuOpen: open })
      },

      toggleSideMenu: () => {
        const { sideMenuOpen } = get()
        set({ sideMenuOpen: !sideMenuOpen })
      },

      setGlobalLoading: (loading: boolean) => {
        set({ globalLoading: loading })
      },

      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9)
        const { notifications } = get()

        const newNotification = {
          ...notification,
          id,
          duration: notification.duration || 5000,
        }

        set({ notifications: [...notifications, newNotification] })

        // Auto-remove notification after duration
        if (newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, newNotification.duration)
        }
      },

      removeNotification: (id: string) => {
        const { notifications } = get()
        set({ notifications: notifications.filter(n => n.id !== id) })
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
)