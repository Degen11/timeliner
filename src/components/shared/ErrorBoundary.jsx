import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './Button'

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
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="rounded-full bg-red-50 p-4 mb-4">
            <AlertTriangle size={32} className="text-error" />
          </div>
          <h2 className="font-display text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred. Your data is safe in local storage.'}
          </p>
          <div className="flex gap-3">
            <Button onClick={this.handleReset}>
              <RefreshCw size={14} />
              Try Again
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
