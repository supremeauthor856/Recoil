import { db } from './db'
import { WritingGuideline } from '../features/settings/types'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Check if a response came back as HTML (this happens in local SPA dev fallback)
async function isValidJson(response: Response): Promise<boolean> {
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('text/html')) {
    return false
  }
  return true
}

export const api = {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/api') ? url : `/api${url}`
    try {
      const response = await fetch(cleanUrl)
      if (response.ok && await isValidJson(response)) {
        const result = await response.json()
        return result as ApiResponse<T>
      }
    } catch {
      // Fall through to local fallback
    }

    // fallback to local Dexie
    if (url.startsWith('/writing-guidelines')) {
      try {
        const u = new URL(url, 'http://localhost')
        const activeOnly = u.searchParams.get('active') === 'true'
        let list: WritingGuideline[]
        if (activeOnly) {
          list = await db.writing_guidelines.where('is_active').equals(1).toArray()
        } else {
          list = await db.writing_guidelines.toArray()
        }
        // sort by category and created_at
        list.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }
          return a.created_at - b.created_at
        })
        return { success: true, data: list as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    return { success: false, error: 'API not available locally' }
  },

  async post<T>(url: string, body: any): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/api') ? url : `/api${url}`
    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (response.ok && await isValidJson(response)) {
        const result = await response.json()
        return result as ApiResponse<T>
      }
    } catch {
      // Fall through to local fallback
    }

    // fallback to local Dexie
    if (url.startsWith('/writing-guidelines')) {
      try {
        const id = crypto.randomUUID()
        const now = Date.now()
        const newGuideline: WritingGuideline = {
          id,
          filename: body.filename || body.display_name,
          display_name: body.display_name,
          category: body.category,
          r2_key: `local:${id}`,
          file_size: body.content?.length ?? 0,
          is_active: true,
          content_preview: body.content || '',
          created_at: now,
          updated_at: now
        }
        await db.writing_guidelines.add(newGuideline)
        return { success: true, data: newGuideline as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    return { success: false, error: 'API not available locally' }
  },

  async put<T>(url: string, body: any): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/api') ? url : `/api${url}`
    try {
      const response = await fetch(cleanUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (response.ok && await isValidJson(response)) {
        const result = await response.json()
        return result as ApiResponse<T>
      }
    } catch {
      // Fall through to local fallback
    }

    // fallback to local Dexie
    if (url.startsWith('/writing-guidelines/')) {
      try {
        const parts = url.split('/')
        const id = parts[parts.length - 1]
        const existing = await db.writing_guidelines.get(id)
        if (!existing) {
          return { success: false, error: 'Guideline not found' }
        }
        const updated: WritingGuideline = {
          ...existing,
          ...body,
          is_active: typeof body.is_active === 'boolean' ? body.is_active : existing.is_active,
          file_size: 'content_preview' in body ? (body.content_preview?.length ?? 0) : existing.file_size,
          updated_at: Date.now()
        }
        await db.writing_guidelines.put(updated)
        return { success: true, data: updated as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    return { success: false, error: 'API not available locally' }
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/api') ? url : `/api${url}`
    try {
      const response = await fetch(cleanUrl, {
        method: 'DELETE'
      })
      if (response.ok && await isValidJson(response)) {
        const result = await response.json()
        return result as ApiResponse<T>
      }
    } catch {
      // Fall through to local fallback
    }

    // fallback to local Dexie
    if (url.startsWith('/writing-guidelines/')) {
      try {
        const parts = url.split('/')
        const id = parts[parts.length - 1]
        await db.writing_guidelines.delete(id)
        return { success: true, data: { deleted: true } as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    return { success: false, error: 'API not available locally' }
  }
}
