import { create } from 'zustand'
import type { Toast } from '../shared/types/common'
import { generateId } from '../shared/utils/id'

interface UIStore {
  rightSidebarOpen: boolean
  leftSidebarOpen: boolean
  searchPaletteOpen: boolean
  activeModal: string | null
  modalData: Record<string, unknown>
  toasts: Toast[]
  isOnline: boolean
  toggleRightSidebar: () => void
  setLeftSidebarOpen: (open: boolean) => void
  openSearchPalette: () => void
  closeSearchPalette: () => void
  openModal: (modalId: string, data?: Record<string, unknown>) => void
  closeModal: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setIsOnline: (online: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  rightSidebarOpen: typeof window !== 'undefined' && window.innerWidth >= 768,
  leftSidebarOpen: false,
  searchPaletteOpen: false,
  activeModal: null,
  modalData: {},
  toasts: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
  openSearchPalette: () => set({ searchPaletteOpen: true }),
  closeSearchPalette: () => set({ searchPaletteOpen: false }),
  openModal: (modalId, data = {}) => set({ activeModal: modalId, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),
  
  addToast: (toast) => set((state) => {
    const newToast: Toast = { ...toast, id: generateId() }
    const newToasts = [newToast, ...state.toasts].slice(0, 3)
    return { toasts: newToasts }
  }),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
  setIsOnline: (online) => set({ isOnline: online }),
}))
