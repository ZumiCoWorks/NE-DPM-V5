import React, { useState } from 'react'

export default function AttendeesUploadPage() {
  const [csvText, setCsvText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const uploadCsv = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const payload = { csv: csvText }
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Attendees Upload</h1>
      <p className="mb-4 text-sm text-gray-600">Paste a CSV of attendees or upload a CSV file. Required columns: email, first_name, last_name, company, job_title, ticket_type, event_id</p>

      <div className="mb-4">
        <input type="file" accept=".csv" onChange={onFileChange} />
      </div>

      <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={12} className="w-full border p-2 rounded" />

      <div className="mt-3 flex items-center gap-3">
        <button onClick={uploadCsv} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Uploading...' : 'Upload CSV'}</button>
        <button onClick={() => setCsvText('')} className="px-3 py-2 border rounded">Clear</button>
      </div>

      {message && <div className="mt-4 p-3 bg-gray-100 rounded">{message}</div>}
    </div>
  )
}
