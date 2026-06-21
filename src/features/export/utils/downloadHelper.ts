export function downloadBlob(filename: string, content: string | Uint8Array | Blob, mimeType = 'text/plain') {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Delay revoke to let the download start
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function getExportFilename(
  baseName: string,
  format: string,
  extension: string
): string {
  return `${slugify(baseName)}-${format}-${new Date().toISOString().slice(0, 10)}.${extension}`
}

// Trigger browser print dialog — user can save as PDF from there
// Works on iPad as "Share > Print > Save to Files as PDF"
export function triggerPrintToPDF(htmlContent: string, title?: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(htmlContent)
  if (title) {
    printWindow.document.title = title
  }
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 500)
}

// Escape special characters for CSV fields
export function csvEscape(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Escape XML special characters
export function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
