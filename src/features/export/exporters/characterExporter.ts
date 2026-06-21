import JSZip from 'jszip'
import * as yaml from 'js-yaml'
import { downloadBlob, getExportFilename, csvEscape, xmlEscape, triggerPrintToPDF, slugify } from '../utils/downloadHelper'
import { buildHTMLPage, htmlToXHTML } from '../utils/htmlTemplates'
import type { Character as BaseCharacter } from '../../../shared/types/database'
import type { CharacterRelationship } from '../../relationships/types'
import type { ExportFormat } from '../types'
import { FORMAT_DEFINITIONS } from '../types'
import { exportCharacterCardPng } from './imageCardExporter'

type Character = BaseCharacter & Record<string, any>

// Helper: flatten character data with arrays joined
function flattenCharacter(char: Character): Record<string, string> {
  const arrayFields = [
    'aliases','personality_traits','likes','dislikes','fears','desires',
    'habits','quirks','defense_mechanisms','contradictions','affiliations',
    'notable_quotes','tags'
  ]
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(char)) {
    if (k.startsWith('_')) continue
    if (arrayFields.includes(k)) {
      result[k] = Array.isArray(v) ? (v as string[]).join('; ') : ''
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      result[k] = String(v)
    } else {
      result[k] = (v as string | null) ?? ''
    }
  }
  return result
}

// Build character body HTML (used for both HTML export and PDF)
function buildCharacterHtml(char: Character): string {
  const arr = (v: string[] | null | undefined) => (v ?? []).filter(Boolean)
  const field = (label: string, value: string | null | undefined) =>
    value ? `<div class="label">${label}</div><div class="value">${xmlEscape(value)}</div>` : ''
  const list = (label: string, items: string[]) =>
    items.length
      ? `<h3>${label}</h3><ul class="list-items">${items.map(i => `<li>${xmlEscape(i)}</li>`).join('')}</ul>`
      : ''

  return `
<h1>${xmlEscape(char.name)}</h1>
${char.pronouns ? `<span class="badge">${xmlEscape(char.pronouns)}</span>` : ''}
${char.species ? `<span class="badge">${xmlEscape(char.species)}</span>` : ''}
${char.narrative_role ? `<span class="badge">${xmlEscape(char.narrative_role)}</span>` : ''}
${char.character_arc_stage ? `<span class="badge">${xmlEscape(char.character_arc_stage)}</span>` : ''}
${char.aesthetic_vibe ? `<p style="font-style:italic;color:#8e8ea8;margin-top:8px;">${xmlEscape(char.aesthetic_vibe)}</p>` : ''}

<div class="section">
<h2>Identity</h2>
<div class="field-grid">
${field('Full Name', char.full_name)}
${field('Age', char.age ? (char.age_note ? `${char.age} (${char.age_note})` : char.age) : null)}
${field('Species', char.species)}
${field('Nationality', char.nationality)}
${field('Occupation', char.occupation)}
</div>
${arr(char.aliases).length ? `<div class="label">Also Known As</div><div class="value">${arr(char.aliases).map(xmlEscape).join(', ')}</div>` : ''}
</div>

${char.appearance_notes || char.hair_color || char.eye_color ? `
<div class="section">
<h2>Appearance</h2>
<div class="field-grid">
${field('Height', char.height)}
${field('Weight', char.weight)}
${field('Hair', char.hair_color && char.hair_style ? `${char.hair_color}, ${char.hair_style}` : (char.hair_color || char.hair_style || null))}
${field('Eyes', char.eye_color)}
${field('Skin', char.skin_tone)}
${field('Build', char.body_type)}
</div>
${field('Distinguishing Features', char.distinguishing_features)}
${field('Style', char.style_and_fashion)}
${char.appearance_notes ? `<p>${xmlEscape(char.appearance_notes)}</p>` : ''}
</div>
` : ''}

${char.personality_summary ? `
<div class="section">
<h2>Personality</h2>
<p>${xmlEscape(char.personality_summary)}</p>
${arr(char.personality_traits).map(t => `<span class="tag">${xmlEscape(t)}</span>`).join('')}
${list('Likes', arr(char.likes))}
${list('Dislikes', arr(char.dislikes))}
${list('Fears', arr(char.fears))}
${list('Desires', arr(char.desires))}
${list('Habits', arr(char.habits))}
${list('Quirks', arr(char.quirks))}
</div>
` : ''}

${char.core_wound || char.deepest_desire ? `
<div class="section">
<h2>Psychological Profile</h2>
${field('Core Wound', char.core_wound)}
${field('Love Language', char.love_language)}
${field('Deepest Desire', char.deepest_desire)}
${field('Biggest Fear', char.biggest_fear)}
${list('Defense Mechanisms', arr(char.defense_mechanisms))}
</div>
` : ''}

${char.backstory ? `
<div class="section">
<h2>Backstory</h2>
<p>${xmlEscape(char.backstory)}</p>
${char.early_life ? `<h3>Early Life</h3><p>${xmlEscape(char.early_life)}</p>` : ''}
${char.defining_moments ? `<h3>Defining Moments</h3><p>${xmlEscape(char.defining_moments)}</p>` : ''}
</div>
` : ''}

${char.power_origin ? `
<div class="section">
<h2>Power &amp; Ability</h2>
${field('Origin', char.power_origin)}
${char.power_origin_details ? `<p>${xmlEscape(char.power_origin_details)}</p>` : ''}
${field('Alignment', char.alignment)}
${char.moral_notes ? `<p>${xmlEscape(char.moral_notes)}</p>` : ''}
</div>
` : ''}

${arr(char.affiliations).length ? `
<div class="section">
<h2>Affiliations</h2>
${arr(char.affiliations).map(a => `<span class="tag">${xmlEscape(a)}</span>`).join('')}
</div>
` : ''}

${arr(char.notable_quotes).length ? `
<div class="section">
<h2>Notable Quotes</h2>
${arr(char.notable_quotes).map(q => `<blockquote>${xmlEscape(q)}</blockquote>`).join('')}
</div>
` : ''}

${arr(char.contradictions).length ? `
<div class="section">
<h2>Contradictions</h2>
${arr(char.contradictions).map(c => `<blockquote style="font-style:italic;">${xmlEscape(c)}</blockquote>`).join('')}
</div>
` : ''}
`
}

