import React, { useState } from 'react'
import { VoiceProfile } from '../../../shared/utils/voiceProfiles'
import { formatRelativeTime } from '../../../shared/utils/format'
import { Quote, X, ChevronDown, ChevronUp } from 'lucide-react'

interface VoiceProfileDisplayProps {
  profile: VoiceProfile
  compact?: boolean
}

const VOCAB_LABELS = {
  simple: 'Simple vocab',
  conversational: 'Conversational',
  elevated: 'Elevated vocab',
  technical: 'Technical',
  archaic: 'Archaic'
}

const SENTENCE_LABELS = {
  terse: 'Terse sentences',
  short: 'Short sentences',
  varied: 'Varied length',
  long: 'Long sentences',
  flowing: 'Flowing prose'
}

export function VoiceProfileDisplay({ profile, compact = false }: VoiceProfileDisplayProps) {
  const [localExpanded, setLocalExpanded] = useState(!compact)

  const toggleExpand = () => {
    if (compact) {
      setLocalExpanded(!localExpanded)
    }
  }

  return (
    <div 
      className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)]/30 p-5 flex flex-col gap-4 select-none"
    >
      {/* HEADER ROW */}
      <div 
        onClick={toggleExpand}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${compact ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-[var(--color-text-primary)]">
            {profile.characterName}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
            {formatRelativeTime(profile.generatedAt)}
          </span>
          {compact && (
            <span className="text-[var(--color-text-muted)] ml-1">
              {localExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {VOCAB_LABELS[profile.vocabularyLevel] || profile.vocabularyLevel}
          </span>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
            {SENTENCE_LABELS[profile.sentenceLengthStyle] || profile.sentenceLengthStyle}
          </span>
        </div>
      </div>

      {localExpanded ? (
        <>
          {/* EXAMPLE LINE */}
          {profile.exampleLine && (
            <div className="bg-[var(--color-bg-base)] rounded-lg p-3.5 border-l-4 border-indigo-500">
              <span className="block text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider mb-1.5 uppercase font-mono">
                Generated Example
              </span>
              <div className="relative flex gap-2">
                <Quote className="h-4 w-4 text-indigo-400/50 shrink-0 transform rotate-180" />
                <p className="italic text-sm text-[var(--color-text-secondary)]">
                  {profile.exampleLine}
                </p>
                <Quote className="h-4 w-4 text-indigo-400/50 shrink-0 self-end" />
              </div>
            </div>
          )}

          {/* UNIQUE VOICE MARKERS */}
          {profile.uniqueVoiceMarkers && (
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase font-mono">
                What Makes Them Unique
              </span>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {profile.uniqueVoiceMarkers}
              </p>
            </div>
          )}

          {/* SPEECH PATTERNS */}
          {profile.speechPatterns && profile.speechPatterns.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase font-mono">
                Speech Patterns
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.speechPatterns.map((pattern, idx) => (
                  <span 
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/5 text-indigo-300 border border-indigo-500/10"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TWO COLUMN GRID: CATCHPHRASES & NEVER SAYS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.catchphrases && profile.catchphrases.length > 0 && (
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase font-mono">
                  Catchphrases
                </span>
                <ul className="space-y-1">
                  {profile.catchphrases.map((phrase, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)]">
                      <Quote className="h-3 w-3 text-indigo-400/65 shrink-0 mt-0.5" />
                      <span>{phrase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {profile.thingsTheyNeverSay && profile.thingsTheyNeverSay.length > 0 && (
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase font-mono">
                  Never Says
                </span>
                <ul className="space-y-1">
                  {profile.thingsTheyNeverSay.map((phrase, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-rose-400">
                      <X className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />
                      <span>{phrase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* EMOTIONAL EXPRESSION */}
          {profile.emotionalExpressionStyle && (
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase font-mono">
                Emotional Expression
              </span>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {profile.emotionalExpressionStyle}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* COMPACT MODE SUMMARY */}
          {profile.uniqueVoiceMarkers && (
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {profile.uniqueVoiceMarkers.length > 100 
                ? `${profile.uniqueVoiceMarkers.slice(0, 100)}...` 
                : profile.uniqueVoiceMarkers}
            </p>
          )}

          {profile.exampleLine && (
            <p className="italic text-xs text-[var(--color-text-muted)]">
              "{profile.exampleLine}"
            </p>
          )}
        </>
      )}
    </div>
  )
}
