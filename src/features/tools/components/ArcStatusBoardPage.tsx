import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Trello, Plus, GripVertical, CheckCircle2, ChevronRight, Hash } from 'lucide-react'
import { ToolsLayout } from './ToolsLayout'
import { storyArcService } from '../../../services/storyArcService'
import type { StoryArc, ArcStatus } from '../types'
import { ARC_STATUSES, ARC_STATUS_LABELS, ARC_STATUS_COLORS } from '../types'
import { cn } from '../../../shared/utils/cn'
import { ArcCreateModal } from './ArcCreateModal'
import { useUIStore } from '../../../store/uiStore'

function ArcCard({ arc, onEdit, onDelete }: { arc: StoryArc, onEdit: (a: StoryArc) => void, onDelete: (id: string) => void }) {
  return (
    <div 
      className="bg-[var(--color-bg-base)] rounded-lg border border-[var(--color-border-subtle)] p-3 cursor-grab active:cursor-grabbing hover:border-[var(--color-border-default)] transition-colors group flex flex-col gap-2 relative shadow-sm"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', arc.id)
        // subtle opacity change on drag start
        setTimeout(() => (e.target as HTMLElement).classList.add('opacity-50'), 0)
      }}
      onDragEnd={(e) => {
        (e.target as HTMLElement).classList.remove('opacity-50')
      }}
    >
      <div className="flex flex-row items-start justify-between gap-2">
        <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)] leading-tight">{arc.title}</h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-[-2px] mr-[-2px]">
          <button 
            className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] px-2 py-1 rounded hover:bg-[var(--color-bg-elevated)]"
            onClick={() => onEdit(arc)}
          >
            Edit
          </button>
        </div>
      </div>
      
      {arc.description && (
        <p className="text-[12px] text-[var(--color-text-secondary)] line-clamp-3 leading-snug">
          {arc.description}
        </p>
      )}

      {arc.sub_series_id && (
        <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] mt-1">
          <Hash size={10} /> Sub-series Link
        </div>
      )}
    </div>
  )
}

export function ArcStatusBoardPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  const addToast = useUIStore(state => state.addToast)
  
  const [arcs, setArcs] = useState<StoryArc[]>([])
  const [loading, setLoading] = useState(true)
  
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingArc, setEditingArc] = useState<StoryArc | undefined>()

  const fetchArcs = async () => {
    try {
      const data = await storyArcService.getAll(verseId)
      setArcs(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArcs() }, [verseId])

  const lists = useMemo(() => {
    const map = new Map<ArcStatus, StoryArc[]>()
    ARC_STATUSES.forEach(s => map.set(s, []))
    arcs.forEach(a => map.get(a.status)?.push(a))
    // sort lists by order
    for (const [s, list] of map.entries()) {
      map.set(s, list.sort((a, b) => a.sort_order - b.sort_order)) // Note: sorting not fully impl in DB
    }
    return map
  }, [arcs])

  const handleDrop = async (e: React.DragEvent, newStatus: ArcStatus) => {
    e.preventDefault()
    const arcId = e.dataTransfer.getData('text/plain')
    if (!arcId) return

    // Opt update
    const arc = arcs.find(a => a.id === arcId)
    if (!arc || arc.status === newStatus) return

    const oldStatus = arc.status
    setArcs(prev => prev.map(a => a.id === arcId ? { ...a, status: newStatus } : a))

    try {
      await storyArcService.updateStatus(arcId, newStatus)
    } catch {
      setArcs(prev => prev.map(a => a.id === arcId ? { ...a, status: oldStatus } : a))
      alert('Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story arc?')) return
    const arc = arcs.find(a => a.id === id)
    const name = arc?.title || 'Story Arc'
    try {
      await storyArcService.delete(id)
      fetchArcs()
      addToast({
        title: `Deleted Story Arc '${name}'`,
        type: 'success',
      })
    } catch {
      addToast({
        title: `Failed to delete Story Arc '${name}'`,
        type: 'error',
      })
    }
  }

  return (
    <ToolsLayout
      title="Arc Status Board"
      description="Kanban board to track story arcs through drafting."
      icon={<Trello size={20} />}
      actions={
        <button
          onClick={() => { setEditingArc(undefined); setCreateModalOpen(true) }}
          className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus size={14} /> New Arc
        </button>
      }
    >
      <div className="p-6 h-full flex flex-row gap-4 overflow-x-auto items-start pb-24 scrollbar-custom">
        {ARC_STATUSES.map(status => {
          const list = lists.get(status) || []
          return (
            <div 
              key={status}
              className="flex-shrink-0 w-80 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl flex flex-col max-h-full"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, status)}
            >
              <div className="p-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ARC_STATUS_COLORS[status] }} />
                  <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tracking-wide uppercase">{ARC_STATUS_LABELS[status]}</span>
                </div>
                <span className="text-[11px] font-medium text-[var(--color-bg-base)] bg-[var(--color-text-muted)] w-5 h-5 flex items-center justify-center rounded-full">
                  {list.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 scrollbar-custom min-h-[150px]">
                {list.map(arc => (
                  <ArcCard 
                    key={arc.id} 
                    arc={arc} 
                    onEdit={(a) => { setEditingArc(a); setCreateModalOpen(true) }} 
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <ArcCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        verseId={verseId}
        onCreated={fetchArcs}
        existingArc={editingArc}
      />
    </ToolsLayout>
  )
}