// TXT export
export function exportCharacterTxt(char: Character): string {
  const arr = (v: string[] | null | undefined, sep = ', ') =>
    (v ?? []).filter(Boolean).join(sep)
  const line = (label: string, value: string | null | undefined) =>
    value ? `${label.toUpperCase()}: ${value}\n` : ''
  const section = (title: string, content: string) =>
    content.trim() ? `\n${'='.repeat(40)}\n${title}\n${'='.repeat(40)}\n${content}\n` : ''

  return [
    `CHARACTER PROFILE: ${char.name.toUpperCase()}`,
    'Exported from Recoil',
    `Date: ${new Date().toLocaleDateString()}`,
    section('IDENTITY',
      line('Full Name', char.full_name) +
      line('Also Known As', arr(char.aliases)) +
      line('Pronouns', char.pronouns) +
      line('Age', char.age ? (char.age_note ? `${char.age} (${char.age_note})` : char.age) : null) +
      line('Species', char.species) +
      line('Nationality', char.nationality) +
      line('Occupation', char.occupation)
    ),
    section('APPEARANCE',
      line('Height', char.height) + line('Weight', char.weight) +
      line('Hair', [char.hair_color, char.hair_style].filter(Boolean).join(', ') || null) +
      line('Eyes', char.eye_color) + line('Skin', char.skin_tone) +
      line('Build', char.body_type) +
      line('Distinguishing Features', char.distinguishing_features) +
      line('Style', char.style_and_fashion) +
      (char.appearance_notes ? `\n${char.appearance_notes}\n` : '')
    ),
    section('PERSONALITY',
      (char.personality_summary ? `${char.personality_summary}\n\n` : '') +
      line('Traits', arr(char.personality_traits)) +
      line('Likes', arr(char.likes)) +
      line('Dislikes', arr(char.dislikes)) +
      line('Fears', arr(char.fears)) +
      line('Desires', arr(char.desires)) +
      line('Habits', arr(char.habits)) +
      line('Quirks', arr(char.quirks))
    ),
    section('PSYCHOLOGICAL PROFILE',
      line('Core Wound', char.core_wound) +
      line('Love Language', char.love_language) +
      line('Deepest Desire', char.deepest_desire) +
      line('Defense Mechanisms', arr(char.defense_mechanisms))
    ),
    section('NARRATIVE',
      line('Narrative Role', char.narrative_role) +
      line('Arc Stage', char.character_arc_stage) +
      line('Aesthetic Vibe', char.aesthetic_vibe) +
      line('Alignment', char.alignment) +
      (char.contradictions?.length ? `CONTRADICTIONS:\n${char.contradictions.map(c => `- ${c}`).join('\n')}\n` : '') +
      line('Affiliations', arr(char.affiliations))
    ),
    section('BACKSTORY', [char.backstory, char.early_life ? `\nEARLY LIFE:\n${char.early_life}` : '', char.defining_moments ? `\nDEFINING MOMENTS:\n${char.defining_moments}` : ''].filter(Boolean).join('')),
    char.notable_quotes?.length ? section('NOTABLE QUOTES', char.notable_quotes.map(q => `"${q}"`).join('\n\n')) : '',
    char.notes ? section('NOTES', char.notes) : '',
  ].join('').trim()
}

