import React, { useState } from 'react'
import { Plus, Check, X, Cpu } from 'lucide-react'
import { useSettingsStore, CustomProviderConfig, APIProviderConfig } from '../../../store/settingsStore'
import { BUILT_IN_PROVIDERS } from '../../../services/aiService'
import { ProviderCard } from './ProviderCard'
import { TaskOverridesTable } from './TaskOverridesTable'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'

export const AIConfigSection: React.FC = () => {
  const { providers, setProviderConfig, addCustomProvider, removeCustomProvider, updateCustomProvider } = useSettingsStore()
  const [showAddForm, setShowAddForm] = useState(false)

  // Add form fields state
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [defaultModel, setDefaultModel] = useState('')
  const [addFormError, setAddFormError] = useState('')

  const handleSaveCustomProvider = () => {
    if (!name.trim()) {
      setAddFormError('Provider name is required')
      return
    }
    if (!baseUrl.trim()) {
      setAddFormError('Base URL is required')
      return
    }
    if (!apiKey.trim()) {
      setAddFormError('API Key is required')
      return
    }

    addCustomProvider({
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      defaultModel: defaultModel.trim() || undefined,
      enabled: true,
    })

    // Reset Form
    setName('')
    setBaseUrl('')
    setApiKey('')
    setDefaultModel('')
    setAddFormError('')
    setShowAddForm(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* BUILT-IN PROVIDERS */}
      <div>
        <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <Cpu size={18} className="text-[var(--color-accent-primary)]" />
          Pre-Configured Providers
        </h3>
        <div className="flex flex-col">
          {BUILT_IN_PROVIDERS.map((definition) => {
            const config = (providers as any)[definition.id] || { enabled: false, apiKey: '' }
            return (
              <ProviderCard
                key={definition.id}
                definition={definition}
                config={config}
                onUpdate={(updates) => setProviderConfig(definition.id, updates)}
              />
            )
          })}
        </div>
      </div>

      {/* CUSTOM PROVIDERS */}
      <div>
        <div className="flex items-center justify-between mb-4 border-t border-[var(--color-border-subtle)]/60 pt-6">
          <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
            Custom OpenAI-Compatible Providers
          </h3>
          {!showAddForm && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAddForm(true)
                setAddFormError('')
              }}
              className="gap-1 px-3 h-8"
            >
              <Plus size={14} /> Add Provider
            </Button>
          )}
        </div>

        {/* List Customs */}
        {providers.custom && providers.custom.length > 0 && (
          <div className="flex flex-col mb-4">
            {providers.custom.map((cp: CustomProviderConfig) => {
              const definition = {
                id: cp.id,
                name: cp.name,
                format: 'openai' as const,
                baseUrl: cp.baseUrl || '',
                docsUrl: '',
                keyLabel: 'API Key',
                keyPlaceholder: 'sk-...',
                requiresAccountId: false,
                models: [],
              }
              return (
                <ProviderCard
                  key={cp.id}
                  definition={definition}
                  config={cp}
                  onUpdate={(updates) => updateCustomProvider(cp.id, updates as any)}
                  onDelete={() => removeCustomProvider(cp.id)}
                />
              )
            })}
          </div>
        )}

        {/* Inline Add form */}
        {showAddForm && (
          <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-accent)]/40 p-5 mt-2 mb-4 animate-fade-in">
            <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-4">
              Add New Custom OpenAI Provider
            </h4>

            <div className="flex flex-col gap-4">
              <Input
                label="Provider Name"
                placeholder="e.g. Local Ollama, DeepSeek etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Base URL"
                placeholder="e.g. http://localhost:11434/v1 or https://api.deepseek.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <Input
                label="API Key"
                placeholder="API Key / Token"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Input
                label="Default Model (optional)"
                placeholder="e.g. llama3, deepseek-chat"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
              />

              {addFormError && (
                <span className="text-[12px] text-[var(--color-error)] mt-1">{addFormError}</span>
              )}

              <div className="flex items-center gap-2 justify-end border-t border-[var(--color-border-subtle)]/60 pt-4 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false)
                    setAddFormError('')
                  }}
                  className="px-3"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveCustomProvider}
                  className="gap-1 px-3"
                >
                  <Check size={14} /> Save Provider
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PER-TASK MODEL OVERRIDES */}
      <div className="border-t border-[var(--color-border-subtle)]/60 pt-6">
        <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)] mb-1">
          Per-Task Model Overrides
        </h3>
        <p className="text-[12px] text-[var(--color-text-secondary)] mb-4">
          Override which model handles each specific task. Leave on Auto to use smart routing.
        </p>
        <TaskOverridesTable />
      </div>
    </div>
  )
}
