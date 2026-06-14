export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatRelativeTime(timestamp: number): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysDifference === 0) {
    const hoursDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60))
    if (hoursDifference === 0) {
      const minutesDifference = Math.round((timestamp - Date.now()) / (1000 * 60))
      if (minutesDifference === 0) return 'just now'
      return rtf.format(minutesDifference, 'minute')
    }
    return rtf.format(hoursDifference, 'hour')
  }
  return rtf.format(daysDifference, 'day')
}

export function formatWordCount(count: number): string {
  return `${count.toLocaleString()} words`
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
