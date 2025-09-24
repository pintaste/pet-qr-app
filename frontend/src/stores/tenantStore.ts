import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Tenant {
  id: number
  name: string
  subdomain: string
  custom_domain?: string
  tier: string
  settings: {
    theme?: {
      primary_color?: string
      secondary_color?: string
      background_color?: string
      logo_url?: string
    }
    [key: string]: any
  }
  schema_name: string
}

interface TenantState {
  currentTenant: Tenant | null
  tenants: Tenant[]
  isLoading: boolean

  // Actions
  setCurrentTenant: (tenant: Tenant) => void
  setTenants: (tenants: Tenant[]) => void
  clearTenant: () => void
  setLoading: (loading: boolean) => void
  updateTenantSettings: (tenantId: number, settings: any) => void
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      currentTenant: null,
      tenants: [],
      isLoading: false,

      setCurrentTenant: (tenant: Tenant) => {
        set({ currentTenant: tenant })
      },

      setTenants: (tenants: Tenant[]) => {
        set({ tenants })
      },

      clearTenant: () => {
        set({ currentTenant: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      updateTenantSettings: (tenantId: number, settings: any) => {
        const { currentTenant, tenants } = get()

        // Update current tenant if it matches
        if (currentTenant && currentTenant.id === tenantId) {
          set({
            currentTenant: {
              ...currentTenant,
              settings: { ...currentTenant.settings, ...settings }
            }
          })
        }

        // Update in tenants list
        const updatedTenants = tenants.map(tenant =>
          tenant.id === tenantId
            ? { ...tenant, settings: { ...tenant.settings, ...settings } }
            : tenant
        )
        set({ tenants: updatedTenants })
      },
    }),
    {
      name: 'tenant-store',
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        tenants: state.tenants,
      }),
    }
  )
)