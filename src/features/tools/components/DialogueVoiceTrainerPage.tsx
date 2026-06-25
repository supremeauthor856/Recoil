import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ToolsLayout } from './ToolsLayout'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { VoiceProfile, voiceProfileStore } from '../../../shared/utils/voiceProfiles'
import { VoiceProfileDisplay } from './VoiceProfileDisplay'
import { getCharacters } from '../../../services/characterService'
import { Character } from '../../../shared/types/database'
import { requestAI } from '../../../services/aiService'
import { countWords } from '../../../services/writingService'
import { useUIStore } from '../../../store/uiStore'
import { Mic, Sparkles, Loader2, RotateCcw, Trash, Save, ChevronDown, ChevronUp, Check, RefreshCw } from 'lucide-react'

export function DialogueVoiceTrainerPage() {
  const { verseId } = useParams<{ verseId: string }>()
  const addToast = useUIStore(state => state.addToast)
  
  const [activeTab, setActiveTab] = useState<'train' | 'view-profiles'>('train')
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  
  const [dialogueExamples, setDialogueExamples] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [isContextExpanded, setIsContextExpanded] = useState(false)
  
  const [existingProfile, setExistingProfile] = useState<VoiceProfile | null>(null)
  const [generatedProfile, setGeneratedProfile] = useState<VoiceProfile | null>(null)
  const [allSavedProfiles, setAllSavedProfiles] = useState<VoiceProfile[]>([])
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch characters on mount
  useEffect(() => {
    if (!verseId) return
    getCharacters({ verseId }).then((chars) => {
      // Sort alphabetically by name
      const sorted = [...chars].sort((a, b) => a.name.localeCompare(b.name))
      setCharacters(sorted)
    }).catch(err => {
      console.error('Failed to fetch characters:', err)
    })
  }, [verseId])

  // Fetch all saved profiles from localStorage to list under View All
  const reloadSavedProfiles = () => {
    const list = voiceProfileStore.getAll()
    // Optional: filter by characterIds that belong to this verse
    setAllSavedProfiles(list)
  }

  useEffect(() => {
    reloadSavedProfiles()
  }, [])

  // When selected character changes, load existing profile if any
  useEffect(() => {
    if (selectedCharacterId) {
      const profile = voiceProfileStore.get(selectedCharacterId)
      setExistingProfile(profile)
      setGeneratedProfile(null) // clear previous generated preview
      setError(null)
    } else {
      setExistingProfile(null)
      setGeneratedProfile(null)
    }
  }, [selectedCharacterId])

  const handleGenerate = async () => {
    if (!selectedCharacterId) return
    const selectedChar = characters.find(c => c.id === selectedCharacterId)
    if (!selectedChar) return

    setIsGenerating(true)
    setError(null)
    setGeneratedProfile(null)

    const CHARACTER_SYSTEM_PROMPT = `You are a linguistic analyst specializing in fictional character voice patterns. Analyze the provided dialogue examples and extract the precise voice profile of this character. 

Respond ONLY with a valid JSON object. No other text. No code fences. Just raw JSON:
{
  "vocabularyLevel": "simple|conversational|elevated|technical|archaic",
  "sentenceLengthStyle": "terse|short|varied|long|flowing",
  "speechPatterns": ["list of specific patterns you observed, e.g. 'uses rhetorical questions', 'tends to trail off mid-thought', 'rarely uses contractions'"],
  "catchphrases": ["recurring phrases or expressions — only include if genuinely present in examples"],
  "thingsTheyNeverSay": ["words, phrases, or types of speech completely absent from their voice — infer from what's missing"],
  "emotionalExpressionStyle": "one paragraph describing how they express emotion through speech",
  "uniqueVoiceMarkers": "one paragraph describing what makes this voice unmistakably theirs — the 3-4 most distinctive features",
  "exampleLine": "Write ONE new line of dialogue in this character's voice that was not in the examples"
}`

    const userContent = `Character: ${selectedChar.name}
${selectedChar.role ? `Narrative Role: ${selectedChar.role}` : ''}
${selectedChar.description ? `Description context: ${selectedChar.description.slice(0, 300)}` : ''}
${additionalContext.trim() ? `Additional context: ${additionalContext}` : ''}

DIALOGUE EXAMPLES:
${dialogueExamples}`

    try {
      const response = await requestAI({
        taskType: 'dialogueVoiceTrainer',
        systemPrompt: CHARACTER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
        maxTokens: 1200,
        injectGuidelines: false,
      })

      if (response.error && !response.content) {
        setError(response.error)
        return
      }

      // Parse JSON
      let raw: Record<string, any>
      try {
        let jsonStr = response.content.replace(/```json|```/g, '').trim()
        const start = jsonStr.indexOf('{')
        const end = jsonStr.lastIndexOf('}')
        if (start === -1 || end === -1) {
          throw new Error('Parsed response is not a JSON object')
        }
        jsonStr = jsonStr.slice(start, end + 1)
        raw = JSON.parse(jsonStr)
      } catch (parseErr) {
        console.error('Failed to parse voice response:', response.content, parseErr)
        setError('Could not parse the voice analysis. Try providing more varied dialogue examples or switch AI providers.')
        return
      }

      const profile: VoiceProfile = {
        characterId: selectedCharacterId,
        characterName: selectedChar.name,
        generatedAt: Date.now(),
        vocabularyLevel: (raw.vocabularyLevel as VoiceProfile['vocabularyLevel']) ?? 'conversational',
        sentenceLengthStyle: (raw.sentenceLengthStyle as VoiceProfile['sentenceLengthStyle']) ?? 'varied',
        speechPatterns: Array.isArray(raw.speechPatterns) ? raw.speechPatterns : [],
        catchphrases: Array.isArray(raw.catchphrases) ? raw.catchphrases : [],
        thingsTheyNeverSay: Array.isArray(raw.thingsTheyNeverSay) ? raw.thingsTheyNeverSay : [],
        emotionalExpressionStyle: (raw.emotionalExpressionStyle as string) ?? '',
        uniqueVoiceMarkers: (raw.uniqueVoiceMarkers as string) ?? '',
        exampleLine: (raw.exampleLine as string) ?? '',
        rawAnalysis: response.content,
      }
      setGeneratedProfile(profile)
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveProfile = () => {
    if (!generatedProfile) return
    voiceProfileStore.save(generatedProfile)
    setExistingProfile(generatedProfile)
    const name = generatedProfile.characterName
    setGeneratedProfile(null)
    setSaveSuccess(true)
    reloadSavedProfiles()
    addToast({
      title: `Saved Dialogue Profile for '${name}'`,
      type: 'success',
    })
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleDeleteProfile = (charId: string) => {
    if (confirm('Are you sure you want to delete this voice profile?')) {
      const profile = voiceProfileStore.get(charId)
      const name = profile?.characterName || 'Voice Profile'
      voiceProfileStore.delete(charId)
      if (charId === selectedCharacterId) {
        setExistingProfile(null)
      }
      reloadSavedProfiles()
      addToast({
        title: `Deleted Voice Profile '${name}'`,
        type: 'success',
      })
    }
  }

  const handleRegenerate = () => {
    setGeneratedProfile(null)
    handleGenerate()
  }

  const charCount = dialogueExamples.length

  return (
    <ToolsLayout
      title="Dialogue Voice Trainer"
      description="Extract a character's unique voice pattern from dialogue examples."
      icon={<Mic size={20} />}
    >
      <div className="p-6 max-w-[860px] mx-auto flex flex-col gap-6 pb-24">
        {/* TAB ROW */}
        <div className="flex border-b border-[var(--color-border-subtle)]/20">
          <button
            onClick={() => setActiveTab('train')}
            className={`px-5 py-2.5 font-semibold text-sm transition-all focus:outline-none relative -mb-px ${
              activeTab === 'train'
                ? 'text-indigo-400 border-b-2 border-indigo-400 font-bold'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Train Voice
          </button>
          <button
            onClick={() => setActiveTab('view-profiles')}
            className={`px-5 py-2.5 font-semibold text-sm transition-all focus:outline-none relative -mb-px ${
              activeTab === 'view-profiles'
                ? 'text-indigo-400 border-b-2 border-indigo-400 font-bold'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            View All Saved Profiles
          </button>
        </div>

        {activeTab === 'train' && (
          <div className="flex flex-col gap-5">
            {/* CHARACTER SELECTOR */}
            <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)]/30 p-5">
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                Select a character
              </label>
              <select
                className="w-full h-10 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                value={selectedCharacterId || ''}
                onChange={e => setSelectedCharacterId(e.target.value || null)}
              >
                <option value="">Choose a character...</option>
                {characters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {existingProfile && !generatedProfile && (
                <div className="mt-3.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                  This character has an existing voice profile — training again will replace it.
                </div>
              )}
            </div>

            {selectedCharacterId ? (
              <>
                {/* DIALOGUE EXAMPLES SECTION */}
                <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)]/30 p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                        Paste Dialogue Examples
                      </span>
                      <span className="block text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Include at least 5-8 lines of dialogue from this character. The more varied the examples, the better.
                      </span>
                    </div>
                  </div>

                  <textarea
                    rows={10}
                    value={dialogueExamples}
                    onChange={e => setDialogueExamples(e.target.value)}
                    placeholder={`"I never said it would be easy. I said it would be worth it."\n"Don't look at me like that — you made your choice."\n"The archive doesn't forget. Neither do I."\n[Add as many dialogue examples as you have]`}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-indigo-500 text-[var(--color-text-primary)] leading-relaxed"
                  />

                  <div className="text-right text-[11px] text-[var(--color-text-muted)] font-mono mt-1">
                    {charCount.toLocaleString()} characters
                  </div>

                  {/* COLLAPSIBLE OPTIONAL CONTEXT */}
                  <div className="mt-4 border-t border-[var(--color-border-subtle)]/15 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsContextExpanded(!isContextExpanded)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 focus:outline-none"
                    >
                      {isContextExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>Add context (optional)</span>
                    </button>

                    {isContextExpanded && (
                      <div className="mt-3">
                        <textarea
                          rows={3}
                          value={additionalContext}
                          onChange={e => setAdditionalContext(e.target.value)}
                          placeholder="Any additional context about how this character speaks — their background, education, emotional state, accent, etc."
                          className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-xs focus:outline-none focus:border-indigo-500 text-[var(--color-text-primary)] leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* GENERATE BUTTON */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !dialogueExamples.trim()}
                  className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-all font-semibold text-white text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Analyzing voice...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Extract Voice Profile</span>
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                    {error}
                  </div>
                )}

                {/* GENERATED PROFILE PREVIEW */}
                {generatedProfile && (
                  <div className="space-y-3 mt-2">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[13px] text-emerald-400 rounded-lg flex items-center gap-2 font-medium">
                      <Check size={16} />
                      Voice profile extracted successfully. Review below to save.
                    </div>

                    <VoiceProfileDisplay profile={generatedProfile} />

                    <div className="flex gap-3 justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="flex items-center gap-1.5 px-4 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs select-none shadow cursor-pointer"
                      >
                        <Save size={14} />
                        <span>Save Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        className="flex items-center gap-1.5 px-4 h-10 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold text-xs select-none cursor-pointer"
                      >
                        <RefreshCw size={14} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* EXISTING PROFILE PREVIEW */}
                {existingProfile && !generatedProfile && (
                  <div className="space-y-3 mt-4 border-t border-[var(--color-border-subtle)]/15 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Current Voice Profile
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Use the speech examples to train a new one? This overrides current.')) {
                              window.scrollTo({ top: 300, behavior: 'smooth' })
                            }
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          <RotateCcw size={12} />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProfile(selectedCharacterId!)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300"
                        >
                          <Trash size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    <VoiceProfileDisplay profile={existingProfile} />
                  </div>
                )}

                {saveSuccess && (
                  <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium text-center">
                    Saved! Profile is now accessible.
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-xs text-[var(--color-text-muted)] italic">
                Please choose a character to get started.
              </div>
            )}
          </div>
        )}

        {activeTab === 'view-profiles' && (
          <div className="flex flex-col gap-4">
            {allSavedProfiles.length > 0 ? (
              allSavedProfiles.map(prof => (
                <div key={prof.characterId} className="relative group">
                  <VoiceProfileDisplay profile={prof} compact={true} />
                  <div className="absolute top-4 right-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProfile(prof.characterId)
                      }}
                      className="p-1 px-2.5 h-7 rounded border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<Mic size={24} />}
                title="No voice profiles yet"
                description="Train your first character voice to get started."
              />
            )}
          </div>
        )}
      </div>
    </ToolsLayout>
  )
}
