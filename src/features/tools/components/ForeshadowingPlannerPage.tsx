import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Eye, Plus } from 'lucide-react'
import { ToolsLayout } from './ToolsLayout'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { ForeshadowingCard } from './ForeshadowingCard'
import { ForeshadowingCreateModal } from './ForeshadowingCreateModal'
import { foreshadowingService } from '../../../services/foreshadowingService'
import type { ForeshadowingEntry, ForeshadowingStatus } from '../types'
import { FORESHADOWING_STATUS_COLORS } from '../types'
import { cn } from '../../../shared/utils/cn'
import { useUIStore } from '../../../store/uiStore'

export function ForeshadowingPlannerPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  const addToast = useUIStore(state => state.addToast)
  
  const [entries, setEntries] = useState<ForeshadowingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | ForeshadowingStatus>('all')
  
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ForeshadowingEntry | undefined>()

  const fetchEntries = async () => {
    try {
      const data = await foreshadowingService.getAll(verseId)
      setEntries(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [verseId])

  const stats = useMemo(() => {
    return {
      planted: entries.filter(e => e.status === 'planted').length,
      pending: entries.filter(e => e.status === 'pending-payoff').length,
      resolved: entries.filter(e => e.status === 'resolved').length,
    }
  }, [entries])

  const filteredEntries = useMemo(() => {
    if (filterStatus === 'all') return entries
    return entries.filter(e => e.status === filterStatus)
  }, [entries, filterStatus])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this foreshadowing entry?')) return
    const entry = entries.find(e => e.id === id)
    const name = entry?.description || 'Foreshadowing Entry'
    try {
      await foreshadowingService.delete(id)
      fetchEntries()
      addToast({
        title: `Deleted Foreshadowing Entry '${name}'`,
        type: 'success',
      })
    } catch (err) {
      addToast({
        title: `Failed to delete Foreshadowing Entry '${name}'`,
        type: 'error',
      })
    }
  }

  const handleStatusChange = async (id: string, status: ForeshadowingStatus) => {
    try {
      await foreshadowingService.update(id, { status })
      fetchEntries()
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const openCreate = () => {
    setEditingEntry(undefined)
    setCreateModalOpen(true)
  }

  const openEdit = (entry: ForeshadowingEntry) => {
    setEditingEntry(entry)
    setCreateModalOpen(true)
  }

  // Define status filter configs
  const filters = [
    { value: 'all', label: 'All', count: entries.length, color: 'var(--color-text-secondary)' },
    { value: 'planted', label: 'Planted', count: stats.planted, color: FORESHADOWING_STATUS_COLORS['planted'] },
    { value: 'pending-payoff', label: 'Pending Payoff', count: stats.pending, color: FORESHADOWING_STATUS_COLORS['pending-payoff'] },
    { value: 'resolved', label: 'Resolved', count: stats.resolved, color: FORESHADOWING_STATUS_COLORS['resolved'] }
  ] as const

  return (
    <ToolsLayout
      title="Foreshadowing Planner"
      description="Track planted seeds and their payoffs across your story."
      icon={<Eye size={20} />}
    >
      <div className="p-6 flex flex-col gap-5 max-w-4xl mx-auto pb-24">
        
        {/* STATS ROW */}
        <div className="flex flex-row gap-4 overflow-x-auto scrollbar-none">
          {filters.slice(1).map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value as any)}
              className="bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] transition-colors rounded-xl border border-[var(--color-border-subtle)] px-4 py-3 flex flex-row items-center gap-3 cursor-pointer shrink-0"
              style={{
                borderColor: filterStatus === f.value ? f.color : undefined,
                backgroundColor: filterStatus === f.value ? `${f.color}15` : undefined,
              }}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: f.color }} 
              />
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[12px] text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">{f.label}</span>
                <span className="text-xl font-bold text-[var(--color-text-primary)] leading-none">{f.count}</span>
              </div>
            </button>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-row items-center gap-2 flex-wrap">
          <div className="flex flex-row bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-1">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value as any)}
                className={cn(
                  "px-3 py-1.5 text-[12px] font-medium rounded-md transition-all",
                  filterStatus === f.value 
                    ? "bg-[var(--color-bg-base)] text-[var(--color-text-primary)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          <div className="flex-1" />
          
          <button
            onClick={openCreate}
            className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md select-none border-t border-white/10"
          >
            <Plus size={14} />
            <span>Add Entry</span>
          </button>
        </div>

        {/* LIST */}
        <div className="flex flex-col gap-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[120px] bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)] animate-pulse" />
            ))
          ) : entries.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={<Eye size={24} />}
                title="No foreshadowing tracked yet"
                description="Plant a seed to get started."
                action={{ label: "Add Entry", onClick: openCreate }}
              />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-[14px] text-[var(--color-text-secondary)]">
              No entries match this filter. <button className="text-indigo-500 hover:underline" onClick={() => setFilterStatus('all')}>Clear filter</button>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <ForeshadowingCard
                key={entry.id}
                entry={entry}
                onEdit={openEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      </div>

      <ForeshadowingCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        verseId={verseId}
        onCreated={fetchEntries}
        existingEntry={editingEntry}
      />
    </ToolsLayout>
  )
}
