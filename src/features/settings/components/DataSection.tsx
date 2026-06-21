import React, { useState, useEffect, useRef } from 'react'
import { Database, Download, Upload, AlertTriangle, RefreshCcw, Check, Sparkles } from 'lucide-react'
import { db } from '../../../services/db'
import { useSettingsStore } from '../../../store/settingsStore'
import { useUIStore } from '../../../store/uiStore'
import { Button } from '../../../shared/components/ui/Button'

interface DBMetrics {
  versesCount: number
  charactersCount: number
  relationshipsCount: number
  piecesCount: number
  chaptersCount: number
  guidelinesCount: number
  storageUsedBytes: number
  storageQuotaBytes: number
}

export const DataSection: React.FC = () => {
  const [metrics, setMetrics] = useState<DBMetrics>({
    versesCount: 0,
    charactersCount: 0,
    relationshipsCount: 0,
    piecesCount: 0,
    chaptersCount: 0,
    guidelinesCount: 0,
    storageUsedBytes: 0,
    storageQuotaBytes: 0,
  })
  const [calculating, setCalculating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addToast = useUIStore((state) => state.addToast)

  const calculateMetrics = async () => {
    setCalculating(true)
    try {
      const [verses, characters, rels, pieces, chapters, guidelines] = await Promise.all([
        db.verses.count(),
        db.characters.count(),
        db.character_relationships.count(),
        db.writing_pieces.count(),
        db.chapters.count(),
        db.writing_guidelines.count(),
      ])

      let used = 0
      let quota = 0
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate()
        used = estimate.usage || 0
        quota = estimate.quota || 0
      }

      setMetrics({
        versesCount: verses,
        charactersCount: characters,
        relationshipsCount: rels,
        piecesCount: pieces,
        chaptersCount: chapters,
        guidelinesCount: guidelines,
        storageUsedBytes: used,
        storageQuotaBytes: quota,
      })
    } catch (err) {
      console.error('Failed to calculate DB state', err)
    } finally {
      setCalculating(false)
    }
  }

  useEffect(() => {
    calculateMetrics()
  }, [])

  // BACKUP EXPORT
  const handleExportBackup = async () => {
    try {
      // Gather all local database data
      const [verses, sub_series, characters, rels, pieces, chapters, guidelines] = await Promise.all([
        db.verses.toArray(),
        db.sub_series.toArray(),
        db.characters.toArray(),
        db.character_relationships.toArray(),
        db.writing_pieces.toArray(),
        db.chapters.toArray(),
        db.writing_guidelines.toArray(),
      ])

      const backupObj = {
        recoilBackup: true,
        backupVersion: 1,
        timestamp: new Date().toISOString(),
        db: {
          verses,
          sub_series,
          characters,
          character_relationships: rels,
          writing_pieces: pieces,
          chapters,
          writing_guidelines: guidelines,
        },
        settings: useSettingsStore.getState(),
      }

      const jsonStr = JSON.stringify(backupObj, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      const formattedDate = new Date().toISOString().split('T')[0]
      link.href = url
      link.download = `recoil_universe_backup_${formattedDate}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast({
        title: 'Backup downloaded successfully',
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: `Failed to generate backup: ${err.message || String(err)}`,
        type: 'error',
      })
    }
  }

  // BACKUP IMPORT
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError('')
    setImporting(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const backup = JSON.parse(text)

        if (!backup || backup.recoilBackup !== true) {
          throw new Error('Invalid backup file structure: missing recoilBackup signature.')
        }

        // Schema validation
        if (!backup.db || typeof backup.db !== 'object') {
          throw new Error('Invalid backup schema: db collection is missing.')
        }

        const confirmRestore = window.confirm(
          'WARNING: Importing this universe backup will overwrite all existing local verses, characters, writing pieces, guidelines, and settings. Are you sure you want to proceed?'
        )
        if (!confirmRestore) {
          setImporting(false)
          return
        }

        // Clear local database tables
        await Promise.all([
          db.verses.clear(),
          db.sub_series.clear(),
          db.characters.clear(),
          db.character_relationships.clear(),
          db.writing_pieces.clear(),
          db.chapters.clear(),
          db.writing_guidelines.clear(),
        ])

        // Bulk seed database
        await Promise.all([
          backup.db.verses ? db.verses.bulkAdd(backup.db.verses) : Promise.resolve(),
          backup.db.sub_series ? db.sub_series.bulkAdd(backup.db.sub_series) : Promise.resolve(),
          backup.db.characters ? db.characters.bulkAdd(backup.db.characters) : Promise.resolve(),
          backup.db.character_relationships
            ? db.character_relationships.bulkAdd(backup.db.character_relationships)
            : Promise.resolve(),
          backup.db.writing_pieces
            ? db.writing_pieces.bulkAdd(backup.db.writing_pieces)
            : Promise.resolve(),
          backup.db.chapters ? db.chapters.bulkAdd(backup.db.chapters) : Promise.resolve(),
          backup.db.writing_guidelines
            ? db.writing_guidelines.bulkAdd(backup.db.writing_guidelines)
            : Promise.resolve(),
        ])

        // Restore settings Store values safely
        if (backup.settings) {
          // Remove methods if saved in backup
          const sanitizedSettings = { ...backup.settings }
          delete sanitizedSettings.setProviderConfig
          delete sanitizedSettings.setTaskOverride
          delete sanitizedSettings.setTheme
          delete sanitizedSettings.setFontSize
          delete sanitizedSettings.addCustomProvider
          delete sanitizedSettings.removeCustomProvider
          delete sanitizedSettings.updateCustomProvider

          useSettingsStore.setState(sanitizedSettings)
        }

        addToast({
          title: 'Database backup imported successfully',
          type: 'success',
        })
        
        // Recalculate parameters
        await calculateMetrics()
      } catch (err: any) {
        setImportError(err.message || 'Error occurred during backup processing.')
        addToast({
          title: 'Backup import failed',
          type: 'error',
        })
      } finally {
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }

    reader.onerror = () => {
      setImportError('Failed to read the backup JSON file.')
      setImporting(false)
    }

    reader.readAsText(file)
  }

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="flex flex-col gap-6">
      {/* STORAGE OVERVIEW */}
      <div>
        <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
          <Database size={16} className="text-[var(--color-accent-primary)]" />
          Universe Databases & Local Storage
        </h3>
        <p className="text-[12px] text-[var(--color-text-secondary)] mb-4">
          All narrative pieces, verses, character relations, and guidelines are saved securely inside your browser's IndexedDB storage pool.
        </p>

        {/* Bento Grid counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-[var(--color-bg-elevated)] p-4 border border-[var(--color-border-subtle)] rounded-xl flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-[var(--color-text-muted)] font-mono">
              Verses Seeding
            </span>
            <span className="text-[18px] font-bold text-[var(--color-text-primary)]">
              {metrics.versesCount}
            </span>
          </div>

          <div className="bg-[var(--color-bg-elevated)] p-4 border border-[var(--color-border-subtle)] rounded-xl flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-[var(--color-text-muted)] font-mono">
              Character Profiles
            </span>
            <span className="text-[18px] font-bold text-[var(--color-text-primary)]">
              {metrics.charactersCount}
            </span>
          </div>

          <div className="bg-[var(--color-bg-elevated)] p-4 border border-[var(--color-border-subtle)] rounded-xl flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-[var(--color-text-muted)] font-mono">
              Writing Pieces
            </span>
            <span className="text-[18px] font-bold text-[var(--color-text-primary)]">
              {metrics.piecesCount}
            </span>
          </div>

          <div className="bg-[var(--color-bg-elevated)] p-4 border border-[var(--color-border-subtle)] rounded-xl flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-[var(--color-text-muted)] font-mono">
              Guidelines Added
            </span>
            <span className="text-[18px] font-bold text-[var(--color-text-primary)]">
              {metrics.guidelinesCount}
            </span>
          </div>
        </div>

        {/* Storage footprint bar */}
        <div className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] p-4 rounded-xl max-w-xl">
          <div className="flex justify-between items-center text-[11px] font-mono text-[var(--color-text-secondary)] mb-2">
            <span>IndexDB footprint: {formatSize(metrics.storageUsedBytes)}</span>
            <span>Allocated Quota: {formatSize(metrics.storageQuotaBytes)} (Flexible)</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent-primary)] rounded-full transition-all duration-300"
              style={{
                width: `${
                  metrics.storageQuotaBytes > 0
                    ? Math.max(1, (metrics.storageUsedBytes / metrics.storageQuotaBytes) * 100)
                    : 1
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* REFRESH & BACKUP OPERATIONS */}
      <div className="border-t border-[var(--color-border-subtle)]/60 pt-6">
        <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1">
          Backup, Export & Portability
        </h3>
        <p className="text-[12px] text-[var(--color-text-secondary)] mb-4 leading-relaxed">
          Establish manual checkpoints or migrate your writing universe safely across workspace browsers by exporting and importing backup datasets.
        </p>

        <div className="flex flex-wrap gap-2">
          {/* Refresh metrics button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={calculateMetrics}
            disabled={calculating}
            className="gap-1.5 px-3 h-8"
          >
            <RefreshCcw size={12} className={calculating ? 'animate-spin' : ''} />
            Refresh Metrics
          </Button>

          {/* Export backup button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportBackup}
            className="gap-1.5 px-3 h-8 text-[var(--color-text-primary)]"
          >
            <Download size={12} />
            Backup Database (.JSON)
          </Button>

          {/* Import backup trigger */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="gap-1.5 px-3 h-8 text-[var(--color-text-accent)] hover:bg-[var(--color-accent-primary-dim)]/50"
          >
            <Upload size={12} />
            {importing ? 'Restoring...' : 'Import Backup'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </div>

        {/* Error warning notification state */}
        {importError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-[var(--color-error)] p-3 rounded-md flex items-center gap-2 text-[11px] mt-4">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{importError}</span>
          </div>
        )}
      </div>
    </div>
  )
}
