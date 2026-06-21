import { useState } from 'react'
import mammoth from 'mammoth'
import { detectFileType, ImportFileType } from '../types'

export type ReadResult = {
  text: string
  fileType: ImportFileType
  fileName: string
  charCount: number
  warning?: string
}

export function useFileReader() {
  const [isReading, setIsReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)

  async function readFile(file: File): Promise<ReadResult | null> {
    setIsReading(true)
    setReadError(null)
    const fileType = detectFileType(file.name)

    try {
      let text = ''
      let warning: string | undefined

      if (fileType === 'docx') {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        text = result.value
        if (result.messages.length > 0) {
          warning = 'Some content may not have been extracted from the Word document.'
        }
      } else if (fileType === 'pdf') {
        try {
          text = await readAsText(file)
          const nonPrintable = (text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) ?? []).length
          if (nonPrintable / text.length > 0.05) {
            warning = 'This PDF could not be read as text. Copy the text manually and use the paste option instead.'
            text = ''
          }
        } catch {
          warning = 'PDF reading failed. Use the paste option instead.'
          text = ''
        }
      } else if (fileType === 'html') {
        const raw = await readAsText(file)
        text = raw
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      } else if (fileType === 'json') {
        text = await readAsText(file)
      } else {
        // txt, md, unknown
        text = await readAsText(file)
      }

      const MAX_CHARS = 80000
      if (text.length > MAX_CHARS) {
        warning = `File is very large (${Math.round(text.length / 1000)}K characters). Only the first ${Math.round(MAX_CHARS / 1000)}K characters will be analyzed. For best results, split large files into sections.`
        text = text.slice(0, MAX_CHARS)
      }

      return {
        text,
        fileType,
        fileName: file.name,
        charCount: text.length,
        warning,
      }
    } catch (err) {
      setReadError(`Could not read file: ${String(err)}`)
      return null
    } finally {
      setIsReading(false)
    }
  }

  async function readText(pastedText: string): Promise<ReadResult> {
    const MAX_CHARS = 80000
    const text = pastedText.slice(0, MAX_CHARS)
    return {
      text,
      fileType: 'txt',
      fileName: 'pasted-content',
      charCount: text.length,
      warning: pastedText.length > MAX_CHARS
        ? `Only the first ${Math.round(MAX_CHARS / 1000)}K characters will be analyzed.`
        : undefined,
    }
  }

  return { readFile, readText, isReading, readError }
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.readAsText(file, 'UTF-8')
  })
}
