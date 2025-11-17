import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const StaffScannerPage: React.FC = () => {
  const { user } = useAuth()
  const [ticketId, setTicketId] = useState('')
  const [eventId, setEventId] = useState('')
  const [lead, setLead] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchLead = async () => {
    setMessage(null)
    setError(null)
    setLead(null)
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Load Quicket API key via backend
      const apiBase = (import.meta as any).env.VITE_API_URL || '/api'
      const settingsRes = await fetch(`${apiBase}/settings/quicket-key`, { credentials: 'include' })
      const settingsJson = await settingsRes.json()
      if (!settingsRes.ok) throw new Error(settingsJson?.message || settingsJson?.error || 'Failed to load Quicket key')
      const apiKey = settingsJson?.data?.quicket_api_key || ''
      if (!apiKey) throw new Error('Quicket API key not set. Ask admin to save it in Settings.')

      // Call Edge Function get-quicket-lead
      const fnUrl = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/get-quicket-lead`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Quicket-Api-Key': apiKey,
        },
        body: JSON.stringify({ ticket_id: ticketId, event_id: eventId || undefined })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch lead')
      setLead({ name: json.name || 'Unknown', email: json.email || '' })
      setMessage('Lead fetched')
    } catch (e: any) {
      setError(e?.message || 'Fetch failed')
    } finally {
      setLoading(false)
    }
  }

  const saveLead = async () => {
    setMessage(null)
    setError(null)
    try {
      if (!lead) throw new Error('No lead to save')
      setSaving(true)
      const payload = {
        event_id: eventId || null,
        staff_user_id: user?.id || null,
        lead_name: lead.name,
        lead_email: lead.email,
        scanned_at: new Date().toISOString(),
      }
      const { error } = await supabase
        ?.from('qualified_leads')
        .insert(payload)
      if (error) throw new Error(error.message || 'Failed to save lead')
      setMessage('Lead saved successfully')
    } catch (e: any) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Lead Scanner</h1>
      <p className="text-sm text-gray-600">Enter a Quicket Ticket ID to fetch attendee details.</p>

      {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700">{error}</div>}
      {message && <div className="p-3 bg-green-100 border border-green-300 text-green-700">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ticketId" className="block text-sm font-medium text-gray-700">Ticket ID</label>
          <input id="ticketId" type="text" value={ticketId} onChange={e => setTicketId(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" placeholder="e.g., 54321" />
        </div>
        <div>
          <label htmlFor="eventId" className="block text-sm font-medium text-gray-700">Event ID (optional)</label>
          <input id="eventId" type="text" value={eventId} onChange={e => setEventId(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" placeholder="Quicket Event ID" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={fetchLead} disabled={loading || !ticketId.trim()} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
          {loading ? (<span className="inline-flex items-center"><LoadingSpinner size="sm"/><span className="ml-2">Fetching...</span></span>) : 'Fetch'}
        </button>
        <button onClick={saveLead} disabled={saving || !lead} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Lead'}
        </button>
      </div>

      {lead && (
        <div className="mt-4 p-4 border rounded bg-white">
          <h2 className="text-lg font-semibold mb-2">Attendee</h2>
          <p><strong>Name:</strong> {lead.name}</p>
          <p><strong>Email:</strong> {lead.email || 'N/A'}</p>
        </div>
      )}
    </div>
  )
}

export default StaffScannerPage
