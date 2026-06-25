import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ToolsLayout } from './ToolsLayout'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { VersionSnapshot, versionHistoryService } from '../../../services/versionHistoryService'
import { getCharacters, updateCharacter } from '../../../services/characterService'
import { Character } from '../../../shared/types/database'
import { useUIStore } from '../../../store/uiStore'
import { VersionSnapshotCard } from './VersionSnapshotCard'
import { SnapshotDiffView } from './SnapshotDiffView'
import { formatDate } from '../../../shared/utils/format'
import { History, Loader2, ArrowRight, Layers, AlertTriangle, RefreshCw, X, ChevronRight, Eye } from 'lucide-react'

function getInitials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : '??'
}

function CharacterAvatar({ character, size = 26 }: { character: Character; size?: number }) {
  if (character.avatar_url) {
    return (
      <img
        src={character.avatar_url}
        alt={character.name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 border border-[var(--color-border-subtle)]/20"
      />
    )
  }
  return (
    <div 
      style={{ width: size, height: size }}
      className="rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/20 text-[10px] shrink-0 select-none"
    >
      {getInitials(character.name)}
    </div>
  )
}

export function VersionHistoryPage() {
  const { verseId } = useParams<{ verseId: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore(state => state.addToast)

  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  // Filtering
  const [filterCharId, setFilterCharId] = useState<'all' | string>('all')

  // Modals state
  const [selectedSnapshot, setSelectedSnapshot] = useState<VersionSnapshot | null>(null) // view details
  const [compareSource, setCompareSource] = useState<VersionSnapshot | null>(null)       // selective diff start
  const [activeDiff, setActiveDiff] = useState<{ older: VersionSnapshot; newer: VersionSnapshot } | null>(null)
  const [snapshotToRestore, setSnapshotToRestore] = useState<VersionSnapshot | null>(null)

  const [actionInProgress, setActionInProgress] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadData = async () => {
    if (!verseId) return
    setLoading(true)
    setErrorMessage(null)
    try {
      const [chars, snaps] = await Promise.all([
        getCharacters({ verseId }),
        versionHistoryService.getAllCharacterSnapshots(verseId)
      ])

      // Sort characters alphabetically
      setCharacters([...chars].sort((a, b) => a.name.localeCompare(b.name)))

      // Map snapshots and inject entity names
      const enrichedSnapshots = snaps.map(s => {
        const char = chars.find(c => c.id === s.entity_id)
        return {
          ...s,
          entity_name: char ? char.name : 'Unknown Character'
        }
      })
      
      // Sort snapshots by reverse chronological order
      enrichedSnapshots.sort((a, b) => b.created_at - a.created_at)
      setSnapshots(enrichedSnapshots)
    } catch (err: any) {
      console.error('Failed to load version history:', err)
      setErrorMessage(err.message || 'Failed to load version history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [verseId])

  // Click on "Compare" for consecutive nodes
  const triggerConsecutiveCompare = (older: VersionSnapshot, newer: VersionSnapshot) => {
    setActiveDiff({ older, newer })
  }

  // Handle selecting elements in comparative workflow
  const handleSelectiveCompareClick = (targetSnip: VersionSnapshot) => {
    if (!compareSource) {
      setCompareSource(targetSnip)
    } else {
      // Run comparison
      // Determine chronology
      if (compareSource.created_at < targetSnip.created_at) {
        setActiveDiff({ older: compareSource, newer: targetSnip })
      } else {
        setActiveDiff({ older: targetSnip, newer: compareSource })
      }
      setCompareSource(null)
    }
  }

  // Trigger DELETE action
  const handleDeleteSnapshot = async (id: string) => {
    if (confirm('Are you sure you want to delete this version? This is permanent.')) {
      const snap = snapshots.find(s => s.id === id)
      const label = snap ? `${snap.entity_type} version (${snap.version_label || 'unlabeled'})` : 'Snapshot'
      try {
        await versionHistoryService.deleteSnapshot(id)
        setSnapshots(prev => prev.filter(s => s.id !== id))
        addToast({
          title: `Deleted version '${label}'`,
          type: 'success',
        })
      } catch (err) {
        console.error('Failed to delete snapshot:', err)
        addToast({
          title: `Failed to delete version '${label}'`,
          type: 'error',
        })
      }
    }
  }

  // TRIGGER RESTORE ACTION WITH SAFETY popup CONFIRMATION
  const handleConfirmRestore = async () => {
    if (!snapshotToRestore) return
    setActionInProgress(true)
    const label = snapshotToRestore.version_label || 'unlabeled'
    try {
      const charData = versionHistoryService.parseSnapshot<Partial<Character>>(snapshotToRestore)
      if (!charData.id) {
        throw new Error('Invalid snapshot entity data.')
      }

      // Overwrite the DB fields
      await updateCharacter(charData.id, charData)
      const charName = charData.name || 'Character'
      setSnapshotToRestore(null)
      addToast({
        title: `Restored version '${label}' for '${charName}'`,
        type: 'success',
      })
      
      // Success: redirect to details!
      navigate(`/verse/${verseId}/characters/${charData.id}`)
    } catch (err: any) {
      addToast({
        title: err.message || 'Failed to restore snapshot',
        type: 'error',
      })
    } finally {
      setActionInProgress(false)
    }
  }

  // Group snapshots by character
  const groupSnapshotsByCharacter = () => {
    const groups: Record<string, { character: Character | null, name: string, list: VersionSnapshot[] }> = {}
    
    // Initialize groups for filtered character
    snapshots.forEach(s => {
      if (filterCharId !== 'all' && s.entity_id !== filterCharId) return
      
      if (!groups[s.entity_id]) {
        const char = characters.find(c => c.id === s.entity_id) || null
        groups[s.entity_id] = {
          character: char,
          name: s.entity_name || char?.name || 'Unknown Character',
          list: []
        }
      }
      groups[s.entity_id].list.push(s)
    })

    return Object.entries(groups).sort((a, b) => a[1].name.localeCompare(b[1].name))
  }

  // Filtered snapshot views
  const filteredSnapshots = snapshots.filter(s => filterCharId === 'all' || s.entity_id === filterCharId)

  // Rendering a preview panel inside View Snapshot modal
  const renderSnapshotOverview = (snap: VersionSnapshot) => {
    const char = versionHistoryService.parseSnapshot<Character>(snap)
    return (
      <div className="space-y-4 text-xs max-h-[480px] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[var(--color-border-subtle)]/15">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[var(--color-text-muted)] tracking-wider font-mono">ROLE</span>
            <p className="font-semibold text-[var(--color-text-secondary)]">{char.role || '(empty)'}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-[var(--color-text-muted)] tracking-wider font-mono">SPECIES</span>
            <p className="font-semibold text-[var(--color-text-secondary)]">{char.species || '(empty)'}</p>
          </div>
          <div className="space-y-0.5 mt-2">
            <span className="text-[10px] text-[var(--color-text-muted)] tracking-wider font-mono">AGE</span>
            <p className="font-semibold text-[var(--color-text-secondary)]">{char.age || '(empty)'}</p>
          </div>
          <div className="space-y-0.5 mt-2">
            <span className="text-[10px] text-[var(--color-text-muted)] tracking-wider font-mono">GENDER/PRONOUNS</span>
            <p className="font-semibold text-[var(--color-text-secondary)]">{(char as any).pronouns || '(empty)'}</p>
          </div>
        </div>

        {char.description && (
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--color-text-muted)] tracking-wider font-mono uppercase block">Description / Biography</span>
            <p className="text-[var(--color-text-primary)] leading-relaxed bg-[var(--color-bg-base)]/30 p-2.5 rounded border border-[var(--color-border-subtle)]/10">
              {char.description}
            </p>
          </div>
        )}

        {(char as any).personality_summary && (
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--color-text-muted)] tracking-wider font-mono uppercase block">Personality Summary</span>
            <p className="text-[var(--color-text-primary)] leading-relaxed bg-[var(--color-bg-base)]/30 p-2.5 rounded border border-[var(--color-border-subtle)]/10">
              {(char as any).personality_summary}
            </p>
          </div>
        )}

        {(char as any).backstory && (
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--color-text-muted)] tracking-wider font-mono uppercase block">Backstory</span>
            <p className="text-[var(--color-text-primary)] leading-relaxed bg-[var(--color-bg-base)]/30 p-2.5 rounded border border-[var(--color-border-subtle)]/10">
              {(char as any).backstory}
            </p>
          </div>
        )}
      </div>
    )
  }

  const grouped = groupSnapshotsByCharacter()

  return (
    <ToolsLayout
      title="Version History"
      description="Track how your characters and content have changed over time."
      icon={<History size={20} />}
    >
      <div className="p-6 max-w-[860px] mx-auto flex flex-col gap-6 pb-24 select-none">
        
        {/* FILTER BAR */}
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 max-sm:w-full">
            <select
              value={filterCharId}
              onChange={e => {
                setFilterCharId(e.target.value)
                setCompareSource(null) // clear comparative anchor
              }}
              className="h-9 w-full sm:w-56 text-xs bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg px-2.5 font-semibold focus:outline-none focus:border-indigo-500 whitespace-nowrap"
            >
              <option value="all">All Characters</option>
              {characters.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-[var(--color-text-secondary)] font-mono text-right sm:text-left">
            Total of <span className="font-bold text-indigo-400">{snapshots.length}</span> revisions saved
          </div>
        </div>

        {/* SELECTIVE DIFFERENCE INFO PROMPT */}
        {compareSource && (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={14} className="animate-pulse" />
              <span>
                Selected <strong>{compareSource.version_label || 'Original Snapshot'}</strong>. Click another to compare.
              </span>
            </div>
            <button 
              onClick={() => setCompareSource(null)}
              className="text-[10px] font-bold text-indigo-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <span className="text-xs text-[var(--color-text-muted)]">Retrieving version list...</span>
          </div>
        ) : errorMessage ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold text-center">
            {errorMessage}
          </div>
        ) : snapshots.length === 0 ? (
          <EmptyState
            icon={<History size={24} />}
            title="No Saved Versions"
            description="Snapshots preserve older profiles as you iterate. Open a character profile page to save your first version."
          />
        ) : (
          <div className="space-y-6">
            {grouped.map(([charId, group]) => (
              <div 
                key={charId} 
                className="bg-[var(--color-bg-elevated)]/40 rounded-xl border border-[var(--color-border-subtle)]/15 overflow-hidden"
              >
                {/* CHARACTER SECTION HEADER */}
                <div className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)]/15 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {group.character && <CharacterAvatar character={group.character} size={24} />}
                    <span className="font-bold text-sm text-[var(--color-text-primary)]">
                      {group.name}
                    </span>
                    <span className="text-[10px] font-mono bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/15 px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">
                      {group.list.length} {group.list.length === 1 ? 'version' : 'versions'}
                    </span>
                  </div>
                </div>

                {/* SNAPSHOTS LIST */}
                <div className="p-4 space-y-4">
                  {group.list.map((snap, i) => {
                    const isSource = compareSource !== null && compareSource.id === snap.id
                    const nextSnap = group.list[i + 1]

                    return (
                      <div key={snap.id} className="space-y-3">
                        <VersionSnapshotCard
                          snapshot={snap}
                          character={group.character}
                          onDelete={() => handleDeleteSnapshot(snap.id)}
                          onRestore={() => setSnapshotToRestore(snap)}
                          onCompare={() => handleSelectiveCompareClick(snap)}
                          onViewSnapshot={() => setSelectedSnapshot(snap)}
                          isComparing={isSource}
                        />

                        {/* CONSECUTIVE COMPARE TRIGGER BUTTON */}
                        {nextSnap && (
                          <div className="flex justify-center -my-1 pb-1">
                            <button
                              type="button"
                              onClick={() => triggerConsecutiveCompare(nextSnap, snap)}
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 focus:outline-none bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/20 px-2.5 py-1 rounded-full transition-all shadow-xs cursor-pointer select-none"
                            >
                              <Layers size={11} />
                              <span>Compare contiguous revisions</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- MODALS --- */}

        {/* 1. VIEW SNAPSHOT OVERVIEW SHEET CODES */}
        {selectedSnapshot && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
              
              <div className="p-4 border-b border-[var(--color-border-subtle)]/15 flex justify-between items-center bg-[var(--color-bg-base)]/20">
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-mono uppercase font-bold">
                  <Eye size={14} className="text-indigo-400" />
                  <span>Snapshot View &mdash; {selectedSnapshot.version_label || 'Original version'}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedSnapshot(null)} 
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto">
                {renderSnapshotOverview(selectedSnapshot)}
              </div>

              <div className="p-4 border-t border-[var(--color-border-subtle)]/15 flex justify-end bg-[var(--color-bg-base)]/20 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSnapshotToRestore(selectedSnapshot)
                    setSelectedSnapshot(null)
                  }}
                  className="h-8.5 px-3 rounded border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 font-bold text-xs cursor-pointer"
                >
                  Restore This Snapshot
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSnapshot(null)}
                  className="h-8.5 px-4 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 2. SNAPSHOT COMPARATIVE DIFF VIEWER */}
        {activeDiff && (
          <SnapshotDiffView
            snapshotA={activeDiff.older}
            snapshotB={activeDiff.newer}
            characterName={activeDiff.newer.entity_name || 'Character'}
            onClose={() => setActiveDiff(null)}
            onRestore={(target) => {
              setSnapshotToRestore(target)
              setActiveDiff(null)
            }}
          />
        )}

        {/* 3. SAFETY CONFIRMATION DIALOG GATING THE RESTORE PROCESS */}
        {snapshotToRestore && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in select-none">
            <div className="bg-[var(--color-bg-elevated)] border-2 border-red-500/20 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
              
              <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex gap-3 items-center text-rose-400">
                <AlertTriangle size={20} className="shrink-0" />
                <h3 className="font-bold text-sm">Dangerous Action &mdash; Overwrite Character</h3>
              </div>

              <div className="p-5 space-y-3">
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  You are about to restore the snapshot version{' '}
                  <strong className="text-[var(--color-text-primary)]">
                    "{snapshotToRestore.version_label || 'Original Snapshot'}"
                  </strong>{' '}
                  saved on <strong className="text-[var(--color-text-primary)]">{formatDate(snapshotToRestore.created_at)}</strong>.
                </p>
                <p className="text-xs text-rose-400 font-medium">
                  WARNING: This will replace all current profile details for{' '}
                  <strong className="underline">{snapshotToRestore.entity_name}</strong> in this verse. Any unsaved edits will be completely lost!
                </p>
              </div>

              <div className="p-4 border-t border-[var(--color-border-subtle)]/15 bg-[var(--color-bg-base)]/25 flex gap-3 justify-end text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSnapshotToRestore(null)}
                  disabled={actionInProgress}
                  className="h-9 px-4 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] select-none transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={actionInProgress}
                  className="h-9 px-4 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white select-none transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  {actionInProgress ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  <span>Confirm Restore</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </ToolsLayout>
  )
}