// Markdown export
export function exportCharacterMd(char: Character): string {
  const arr = (v: string[] | null | undefined) => (v ?? []).filter(Boolean)
  const field = (label: string, value: string | null | undefined) =>
    value ? `**${label}:** ${value}  \n` : ''
  const list = (label: string, items: string[]) =>
    items.length ? `\n**${label}:**\n${items.map(i => `- ${i}`).join('\n')}\n` : ''

  return [
    `# ${char.name}`,
    char.pronouns || char.species ? `*${[char.pronouns, char.species].filter(Boolean).join(' — ')}*` : '',
    char.aesthetic_vibe ? `\n> ${char.aesthetic_vibe}\n` : '',
    `\n## Identity\n`,
    field('Full Name', char.full_name),
    field('Also Known As', arr(char.aliases).join(', ') || null),
    field('Age', char.age ? (char.age_note ? `${char.age} *(${char.age_note})*` : char.age) : null),
    field('Species', char.species),
    field('Nationality', char.nationality),
    field('Occupation', char.occupation),
    char.personality_summary ? `\n## Personality\n\n${char.personality_summary}\n` : '',
    arr(char.personality_traits).length ? `\n**Traits:** ${arr(char.personality_traits).join(' · ')}\n` : '',
    list('Likes', arr(char.likes)),
    list('Dislikes', arr(char.dislikes)),
    list('Fears', arr(char.fears)),
    char.core_wound ? `\n## Psychological Profile\n\n**Core Wound:** ${char.core_wound}  \n${field('Love Language', char.love_language)}${field('Deepest Desire', char.deepest_desire)}` : '',
    char.backstory ? `\n## Backstory\n\n${char.backstory}\n` : '',
    char.early_life ? `\n### Early Life\n\n${char.early_life}\n` : '',
    char.narrative_role ? `\n## Narrative\n\n${field('Role', char.narrative_role)}${field('Arc Stage', char.character_arc_stage)}${field('Alignment', char.alignment)}` : '',
    arr(char.contradictions).length ? `\n**Contradictions:**\n${arr(char.contradictions).map(c => `- *${c}*`).join('\n')}\n` : '',
    arr(char.affiliations).length ? `\n**Affiliations:** ${arr(char.affiliations).join(', ')}\n` : '',
    arr(char.notable_quotes).length ? `\n## Quotes\n\n${arr(char.notable_quotes).map(q => `> "${q}"`).join('\n\n')}\n` : '',
    char.notes ? `\n## Notes\n\n${char.notes}\n` : '',
    `\n---\n*Exported from Recoil — ${new Date().toLocaleDateString()}*`,
  ].join('')
}

