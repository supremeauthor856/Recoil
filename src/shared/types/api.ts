export interface APIResponse<T> {
  success: boolean
  data: T | null
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  total: number
  page: number
  pageSize: number
}
