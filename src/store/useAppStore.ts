import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, LanguageCode } from '@/types'

const DEFAULT_SETTINGS: AppSettings = {
  language: 'te',
  fontSize: 'normal',
  highContrast: false,
  reducedMotion: false,
  cameraEnabled: false,
  ttsEnabled: true,
  ttsSpeed: 1.0,
  ttsVolume: 1.0,
  demoMode: true,
  privacyLocalOnly: true,
}

interface AppStore {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void
  setLanguage: (code: LanguageCode) => void
  resetSettings: () => void
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      setLanguage: (code) =>
        set((state) => ({ settings: { ...state.settings, language: code } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      isSidebarOpen: true,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    { name: 'bhashasign-settings' }
  )
)
