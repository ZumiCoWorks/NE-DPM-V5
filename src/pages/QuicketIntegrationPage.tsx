import React, { useState, useEffect } from 'react'
import { Link2, CheckCircle, AlertCircle, RefreshCw, Users, TrendingUp } from 'lucide-react'

interface QuicketConfig {
  apiKey: string
  mockMode: boolean
  lastSync?: string
  status: 'connected' | 'disconnected' | 'error'
}

export function QuicketIntegrationPage() {
  const [config, setConfig] = useState<QuicketConfig>({
    apiKey: '',
    mockMode: true,
    status: 'disconnected'
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/quicket/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      })
      
      const data = await response.json()
      
      setConfig({
        apiKey: data.apiKeyPresent ? '****-****-****-' + (process.env.QUICKET_API_KEY?.slice(-4) || '****') : '',
        mockMode: data.mockMode,
        lastSync: data.configured ? new Date().toISOString() : undefined,
        status: data.configured ? 'connected' : 'disconnected'
      })
    } catch (error) {
      console.error('Error loading config:', error)
      // Fallback to showing API key from env if backend fails
      setConfig({
        apiKey: '****-****-****',
        mockMode: process.env.QUICKET_MOCK_MODE === 'true',
        status: 'disconnected'
      })
    }
  }

  const handleSaveConfig = async () => {
    try {
      console.log('Saving Quicket config:', config)
      // TODO: API call to save config
      setIsEditing(false)
      setConfig({ ...config, status: 'connected' })
    } catch (error) {
      console.error('Error saving config:', error)
      setConfig({ ...config, status: 'error' })
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      // Call backend to test Quicket API connection
      const response = await fetch('http://localhost:3001/api/quicket/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          userToken: config.apiKey // In real implementation, user would provide their Quicket user token
        })
      })

      const data = await response.json()

      if (data.success) {
        setTestResult(`✅ Connection successful! User ID: ${data.userId}`)
        setConfig({ ...config, status: 'connected', lastSync: new Date().toISOString() })
      } else {
        setTestResult(`❌ ${data.message || 'Connection failed'}`)
        setConfig({ ...config, status: 'error' })
      }
    } catch (error: any) {
      console.error('Test connection error:', error)
      setTestResult(`❌ Connection failed: ${error.message}`)
      setConfig({ ...config, status: 'error' })
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusBadge = () => {
    switch (config.status) {
      case 'connected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Connected
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-4 w-4 mr-1" />
            Error
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="h-4 w-4 mr-1" />
            Not Connected
          </span>
        )
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Value Proposition Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-6 text-white">
        <h1 className="text-3xl font-bold mb-3">🎯 Quicket Integration</h1>
        <p className="text-lg text-blue-100 mb-4">
          Unlock powerful insights by connecting your Quicket attendee data with AR engagement metrics
        </p>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <Users className="h-8 w-8 mb-2" />
            <h3 className="font-semibold mb-1">Attendee Matching</h3>
            <p className="text-sm text-blue-100">
              Automatically match AR engagement with ticket holders
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <TrendingUp className="h-8 w-8 mb-2" />
            <h3 className="font-semibold mb-1">Sponsor ROI Proof</h3>
            <p className="text-sm text-blue-100">
              Show sponsors exactly who visited their booths
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <CheckCircle className="h-8 w-8 mb-2" />
            <h3 className="font-semibold mb-1">Verified Metrics</h3>
            <p className="text-sm text-blue-100">
              Auditable engagement data tied to real attendees
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
            <p className="text-sm text-gray-600 mt-1">
              Connect your Quicket account to enable attendee data integration
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-6">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quicket API Key
            </label>
            {isEditing ? (
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Quicket API key"
              />
            ) : (
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-md">
                <span className="text-gray-600 font-mono">{config.apiKey || 'Not configured'}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Get your API key from <a href="https://www.quicket.co.za/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Quicket Developer Portal</a>
            </p>
          </div>

          {/* Mock Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Demo/Mock Mode</h3>
              <p className="text-sm text-gray-600 mt-1">
                Use simulated data for testing without connecting to Quicket
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.mockMode}
                onChange={(e) => setConfig({ ...config, mockMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Last Sync Info */}
          {config.lastSync && (
            <div className="flex items-center text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Last synced: {new Date(config.lastSync).toLocaleString()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {isEditing && (
              <>
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save Configuration
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    loadConfig()
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            )}
            
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Link2 className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className="text-sm font-medium">{testResult}</p>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-4">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Connect Quicket</h3>
              <p className="text-sm text-gray-600">
                Provide your Quicket API key to securely access your attendee guest lists
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-4">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Attendees Use AR Wayfinding</h3>
              <p className="text-sm text-gray-600">
                Event attendees log in with their Quicket ticket and use AR navigation to find sponsor booths
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-4">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Automatic Engagement Tracking</h3>
              <p className="text-sm text-gray-600">
                When attendees navigate to booths or scan QR codes, engagement is automatically logged with their Quicket ID
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-4">
              4
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Deliver Sponsor ROI Reports</h3>
              <p className="text-sm text-gray-600">
                Generate detailed reports showing sponsors exactly which attendees engaged with their booths
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🚀 Ready to unlock sponsor value?
        </h3>
        <p className="text-gray-700 mb-4">
          Connect Quicket now and start providing sponsors with verified engagement data that proves ROI. This is your key to higher sponsorship renewals and premium pricing.
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          {config.apiKey ? 'Update Configuration' : 'Get Started'}
        </button>
      </div>
    </div>
  )
}
