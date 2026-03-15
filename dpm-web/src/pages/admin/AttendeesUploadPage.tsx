import React, { useState, useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'

export default function AttendeesUploadPage() {
  const [csvText, setCsvText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<{ id: string, name: string }[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
        const json = await res.json()
        if (json.success && json.data) {
          setEvents(json.data)
        }
      } catch (err) {
        console.error('Failed to fetch events', err)
      }
    }
    fetchEvents()
  }, [])

  const uploadCsv = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const payload = { csv: csvText, event_id: selectedEventId }
      const res = await fetch('/api/attendees/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (json && json.success) {
        setMessage(`Imported ${json.created || 0} attendees`)
      } else {
        setMessage(`Upload failed: ${json && json.message ? json.message : 'unknown'}`)
      }
    } catch (err) {
      console.error('Upload error', err)
      setMessage('Upload failed: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const txt = ev.target?.result as string
      setCsvText(txt)
    }
    reader.readAsText(f)
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Admin — Attendees Upload</h1>

      {/* POPIA compliance notice */}
      <div className="flex items-start gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
        <span>
          <strong>POPIA compliant:</strong> Email and Phone values are hashed with SHA-256 before being stored.
          Raw PII is never written to the database.
        </span>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Upload a Quicket guestlist CSV or any attendee CSV. Supported columns:
      </p>
      <ul className="mb-4 text-sm text-gray-600 list-disc list-inside space-y-0.5">
        <li><code>Email</code> or <code>email</code> — attendee email address (will be hashed)</li>
        <li><code>Phone</code>, <code>phone</code>, or <code>Phone Number</code> — phone number (will be hashed)</li>
        <li><code>First Name</code> / <code>first_name</code></li>
        <li><code>Last Name</code> / <code>last_name</code></li>
        <li><code>Ticket Type</code> / <code>ticket_type</code></li>
        <li><code>Company</code>, <code>Job Title</code> / <code>job_title</code>, <code>event_id</code></li>
      </ul>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Event (Optional)</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full md:w-1/2 border p-2 rounded text-sm bg-white"
        >
          <option value="">No specific event</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <input type="file" accept=".csv" onChange={onFileChange} />
      </div>

      <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={12} className="w-full border p-2 rounded font-mono text-sm" placeholder="Paste CSV content here, or use the file picker above…" />

      <div className="mt-3 flex items-center gap-3">
        <button onClick={uploadCsv} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Uploading…' : 'Upload CSV'}</button>
        <button onClick={() => setCsvText('')} className="px-3 py-2 border rounded">Clear</button>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded ${message.startsWith('Imported') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
