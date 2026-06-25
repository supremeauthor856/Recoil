import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Archive, Plus, X, MoreHorizontal } from 'lucide-react'
import { ToolsLayout } from './ToolsLayout'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { headcanonService } from '../../../services/headcanonService'
import type { Headcanon, CanonStatus } from '../types'
import { CANON_STATUSES, CANON_STATUS_LABELS, CANON_STATUS_COLORS } from '../types'
import { cn } from '../../../shared/utils/cn'
import { useUIStore } from '../../../store/uiStore'

function formatRelativeTime(ts: number) {
  return new Date(ts).toLocaleString()
}

function HeadcanonCard({ entry, onEdit, onDelete }: { entry: Headcanon, onEdit: (e: Headcanon) => void, onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="bg-[var(--color-bg-elevated)] p-4 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] transition-colors relative group">
      <div className="flex justify-between items-start mb-2">
        <span 
          className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider"
          style={{ color: CANON_STATUS_COLORS[entry.canon_status], backgroundColor: `${CANON_STATUS_COLORS[entry.canon_status]}10` }}
        >
          {CANON_STATUS_LABELS[entry.canon_status]}
        </span>
        
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--color-bg-hover)] rounded">
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 w-32 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded shadow-xl z-20 overflow-hidden flex flex-col text-xs" onMouseLeave={() => setMenuOpen(false)}>
              <button className="text-left px-3 py-2 hover:bg-[var(--color-bg-hover)]" onClick={() => { onEdit(entry); setMenuOpen(false) }}>Edit</button>
              <button className="text-left px-3 py-2 hover:bg-red-500/10 text-red-500" onClick={() => { onDelete(entry.id); setMenuOpen(false) }}>Delete</button>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm mt-1 mb-2 whitespace-pre-wrap">{entry.content}</p>
      {entry.notes && <p className="text-xs text-[var(--color-text-muted)] italic leading-snug">{entry.notes}</p>}
      <div className="text-[10px] text-[var(--color-text-muted)] text-right mt-2">{formatRelativeTime(entry.created_at)}</div>
    </div>
  )
}

export function HeadcanonVaultPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  const addToast = useUIStore(state => state.addToast)
  
  const [entries, setEntries] = useState<Headcanon[]>([])
  const [loading, setLoading] = useState(true)
  
  const [filter, setFilter] = useState<'all' | CanonStatus>('all')
  const [quickAdd, setQuickAdd] = useState('')

  const fetchHeadcanons = async () => {
    try {
      const data = await headcanonService.getAll(verseId)
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHeadcanons() }, [verseId])

  const filtered = useMemo(() => filter === 'all' ? entries : entries.filter(e => e.canon_status === filter), [entries, filter])

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAdd.trim()) return
    const content = quickAdd.trim()
    setQuickAdd('')
    try {
      const added = await headcanonService.create({ verse_id: verseId, content })
      setEntries(prev => [added, ...prev])
      addToast({
        title: 'Headcanon added successfully',
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Failed to add headcanon',
        type: 'error',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete headcanon?')) return
    const entry = entries.find(e => e.id === id)
    const summary = entry ? (entry.content.length > 30 ? entry.content.slice(0, 30) + '...' : entry.content) : 'Headcanon'
    try {
      await headcanonService.delete(id)
      fetchHeadcanons()
      addToast({
        title: `Deleted Headcanon '${summary}'`,
        type: 'success',
      })
    } catch {
      addToast({
        title: `Failed to delete Headcanon '${summary}'`,
        type: 'error',
      })
    }
  }

  const [editingEntry, setEditingEntry] = useState<Headcanon | null>(null)
  
  return (
    <ToolsLayout
      title="Headcanon Vault"
      description="Store, categorize, and track ideas that might become canon."
      icon={<Archive size={20} />}
    >
      <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6 pb-24">
        
        {/* Quick Add */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input 
            className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg px-4 focus:outline-none focus:border-[var(--color-accent-primary)] text-sm"
            placeholder="Type a quick headcanon idea and press Enter..."
            value={quickAdd}
            onChange={e => setQuickAdd(e.target.value)}
          />
          <button type="submit" disabled={!quickAdd.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-1.5">
            <Plus size={16} /> Add
          </button>
        </form>

        {/* Filters */}
        <div className="flex bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-1 w-fit">
          <button onClick={() => setFilter('all')} className={cn("px-3 py-1.5 text-xs font-medium rounded-md", filter === 'all' ? "bg-[var(--color-bg-base)] shadow-sm" : "text-[var(--color-text-muted)]")}>All</button>
          {CANON_STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={cn("px-3 py-1.5 text-xs font-medium rounded-md", filter === s ? "bg-[var(--color-bg-base)] shadow-sm" : "text-[var(--color-text-muted)]")}>
              {CANON_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="h-24 bg-[var(--color-bg-elevated)] rounded-xl animate-pulse" />
          ) : filtered.length === 0 ? (
             <div className="col-span-full mt-4">
               <EmptyState icon={<Archive size={24} />} title="No headcanons here" description="Add your first idea above." />
             </div>
          ) : (
            filtered.map(entry => (
              <HeadcanonCard key={entry.id} entry={entry} onDelete={handleDelete} onEdit={setEditingEntry} />
            ))
          )}
        </div>
      </div>

      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingEntry(null)} />
          <div className="relative w-full max-w-sm bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-2xl shadow-xl flex flex-col p-5">
            <h2 className="text-sm font-bold mb-4">Edit Headcanon</h2>
            <textarea 
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded p-2 text-sm mb-3 resize-none focus:outline-none focus:border-indigo-500" 
              rows={4} 
              value={editingEntry.content} 
              onChange={e => setEditingEntry({...editingEntry, content: e.target.value})}
            />
            <select 
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded p-2 text-sm mb-4 focus:outline-none focus:border-indigo-500"
              value={editingEntry.canon_status} 
              onChange={e => setEditingEntry({...editingEntry, canon_status: e.target.value as CanonStatus})}
            >
              {CANON_STATUSES.map(s => <option key={s} value={s}>{CANON_STATUS_LABELS[s]}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs hover:bg-[var(--color-bg-hover)] rounded" onClick={() => setEditingEntry(null)}>Cancel</button>
              <button className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded font-medium" onClick={async () => {
                await headcanonService.update(editingEntry.id, { content: editingEntry.content, canon_status: editingEntry.canon_status })
                setEditingEntry(null)
                fetchHeadcanons()
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </ToolsLayout>
  )
}
