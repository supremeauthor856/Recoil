import { useSettingsStore, APIProviderConfig, TaskModelOverride } from '../store/settingsStore'
import { GuidelineCategory, GUIDELINE_CATEGORY_LABELS, WritingGuideline, BuiltInProviderDefinition } from '../features/settings/types'
import { api } from './api'

export const BUILT_IN_PROVIDERS: BuiltInProviderDefinition[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    format: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    docsUrl: 'https://aistudio.google.com/apikey',
    keyLabel: 'API Key',
    keyPlaceholder: 'AIza...',
    requiresAccountId: false,
    models: [
      { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', contextWindow: 1000000 },
      { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', contextWindow: 1000000 },
      { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', contextWindow: 1000000 },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    format: 'openai',
    baseUrl: 'https://api.groq.com/openai',
    docsUrl: 'https://console.groq.com/keys',
    keyLabel: 'API Key',
    keyPlaceholder: 'gsk_...',
    requiresAccountId: false,
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', contextWindow: 128000 },
      { id: 'llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout', contextWindow: 131072 },
      { id: 'llama-4-maverick-17b-128e-instruct-fp8', label: 'Llama 4 Maverick', contextWindow: 131072 },
      { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 70B', contextWindow: 128000 },
      { id: 'qwen-qwq-32b', label: 'Qwen QwQ 32B', contextWindow: 32768 },
    ],
  },
  {
    id: 'cloudflareAI',
    name: 'Cloudflare Workers AI',
    format: 'cloudflare',
    baseUrl: 'https://api.cloudflare.com/client/v4',
    docsUrl: 'https://dash.cloudflare.com/profile/api-tokens',
    keyLabel: 'API Token',
    keyPlaceholder: 'API token from Cloudflare dashboard',
    requiresAccountId: true,
    models: [
      { id: '@cf/meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', contextWindow: 128000 },
      { id: '@hf/nousresearch/hermes-2-pro-mistral-7b', label: 'Hermes 2 Pro', contextWindow: 32768 },
      { id: '@cf/qwen/qwen1.5-14b-chat-awq', label: 'Qwen 1.5 14B', contextWindow: 32768 },
      { id: '@cf/google/gemma-7b-it', label: 'Gemma 7B', contextWindow: 8192 },
      { id: '@cf/mistral/mistral-7b-instruct-v0.2', label: 'Mistral 7B', contextWindow: 32768 },
    ],
  },
  {
    id: 'openRouter',
    name: 'OpenRouter',
    format: 'openai',
    baseUrl: 'https://openrouter.ai/api',
    docsUrl: 'https://openrouter.ai/keys',
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-or-...',
    requiresAccountId: false,
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Free)', contextWindow: 131072 },
      { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Free)', contextWindow: 163840 },
      { id: 'qwen/qwen3-8b:free', label: 'Qwen3 8B (Free)', contextWindow: 40960 },
      { id: 'google/gemma-3-27b-it:free', label: 'Gemma 3 27B (Free)', contextWindow: 96000 },
      { id: 'mistralai/devstral-small:free', label: 'Devstral Small (Free)', contextWindow: 32768 },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    format: 'openai',
    baseUrl: 'https://api.mistral.ai',
    docsUrl: 'https://console.mistral.ai/api-keys/',
    keyLabel: 'API Key',
    keyPlaceholder: 'Mistral API key',
    requiresAccountId: false,
    models: [
      { id: 'mistral-large-latest', label: 'Mistral Large', contextWindow: 128000 },
      { id: 'mistral-small-latest', label: 'Mistral Small', contextWindow: 32768 },
      { id: 'open-mixtral-8x7b', label: 'Mixtral 8x7B', contextWindow: 32768 },
    ],
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    format: 'openai',
    baseUrl: 'https://api.cerebras.ai',
    docsUrl: 'https://cloud.cerebras.ai',
    keyLabel: 'API Key',
    keyPlaceholder: 'csk-...',
    requiresAccountId: false,
    models: [
      { id: 'llama3.3-70b', label: 'Llama 3.3 70B', contextWindow: 128000 },
      { id: 'llama3.1-70b', label: 'Llama 3.1 70B', contextWindow: 128000 },
    ],
  },
  {
    id: 'nvidianim',
    name: 'NVIDIA NIM',
    format: 'openai',
    baseUrl: 'https://integrate.api.nvidia.com',
    docsUrl: 'https://build.nvidia.com',
    keyLabel: 'API Key',
    keyPlaceholder: 'nvapi-...',
    requiresAccountId: false,
    models: [
      { id: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', contextWindow: 128000 },
      { id: 'mistralai/mistral-7b-instruct-v0.3', label: 'Mistral 7B', contextWindow: 32768 },
    ],
  },
  {
    id: 'cohere',
    name: 'Cohere',
    format: 'openai',
    baseUrl: 'https://api.cohere.com/compatibility',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
    keyLabel: 'API Key',
    keyPlaceholder: 'Cohere API key',
    requiresAccountId: false,
    models: [
      { id: 'command-r-plus', label: 'Command R+', contextWindow: 128000 },
      { id: 'command-r', label: 'Command R', contextWindow: 128000 },
    ],
  },
  {
    id: 'githubModels',
    name: 'GitHub Models',
    format: 'openai',
    baseUrl: 'https://models.inference.ai.azure.com',
    docsUrl: 'https://github.com/settings/tokens',
    keyLabel: 'Personal Access Token',
    keyPlaceholder: 'ghp_... or github_pat_...',
    requiresAccountId: false,
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', contextWindow: 128000 },
      { id: 'Meta-Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B', contextWindow: 131072 },
      { id: 'Mistral-Nemo', label: 'Mistral Nemo', contextWindow: 128000 },
    ],
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    format: 'openai',
    baseUrl: 'https://api-inference.huggingface.co/v1',
    docsUrl: 'https://huggingface.co/settings/tokens',
    keyLabel: 'Access Token',
    keyPlaceholder: 'hf_...',
    requiresAccountId: false,
    models: [
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', label: 'Llama 3.1 70B', contextWindow: 131072 },
      { id: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B', contextWindow: 131072 },
    ],
  },
]

const TASK_ROUTING: Record<string, string[]> = {
  novelWriting:         ['gemini','groq','openRouter','mistral','cerebras'],
  shortStoryWriting:    ['gemini','groq','cloudflareAI','openRouter','cerebras'],
  oracle:               ['gemini','groq','openRouter','mistral'],
  longConversation:     ['gemini','groq','openRouter','mistral','cerebras'],
  loreExpander:         ['gemini','groq','cloudflareAI','openRouter'],
  chapterSummary:       ['groq','cloudflareAI','gemini','openRouter','cerebras'],
  plotHoleDetector:     ['gemini','groq','openRouter','cloudflareAI'],
  importAutoFill:       ['gemini','groq','openRouter','cloudflareAI'],
  brainstormRoom:       ['groq','cloudflareAI','cerebras','gemini','openRouter'],
  dialogueVoiceTrainer: ['gemini','groq','openRouter','cloudflareAI'],
  foreshadowingPlanner: ['gemini','groq','openRouter','cloudflareAI'],
  characterAnalysis:    ['gemini','groq','openRouter','cloudflareAI'],
  verseBible:           ['gemini','groq','openRouter','mistral'],
  generalSuggestions:   ['groq','cloudflareAI','cerebras','gemini','openRouter'],
}

const TASK_GUIDELINE_CATEGORIES: Record<string, GuidelineCategory[]> = {
  novelWriting:         ['character-development','plot-hooks','pacing','dialogue'],
  shortStoryWriting:    ['character-development','pacing','intros','dialogue'],
  oracle:               ['worldbuilding','general'],
  longConversation:     ['general'],
  loreExpander:         ['worldbuilding','general'],
  chapterSummary:       ['general'],
  plotHoleDetector:     ['plot-hooks','pacing','general'],
  importAutoFill:       ['character-development','worldbuilding','general'],
  brainstormRoom:       ['plot-hooks','character-development','general'],
  dialogueVoiceTrainer: ['dialogue','character-development'],
  foreshadowingPlanner: ['plot-hooks','pacing'],
  characterAnalysis:    ['character-development'],
  verseBible:           ['worldbuilding','character-development','general'],
  generalSuggestions:   ['general'],
}

const DEFAULT_MODELS: Record<string, string> = {
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

export enum ThinkingLevel {
  OFF = 'OFF',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIRequestOptions {
  taskType: string
  systemPrompt: string
  messages: AIMessage[]
  maxTokens?: number
  temperature?: number
  injectGuidelines?: boolean  // default true
  thinkingLevel?: ThinkingLevel
  isLowLatency?: boolean
  preferredModel?: string
}

export interface AIResponse {
  content: string
  provider: string
  model: string
  tokensUsed?: number
  estimatedTokens?: number
  error?: string
}

export type ProviderFormat = 'openai' | 'gemini' | 'cloudflare'

interface ResolvedProvider {
  id: string
  name: string
  format: ProviderFormat
  baseUrl: string
  apiKey: string
  accountId?: string
  model: string
  temperature: number
}

function sanitizeModel(model: string): string {
  if (!model) return model
  const m = model.toLowerCase()
  if (m.includes('gemini-2.5-flash-lite') || m.includes('gemini-2.0-flash-lite') || m.includes('gemini-1.5-flash-lite')) {
    return 'gemini-3.1-flash-lite'
  }
  if (m.includes('gemini-2.5-flash') || m.includes('gemini-2.0-flash') || m.includes('gemini-1.5-flash') || m === 'gemini-flash' || m === 'gemini-pro') {
    return 'gemini-3.5-flash'
  }
  if (m.includes('gemini-2.5-pro') || m.includes('gemini-2.0-pro') || m.includes('gemini-1.5-pro') || m.includes('gemini-2.0-flash-thinking')) {
    return 'gemini-3.1-pro-preview'
  }
  return model
}

function pruneForLimits(providerId: string, systemPrompt: string, messages: AIMessage[]): { systemPrompt: string, messages: AIMessage[] } {
  if (providerId !== 'groq') {
    return { systemPrompt, messages }
  }

  let currentPrompt = systemPrompt
  const currentMessages = [...messages]

  const getLength = () => [currentPrompt, ...currentMessages.map(m => m.content)].join(' ').length

  // Groq TPM/RPM are extremely low on free tier. Let's prune context to stay under 32,000 characters (~8,000 tokens) total.
  // 1. If still too long, drop oldest messages (except the very last user message)
  while (getLength() > 32000 && currentMessages.length > 1) {
    currentMessages.shift()
  }

  // 2. If still too long, let's aggressively shorten/trim the systemPrompt (remove detailed profiles, etc.)
  if (getLength() > 32000) {
    const profilesIndex = currentPrompt.indexOf('=== CHARACTERS DETAILED PROFILES ===')
    if (profilesIndex !== -1) {
      currentPrompt = currentPrompt.substring(0, profilesIndex) + '\n[Detailed profiles omitted to fit model limits]'
    }
  }

  if (getLength() > 32000) {
    const guidelinesIndex = currentPrompt.indexOf('--- WRITING GUIDELINES ---')
    if (guidelinesIndex !== -1) {
      currentPrompt = currentPrompt.substring(0, guidelinesIndex) + '\n[Guidelines omitted to fit model limits]'
    }
  }

  return { systemPrompt: currentPrompt, messages: currentMessages }
}

function getOptimalGeminiModel(taskType: string, model: string): string {
  const m = model.toLowerCase()
  if (m.includes('gemini-3.1-pro-preview') || m.includes('gemini-3.5-flash') || m.includes('gemini-3.1-flash-lite')) {
    return model
  }
  
  if (['plotHoleDetector', 'novelWriting', 'importAutoFill', 'foreshadowingPlanner', 'characterAnalysis'].includes(taskType)) {
    return 'gemini-3.1-pro-preview'
  }
  if (['chapterSummary', 'dialogueVoiceTrainer', 'generalSuggestions'].includes(taskType)) {
    return 'gemini-3.1-flash-lite'
  }
  return 'gemini-3.5-flash'
}

function resolveProvider(taskType: string): ResolvedProvider | null {
  const settings = useSettingsStore.getState()
  const taskOverride = (settings.taskOverrides as Record<string, TaskModelOverride>)[taskType]

  // Check per-task override
  if (taskOverride && taskOverride.provider !== 'auto' && taskOverride.model) {
    const pId = taskOverride.provider
    const pConfig = (settings.providers as unknown as Record<string, APIProviderConfig>)[pId]
    if (pConfig?.enabled && pConfig?.apiKey) {
       const def = BUILT_IN_PROVIDERS.find(p => p.id === pId)
       if (def) {
         let resolvedModel = sanitizeModel(taskOverride.model)
         if (def.format === 'gemini') {
           resolvedModel = getOptimalGeminiModel(taskType, resolvedModel)
         }
         return {
           id: pId, name: def.name, format: def.format,
           baseUrl: pConfig.baseUrl ?? def.baseUrl,
           apiKey: pConfig.apiKey,
           accountId: (pConfig as Record<string, any>).accountId,
           model: resolvedModel,
           temperature: taskOverride.temperature ?? 0.8,
         }
       }
    }
    // Check custom providers
    const customProvider = settings.providers.custom?.find(
      (c: any) => c.id === pId
    )
    if (customProvider?.apiKey) {
      return {
        id: pId, name: customProvider.name ?? 'Custom', format: 'openai',
        baseUrl: customProvider.baseUrl ?? '',
        apiKey: customProvider.apiKey,
        model: sanitizeModel(taskOverride.model),
        temperature: taskOverride.temperature ?? 0.8,
      }
    }
  }

  // Smart routing: try providers in priority order
  const priorityList = TASK_ROUTING[taskType] ?? TASK_ROUTING.generalSuggestions
  for (const pId of priorityList) {
    const pConfig = (settings.providers as unknown as Record<string, APIProviderConfig>)[pId]
    if (pConfig?.enabled && pConfig?.apiKey) {
      const def = BUILT_IN_PROVIDERS.find(p => p.id === pId)
      if (def) {
        let resolvedModel = sanitizeModel(pConfig.defaultModel ?? DEFAULT_MODELS[pId] ?? def.models[0]?.id ?? '')
        if (def.format === 'gemini') {
          resolvedModel = getOptimalGeminiModel(taskType, resolvedModel)
        }
        return {
          id: pId, name: def.name, format: def.format,
          baseUrl: pConfig.baseUrl ?? def.baseUrl,
          apiKey: pConfig.apiKey,
          accountId: (pConfig as Record<string, any>).accountId,
          model: resolvedModel,
          temperature: 0.8,
        }
      }
    }
  }

  // Check custom providers as final fallback
  const customProviders = settings.providers.custom ?? []
  for (const cp of customProviders) {
    if ((cp as any).enabled && (cp as any).apiKey) {
      return {
        id: (cp as any).id, name: (cp as any).name, format: 'openai',
        baseUrl: (cp as any).baseUrl ?? '',
        apiKey: (cp as any).apiKey,
        model: sanitizeModel((cp as any).defaultModel ?? ''),
        temperature: 0.8,
      }
    }
  }

  return null
}

async function getGuidelinesForTask(taskType: string): Promise<string> {
  const categories = TASK_GUIDELINE_CATEGORIES[taskType] ?? ['general']
  try {
    const result = await api.get<WritingGuideline[]>(
      '/writing-guidelines?active=true'
    )
    if (!result.success || !result.data) return ''
    const relevant = result.data.filter(g =>
      categories.includes(g.category as GuidelineCategory) && g.content_preview
    )
    if (relevant.length === 0) return ''
    return relevant.map(g =>
      `[${GUIDELINE_CATEGORY_LABELS[g.category as GuidelineCategory] ?? g.category}]\n${g.content_preview}`
    ).join('\n\n')
  } catch {
    return ''
  }
}

export async function requestAI(options: AIRequestOptions): Promise<AIResponse> {
  const provider = resolveProvider(options.taskType)
  if (!provider) {
    return {
      content: '',
      provider: 'none',
      model: 'none',
      error: 'No AI provider configured. Please add API keys in Settings > AI Configuration.',
    }
  }

  if (options.thinkingLevel === ThinkingLevel.HIGH) {
    provider.model = 'gemini-3.1-pro-preview'
  } else if (options.isLowLatency) {
    provider.model = 'gemini-3.1-flash-lite'
  } else if (options.preferredModel) {
    provider.model = options.preferredModel
  }

  const settings = useSettingsStore.getState()
  const taskOverride = (settings.taskOverrides as Record<string, TaskModelOverride>)[options.taskType]
  const temperature = provider.temperature

  // Build system prompt with optional guidelines
  let systemPrompt = options.systemPrompt
  if (options.injectGuidelines !== false) {
    const guidelines = await getGuidelinesForTask(options.taskType)
    if (guidelines) {
      systemPrompt = `${systemPrompt}\n\n--- WRITING GUIDELINES ---\n${guidelines}\n--- END WRITING GUIDELINES ---`
    }
  }
  if (taskOverride?.systemPromptPrefix) {
    systemPrompt = `${taskOverride.systemPromptPrefix}\n\n${systemPrompt}`
  }

  const pruned = pruneForLimits(provider.id, systemPrompt, options.messages)
  const finalSystemPrompt = pruned.systemPrompt
  const finalMessages = pruned.messages

  // Estimate token count (rough: 4 chars ≈ 1 token)
  const estimatedTokens = Math.ceil(
    [finalSystemPrompt, ...finalMessages.map(m => m.content)]
      .join(' ')
      .length / 4
  )

  const maxTokens = options.maxTokens ?? 4096

  try {
    switch (provider.format) {
      case 'gemini':
        return await callGemini(provider, finalSystemPrompt, finalMessages, maxTokens, temperature, estimatedTokens, options)
      case 'cloudflare':
        return await callCloudflareAI(provider, finalSystemPrompt, finalMessages, maxTokens, temperature, estimatedTokens)
      default:
        return await callOpenAICompatible(provider, finalSystemPrompt, finalMessages, maxTokens, temperature, estimatedTokens)
    }
  } catch (error) {
    // API keys must never be logged to console or in error messages
    let message = String(error)
    if (provider.apiKey) {
      message = message.replace(new RegExp(provider.apiKey, 'g'), '[REDACTED]')
    }
    return {
      content: '',
      provider: provider.name,
      model: provider.model,
      error: `Request failed: ${message}`,
      estimatedTokens,
    }
  }
}

async function callOpenAICompatible(
  provider: ResolvedProvider,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number,
  temperature: number,
  estimatedTokens: number
): Promise<AIResponse> {
  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]
  const response = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      messages: allMessages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).error?.message ?? `HTTP ${response.status}`)
  }
  const data = await response.json() as Record<string, any>
  const choices = data.choices as Array<Record<string, any>>
  return {
    content: choices[0]?.message?.content ?? '',
    provider: provider.name,
    model: provider.model,
    tokensUsed: (data.usage as Record<string, any>)?.total_tokens,
    estimatedTokens,
  }
}

async function callGemini(
  provider: ResolvedProvider,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number,
  temperature: number,
  estimatedTokens: number,
  options?: AIRequestOptions
): Promise<AIResponse> {
  const url = `${provider.baseUrl}/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const isHighThinking = options?.thinkingLevel === ThinkingLevel.HIGH || provider.model === 'gemini-3.1-pro-preview'

  const body: Record<string, any> = {
    contents,
    generationConfig: {
      temperature,
    },
  }

  if (isHighThinking) {
    body.generationConfig.thinkingLevel = 'HIGH'
    body.generationConfig.thinkingConfig = {
      thinkingBudget: 2048,
    }
  } else {
    body.generationConfig.maxOutputTokens = maxTokens
  }

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] }
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      (err as any).error?.message ?? `HTTP ${response.status}`
    )
  }
  const data = await response.json() as Record<string, any>
  const candidates = data.candidates as Array<Record<string, any>>
  const text = candidates[0]?.content?.parts?.[0]?.text ?? ''
  const usageMeta = data.usageMetadata as Record<string, number> | undefined
  return {
    content: text,
    provider: 'Google Gemini',
    model: provider.model,
    tokensUsed: usageMeta?.totalTokenCount,
    estimatedTokens,
  }
}

async function callCloudflareAI(
  provider: ResolvedProvider,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number,
  temperature: number,
  estimatedTokens: number
): Promise<AIResponse> {
  if (!provider.accountId) {
    throw new Error('Cloudflare Account ID is required. Add it in Settings > AI Configuration.')
  }
  const url = `${provider.baseUrl}/accounts/${provider.accountId}/ai/run/${provider.model}`
  const cfMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ]
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: cfMessages,
      max_tokens: maxTokens,
      temperature,
    }),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const data = await response.json() as Record<string, any>
  const result = data.result as Record<string, string> | undefined
  return {
    content: result?.response ?? '',
    provider: 'Cloudflare Workers AI',
    model: provider.model,
    estimatedTokens,
  }
}

export function getConfiguredProviders(): string[] {
  const settings = useSettingsStore.getState()
  return BUILT_IN_PROVIDERS
    .filter(p => {
      const config = (settings.providers as unknown as Record<string, APIProviderConfig>)[p.id]
      return config?.enabled && config?.apiKey
    })
    .map(p => p.name)
}

export function hasAnyProviderConfigured(): boolean {
  return getConfiguredProviders().length > 0 ||
    (useSettingsStore.getState().providers.custom ?? []).some(
      (c: Record<string, any>) => c.enabled && c.apiKey
    )
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export async function streamAI(
  options: AIRequestOptions,
  onChunk: (text: string) => void
): Promise<{ provider: string; model: string; estimatedTokens: number }> {
    const provider = resolveProvider(options.taskType)
    if (!provider) {
      throw new Error('No AI provider configured. Please add API keys in Settings > AI Configuration.')
    }

    if (options.thinkingLevel === ThinkingLevel.HIGH) {
      provider.model = 'gemini-3.1-pro-preview'
    } else if (options.isLowLatency) {
      provider.model = 'gemini-3.1-flash-lite'
    } else if (options.preferredModel) {
      provider.model = options.preferredModel
    }

    const settings = useSettingsStore.getState()
    const taskOverride = (settings.taskOverrides as Record<string, TaskModelOverride>)[options.taskType]
    const temperature = provider.temperature

    let systemPrompt = options.systemPrompt
    if (options.injectGuidelines !== false) {
      const guidelines = await getGuidelinesForTask(options.taskType)
      if (guidelines) {
        systemPrompt = `${systemPrompt}\n\n--- WRITING GUIDELINES ---\n${guidelines}\n--- END WRITING GUIDELINES ---`
      }
    }
    if (taskOverride?.systemPromptPrefix) {
      systemPrompt = `${taskOverride.systemPromptPrefix}\n\n${systemPrompt}`
    }

    const pruned = pruneForLimits(provider.id, systemPrompt, options.messages)
    const finalSystemPrompt = pruned.systemPrompt
    const finalMessages = pruned.messages

    const estimatedTokens = Math.ceil(
      [finalSystemPrompt, ...finalMessages.map(m => m.content)]
        .join(' ')
        .length / 4
    )

    const maxTokens = options.maxTokens ?? 4096

    try {
      if (provider.format === 'gemini') {
        const url = `${provider.baseUrl}/v1beta/models/${provider.model}:streamGenerateContent?key=${provider.apiKey}&alt=sse`
        const contents = finalMessages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }))
        const isHighThinking = options?.thinkingLevel === ThinkingLevel.HIGH || provider.model === 'gemini-3.1-pro-preview'
        const body: Record<string, any> = {
          contents,
          generationConfig: {
            temperature,
          },
        }
        if (isHighThinking) {
          body.generationConfig.thinkingLevel = 'HIGH'
          body.generationConfig.thinkingConfig = {
            thinkingBudget: 2048,
          }
        } else {
          body.generationConfig.maxOutputTokens = maxTokens
        }
        if (finalSystemPrompt) {
          body.systemInstruction = { parts: [{ text: finalSystemPrompt }] }
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error((err as any).error?.message ?? `HTTP ${response.status}`)
        }

        await readSSEStream(response, (dataStr) => {
          try {
            const data = JSON.parse(dataStr)
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
            if (text) onChunk(text)
          } catch {
            // silent parse error
          }
        })
      } else if (provider.format === 'cloudflare') {
        if (!provider.accountId) {
          throw new Error('Cloudflare Account ID is required. Add it in Settings > AI Configuration.')
        }
        const url = `${provider.baseUrl}/accounts/${provider.accountId}/ai/run/${provider.model}`
        const cfMessages = [
          { role: 'system', content: finalSystemPrompt },
          ...finalMessages.map(m => ({ role: m.role, content: m.content })),
        ]

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: cfMessages,
            max_tokens: maxTokens,
            temperature,
            stream: true,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        await readSSEStream(response, (dataStr) => {
          if (dataStr === '[DONE]') return
          try {
            const data = JSON.parse(dataStr)
            const text = data.response ?? ''
            if (text) onChunk(text)
          } catch {
            // raw text fallback
            onChunk(dataStr)
          }
        })
      } else {
        // OpenAI Compatible format
        const allMessages = [
          { role: 'system', content: finalSystemPrompt },
          ...finalMessages,
        ]
        const response = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: provider.model,
            messages: allMessages,
            max_tokens: maxTokens,
            temperature,
            stream: true,
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error((err as any).error?.message ?? `HTTP ${response.status}`)
        }

        await readSSEStream(response, (dataStr) => {
          if (dataStr === '[DONE]') return
          try {
            const data = JSON.parse(dataStr)
            const text = data.choices?.[0]?.delta?.content ?? ''
            if (text) onChunk(text)
          } catch {
            // silent parse error
          }
        })
      }

      return {
        provider: provider.name,
        model: provider.model,
        estimatedTokens,
      }
    } catch (error) {
      // API keys must never be logged to console or in error messages
      let message = String(error)
      if (provider.apiKey) {
        message = message.replace(new RegExp(provider.apiKey, 'g'), '[REDACTED]')
      }
      throw new Error(message)
    }
}

async function readSSEStream(response: Response, onData: (data: string) => void) {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        if (trimmed.startsWith('data: ')) {
          const dataContent = trimmed.slice(6).trim()
          if (dataContent) {
            onData(dataContent)
          }
        }
      }
    }
    // Parse any remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      const dataContent = buffer.trim().slice(6).trim()
      if (dataContent) {
        onData(dataContent)
      }
    }
  } finally {
    reader.releaseLock()
  }
}
