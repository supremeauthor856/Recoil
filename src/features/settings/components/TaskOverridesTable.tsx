import React from 'react'
import { useSettingsStore, TaskModelOverride } from '../../../store/settingsStore'
import { BUILT_IN_PROVIDERS } from '../../../services/aiService'
import { IntensitySlider } from '../../relationships/components/IntensitySlider'
import { Input } from '../../../shared/components/ui/Input'

const TASK_MAP: Record<string, string> = {
  novelWriting: 'Novel Writing',
  shortStoryWriting: 'Short Story / Scene Writing',
  oracle: 'The Oracle',
  longConversation: 'Long Conversation',
  loreExpander: 'Lore Expander',
  chapterSummary: 'Chapter Summary',
  plotHoleDetector: 'Plot Hole Detector',
  importAutoFill: 'Import & Auto-fill',
  brainstormRoom: 'Brainstorm Room',
  dialogueVoiceTrainer: 'Dialogue Voice Trainer',
  foreshadowingPlanner: 'Foreshadowing Planner',
  characterAnalysis: 'Character Analysis',
  verseBible: 'Verse Bible',
  generalSuggestions: 'General Suggestions',
}

const PROVIDER_PLACEHOLDER_MODELS: Record<string, string> = {
  gemini: 'gemini-3.5-flash',
  groq: 'llama-3.3-70b-versatile',
  cloudflareAI: '@cf/meta/llama-3.3-70b-instruct',
  openRouter: 'meta-llama/llama-3.3-70b-instruct:free',
  mistral: 'mistral-small-latest',
  cerebras: 'llama3.3-70b',
  nvidianim: 'meta/llama-3.3-70b-instruct',
  cohere: 'command-r',
  githubModels: 'Meta-Llama-3.3-70B-Instruct',
  huggingface: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
}

export const TaskOverridesTable: React.FC = () => {
  const { taskOverrides, providers, setTaskOverride } = useSettingsStore()

  // Find enabled providers
  const enabledBuiltIns = BUILT_IN_PROVIDERS.filter((p) => {
    const config = (providers as any)[p.id]
    return config?.enabled && config?.apiKey
  })

  const enabledCustoms = (providers.custom || []).filter(
    (c: any) => c.enabled && c.apiKey
  )

  const handleSetOverride = (taskKey: string, override: Partial<TaskModelOverride>) => {
    setTaskOverride(taskKey, override)
  }

  return (
    <div className="flex flex-col gap-4 border border-[var(--color-border-subtle)] rounded-xl overflow-hidden bg-[var(--color-bg-base)]/50 p-4">
      {/* Title Row / Headers for wider screens */}
      <div className="hidden md:grid grid-cols-12 gap-4 pb-2 border-b border-[var(--color-border-subtle)]/70 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase">
        <div className="col-span-4">Task</div>
        <div className="col-span-3">Provider</div>
        <div className="col-span-5">Model & Temperature</div>
      </div>

      <div className="flex flex-col gap-4 divide-y divide-[var(--color-border-subtle)]/30">
        {Object.entries(TASK_MAP).map(([taskKey, label], idx) => {
          const overrideCurrent = (taskOverrides as Record<string, TaskModelOverride>)[taskKey] || {
            provider: 'auto',
            model: '',
            temperature: 0.8,
            systemPromptPrefix: '',
          }

          const activeProviderId = overrideCurrent.provider
          const isOverridden = activeProviderId !== 'auto'
          const modelPlaceholder = PROVIDER_PLACEHOLDER_MODELS[activeProviderId] || 'model-id'

          return (
            <div
              key={taskKey}
              className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 pt-4 first:pt-0 pb-1 items-center`}
            >
              {/* Col 1: Task Label */}
              <div className="col-span-1 md:col-span-4 flex flex-col">
                <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                  {label}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">
                  Key: {taskKey}
                </span>
              </div>

              {/* Col 2: Provider Select */}
              <div className="col-span-1 md:col-span-3">
                <select
                  value={activeProviderId}
                  onChange={(e) => {
                    const nextProv = e.target.value
                    const defaultModel = PROVIDER_PLACEHOLDER_MODELS[nextProv] || ''
                    handleSetOverride(taskKey, {
                      provider: nextProv,
                      model: defaultModel,
                    })
                  }}
                  className="w-full h-[34px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)]/40 rounded-[var(--radius-md)] text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]/80 focus:ring-1 focus:ring-[var(--color-accent-primary)]/40 transition-shadow"
                >
                  <option value="auto" className="bg-[var(--color-bg-sidebar)]">Auto (Smart Routing)</option>
                  {enabledBuiltIns.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[var(--color-bg-sidebar)]">
                      {p.name}
                    </option>
                  ))}
                  {enabledCustoms.map((c: any) => (
                    <option key={c.id} value={c.id} className="bg-[var(--color-bg-sidebar)]">
                      {c.name} (Custom)
                    </option>
                  ))}
                </select>
              </div>

              {/* Col 3: Model and Temperature Override options */}
              <div className="col-span-1 md:col-span-5 flex flex-col gap-3">
                {isOverridden ? (
                  <div className="flex flex-col gap-3 bg-[var(--color-bg-elevated)]/50 p-3 rounded-lg border border-[var(--color-border-subtle)]/40">
                    {/* Model ID Input */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">
                        Model ID
                      </span>
                      <Input
                        type="text"
                        value={overrideCurrent.model || ''}
                        placeholder={`e.g. ${modelPlaceholder}`}
                        onChange={(e) => handleSetOverride(taskKey, { model: e.target.value })}
                        className="bg-[var(--color-bg-elevated)]"
                      />
                    </div>

                    {/* Temperature Slider */}
                    <IntensitySlider
                      dimension={{
                        key: 'narrative_importance',
                        label: 'Temperature (Creativity)',
                        bipolar: false,
                        minLabel: 'Creative / Dynamic (1.0)',
                        maxLabel: 'Analytical / Deterministic (0.0)',
                      } as any}
                      value={Math.round((overrideCurrent.temperature ?? 0.8) * 10)}
                      onChange={(val) => handleSetOverride(taskKey, { temperature: val / 10 })}
                    />
                  </div>
                ) : (
                  <span className="text-[12px] text-[var(--color-text-muted)] italic leading-relaxed">
                    Managed by automatic optimal capability routing.
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
