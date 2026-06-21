import JSZip from 'jszip'
import * as yaml from 'js-yaml'
import { downloadBlob, slugify, csvEscape } from '../utils/downloadHelper'
import { exportCharacterMd } from './characterExporter'
import type { Verse, SubSeries, Character as BaseCharacter } from '../../../shared/types/database'
import type { WritingPiece } from '../../writing/types'
import type { ExportFormat } from '../types'

type Character = BaseCharacter & Record<string, any>

async function buildCharacterMarkdown(char: Character): Promise<string> {
  return exportCharacterMd(char)
}

export async function exportVerse(
  verse: Verse,
  characters: Character[],
  writing: WritingPiece[],
  format: ExportFormat
): Promise<void> {
  const base = slugify(verse.name)

  switch (format) {
    case 'json': {
      downloadBlob(
        `${base}-backup.json`,
        JSON.stringify({ verse, characters, writing }, null, 2),
        'application/json'
      )
      break
    }

    case 'csv': {
      const headers = [
        'Name','Pronouns','Age','Species','Occupation',
        'Narrative Role','Arc Stage','Alignment','Aesthetic Vibe','Profile Completion'
      ]
      const rows = characters.map(c => [
        c.name, c.pronouns, c.age, c.species, c.occupation,
        c.narrative_role, c.character_arc_stage, c.alignment,
        c.aesthetic_vibe, String(c.profile_completion) + '%',
      ].map(csvEscape).join(','))
      downloadBlob(
        `${base}-characters.csv`,
        [headers.join(','), ...rows].join('\n'),
        'text/csv'
      )
      break
    }

    case 'tsv': {
      const headers = ['Name','Pronouns','Age','Species','Occupation','Narrative Role','Arc Stage']
      const rows = characters.map(c => [
        c.name, c.pronouns ?? '', c.age ?? '', c.species ?? '',
        c.occupation ?? '', c.narrative_role ?? '', c.character_arc_stage ?? '',
      ].join('\t'))
      downloadBlob(
        `${base}-characters.tsv`,
        [headers.join('\t'), ...rows].join('\n'),
        'text/tab-separated-values'
      )
      break
    }

    case 'yaml':
      downloadBlob(`${base}.yaml`, yaml.dump({ verse, characters, writing }), 'text/yaml')
      break

    case 'sql': {
      // Basic fallback since offline sqlite doesn't easily map to an arbitrary remote API endpoint in this context.
      // Alternatively, we construct a dump of what we have.
      const lines: string[] = [
        '-- Recoil Database Backup',
        `-- Exported: ${new Date().toISOString()}`,
        '-- Note: Manual client-side export may not cover deep nested relationship graph links.\n',
      ]
      // Characters
      for (const char of characters) {
        lines.push(`INSERT OR REPLACE INTO characters (id, name, verse_id) VALUES ('${char.id}', '${char.name.replace(/'/g, "''")}', '${verse.id}');`)
      }
      downloadBlob(`${base}-backup.sql`, lines.join('\n'), 'text/plain')
      break
    }

    case 'zip': {
      const zip = new JSZip()
      const folder = zip.folder(base) as JSZip

      // Characters as markdown
      const charsFolder = folder.folder('characters') as JSZip
      for (const char of characters) {
        charsFolder.file(`${slugify(char.name)}.md`, (await buildCharacterMarkdown(char)))
      }

      // Writing as TXT
      const writingFolder = folder.folder('writing') as JSZip
      for (const piece of writing) {
        const { htmlToPlainText } = await import('../utils/htmlToText')
        writingFolder.file(
          `${slugify(piece.title)}.txt`,
          `${piece.title}\n${'='.repeat(piece.title.length)}\n\n${piece.summary ? piece.summary + '\n\n' : ''}${htmlToPlainText(piece.content ?? '')}`
        )
      }

      folder.file(`${base}.json`, JSON.stringify({ verse, characters, writing }, null, 2))

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
      downloadBlob(`${base}-export.zip`, blob, 'application/zip')
      break
    }

    default:
      console.warn(`Verse export format not implemented: ${format}`)
  }
}
