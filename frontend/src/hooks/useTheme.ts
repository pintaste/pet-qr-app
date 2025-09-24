/**
 * Theme management hook.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, ThemeConfig } from '@/types'

interface ThemeStore {
  theme: Theme
  customTheme: ThemeConfig | null
  setTheme: (theme: Theme) => void
  setCustomTheme: (config: ThemeConfig) => void
  toggleTheme: () => void
}

const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      customTheme: null,

      setTheme: (theme: Theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      },

      setCustomTheme: (config: ThemeConfig) => {
        set({ customTheme: config })
        // Apply custom CSS variables
        const root = document.documentElement
        root.style.setProperty('--custom-primary', config.primary)
        root.style.setProperty('--custom-secondary', config.secondary)
      },

      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },
    }),
    {
      name: 'pet-qr-theme',
    }
  )
)

export const useTheme = () => {
  const { theme, customTheme, setTheme, setCustomTheme, toggleTheme } = useThemeStore()

  // Apply theme on mount
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (customTheme) {
      const root = document.documentElement
      root.style.setProperty('--custom-primary', customTheme.primary)
      root.style.setProperty('--custom-secondary', customTheme.secondary)
    }
  }, [theme, customTheme])

  return {
    theme,
    customTheme,
    setTheme,
    setCustomTheme,
    toggleTheme,
  }
}

import React from 'react'