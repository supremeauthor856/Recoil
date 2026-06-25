import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ExternalLink, Loader2, ArrowLeft, BookOpen, User, Shield, Compass, Edit3, Save, Check, X, RefreshCw, AlertCircle } from 'lucide-react'
import { getCharacter, updateCharacter } from '../../../services/characterService'
import { getCharacterRelationships } from '../../../services/relationshipService'
import { Character } from '../../../shared/types/database'
import { CharacterRelationship } from '../../relationships/types'
import { RelationshipTypeBadge } from '../../relationships/components/RelationshipTypeBadge'
import { RELATIONSHIP_COLORS_HEX } from '../../relationships/types'
import { cn } from '../../../shared/utils/cn'
import { ExportButton } from '../../export/components/ExportButton'
import { SnapshotCreateModal } from '../../tools/components/SnapshotCreateModal'
import { History } from 'lucide-react'

// TipTap imports
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { EditorToolbar } from '../../writing/components/EditorToolbar'
import * as writingService from '../../../services/writingService'

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

  // Biography/Wiki edits using TipTap
  const [isEditingWiki, setIsEditingWiki] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<number | null>(null)

  // Version snapshot state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [versionSaveSuccess, setVersionSaveSuccess] = useState(false)

  // Profile fields edits
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileSpecies, setProfileSpecies] = useState('')
  const [profileAge, setProfileAge] = useState('')
  const [profileRole, setProfileRole] = useState('')

  // Sync profile fields from loaded character details
  useEffect(() => {
    if (character) {
      setProfileName(character.name || '')
      setProfileSpecies(character.species || '')
      setProfileAge(character.age || '')
      setProfileRole(character.role || '')
    }
  }, [character])

  // Initialize TipTap editor for Character biography wiki lore
  const wikiEditor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        }
      }),
      Placeholder.configure({
        placeholder: "Write this character's biography, origin story, and chronicle details here...",
      }),
      CharacterCount,
    ],
    content: character?.description || '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none max-w-none text-[var(--color-text-primary)] h-full min-h-[250px] text-sm leading-relaxed',
      },
    },
  })

  // Synchronize asynchronously loaded character content with TipTap editor
  useEffect(() => {
    if (wikiEditor && character && !isEditingWiki) {
      const currentContent = wikiEditor.getHTML()
      if (character.description !== currentContent) {
        wikiEditor.commands.setContent(character.description || '', false)
      }
    }
  }, [wikiEditor, character, isEditingWiki])

  const handleSaveWiki = async () => {
    if (!wikiEditor || !character) return
    setSaveStatus('saving')
    try {
      const htmlContent = wikiEditor.getHTML()
      await updateCharacter(character.id, { description: htmlContent })
      
      setCharacter(prev => prev ? { ...prev, description: htmlContent } : null)
      setSaveStatus('saved')
      setLastSaved(Date.now())
      setIsEditingWiki(false)
      
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to save character biography:', err)
      setSaveStatus('error')
    }
  }

  const handleCancelWiki = () => {
    if (wikiEditor && character) {
      wikiEditor.commands.setContent(character.description || '')
    }
    setIsEditingWiki(false)
    setSaveStatus('idle')
  }

  const handleSaveProfile = async () => {
    if (!character) return
    try {
      await updateCharacter(character.id, {
        name: profileName,
        species: profileSpecies,
        age: profileAge,
        role: profileRole
      })
      setCharacter(prev => prev ? {
        ...prev,
        name: profileName,
        species: profileSpecies,
        age: profileAge,
        role: profileRole
      } : null)
      setIsEditingProfile(false)
    } catch (err) {
      console.error('Failed to update profile details:', err)
    }
  }

  const handleCancelProfile = () => {
    if (character) {
      setProfileName(character.name || '')
      setProfileSpecies(character.species || '')
      setProfileAge(character.age || '')
      setProfileRole(character.role || '')
    }
    setIsEditingProfile(false)
  }

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

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-colors focus:outline-none px-3.5 h-9 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)]/50 text-[13px] font-semibold cursor-pointer"
          >
            <History size={15} className="text-indigo-400" />
            <span>Save Version</span>
          </button>

          <ExportButton 
            scope={{ type: 'character', character, relationships }} 
            title={`Export ${character.name}`} 
            allowedFormats={['pdf', 'txt', 'md', 'html', 'png', 'json', 'yaml']} 
          />
        </div>
      </div>

      {versionSaveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold rounded-xl text-center animate-fade-in">
          Version snapshot successfully saved. It is now stored in Version History.
        </div>
      )}

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
            <div className="space-y-4">
              {/* Write/Edit Toggle Mode Toolbar */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Character Biography Record
                </span>
                
                {!isEditingWiki ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingWiki(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[#818cf8] hover:text-[#a5b4fc] hover:bg-[var(--color-bg-hover)] transition-all text-xs font-semibold select-none cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Edit Biography</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {saveStatus === 'saving' && (
                      <span className="flex items-center gap-1 text-xs text-indigo-400">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        Saved
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="flex items-center gap-1 text-xs text-rose-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Error
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveWiki}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs font-bold shrink-0 cursor-pointer"
                    >
                      <Save size={12} />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelWiki}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      <X size={12} />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Read / Edit container views */}
              {!isEditingWiki ? (
                <div className="p-5 sm:p-6 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] border-dashed border-opacity-65 rounded-2xl leading-relaxed text-[15px] text-[var(--color-text-secondary)] prose-editor">
                  {character.description ? (
                    <div 
                      className="tiptap"
                      dangerouslySetInnerHTML={{ __html: character.description }}
                    />
                  ) : (
                    <span className="italic text-[var(--color-text-muted)]">No wiki record or lore biography compiled for this character yet.</span>
                  )}
                </div>
              ) : (
                <div className="border border-[var(--color-border-subtle)]/30 rounded-2xl overflow-hidden flex flex-col bg-[var(--color-bg-elevated)]">
                  {/* Formatting Toolbar */}
                  <EditorToolbar editor={wikiEditor} />

                  {/* Scrollable editable TipTap wrapper styled with prose-editor */}
                  <div className="prose-editor p-4 sm:p-6 bg-[var(--color-bg-base)] border-t border-[var(--color-border-subtle)] hover:border-[var(--color-border-subtle)] border-opacity-40 outline-none">
                    <EditorContent editor={wikiEditor} />
                  </div>

                  {/* Character and word stats footer */}
                  <div className="flex h-8 items-center justify-between border-t border-[var(--color-border-subtle)]/20 bg-[var(--color-bg-elevated)] px-4 text-[10px] font-mono text-[var(--color-text-muted)]">
                    <div>
                      <span>Words: <strong>{wikiEditor ? writingService.countWords(wikiEditor.getHTML()) : 0}</strong></span>
                    </div>
                    <div>
                      <span>Characters: {wikiEditor?.storage.characterCount.characters().toLocaleString() ?? 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Profile Details Record
                </span>
                
                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-indigo-400 hover:text-indigo-300 hover:bg-[var(--color-bg-hover)] transition-all text-xs font-semibold select-none cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs font-bold shrink-0 cursor-pointer"
                    >
                      <Check size={12} />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelProfile}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      <X size={12} />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              {!isEditingProfile ? (
                <div className="p-5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">Name</span>
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">{character.name}</p>
                  </div>
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
                  <div className="space-y-1.5 sm:col-span-2">
                    <span className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">RECORD ID</span>
                    <p className="text-[10px] font-mono text-[var(--color-text-muted)] truncate">{character.id}</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full h-9 px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500"
                        placeholder="Character name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">Species</label>
                      <input
                        type="text"
                        value={profileSpecies}
                        onChange={(e) => setProfileSpecies(e.target.value)}
                        className="w-full h-9 px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500"
                        placeholder="Species (e.g. Elf, Human, Android)"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">Age</label>
                      <input
                        type="text"
                        value={profileAge}
                        onChange={(e) => setProfileAge(e.target.value)}
                        className="w-full h-9 px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500"
                        placeholder="Age (e.g. 24, immortal)"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">Role / Classification</label>
                      <input
                        type="text"
                        value={profileRole}
                        onChange={(e) => setProfileRole(e.target.value)}
                        className="w-full h-9 px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500"
                        placeholder="Narrative Role (e.g. Protagonist, Antagonist, Mentor)"
                      />
                    </div>
                  </div>
                </div>
              )}
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

      <SnapshotCreateModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        character={character}
        onSaved={() => {
          setVersionSaveSuccess(true)
          setTimeout(() => setVersionSaveSuccess(false), 5000)
        }}
      />
    </div>
  )
}
