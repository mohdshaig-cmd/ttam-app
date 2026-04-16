import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('TTAM Error Boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '2rem', background: '#f7f9f7',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '2.5rem',
            maxWidth: 480, width: '100%', textAlign: 'center',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem',
            }}>
              Something went wrong
            </h2>
            <p style={{ color: '#6b6b6b', fontSize: 14, lineHeight: 1.6, marginBottom: '1.5rem' }}>
              The application encountered an unexpected error.
              Please refresh the page or contact support if the issue persists.
            </p>
            {this.state.error && (
              <details style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <summary style={{ fontSize: 13, color: '#9a9a9a', cursor: 'pointer', marginBottom: 8 }}>
                  Error details
                </summary>
                <pre style={{
                  background: '#f4f4f4', borderRadius: 8, padding: '0.75rem',
                  fontSize: 11, overflow: 'auto', color: '#c62828',
                }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px', background: '#1a6b1a', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                🔄 Reload Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
                style={{
                  padding: '10px 20px', background: 'transparent', color: '#1a6b1a',
                  border: '1px solid #1a6b1a', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Go to Home
              </button>
            </div>
            <p style={{ marginTop: '1.5rem', fontSize: 12, color: '#9a9a9a' }}>
              TTAM Support: info@ttam.mv
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
