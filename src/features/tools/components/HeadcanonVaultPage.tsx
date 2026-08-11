import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Archive, Plus, X, MoreHorizontal, User, Tag, ShieldAlert, Sparkles, Filter } from 'lucide-react'
import { ToolsLayout } from './ToolsLayout'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { headcanonService } from '../../../services/headcanonService'
import type { Headcanon, CanonStatus } from '../types'
import { CANON_STATUSES, CANON_STATUS_LABELS, CANON_STATUS_COLORS } from '../types'
import { cn } from '../../../shared/utils/cn'
import { useUIStore } from '../../../store/uiStore'
import { db } from '../../../services/db'
import type { Character } from '../../../shared/types/database'

function formatRelativeTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

function HeadcanonCard({ entry, characters, onEdit, onDelete }: { entry: Headcanon, characters: Character[], onEdit: (e: Headcanon) => void, onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const linkedChar = characters.find(c => c.id === entry.character_id)
  const statusColor = CANON_STATUS_COLORS[entry.canon_status] || '#3B82F6'

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs relative group flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="px-2.5 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider border shadow-2xs"
              style={{ color: statusColor, borderColor: `${statusColor}40`, backgroundColor: `${statusColor}15` }}
            >
              {CANON_STATUS_LABELS[entry.canon_status] || entry.canon_status}
            </span>

            {linkedChar && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                <User size={12} className="text-slate-400" />
                {linkedChar.name}
              </span>
            )}
          </div>

          <div className="relative shrink-0">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden flex flex-col text-xs font-medium" onMouseLeave={() => setMenuOpen(false)}>
                <button className="text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200" onClick={() => { onEdit(entry); setMenuOpen(false) }}>Edit Idea</button>
                <button className="text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600" onClick={() => { onDelete(entry.id); setMenuOpen(false) }}>Delete</button>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
        
        {entry.notes && (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            {entry.notes}
          </p>
        )}
      </div>

      <div className="text-[10px] text-slate-400 text-right mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 font-mono">
        {formatRelativeTime(entry.created_at)}
      </div>
    </div>
  )
}

export function HeadcanonVaultPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  const addToast = useUIStore(state => state.addToast)
  
  const [entries, setEntries] = useState<Headcanon[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  
  const [filter, setFilter] = useState<'all' | CanonStatus>('all')
  const [quickAdd, setQuickAdd] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<CanonStatus>('headcanon')
  const [selectedCharId, setSelectedCharId] = useState<string>('')
  const [quickNotes, setQuickNotes] = useState('')

  const fetchHeadcanonsAndCharacters = async () => {
    try {
      const [data, chars] = await Promise.all([
        headcanonService.getAll(verseId),
        verseId ? db.characters.where('verse_id').equals(verseId).toArray() : db.characters.toArray()
      ])
      setEntries(data)
      setCharacters(chars)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHeadcanonsAndCharacters() }, [verseId])

  const filtered = useMemo(() => filter === 'all' ? entries : entries.filter(e => e.canon_status === filter), [entries, filter])

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAdd.trim()) return
    const content = quickAdd.trim()
    
    try {
      const added = await headcanonService.create({
        verse_id: verseId,
        content,
        character_id: selectedCharId || null,
        canon_status: selectedStatus,
        notes: quickNotes.trim() || undefined,
      })
      setEntries(prev => [added, ...prev])
      setQuickAdd('')
      setQuickNotes('')
      addToast({
        title: 'Idea recorded to Vault!',
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Failed to record idea',
        type: 'error',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete headcanon entry?')) return
    try {
      await headcanonService.delete(id)
      fetchHeadcanonsAndCharacters()
      addToast({
        title: 'Idea deleted',
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Failed to delete idea',
        type: 'error',
      })
    }
  }

  const [editingEntry, setEditingEntry] = useState<Headcanon | null>(null)
  
  return (
    <ToolsLayout
      title="Headcanon & Canon Tier Vault"
      description="Record, categorize, and differentiate between Official Canon, Headcanon, Fanon, and Brainstorm Ideas."
      icon={<Archive size={20} />}
    >
      <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6 pb-24 select-none">
        
        {/* Creation Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" /> Record New Universe Idea
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">Indexed Database Storage</span>
          </div>

          <form onSubmit={handleQuickAdd} className="space-y-3">
            <textarea 
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-medium"
              rows={2}
              placeholder="Describe your headcanon, theory, or plot idea..."
              value={quickAdd}
              onChange={e => setQuickAdd(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Canon Tier Status Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Canon Classification</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as CanonStatus)}
                  className="w-full h-9 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {CANON_STATUSES.map(s => (
                    <option key={s} value={s}>{CANON_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              {/* Linked Character Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Linked Character (Optional)</label>
                <select
                  value={selectedCharId}
                  onChange={(e) => setSelectedCharId(e.target.value)}
                  className="w-full h-9 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">-- Unlinked / General --</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!quickAdd.trim()}
                  className="w-full h-9 bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-40 rounded-xl font-bold text-xs hover:scale-[1.02] transition-transform shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={16} /> Save Idea
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0",
              filter === 'all'
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            )}
          >
            All Ideas ({entries.length})
          </button>

          {CANON_STATUSES.map(s => {
            const count = entries.filter(e => e.canon_status === s).length
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5",
                  filter === s
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                )}
              >
                <span>{CANON_STATUS_LABELS[s]}</span>
                <span className="opacity-60 font-mono text-[10px]">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse col-span-full" />
          ) : filtered.length === 0 ? (
             <div className="col-span-full mt-4">
               <EmptyState icon={<Archive size={28} />} title="Vault is currently empty" description="Type a new headcanon or theory in the form above to save it." />
             </div>
          ) : (
            filtered.map(entry => (
              <HeadcanonCard key={entry.id} entry={entry} characters={characters} onDelete={handleDelete} onEdit={setEditingEntry} />
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setEditingEntry(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Edit Vault Entry</h2>
            
            <textarea 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-slate-100 resize-none focus:outline-none" 
              rows={4} 
              value={editingEntry.content} 
              onChange={e => setEditingEntry({...editingEntry, content: e.target.value})}
            />

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Canon Tier</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                value={editingEntry.canon_status} 
                onChange={e => setEditingEntry({...editingEntry, canon_status: e.target.value as CanonStatus})}
              >
                {CANON_STATUSES.map(s => <option key={s} value={s}>{CANON_STATUS_LABELS[s]}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Linked Character</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                value={editingEntry.character_id || ''} 
                onChange={e => setEditingEntry({...editingEntry, character_id: e.target.value || null})}
              >
                <option value="">-- Unlinked / General --</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl" onClick={() => setEditingEntry(null)}>Cancel</button>
              <button className="px-5 py-2 text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xs" onClick={async () => {
                await headcanonService.update(editingEntry.id, {
                  content: editingEntry.content,
                  canon_status: editingEntry.canon_status,
                  character_id: editingEntry.character_id,
                })
                setEditingEntry(null)
                fetchHeadcanonsAndCharacters()
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </ToolsLayout>
  )
}

