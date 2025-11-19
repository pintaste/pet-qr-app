import { create } from 'zustand'

interface ImpersonatedUser {
  id: number
  email: string
  role: string
  tenant_id?: number
}

interface ImpersonationState {
  isImpersonating: boolean
  impersonatedUser: ImpersonatedUser | null
  startedAt: Date | null

  // Actions
  startImpersonation: (user: ImpersonatedUser) => void
  stopImpersonation: () => void
}

/**
 * Impersonation Store
 *
 * Manages the state when an admin is impersonating another user.
 * This is used to display a banner and track impersonation status.
 */
export const useImpersonationStore = create<ImpersonationState>((set) => ({
  isImpersonating: false,
  impersonatedUser: null,
  startedAt: null,

  startImpersonation: (user: ImpersonatedUser) => {
    set({
      isImpersonating: true,
      impersonatedUser: user,
      startedAt: new Date(),
    })
  },

  stopImpersonation: () => {
    set({
      isImpersonating: false,
      impersonatedUser: null,
      startedAt: null,
    })
  },
}))
