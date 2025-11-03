import React from 'react'

interface State {
  hasError: boolean
  error?: Error | null
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error in component tree:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="max-w-2xl bg-white border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-red-700">Something went wrong</h2>
            <pre className="mt-4 text-sm text-red-600 whitespace-pre-wrap">{String(this.state.error)}</pre>
            <p className="mt-4 text-sm text-gray-700">Check the browser console for more details.</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
