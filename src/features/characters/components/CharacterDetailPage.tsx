import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ExternalLink, Loader2, ArrowLeft, BookOpen, User, Shield, Compass } from 'lucide-react'
import { getCharacter } from '../../../services/characterService'
import { getCharacterRelationships } from '../../../services/relationshipService'
import { Character } from '../../../shared/types/database'
import { CharacterRelationship } from '../../relationships/types'
import { RelationshipTypeBadge } from '../../relationships/components/RelationshipTypeBadge'
import { RELATIONSHIP_COLORS_HEX } from '../../relationships/types'
import { cn } from '../../../shared/utils/cn'
import { ExportButton } from '../../export/components/ExportButton'

type TabType = 'wiki' | 'profile' | 'sheet'

export function CharacterDetailPage() {
  const { verseId = '', characterId = '' } = useParams<{ verseId: string; characterId: string }>()
  const navigate = useNavigate()

  // 1. Loading indicators and core states
  const [character, setCharacter] = useState<Character | null>(null)
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([])
  const [otherCharacters, setOtherCharacters] = useState<Record<string, Character>>({})
  const [activeTab, setActiveTab] = useState<TabType>('wiki')

  const [loadingChar, setLoadingChar] = useState(true)
  const [loadingRels, setLoadingRels] = useState(true)
  const [errorHeader, setErrorHeader] = useState<string | null>(null)

  // Fetch central character details
  useEffect(() => {
    if (!characterId) return
    setLoadingChar(true)
    setErrorHeader(null)
    getCharacter(characterId)
      .then((data) => {
        setCharacter(data)
      })
      .catch((err) => {
        console.error('Err fetching char profile:', err)
        setErrorHeader('Could not locate character profile details.')
      })
      .finally(() => {
        setLoadingChar(false)
      })
  }, [characterId])

  // Fetch relationships
  useEffect(() => {
    if (!characterId) return
    setLoadingRels(true)
    getCharacterRelationships(characterId)
      .then((data) => {
        setRelationships(data || [])
      })
      .catch((err) => {
        console.error('Err loading relationships for char profile:', err)
      })
      .finally(() => {
        setLoadingRels(false)
      })
  }, [characterId])

  // Cache/Fetch other participating characters details in parallel
  useEffect(() => {
    if (relationships.length === 0) return

    const fetchOtherCharsIndex = async () => {
      const uniqueOtherIds = Array.from(
        new Set(
          relationships.map((rel) =>
            rel.character_a_id === characterId ? rel.character_b_id : rel.character_a_id
          )
        )
      )

      const cached = { ...otherCharacters }
      let changed = false

      await Promise.all(
        uniqueOtherIds.map(async (id) => {
          if (cached[id]) return
          try {
            const char = await getCharacter(id)
            cached[id] = char
            changed = true
          } catch (err) {
            console.error('Could not load participant details:', id, err)
          }
        })
      )

      if (changed) {
        setOtherCharacters(cached)
      }
    }

    fetchOtherCharsIndex()
  }, [relationships, characterId])

  if (loadingChar) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#07070B] text-[var(--color-text-secondary)] font-mono text-xs select-none">
        <Loader2 size={24} className="animate-spin text-indigo-500 mb-2.5" />
        <span>LOADING CHARACTER RECORD...</span>
      </div>
    )
  }

  if (errorHeader || !character) {
    return (
      <div className="w-full h-full p-8 flex items-center justify-center bg-[#07070B]">
        <div className="max-w-md p-6 bg-rose-950/20 border border-rose-500/20 rounded-2xl text-center space-y-4">
          <p className="text-sm font-semibold text-rose-400">{errorHeader || 'Character Not Found'}</p>
          <button
            onClick={() => navigate(`/verse/${verseId}`)}
            className="px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Profile metadata elements
  const avatarUrl = character.avatar_url || character.reference_image_url || null

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-4xl mx-auto space-y-6 select-none animate-fade-in text-[var(--color-text-primary)]">
      
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/verse/${verseId}`)}
          className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Verse Dashboard</span>
        </button>

        <ExportButton 
          scope={{ type: 'character', character, relationships }} 
          title={`Export ${character.name}`} 
          allowedFormats={['pdf', 'txt', 'md', 'html', 'png', 'json', 'yaml']} 
        />
      </div>

      {/* 2. PROFILE HERO HEADER CARD */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/40 rounded-2xl shadow-sm">
        
        {/* Profile Avatar Frame */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={character.name}
            referrerPolicy="no-referrer"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[var(--color-border-subtle)]/30 shadow-md transform hover:scale-102 duration-300"
          />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-950 border border-indigo-700 font-extrabold flex items-center justify-center text-3xl text-indigo-200 uppercase shadow-inner">
            {character.name.charAt(0)}
          </div>
        )}

        {/* Major metadata descriptions */}
        <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
            <h1 className="text-xl font-extrabold sm:text-2xl tracking-tight leading-none text-[var(--color-text-primary)] truncate">
              {character.name}
            </h1>
            {character.role && (
              <span className="inline-flex max-w-[max-content] self-center sm:self-auto px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 capitalize">
                {character.role}
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--color-text-muted)] flex items-center justify-center sm:justify-start gap-1">
            <Compass size={11} />
            <span>Character Entity inside Verse Universe</span>
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3.5 text-[11px] text-[var(--color-text-secondary)] font-medium pt-1.5">
            {character.species && (
              <span>
                Species: <b className="text-[var(--color-text-primary)]">{character.species}</b>
              </span>
            )}
            {character.age && (
              <span>
                Age: <b className="text-[var(--color-text-primary)]">{character.age}</b>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION COMPONENT */}
      <div className="space-y-4">
        <div className="flex border-b border-[var(--color-border-subtle)]/30 p-0.5 gap-2">
          <button
            onClick={() => setActiveTab('wiki')}
            className={cn(
              'pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all outline-none border-b-2',
              activeTab === 'wiki'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
          >
            <BookOpen size={12.5} />
            Wiki / Lore
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              'pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all outline-none border-b-2',
              activeTab === 'profile'
                ? 'border-indigo-400 text-indigo-400 font-bold'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
          >
            <User size={12.5} />
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab('sheet')}
            className={cn(
              'pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all outline-none border-b-2',
              activeTab === 'sheet'
                ? 'border-indigo-400 text-indigo-400 font-bold'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
          >
            <Shield size={12.5} />
            Character Sheet
          </button>
        </div>

        {/* TAB VIEWS RENDERING */}
        <div className="min-h-[120px]">
          {activeTab === 'wiki' && (
            <div className="p-5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-2xl leading-relaxed text-xs text-[var(--color-text-secondary)]">
              {character.description ? (
                <p className="whitespace-pre-wrap">{character.description}</p>
              ) : (
                <span className="italic text-[var(--color-text-muted)]">No wiki record or lore biography compiled for this character yet.</span>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">SPECIES</span>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">{character.species || 'Unclassified'}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">AGE</span>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">{character.age || 'Unknown'}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">ROLE / CLASSIFICATION</span>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">{character.role || 'Unspecified Narrative Role'}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">RECORD ID</span>
                <p className="text-[10px] font-mono text-[var(--color-text-muted)] truncate">{character.id}</p>
              </div>
            </div>
          )}

          {activeTab === 'sheet' && (
            <div className="p-5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-2xl leading-relaxed text-xs text-[var(--color-text-secondary)] space-y-3">
              <h4 className="text-[12px] font-semibold text-[var(--color-text-primary)]">Attributes Overview</h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Narrative stat parameters and story arc metrics are derived dynamically according to ongoing interaction counts. Map relationships below to update connection matrices dynamically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. RELATIONSHIPS SUMMARY SECTION (BOTTOM, READ-ONLY) */}
      <div className="space-y-3 border-t border-[var(--color-border-subtle)]/20 pt-6">
        
        {/* Section header */}
        <div className="flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight text-[var(--color-text-primary)] uppercase">
              RECOIL RELATIONSHIP NETWORK
            </h3>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]/40 rounded-full">
              {relationships.length}
            </span>
          </div>

          <Link
            to={`/verse/${verseId}/relationships`}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
          >
            <span>View in Web</span>
            <ExternalLink size={11} />
          </Link>
        </div>

        {/* LOADING INDICATOR SKELETON */}
        {loadingRels ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-full bg-[var(--color-bg-elevated)]/40 border border-[var(--color-border-subtle)]/10 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : relationships.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] italic leading-relaxed py-2">
            No character relationship dynamics registered. Open the Relationship Web to establish connections.
          </p>
        ) : (
          <div className="space-y-2">
            
            {/* List top-6 relationship records */}
            {relationships.slice(0, 6).map((rel) => {
              // Extract the target participant character
              const otherId = rel.character_a_id === characterId ? rel.character_b_id : rel.character_a_id
              const otherChar = otherCharacters[otherId] || null
              const dotColor = RELATIONSHIP_COLORS_HEX[rel.relationship_type] || '#9090A8'

              // Mini narrative importance rating (Out of 10 values)
              const impPct = Math.min(100, Math.max(0, (rel.narrative_importance / 10) * 100))

              return (
                <div
                  key={rel.id}
                  className="h-11 px-3.5 bg-[var(--color-bg-elevated)]/60 border border-[var(--color-border-subtle)]/30 hover:border-[var(--color-border-subtle)]/65 rounded-xl flex items-center justify-between gap-3 transition-colors"
                >
                  {/* Left row: Avatar and participant links */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                    
                    {/* Other character avatar */}
                    {otherChar?.avatar_url || otherChar?.reference_image_url ? (
                      <img
                        src={otherChar.avatar_url || otherChar.reference_image_url || ''}
                        alt={otherChar.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover border border-[var(--color-border-subtle)]/30 shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-950 flex items-center justify-center text-[9px] font-extrabold text-indigo-200 uppercase shrink-0">
                        {otherChar?.name.charAt(0) || '?'}
                      </div>
                    )}

                    {/* Participant links and labels */}
                    <Link
                      to={`/verse/${verseId}/characters/${otherId}`}
                      className="text-xs font-semibold text-[var(--color-text-primary)] hover:text-indigo-400 transition-colors truncate"
                    >
                      {otherChar?.name || 'Loading Character...'}
                    </Link>

                    {/* Meta Type info */}
                    <RelationshipTypeBadge type={rel.relationship_type} size="sm" />

                    {rel.dynamic_label && (
                      <span className="text-[11px] text-[var(--color-text-muted)] italic truncate hidden sm:inline max-w-[200px]">
                        — {rel.dynamic_label}
                      </span>
                    )}
                  </div>

                  {/* Right row: Narrative Importance index mini index */}
                  <div className="flex items-center gap-2 shrink-0 select-none">
                    <span className="text-[9px] font-mono font-medium text-[var(--color-text-muted)]">Narrative Power</span>
                    <div className="w-12 h-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/15 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${impPct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* View Remaining links */}
            {relationships.length > 6 && (
              <div className="pt-1.5 text-center">
                <Link
                  to={`/verse/${verseId}/relationships`}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View all {relationships.length} relationships in Graph
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
