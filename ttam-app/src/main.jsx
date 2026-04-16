import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'
import { ErrorBoundary } from './components/UI/ErrorBoundary'
import App from './App'
import './styles/globals.css'

// Only init push if the key is present
try {
  if (import.meta.env.VITE_ONESIGNAL_APP_ID) {
    const { initOneSignal } = await import('./lib/notifications')
    initOneSignal()
  }
} catch (_) {}

// Remove splash screen once React has mounted
function removeSplash() {
  const loader = document.getElementById('app-loader')
  if (loader) {
    loader.style.opacity = '0'
    loader.style.transition = 'opacity 0.4s'
    setTimeout(() => loader.remove(), 420)
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)

// Splash removes itself after first paint
requestAnimationFrame(() => setTimeout(removeSplash, 400))
