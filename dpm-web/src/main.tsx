import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

// Register Service Worker for offline functionality (production only)
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(registration => {
//         console.log('✅ Service Worker registered:', registration.scope);
//       })
//       .catch(error => {
//         console.error('❌ Service Worker registration failed:', error);
//       });
//   });
// Unregister any existing service workers in development
if (import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('🧹 Unregistered Service Worker in development');
    });
  });
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" />
  </StrictMode>,
)
