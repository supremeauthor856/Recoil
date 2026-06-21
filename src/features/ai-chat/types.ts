export type AIWorkspaceMode =
  | 'chat'
  | 'oracle'
  | 'brainstorm'
  | 'novel-writing'

export const AI_WORKSPACE_MODES: { id: AIWorkspaceMode; label: string; description: string }[] = [
  {
    id: 'chat',
    label: 'Chat',
    description: 'Casual conversation about your verse, characters, and stories',
  },
  {
    id: 'oracle',
    label: 'Oracle',
    description: 'Deep lore Q&A — ask anything about your world and get in-universe answers',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    description: 'Rapid creative ideation — ideas, plot hooks, character concepts',
  },
  {
    id: 'novel-writing',
    label: 'Novel Writing',
    description: 'Collaborative chapter-by-chapter novel writing set in your verse',
  },
]

export interface Conversation {
  id: string
  verse_id: string | null
  title: string | null
  description: string | null
  previous_conversation_id: string | null
  summary: string | null
  total_messages: number
  total_tokens_used: number
  provider_used: string | null
  model_used: string | null
  is_context_limit_reached: boolean
  created_at: number
  updated_at: number
  // Client-only, not in D1
  mode?: AIWorkspaceMode
}

export interface ConversationMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  token_count: number
  provider: string | null
  model: string | null
  created_at: number
}

export interface ConversationChainEntry {
  id: string
  title: string | null
  created_at: number
  total_messages: number
  summary: string | null
  is_context_limit_reached: boolean
}

export type ContextLimitStatus =
  | 'safe'          // 0-60%
  | 'caution'       // 60-80%
  | 'warning'       // 80-90%
  | 'critical'      // 90-95%
  | 'limit-reached' // 95%+

export interface MessageStreamState {
  isStreaming: boolean
  streamingContent: string
  streamingMessageId: string | null
}

export interface VerseContextPackage {
  verseOverview: string
  characterSummaries: string
  detailedProfiles: string
  relationshipSummary: string
  previousSummaries: string
  totalEstimatedChars: number
}

export const CONTEXT_WINDOW_SIZES: Record<string, number> = {
  'gemini-2.5-pro-preview-06-05': 1000000,
  'gemini-2.5-flash-preview-05-20': 1000000,
  'gemini-2.5-flash-lite-preview-06-17': 1000000,
  'llama-3.3-70b-versatile': 128000,
  'llama-4-scout-17b-16e-instruct': 131072,
  'llama-4-maverick-17b-128e-instruct-fp8': 131072,
  'deepseek-r1-distill-llama-70b': 128000,
  'qwen-qwq-32b': 32768,
  '@cf/meta/llama-3.3-70b-instruct': 128000,
  '@hf/nousresearch/hermes-2-pro-mistral-7b': 32768,
  'meta-llama/llama-3.3-70b-instruct:free': 131072,
  'deepseek/deepseek-r1:free': 163840,
  'qwen/qwen3-8b:free': 40960,
  'mistral-large-latest': 128000,
  'mistral-small-latest': 32768,
  'llama3.3-70b': 128000,
  'meta/llama-3.3-70b-instruct': 128000,
  'command-r-plus': 128000,
  'command-r': 128000,
  'gpt-4o-mini': 128000,
  'Meta-Llama-3.3-70B-Instruct': 131072,
  'meta-llama/Meta-Llama-3.1-70B-Instruct': 131072,
}

export const DEFAULT_CONTEXT_WINDOW = 128000

// Characters per token approximation
export const CHARS_PER_TOKEN = 4

export function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export function getContextLimitStatus(
  estimatedTokens: number,
  contextWindow: number
): ContextLimitStatus {
  const pct = estimatedTokens / contextWindow
  if (pct >= 0.95) return 'limit-reached'
  if (pct >= 0.90) return 'critical'
  if (pct >= 0.80) return 'warning'
  if (pct >= 0.60) return 'caution'
  return 'safe'
}
