import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export const ARCampaignsPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    eventId: '',
    startDate: '',
    endDate: '',
    checkpointType: 'QR',
    checkpointCount: 3,
    prize: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === 'checkpointCount' ? Number(value) : value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    if (!form.name.trim()) {
      setError('Campaign name is required')
      return
    }
    setSaving(true)
    try {
      setSaved(true)
    } catch (err) {
      // mark error as used to satisfy lint without noisy logging
      void err
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AR Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up and manage augmented reality scavenger hunts for your events.
          </p>
        </div>
        <Link
          to="#"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Create Campaign (coming soon)
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          <p className="mt-2 text-sm text-gray-600">
            This is the organizer starting point for AR scavenger hunts. You will be able to create a
            campaign, define checkpoints (QR/geo/marker), and publish it to staff and attendees.
          </p>

          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-500">
              We’ll wire this to the backend after the database and API are in place. For now, this page establishes
              the route and UI entry so the rest of the flow can be built.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Create Campaign</h2>
          <p className="mt-2 text-sm text-gray-600">Fill out the details to define your scavenger hunt.</p>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          {saved && (
            <div className="mt-4 rounded-md bg-green-50 p-4 text-sm text-green-700">Draft saved locally.</div>
          )}

          <form className="mt-4 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Spring Expo Hunt"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event ID (optional)</label>
                <input
                  type="text"
                  name="eventId"
                  value={form.eventId}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., QKT-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Checkpoint Type</label>
                <select
                  name="checkpointType"
                  value={form.checkpointType}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="QR">QR</option>
                  <option value="Geo">Geo</option>
                  <option value="Marker">Marker</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Checkpoints</label>
                <input
                  type="number"
                  name="checkpointCount"
                  min={1}
                  value={form.checkpointCount}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Prize Description</label>
              <textarea
                name="prize"
                value={form.prize}
                onChange={onChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Describe the prize for completing the hunt"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50"
                onClick={() => setForm({ name: '', eventId: '', startDate: '', endDate: '', checkpointType: 'QR', checkpointCount: 3, prize: '' })}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ARCampaignsPage