import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storageConfig } from '@/config'
import type { AccentColorKey } from '@/lib/accent-palette'

interface AccentStoreState {
  accentColor: AccentColorKey
  secondaryColor: AccentColorKey
  setAccentColor: (color: AccentColorKey) => void
  setSecondaryColor: (color: AccentColorKey) => void
}

const DEFAULT_PRIMARY: AccentColorKey = 'red'
const DEFAULT_SECONDARY: AccentColorKey = 'green'

export const useAccentStore = create<AccentStoreState>()(
  persist(
    (set) => ({
      accentColor: DEFAULT_PRIMARY,
      secondaryColor: DEFAULT_SECONDARY,
      setAccentColor: (color) => set({ accentColor: color }),
      setSecondaryColor: (color) => set({ secondaryColor: color }),
    }),
    {
      name: storageConfig.accentColorKey,
    }
  )
)
