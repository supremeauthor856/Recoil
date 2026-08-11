import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '../shared/types/common'
import type { Character } from '../shared/types/database'
import type { LoreEntry } from '../features/lore/types'
import { useSettingsStore } from './settingsStore'

export interface UniverseStore {
  // Character Data State
  currentCharacter: Character | null
  characters: Character[]
  
  // Universe Notes (Lore Entries) State
  universeNotes: LoreEntry[]
  currentNote: LoreEntry | null
  
  // Active UI Theme Settings
  activeTheme: Theme
  
  // Character Actions
  setCurrentCharacter: (character: Character | null) => void
  setCharacters: (characters: Character[]) => void
  addCharacter: (character: Character) => void
  updateCharacter: (character: Character) => void
  deleteCharacter: (id: string) => void
  
  // Universe Notes Actions
  setCurrentNote: (note: LoreEntry | null) => void
  setUniverseNotes: (notes: LoreEntry[]) => void
  addUniverseNote: (note: LoreEntry) => void
  updateUniverseNote: (note: LoreEntry) => void
  deleteUniverseNote: (id: string) => void
  
  // Theme Actions
  setActiveTheme: (theme: Theme) => void
}

export const useUniverseStore = create<UniverseStore>()(
  persist(
    (set) => ({
      // Initial States
      currentCharacter: null,
      characters: [],
      universeNotes: [],
      currentNote: null,
      activeTheme: 'dark',

      // Character Actions
      setCurrentCharacter: (character) => set({ currentCharacter: character }),
      setCharacters: (characters) => set({ characters }),
      addCharacter: (character) => set((state) => ({ 
        characters: [...state.characters.filter(c => c.id !== character.id), character] 
      })),
      updateCharacter: (character) => set((state) => {
        const updatedCharacters = state.characters.map((c) => 
          c.id === character.id ? { ...c, ...character } : c
        )
        const updatedCurrent = state.currentCharacter?.id === character.id 
          ? { ...state.currentCharacter, ...character } 
          : state.currentCharacter
        return { 
          characters: updatedCharacters,
          currentCharacter: updatedCurrent
        }
      }),
      deleteCharacter: (id) => set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
        currentCharacter: state.currentCharacter?.id === id ? null : state.currentCharacter
      })),

      // Universe Notes Actions
      setCurrentNote: (note) => set({ currentNote: note }),
      setUniverseNotes: (universeNotes) => set({ universeNotes }),
      addUniverseNote: (note) => set((state) => ({
        universeNotes: [...state.universeNotes.filter(n => n.id !== note.id), note]
      })),
      updateUniverseNote: (note) => set((state) => {
        const updatedNotes = state.universeNotes.map((n) =>
          n.id === note.id ? { ...n, ...note } : n
        )
        const updatedCurrent = state.currentNote?.id === note.id
          ? { ...state.currentNote, ...note }
          : state.currentNote
        return {
          universeNotes: updatedNotes,
          currentNote: updatedCurrent
        }
      }),
      deleteUniverseNote: (id) => set((state) => ({
        universeNotes: state.universeNotes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote
      })),

      // Theme Actions
      setActiveTheme: (theme) => {
        set({ activeTheme: theme })
        // Sync with existing SettingsStore so the document class and attributes get updated properly across the app
        useSettingsStore.getState().setTheme(theme)
      },
    }),
    {
      name: 'recoil-universe-store',
    }
  )
)
