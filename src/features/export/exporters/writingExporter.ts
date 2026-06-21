import JSZip from 'jszip'
import * as yaml from 'js-yaml'
import { downloadBlob, slugify, xmlEscape, triggerPrintToPDF } from '../utils/downloadHelper'
import { buildHTMLPage, htmlToXHTML } from '../utils/htmlTemplates'
import { htmlToPlainText, htmlToMarkdown } from '../utils/htmlToText'
import { buildAndDownloadEpub } from '../utils/epubBuilder'
import type { WritingPiece, Chapter } from '../../writing/types'
import type { ExportFormat } from '../types'

function getFullText(piece: WritingPiece, chapters: Chapter[]): string {
  if (piece.type === 'novel' && chapters.length > 0) {
    return chapters
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map(ch => `${ch.title ?? `Chapter ${ch.chapter_number}`}\n\n${htmlToPlainText(ch.content ?? '')}`)
      .join('\n\n' + '='.repeat(40) + '\n\n')
  }
  return htmlToPlainText(piece.content ?? '')
}

function getFullMarkdown(piece: WritingPiece, chapters: Chapter[]): string {
  const frontmatter = [
    '---',
    `title: "${piece.title}"`,
    `type: ${piece.type}`,
    `status: ${piece.status}`,
    piece.summary ? `summary: "${piece.summary}"` : null,
    `exported: ${new Date().toISOString().slice(0, 10)}`,
    '---',
  ].filter(Boolean).join('\n')

  if (piece.type === 'novel' && chapters.length > 0) {
    const body = chapters
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map(ch => `## ${ch.title ?? `Chapter ${ch.chapter_number}`}\n\n${htmlToMarkdown(ch.content ?? '')}`)
      .join('\n\n---\n\n')
    return `${frontmatter}\n\n# ${piece.title}\n\n${body}`
  }
  return `${frontmatter}\n\n# ${piece.title}\n\n${htmlToMarkdown(piece.content ?? '')}`
}

function buildWritingHtml(piece: WritingPiece, chapters: Chapter[]): string {
  let body = `<h1>${xmlEscape(piece.title)}</h1>`
  if (piece.summary) body += `<p style="color:#8e8ea8;font-style:italic;">${xmlEscape(piece.summary)}</p><hr/>`

  if (piece.type === 'novel' && chapters.length > 0) {
    body += chapters
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map(ch => `<h2>${xmlEscape(ch.title ?? `Chapter ${ch.chapter_number}`)}</h2>\n${ch.content ?? ''}`)
      .join('\n<hr/>\n')
  } else {
    body += piece.content ?? ''
  }
  return body
}

function exportFountain(piece: WritingPiece, chapters: Chapter[]): string {
  const text = getFullText(piece, chapters)
  // Basic Fountain: title page + content
  return `Title: ${piece.title}
Author: Recoil Export
Date: ${new Date().toLocaleDateString()}

===

${text}`
}

function exportFB2(piece: WritingPiece, chapters: Chapter[]): string {
  const esc = (s: string) => xmlEscape(s)
  const sections = piece.type === 'novel' && chapters.length > 0
    ? chapters.sort((a, b) => a.chapter_number - b.chapter_number).map(ch => `
    <section>
      <title><p>${esc(ch.title ?? `Chapter ${ch.chapter_number}`)}</p></title>
      <p>${esc(htmlToPlainText(ch.content ?? '')).split('\n\n').join('</p>\n      <p>')}</p>
    </section>`)
    : [`<section><p>${esc(htmlToPlainText(piece.content ?? '')).split('\n\n').join('</p>\n<p>')}</p></section>`]

  return `<?xml version="1.0" encoding="UTF-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">
  <description>
    <title-info>
      <book-title>${esc(piece.title)}</book-title>
      <annotation><p>${esc(piece.summary ?? '')}</p></annotation>
    </title-info>
  </description>
  <body>
    ${sections.join('\n    ')}
  </body>
</FictionBook>`
}

export async function exportWriting(
  piece: WritingPiece,
  chapters: Chapter[],
  format: ExportFormat
): Promise<void> {
  const base = slugify(piece.title)

  switch (format) {
    case 'txt':
      downloadBlob(`${base}.txt`, getFullText(piece, chapters), 'text/plain')
      break

    case 'md':
      downloadBlob(`${base}.md`, getFullMarkdown(piece, chapters), 'text/markdown')
      break

    case 'json':
      downloadBlob(
        `${base}.json`,
        JSON.stringify({ piece, chapters }, null, 2),
        'application/json'
      )
      break

    case 'yaml':
      downloadBlob(`${base}.yaml`, yaml.dump({ piece, chapters }), 'text/yaml')
      break

    case 'html': {
      const body = buildWritingHtml(piece, chapters)
      downloadBlob(`${base}.html`, buildHTMLPage(piece.title, body), 'text/html')
      break
    }

    case 'xhtml': {
      const body = buildWritingHtml(piece, chapters)
      downloadBlob(`${base}.xhtml`, htmlToXHTML(buildHTMLPage(piece.title, body)), 'application/xhtml+xml')
      break
    }

    case 'pdf': {
      const body = buildWritingHtml(piece, chapters)
      triggerPrintToPDF(buildHTMLPage(piece.title, body), piece.title)
      break
    }

    case 'rtf': {
      const txt = getFullText(piece, chapters)
      const rtf = `{\rtf1\ansi\deff0\n{\fonttbl{\f0 Georgia;}}\n{\info{\title ${txt.slice(0,40)}}}\n\f0\fs24 ${txt.replace(/\n/g, '\\par\n').replace(/[\\{}]/g, '\\$&')}\n}`
      downloadBlob(`${base}.rtf`, rtf, 'application/rtf')
      break
    }

    case 'latex': {
      const esc = (s: string) => s.replace(/[&%$#_{}~^\\]/g, c => `\\${c}`)
      const text = getFullText(piece, chapters)
      downloadBlob(`${base}.tex`,
        `\\documentclass[12pt,a4paper]{article}\n\\usepackage[utf8]{inputenc}\n\\title{${esc(piece.title)}}\n\\begin{document}\n\\maketitle\n${esc(text)}\n\\end{document}`,
        'application/x-latex'
      )
      break
    }

    case 'fountain':
      downloadBlob(`${base}.fountain`, exportFountain(piece, chapters), 'text/plain')
      break

    case 'fb2':
      downloadBlob(`${base}.fb2`, exportFB2(piece, chapters), 'application/x-fictionbook+xml')
      break

    case 'epub':
      await buildAndDownloadEpub({
        title: piece.title,
        description: piece.summary ?? undefined,
        chapters: piece.type === 'novel' && chapters.length > 0
          ? chapters.sort((a, b) => a.chapter_number - b.chapter_number).map(ch => ({
              id: ch.id as string,
              title: ch.title ?? `Chapter ${ch.chapter_number}`,
              content: ch.content ?? '',
            }))
          : [{ id: piece.id as string, title: piece.title, content: piece.content ?? '' }],
      })
      break

    default:
      console.warn(`Writing export format not implemented: ${format}`)
  }
}
