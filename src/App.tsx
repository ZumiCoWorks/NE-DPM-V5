import React from 'react'
import { useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {user ? <Dashboard /> : <AuthPage />}
    </div>
  )
}

export default App
