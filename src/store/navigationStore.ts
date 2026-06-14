import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SectionName } from '../shared/types/common'

interface NavigationStore {
  activeVerseId: string | null
  activeSection: SectionName | null
  activeItemId: string | null
  activeSubSeriesId: string | null
  expandedSections: string[]
  breadcrumb: string[]
  setActiveVerse: (id: string | null) => void
  setActiveSection: (section: SectionName | null) => void
  setActiveItem: (id: string | null) => void
  setActiveSubSeries: (id: string | null) => void
  toggleSectionExpanded: (section: string) => void
  setBreadcrumb: (crumbs: string[]) => void
}

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set) => ({
      activeVerseId: null,
      activeSection: null,
      activeItemId: null,
      activeSubSeriesId: null,
      expandedSections: [],
      breadcrumb: [],
      setActiveVerse: (id) => set({ activeVerseId: id }),
      setActiveSection: (section) => set({ activeSection: section }),
      setActiveItem: (id) => set({ activeItemId: id }),
      setActiveSubSeries: (id) => set({ activeSubSeriesId: id }),
      toggleSectionExpanded: (section) => set((state) => ({
        expandedSections: state.expandedSections.includes(section)
          ? state.expandedSections.filter((s) => s !== section)
          : [...state.expandedSections, section],
      })),
      setBreadcrumb: (crumbs) => set({ breadcrumb: crumbs }),
    }),
    {
      name: 'recoil-navigation',
    }
  )
)
