import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center" role="alert">
          <div className="rounded-full bg-error/10 p-4 mb-4">
            <AlertTriangle size={32} className="text-error" />
          </div>
          <h2 className="font-display text-xl font-semibold text-text-strong mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-text-muted mb-2 max-w-md">
            The app hit an unexpected error while rendering. Your timelines and photos are safe —
            everything is stored locally on this device.
          </p>
          {this.state.error?.message && (
            <pre className="text-xs text-text-muted bg-surface-raised border border-gray-200 rounded-lg px-3 py-2 mb-6 max-w-md overflow-x-auto whitespace-pre-wrap text-left">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <Button onClick={this.handleReset}>
              <RefreshCw size={14} />
              Try Again
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-4">
            If this keeps happening, reload the page or switch to a different view.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