// LaTeX export
function exportCharacterLatex(char: Character): string {
  const esc = (s: string) => s.replace(/[&%$#_{}~^\\]/g, c => `\\${c}`)
  const arr = (v: string[] | null | undefined) => (v ?? []).filter(Boolean)
  return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{margin=2cm}
\\title{${esc(char.name)}}
\\author{Recoil Export}
\\date{${esc(new Date().toLocaleDateString())}}
\\begin{document}
\\maketitle
\\section*{Identity}
\\begin{description}
${char.full_name ? `\\item[Full Name] ${esc(char.full_name)}` : ''}
${char.pronouns ? `\\item[Pronouns] ${esc(char.pronouns)}` : ''}
${char.age ? `\\item[Age] ${esc(char.age)}` : ''}
${char.species ? `\\item[Species] ${esc(char.species)}` : ''}
${char.occupation ? `\\item[Occupation] ${esc(char.occupation)}` : ''}
\\end{description}
${char.personality_summary ? `\\section*{Personality}\n${esc(char.personality_summary)}` : ''}
${arr(char.personality_traits).length ? `\\paragraph{Traits:} ${arr(char.personality_traits).map(esc).join(', ')}` : ''}
${char.backstory ? `\\section*{Backstory}\n${esc(char.backstory)}` : ''}
${char.narrative_role ? `\\section*{Narrative Role}\n${esc(char.narrative_role)}` : ''}
${arr(char.notable_quotes).length ? `\\section*{Notable Quotes}\n\\begin{quote}\n${arr(char.notable_quotes).map(q => `\\textit{\`\`${esc(q)}''}`).join('\\n\\n')}\n\\end{quote}` : ''}
${char.notes ? `\\section*{Notes}\n${esc(char.notes)}` : ''}
\\end{document}`
}

// Main export function
export async function exportCharacter(
  char: Character,
  format: ExportFormat,
): Promise<void> {
  const base = slugify(char.name)
  const def = FORMAT_DEFINITIONS.find(f => f.id === format)!

  switch (format) {
    case 'txt':
      downloadBlob(
        `${base}.txt`,
        exportCharacterTxt(char),
        'text/plain'
      )
      break

    case 'md':
      downloadBlob(`${base}.md`, exportCharacterMd(char), 'text/markdown')
      break

    case 'json':
      downloadBlob(
        `${base}.json`,
        JSON.stringify(char, null, 2),
        'application/json'
      )
      break

    case 'yaml':
      downloadBlob(`${base}.yaml`, yaml.dump(char), 'text/yaml')
      break

    case 'png':
      exportCharacterCardPng(char)
      break

    case 'xml': {
      const flat = flattenCharacter(char)
      const fields = Object.entries(flat)
        .filter(([, v]) => v)
        .map(([k, v]) => `  <${k}>${xmlEscape(v)}</${k}>`)
        .join('\n')
      downloadBlob(
        `${base}.xml`,
        `<?xml version="1.0" encoding="UTF-8"?>\n<character>\n${fields}\n</character>`,
        'application/xml'
      )
      break
    }

    case 'html': {
      const body = buildCharacterHtml(char)
      downloadBlob(
        `${base}.html`,
        buildHTMLPage(char.name, body),
        'text/html'
      )
      break
    }

    case 'xhtml': {
      const body = buildCharacterHtml(char)
      downloadBlob(
        `${base}.xhtml`,
        htmlToXHTML(buildHTMLPage(char.name, body)),
        'application/xhtml+xml'
      )
      break
    }

    case 'pdf': {
      // Generate HTML and open print dialog (save as PDF from share sheet on iPad)
      const body = buildCharacterHtml(char)
      triggerPrintToPDF(buildHTMLPage(char.name, body), char.name)
      break
    }

    case 'rtf': {
      const txt = exportCharacterTxt(char)
      const rtf = `{\rtf1\ansi\deff0\n{\fonttbl{\f0 Georgia;}}\n\f0\fs24 ${txt.replace(/\n/g, '\\par\n').replace(/[\\{}]/g, '\\$&')}\n}`
      downloadBlob(`${base}.rtf`, rtf, 'application/rtf')
      break
    }

    case 'latex':
      downloadBlob(`${base}.tex`, exportCharacterLatex(char), 'application/x-latex')
      break

    default:
      console.warn(`Character export format not implemented: ${format}`)
  }
}
