import React, { useState } from 'react'
import { Eye, EyeOff, ExternalLink, Plug, Trash, Loader2 } from 'lucide-react'
import { BuiltInProviderDefinition } from '../types'
import { APIProviderConfig } from '../../../store/settingsStore'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { requestAI } from '../../../services/aiService'
import { useSettingsStore } from '../../../store/settingsStore'

interface ProviderCardProps {
  definition: BuiltInProviderDefinition
  config: APIProviderConfig & { accountId?: string }
  onUpdate: (config: Partial<APIProviderConfig & { accountId?: string }>) => void
  onDelete?: () => void
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  definition,
  config,
  onUpdate,
  onDelete,
}) => {
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ status: 'success' | 'failed' | null; message: string }>({
    status: null,
    message: '',
  })

  const hasKey = !!config?.apiKey
  const isEnabled = !!config?.enabled

  const handleTestConnection = async () => {
    if (!config?.apiKey) return

    setTesting(true)
    setTestResult({ status: null, message: '' })

    const settings = useSettingsStore.getState()
    const originalOverride = { ...settings.taskOverrides.generalSuggestions }
    const originalProviderConfig = { ...(settings.providers as any)[definition.id] }

    try {
      // Temporarily write the current active state to the store if it isn't already, so resolveProvider takes it
      settings.setProviderConfig(definition.id, {
        enabled: true,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        defaultModel: config.defaultModel,
      })
      if (definition.requiresAccountId && config.accountId) {
        settings.setProviderConfig(definition.id, { accountId: config.accountId } as any)
      }

      // Temporarily override generalSuggestions task
      const testModel = config.defaultModel || definition.models[0]?.id || ''
      settings.setTaskOverride('generalSuggestions', {
        provider: definition.id,
        model: testModel,
        temperature: 0.1,
        systemPromptPrefix: '',
      })

      // We do a small timeout-wrapped request
      const requestPromise = requestAI({
        taskType: 'generalSuggestions',
        systemPrompt: 'You are a test helper. Respond only with the word "OK".',
        messages: [{ role: 'user', content: 'Say OK' }],
        injectGuidelines: false,
      })

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection request timed out after 10 seconds')), 10000)
      )

      const result = await Promise.race([requestPromise, timeoutPromise])

      if (result.error) {
        setTestResult({
          status: 'failed',
          message: `Failed: ${result.error}`,
        })
      } else {
        setTestResult({
          status: 'success',
          message: 'Connected',
        })
      }
    } catch (err: any) {
      setTestResult({
        status: 'failed',
        message: `Failed: ${err.message || String(err)}`,
      })
    } finally {
      // Restore previous settings states
      settings.setTaskOverride('generalSuggestions', originalOverride)
      settings.setProviderConfig(definition.id, originalProviderConfig)
      setTesting(false)

      // Clear test message after 3 seconds
      setTimeout(() => {
        setTestResult({ status: null, message: '' })
      }, 3000)
    }
  }

  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)] p-5 mb-3 transition-colors">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            {definition.name}
          </span>
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors p-1 rounded"
              title="Delete custom provider"
            >
              <Trash size={14} />
            </button>
          )}
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={() => onUpdate({ enabled: !isEnabled })}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isEnabled ? 'bg-[var(--color-accent-primary)]' : 'bg-zinc-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* BODY CONFIG (Shown when enabled is true) */}
      {isEnabled && (
        <div className="mt-4 flex flex-col gap-4 border-t border-[var(--color-border-subtle)] pt-4">
          {/* API Key */}
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
              {definition.keyLabel}
            </span>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.apiKey || ''}
                placeholder={definition.keyPlaceholder}
                onChange={(e) => onUpdate({ apiKey: e.target.value })}
                className="w-full h-[34px] pl-3 pr-10 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)]/40 rounded-[var(--radius-md)] text-[12px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]/80 focus:ring-1 focus:ring-[var(--color-accent-primary)]/40 transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {definition.docsUrl && (
              <a
                href={definition.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[var(--color-text-link)] hover:underline mt-1 inline-flex items-center gap-1 focus:outline-none"
              >
                Get {definition.keyLabel} <ExternalLink size={10} />
              </a>
            )}
          </div>

          {/* Cloudflare Account ID */}
          {definition.requiresAccountId && (
            <div className="flex flex-col gap-1 w-full">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                Cloudflare Account ID
              </span>
              <input
                type="text"
                value={config.accountId || ''}
                placeholder="Find in Cloudflare dashboard URL"
                onChange={(e) => onUpdate({ accountId: e.target.value })}
                className="w-full h-[34px] px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)]/40 rounded-[var(--radius-md)] text-[12px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]/80 focus:ring-1 focus:ring-[var(--color-accent-primary)]/40 transition-shadow"
              />
            </div>
          )}

          {/* Base URL override */}
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
              Base URL (optional override)
            </span>
            <input
              type="text"
              value={config.baseUrl || ''}
              placeholder={definition.baseUrl}
              onChange={(e) => onUpdate({ baseUrl: e.target.value })}
              className="w-full h-[34px] px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)]/40 rounded-[var(--radius-md)] text-[12px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]/80 focus:ring-1 focus:ring-[var(--color-accent-primary)]/40 transition-shadow"
            />
          </div>

          {/* Default Model */}
          {definition.models && definition.models.length > 0 && (
            <div className="flex flex-col gap-1 w-full">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                Default Model
              </span>
              <select
                value={config.defaultModel || definition.models[0]?.id || ''}
                onChange={(e) => onUpdate({ defaultModel: e.target.value })}
                className="w-full h-[34px] px-3 bg-[var(--color-bg-base)] border border border-[var(--color-border-strong)]/40 rounded-[var(--radius-md)] text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]/80 focus:ring-1 focus:ring-[var(--color-accent-primary)]/40 transition-shadow"
              >
                {definition.models.map((model) => (
                  <option key={model.id} value={model.id} className="bg-[var(--color-bg-sidebar)]">
                    {model.label} ({model.contextWindow.toLocaleString()} ctx)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* FOOTER STATUS / ACTIONS */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-subtle)]/60 pt-4 text-[12px]">
        {/* Connection status dots */}
        <div className="flex items-center gap-2">
          {!isEnabled ? (
            <>
              <span className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="text-[var(--color-text-muted)]">Disabled</span>
            </>
          ) : !hasKey ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[var(--color-warning)]">API key required</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[var(--color-success)] font-medium">
                {testResult.status === 'success' ? 'Connected' : testResult.status === 'failed' ? 'Failed' : 'Ready'}
              </span>
            </>
          )}

          {testResult.message && testResult.status === 'failed' && (
            <span className="text-[var(--color-error)] truncate max-w-[200px] hover:text-clip" title={testResult.message}>
              - {testResult.message}
            </span>
          )}
        </div>

        {/* Test Connection Button */}
        {isEnabled && hasKey && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
            className="h-8 px-3 gap-1.5 hover:bg-[var(--color-bg-base)]"
          >
            {testing ? (
              <Loader2 size={12} className="animate-spin text-[var(--color-accent-primary)]" />
            ) : (
              <Plug size={12} />
            )}
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        )}
      </div>
    </div>
  )
}
