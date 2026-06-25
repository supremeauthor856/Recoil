import React from 'react'
import { ErrorFallback } from './ErrorFallback'

interface State { hasError: boolean; error: Error | null }

interface Props {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error | null; reset: () => void }>
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in development
    console.error('[Recoil Error Boundary]', error, info.componentStack)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback ?? ErrorFallback
      return <Fallback error={this.state.error} reset={this.reset} />
    }
    return this.props.children
  }
}
