// Shared utility — put this in src/shared/utils/voiceProfiles.ts

export interface VoiceProfile {
  characterId: string
  characterName: string
  generatedAt: number
  vocabularyLevel: 'simple' | 'conversational' | 'elevated' | 'technical' | 'archaic'
  sentenceLengthStyle: 'terse' | 'short' | 'varied' | 'long' | 'flowing'
  speechPatterns: string[]
  catchphrases: string[]
  thingsTheyNeverSay: string[]
  emotionalExpressionStyle: string
  uniqueVoiceMarkers: string
  exampleLine: string
  rawAnalysis: string      // full AI response for reference
}

const KEY = (id: string) => `recoil-voice-profile-${id}`

export const voiceProfileStore = {
  get(characterId: string): VoiceProfile | null {
    try {
      const raw = localStorage.getItem(KEY(characterId))
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  },

  save(profile: VoiceProfile): void {
    try {
      localStorage.setItem(KEY(profile.characterId), JSON.stringify(profile))
    } catch (e) {
      console.warn('Voice profile save failed:', e)
    }
  },

  delete(characterId: string): void {
    try {
      localStorage.removeItem(KEY(characterId))
    } catch (e) {
      console.warn('Voice profile delete failed:', e)
    }
  },

  getAll(): VoiceProfile[] {
    const profiles: VoiceProfile[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('recoil-voice-profile-')) {
          try {
            const raw = localStorage.getItem(key)
            if (raw) profiles.push(JSON.parse(raw))
          } catch { /* skip corrupted */ }
        }
      }
    } catch { /* fallback for non-storage environments */ }
    return profiles.sort((a, b) => b.generatedAt - a.generatedAt)
  },
}
