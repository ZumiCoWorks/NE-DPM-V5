import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

// Note: Service Worker registration removed for development
// PWA features will be available in production builds via vite-plugin-pwa



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" />
  </StrictMode>,
)
