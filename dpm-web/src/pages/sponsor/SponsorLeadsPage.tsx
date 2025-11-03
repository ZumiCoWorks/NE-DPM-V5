import React, { useState } from 'react'

export default function SponsorLeadsPage() {
  const [sponsorId, setSponsorId] = useState('')
  const [leads, setLeads] = useState<any[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchLeads = async () => {
    if (!sponsorId) return setMessage('Enter sponsor id')
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/sponsors/${encodeURIComponent(sponsorId)}/leads`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      })
      const json = await res.json()
      if (json && json.success) {
        setLeads(json.leads || [])
      } else {
        setMessage('Failed to fetch leads')
      }
    } catch (err) {
      console.error(err)
      setMessage('Error fetching leads')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sponsor Leads</h1>
      <p className="text-sm text-gray-600 mb-4">Enter sponsor id to view leads and export CSV.</p>

      <div className="flex gap-2 mb-4">
        <input value={sponsorId} onChange={(e) => setSponsorId(e.target.value)} placeholder="sponsor_1" className="border p-2 rounded flex-1" />
        <button onClick={fetchLeads} className="px-3 py-2 bg-blue-600 text-white rounded">{loading ? 'Loading...' : 'Fetch'}</button>
        <a href={`/api/sponsors/${encodeURIComponent(sponsorId)}/leads?format=csv`} className="px-3 py-2 bg-gray-200 rounded" download>Export CSV</a>
      </div>

      {message && <div className="mb-4 text-red-600">{message}</div>}

      <div>
        <h2 className="font-semibold mb-2">Leads ({leads.length})</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left">
              <th className="border p-2">ID</th>
              <th className="border p-2">Attendee</th>
              <th className="border p-2">Staff</th>
              <th className="border p-2">Rating</th>
              <th className="border p-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td className="border p-2">{l.id}</td>
                <td className="border p-2">{l.attendee_id}</td>
                <td className="border p-2">{l.staff_id}</td>
                <td className="border p-2">{l.rating}</td>
                <td className="border p-2">{l.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
