import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  error: Error | null
  reset: () => void
}

export function ErrorFallback({ error, reset }: Props) {
  const navigate = useNavigate()

  return (
    <div
      className="flex flex-col items-center justify-center w-full"
      style={{
        minHeight: '400px',
        padding: '48px 24px',
        color: 'var(--color-text-primary)',
      }}
    >
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full mb-6"
        style={{ background: 'var(--color-error-dim)' }}
      >
        <AlertTriangle className="w-8 h-8" style={{ color: 'var(--color-error)' }} />
      </div>

      <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>

      <p
        className="text-sm text-center mb-2 max-w-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        An unexpected error occurred in this section of the app.
      </p>

      {error?.message && (
        <details className="mb-6">
          <summary
            className="text-xs cursor-pointer select-none"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Show error details
          </summary>
          <pre
            className="mt-2 p-3 rounded-lg text-[11px] overflow-x-auto max-w-sm"
            style={{
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-default)',
            }}
          >
            {error.message}
          </pre>
        </details>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:opacity-90"
          style={{
            background: 'var(--color-accent-primary)',
            color: 'var(--color-text-inverse)',
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <button
          onClick={() => { reset(); navigate('/') }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:bg-[var(--color-bg-hover)]"
          style={{
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          <Home className="w-4 h-4" />
          Go home
        </button>
      </div>
    </div>
  )
}
