/**
 * GEO-SCOPE Brand Store
 *
 * @deprecated This store is deprecated. Use useProjectStore from @/store/project-store instead.
 *
 * The useProjectStore provides:
 * - currentProject (replaces brandInfo)
 * - currentProject.assets.features (replaces products)
 * - currentProject.assets.competitors (replaces competitors)
 * - currentProject.assets.claims (replaces keyMessages)
 * - currentProject.settings (replaces settings)
 *
 * Migration guide:
 * - useBrandStore() → useProjectStore()
 * - brandInfo → currentProject
 * - products → currentProject?.assets.features
 * - competitors → currentProject?.assets.competitors
 * - keyMessages → currentProject?.assets.claims
 * - settings → currentProject?.settings
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { BrandInfo, Product, KeyMessage, BrandSettings } from './types'

/**
 * @deprecated Use useProjectStore instead
 */
interface BrandStore {
  // Brand Info
  brandInfo: BrandInfo | null
  setBrandInfo: (info: BrandInfo) => void
  updateBrandInfo: (updates: Partial<BrandInfo>) => void

  // Products
  products: Product[]
  addProduct: (product: Product) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  removeProduct: (id: string) => void

  // Competitors
  competitors: LegacyCompetitor[]
  addCompetitor: (competitor: LegacyCompetitor) => void
  updateCompetitor: (id: string, updates: Partial<LegacyCompetitor>) => void
  removeCompetitor: (id: string) => void

  // Key Messages
  keyMessages: KeyMessage[]
  addKeyMessage: (message: KeyMessage) => void
  updateKeyMessage: (id: string, updates: Partial<KeyMessage>) => void
  removeKeyMessage: (id: string) => void

  // Settings
  settings: BrandSettings
  updateSettings: (updates: Partial<BrandSettings>) => void

  // Reset
  reset: () => void
}

// Legacy competitor type (different from api/types Competitor)
interface LegacyCompetitor {
  id: string
  name: string
  category: string
  website: string
  status: "monitoring" | "inactive"
}

const defaultBrandInfo: BrandInfo = {
  id: '1',
  name: 'GEO-SCOPE',
  website: 'https://GEO-SCOPE.ai',
  industry: 'AI Analytics',
  founded: '2024',
  tagline: 'AI-powered brand visibility platform',
  description: 'GEO-SCOPE helps brands track and optimize their presence across AI platforms.',
}

const defaultSettings: BrandSettings = {
  aiMonitoring: true,
  autoUpdateBrandInfo: false,
  sentimentAlerts: true,
}

/**
 * @deprecated Use useProjectStore from @/store/project-store instead
 */
export const useBrandStore = create<BrandStore>()(
  persist(
    (set) => ({
      // Initial state
      brandInfo: defaultBrandInfo,
      products: [],
      competitors: [],
      keyMessages: [],
      settings: defaultSettings,

      // Brand Info actions
      setBrandInfo: (info) => set({ brandInfo: info }),
      updateBrandInfo: (updates) =>
        set((state) => ({
          brandInfo: state.brandInfo ? { ...state.brandInfo, ...updates } : null,
        })),

      // Product actions
      addProduct: (product) =>
        set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      removeProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

      // Competitor actions
      addCompetitor: (competitor) =>
        set((state) => ({ competitors: [...state.competitors, competitor] })),
      updateCompetitor: (id, updates) =>
        set((state) => ({
          competitors: state.competitors.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      removeCompetitor: (id) =>
        set((state) => ({ competitors: state.competitors.filter((c) => c.id !== id) })),

      // Key Message actions
      addKeyMessage: (message) =>
        set((state) => ({ keyMessages: [...state.keyMessages, message] })),
      updateKeyMessage: (id, updates) =>
        set((state) => ({
          keyMessages: state.keyMessages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      removeKeyMessage: (id) =>
        set((state) => ({ keyMessages: state.keyMessages.filter((m) => m.id !== id) })),

      // Settings actions
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      // Reset action
      reset: () =>
        set({
          brandInfo: defaultBrandInfo,
          products: [],
          competitors: [],
          keyMessages: [],
          settings: defaultSettings,
        }),
    }),
    {
      name: 'GEO-SCOPE-brand-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
)
