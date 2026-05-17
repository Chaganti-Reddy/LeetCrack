import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Platform, ThemeMode } from '@/types'

interface UiState {
  theme: ThemeMode
  activePlatform: Platform
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  notePanelProblemId: string | null
  mobileNavOpen: boolean
  randomModalOpen: boolean
  weeklyDigestOpen: boolean
  onboardingOpen: boolean
  weeklyGoal: number
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setActivePlatform: (platform: Platform) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setNotePanelProblemId: (problemId: string | null) => void
  setMobileNavOpen: (open: boolean) => void
  setRandomModalOpen: (open: boolean) => void
  setWeeklyDigestOpen: (open: boolean) => void
  setOnboardingOpen: (open: boolean) => void
  setWeeklyGoal: (goal: number) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      activePlatform: 'lc',
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      notePanelProblemId: null,
      mobileNavOpen: false,
      randomModalOpen: false,
      weeklyDigestOpen: false,
      onboardingOpen: false,
      weeklyGoal: 7,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setActivePlatform: (activePlatform) => set({ activePlatform }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setNotePanelProblemId: (notePanelProblemId) => set({ notePanelProblemId }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setRandomModalOpen: (randomModalOpen) => set({ randomModalOpen }),
      setWeeklyDigestOpen: (weeklyDigestOpen) => set({ weeklyDigestOpen }),
      setOnboardingOpen: (onboardingOpen) => set({ onboardingOpen }),
      setWeeklyGoal: (weeklyGoal) => set({ weeklyGoal }),
    }),
    {
      name: 'algo-track-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        activePlatform: state.activePlatform,
        sidebarCollapsed: state.sidebarCollapsed,
        weeklyGoal: state.weeklyGoal,
      }),
    },
  ),
)
