import { useState } from 'react'
import type { ExportFormat, ExportScope } from '../types'
import { exportCharacter } from '../exporters/characterExporter'
import { exportWriting } from '../exporters/writingExporter'
import { exportVerse } from '../exporters/verseExporter'
import { exportRelationshipWebSvg } from '../exporters/imageCardExporter'

interface UseExportReturn {
  isExporting: boolean
  error: string | null
  executeExport: (format: ExportFormat, scope: ExportScope) => Promise<boolean>
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeExport = async (format: ExportFormat, scope: ExportScope): Promise<boolean> => {
    setIsExporting(true)
    setError(null)
    try {
      if (scope.type === 'character') {
        await exportCharacter(scope.character, format)
      } else if (scope.type === 'writing') {
        await exportWriting(scope.piece, scope.chapters, format)
      } else if (scope.type === 'verse') {
        await exportVerse(scope.verse, scope.characters, scope.writing, format)
      } else if (scope.type === 'all-characters') {
        // we map to verse exporter
        await exportVerse(scope.verse, scope.characters, [], format)
      } else if (scope.type === 'all-writing') {
        // we map to verse exporter
        await exportVerse(scope.verse, [], scope.pieces, format)
      } else if (scope.type === 'relationship-web') {
        if (format === 'svg') {
          exportRelationshipWebSvg(scope.svgRef, scope.verse.name)
        } else {
          throw new Error('Unsupported format for relationship web')
        }
      }
      return true
    } catch (e: any) {
      console.error('Export failed:', e)
      setError(e.message || 'An error occurred during export')
      return false
    } finally {
      setIsExporting(false)
    }
  }

  return { isExporting, error, executeExport }
}
