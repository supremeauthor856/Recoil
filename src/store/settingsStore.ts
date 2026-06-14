import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, FontSize } from '../shared/types/common'

export interface APIProviderConfig {
  enabled: boolean
  apiKey: string
  baseUrl?: string
  defaultModel?: string
}

export interface CustomProviderConfig extends APIProviderConfig {
  name: string
  id: string
}

export interface TaskModelOverride {
  provider: string
  model: string
  temperature: number
  systemPromptPrefix: string
}

const defaultTaskOverride: TaskModelOverride = {
  provider: 'auto',
  model: '',
  temperature: 0.8,
  systemPromptPrefix: '',
}

interface SettingsStore {
  providers: {
    gemini: APIProviderConfig
    groq: APIProviderConfig
    cloudflareAI: APIProviderConfig
    openRouter: APIProviderConfig
    mistral: APIProviderConfig
    cerebras: APIProviderConfig
    nvidianim: APIProviderConfig
    cohere: APIProviderConfig
    githubModels: APIProviderConfig
    huggingface: APIProviderConfig
    custom: CustomProviderConfig[]
  }
  taskOverrides: {
    novelWriting: TaskModelOverride
    shortStoryWriting: TaskModelOverride
    oracle: TaskModelOverride
    longConversation: TaskModelOverride
    loreExpander: TaskModelOverride
    chapterSummary: TaskModelOverride
    plotHoleDetector: TaskModelOverride
    importAutoFill: TaskModelOverride
    brainstormRoom: TaskModelOverride
    dialogueVoiceTrainer: TaskModelOverride
    foreshadowingPlanner: TaskModelOverride
    characterAnalysis: TaskModelOverride
    verseBible: TaskModelOverride
    generalSuggestions: TaskModelOverride
  }
  theme: Theme
  fontSize: FontSize
  reducedMotion: boolean
  setProviderConfig: (provider: string, config: Partial<APIProviderConfig>) => void
  setTaskOverride: (task: string, override: Partial<TaskModelOverride>) => void
  setTheme: (theme: Theme) => void
  setFontSize: (size: FontSize) => void
  addCustomProvider: (provider: Omit<CustomProviderConfig, 'id'>) => void
  removeCustomProvider: (id: string) => void
  updateCustomProvider: (id: string, config: Partial<CustomProviderConfig>) => void
}

const defaultProvider: APIProviderConfig = { enabled: false, apiKey: '' }

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      providers: {
        gemini: { ...defaultProvider },
        groq: { ...defaultProvider },
        cloudflareAI: { ...defaultProvider },
        openRouter: { ...defaultProvider },
        mistral: { ...defaultProvider },
        cerebras: { ...defaultProvider },
        nvidianim: { ...defaultProvider },
        cohere: { ...defaultProvider },
        githubModels: { ...defaultProvider },
        huggingface: { ...defaultProvider },
        custom: [],
      },
      taskOverrides: {
        novelWriting: { ...defaultTaskOverride },
        shortStoryWriting: { ...defaultTaskOverride },
        oracle: { ...defaultTaskOverride },
        longConversation: { ...defaultTaskOverride },
        loreExpander: { ...defaultTaskOverride },
        chapterSummary: { ...defaultTaskOverride },
        plotHoleDetector: { ...defaultTaskOverride },
        importAutoFill: { ...defaultTaskOverride },
        brainstormRoom: { ...defaultTaskOverride },
        dialogueVoiceTrainer: { ...defaultTaskOverride },
        foreshadowingPlanner: { ...defaultTaskOverride },
        characterAnalysis: { ...defaultTaskOverride },
        verseBible: { ...defaultTaskOverride },
        generalSuggestions: { ...defaultTaskOverride },
      },
      theme: 'dark',
      fontSize: 'default',
      reducedMotion: false,

      setProviderConfig: (provider, config) => set((state) => ({
        providers: {
          ...state.providers,
          [provider]: { ...state.providers[provider as keyof typeof state.providers], ...config }
        }
      })),
      
      setTaskOverride: (task, override) => set((state) => ({
        taskOverrides: {
          ...state.taskOverrides,
          [task]: { ...state.taskOverrides[task as keyof typeof state.taskOverrides], ...override }
        }
      })),
      
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      
      addCustomProvider: (provider) => set((state) => ({
        providers: {
          ...state.providers,
          custom: [...state.providers.custom, { ...provider, id: crypto.randomUUID() }]
        }
      })),
      
      removeCustomProvider: (id) => set((state) => ({
        providers: {
          ...state.providers,
          custom: state.providers.custom.filter(p => p.id !== id)
        }
      })),
      
      updateCustomProvider: (id, config) => set((state) => ({
        providers: {
          ...state.providers,
          custom: state.providers.custom.map(p => p.id === id ? { ...p, ...config } : p)
        }
      })),
    }),
    {
      name: 'recoil-settings',
    }
  )
)
