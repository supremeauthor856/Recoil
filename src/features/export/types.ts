import type { Character as BaseCharacter, Verse, SubSeries } from '../../shared/types/database'
import type { WritingPiece, Chapter } from '../writing/types'
import type { CharacterRelationship } from '../relationships/types'
import type { NodeDatum, LinkDatum } from '../relationships/types'

type Character = BaseCharacter & Record<string, any>

export type ExportFormat =
  | 'txt'
  | 'md'
  | 'json'
  | 'yaml'
  | 'xml'
  | 'csv'
  | 'tsv'
  | 'html'
  | 'xhtml'
  | 'pdf'
  | 'epub'
  | 'rtf'
  | 'latex'
  | 'fountain'
  | 'fb2'
  | 'svg'
  | 'png'
  | 'zip'
  | 'sql'

export type ExportScope =
  | { type: 'character'; character: Character; relationships?: CharacterRelationship[] }
  | { type: 'writing'; piece: WritingPiece; chapters: Chapter[] }
  | { type: 'all-characters'; characters: Character[]; verse: Verse }
  | { type: 'all-writing'; pieces: WritingPiece[]; verse: Verse }
  | { type: 'verse'; verse: Verse; characters: Character[]; writing: WritingPiece[]; subSeries: SubSeries[] }
  | { type: 'relationship-web'; nodes: NodeDatum[]; links: LinkDatum[]; verse: Verse; svgRef: React.RefObject<SVGSVGElement | null> }

export interface FormatDefinition {
  id: ExportFormat
  label: string
  extension: string
  mimeType: string
  description: string
  icon: string           // Lucide icon name
  group: FormatGroup
  availableFor: ExportScope['type'][]
}

export type FormatGroup = 'document' | 'data' | 'ebook' | 'code' | 'image' | 'archive'

export const FORMAT_GROUPS: Record<FormatGroup, string> = {
  document: 'Documents',
  data: 'Data',
  ebook: 'Ebooks',
  code: 'Markup & Code',
  image: 'Images',
  archive: 'Archives',
}

export const FORMAT_DEFINITIONS: FormatDefinition[] = [
  {
    id: 'txt', label: 'Plain Text', extension: 'txt', mimeType: 'text/plain',
    description: 'Formatted text, readable everywhere',
    icon: 'FileText', group: 'document',
    availableFor: ['character','writing','all-characters','all-writing','verse'],
  },
  {
    id: 'md', label: 'Markdown', extension: 'md', mimeType: 'text/markdown',
    description: 'Structured markdown with headers and lists',
    icon: 'Hash', group: 'document',
    availableFor: ['character','writing','all-characters','verse'],
  },
  {
    id: 'html', label: 'HTML Page', extension: 'html', mimeType: 'text/html',
    description: 'Styled standalone web page',
    icon: 'Globe', group: 'document',
    availableFor: ['character','writing','verse'],
  },
  {
    id: 'pdf', label: 'PDF', extension: 'pdf', mimeType: 'application/pdf',
    description: 'Formatted PDF document',
    icon: 'FileBadge', group: 'document',
    availableFor: ['character','writing'],
  },
  {
    id: 'rtf', label: 'Rich Text (RTF)', extension: 'rtf', mimeType: 'application/rtf',
    description: 'Editable in Word, Pages, and most text editors',
    icon: 'FileEdit', group: 'document',
    availableFor: ['character','writing'],
  },
  {
    id: 'epub', label: 'EPUB', extension: 'epub', mimeType: 'application/epub+zip',
    description: 'Standard ebook format for Kindle, Apple Books, Kobo',
    icon: 'BookOpen', group: 'ebook',
    availableFor: ['writing'],
  },
  {
    id: 'fb2', label: 'FictionBook 2 (FB2)', extension: 'fb2', mimeType: 'application/x-fictionbook+xml',
    description: 'XML-based ebook format popular in Eastern Europe',
    icon: 'Book', group: 'ebook',
    availableFor: ['writing'],
  },
  {
    id: 'json', label: 'JSON', extension: 'json', mimeType: 'application/json',
    description: 'Machine-readable structured data',
    icon: 'Braces', group: 'data',
    availableFor: ['character','writing','all-characters','all-writing','verse'],
  },
  {
    id: 'csv', label: 'CSV', extension: 'csv', mimeType: 'text/csv',
    description: 'Spreadsheet rows for all characters',
    icon: 'Table', group: 'data',
    availableFor: ['all-characters','verse'],
  },
  {
    id: 'tsv', label: 'TSV', extension: 'tsv', mimeType: 'text/tab-separated-values',
    description: 'Tab-separated spreadsheet data',
    icon: 'Table2', group: 'data',
    availableFor: ['all-characters','verse'],
  },
  {
    id: 'yaml', label: 'YAML', extension: 'yaml', mimeType: 'text/yaml',
    description: 'Human-readable structured configuration format',
    icon: 'AlignLeft', group: 'data',
    availableFor: ['character','writing','verse'],
  },
  {
    id: 'xml', label: 'XML', extension: 'xml', mimeType: 'application/xml',
    description: 'Structured XML document',
    icon: 'Code2', group: 'code',
    availableFor: ['character','writing','verse'],
  },
  {
    id: 'xhtml', label: 'XHTML', extension: 'xhtml', mimeType: 'application/xhtml+xml',
    description: 'Well-formed HTML as XML',
    icon: 'FileCode', group: 'code',
    availableFor: ['character','writing'],
  },
  {
    id: 'latex', label: 'LaTeX', extension: 'tex', mimeType: 'application/x-latex',
    description: 'LaTeX typesetting source for academic or print use',
    icon: 'Sigma', group: 'code',
    availableFor: ['writing','character'],
  },
  {
    id: 'fountain', label: 'Fountain', extension: 'fountain', mimeType: 'text/plain',
    description: 'Screenplay format compatible with Final Draft and Highland',
    icon: 'Film', group: 'code',
    availableFor: ['writing'],
  },
  {
    id: 'png', label: 'Character Card (PNG)', extension: 'png', mimeType: 'image/png',
    description: 'Shareable visual character card',
    icon: 'Image', group: 'image',
    availableFor: ['character'],
  },
  {
    id: 'svg', label: 'Relationship Web (SVG)', extension: 'svg', mimeType: 'image/svg+xml',
    description: 'Scalable vector export of the relationship graph',
    icon: 'Network', group: 'image',
    availableFor: ['relationship-web'],
  },
  {
    id: 'zip', label: 'ZIP Bundle', extension: 'zip', mimeType: 'application/zip',
    description: 'Archive containing all content in multiple formats',
    icon: 'Archive', group: 'archive',
    availableFor: ['verse','all-characters','all-writing'],
  },
  {
    id: 'sql', label: 'SQL Backup', extension: 'sql', mimeType: 'text/plain',
    description: 'Database INSERT statements for full data backup',
    icon: 'Database', group: 'archive',
    availableFor: ['verse'],
  },
]
