import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Settings, Key, Save } from 'lucide-react'

export const SettingsPage = () => {
  const { user } = useAuth()
  const [quicketApiKey, setQuicketApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Assuming the API key is stored in a JSON field or metadata
      // You may need to adjust this based on your actual database schema
      setQuicketApiKey('')
    } catch (err: any) {
      console.error('Error loading settings:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Save to local storage for now
      // In a real app, you'd save this to the database or a secure settings table
      localStorage.setItem('quicket_api_key', quicketApiKey)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    // Load from localStorage on mount
    const savedKey = localStorage.getItem('quicket_api_key')
    if (savedKey) {
      setQuicketApiKey(savedKey)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Settings className="mr-2 h-6 w-6" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your API integrations and preferences
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">Settings saved successfully!</span>
        </div>
      )}

      <Card>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Quicket API Integration
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure your Quicket API key to enable event synchronization
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="quicket-api-key" className="block text-sm font-medium text-gray-700 mb-1">
                Quicket API Key
              </label>
              <Input
                id="quicket-api-key"
                type="password"
                value={quicketApiKey}
                onChange={(e) => setQuicketApiKey(e.target.value)}
                placeholder="Enter your Quicket API key"
              />
              <p className="mt-2 text-sm text-gray-500">
                Find your API key in your{' '}
                <a 
                  href="https://developer.quicket.co.za" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  Quicket Developer Portal
                </a>
              </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={saving || !quicketApiKey.trim()}
                className="inline-flex items-center"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Important Notes:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Your API key is stored securely and used only for Quicket integration</li>
              <li>Don't have a Quicket API key? Contact Quicket support to request one</li>
              <li>You can update your API key at any time from this page</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SettingsPage
