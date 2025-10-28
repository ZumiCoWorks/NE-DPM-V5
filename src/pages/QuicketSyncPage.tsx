import React, { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function QuicketSyncPage() {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFetchEvents = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Quicket API key')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('http://localhost:3001/api/quicket/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-Quicket-Api-Key': apiKey
        }
      })

      const data = await response.json()

      if (data.success || data.events) {
        setSuccess(true)
        alert(`Successfully fetched ${data.events?.length || 0} events from Quicket!`)
      } else {
        setError(data.message || 'Failed to fetch events from Quicket')
      }
    } catch (err: any) {
      setError('Failed to connect to Quicket API. Please check your API key.')
      console.error('Quicket fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Event from Quicket</h1>
        <p className="mt-2 text-gray-600">
          Connect your Quicket account to import event details and attendee data.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">Successfully connected to Quicket!</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">Step 1: Connect to Quicket</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quicket API Key
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Quicket API key"
            className="w-full"
          />
          <p className="mt-2 text-sm text-gray-500">
            Find your API key in your{' '}
            <a 
              href="https://developer.quicket.co.za" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Quicket Developer Portal
            </a>
          </p>
        </div>

        <Button 
          onClick={handleFetchEvents} 
          disabled={loading || !apiKey.trim()}
          className="w-full sm:w-auto"
        >
          {loading ? 'Connecting...' : 'Fetch Events'}
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Don't have a Quicket API key? Contact Quicket support to request one.</li>
          <li>• This sync is one-time. Attendee updates will sync automatically via webhook.</li>
          <li>• After importing, you'll set up sponsor booth locations in the next step.</li>
        </ul>
      </div>
    </div>
  )
}
