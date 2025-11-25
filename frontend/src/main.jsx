import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'
import { registerServiceWorker } from './utils/serviceWorker'

// Register service worker in production
if (import.meta.env.PROD) {
  registerServiceWorker()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
)
