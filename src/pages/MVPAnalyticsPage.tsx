import React, { useState, useEffect } from 'react'
import { Download, Users, Activity, Target, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Event {
  id: string
  name: string
}

interface BoothAnalytics {
  booth_id: string
  booth_name: string
  sponsor_name: string
  sponsor_tier: string
  total_scans: number
  unique_devices: number
}

// Internal shape while building analytics (unique_devices is a Set)
interface BoothAnalyticsInternal {
  booth_id: string
  booth_name: string
  sponsor_name: string
  sponsor_tier: string
  total_scans: number
  unique_devices: Set<string>
}

interface SummaryStats {
  totalScans: number
  uniqueDevices: number
  activeBooths: number
}

export default function MVPAnalyticsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<BoothAnalytics[]>([])
  const [summary, setSummary] = useState<SummaryStats>({
    totalScans: 0,
    uniqueDevices: 0,
    activeBooths: 0
  })

  // Fetch events on mount
  useEffect(() => {
    fetchEvents()
  }, [])

  // Fetch analytics when event is selected
  useEffect(() => {
    if (selectedEventId) {
      fetchAnalytics(selectedEventId)
    }
  }, [selectedEventId])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .order('created_at', { ascending: false })

      if (error) throw error

      setEvents(data || [])
      if (data && data.length > 0) {
        setSelectedEventId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (eventId: string) => {
    setLoading(true)
    try {
      // Fetch anonymous scans with booth information
      const { data: scansData, error: scansError } = await supabase
        .from('anonymous_scans')
        .select(`
          booth_id,
          device_id,
          booths (
            id,
            name,
            sponsor_name,
            sponsor_tier
          )
        `)
        .eq('event_id', eventId)

      if (scansError) throw scansError

      // Process the data to get analytics per booth
      const boothMap = new Map<string, BoothAnalyticsInternal>()
      const allDevices = new Set<string>()

      type ScanRow = { booth_id?: string | null; booths?: { name?: string; sponsor_name?: string; sponsor_tier?: string } | null; device_id?: string | null }

      scansData?.forEach((scanRaw: unknown) => {
        const scan = scanRaw as ScanRow
        const boothId = scan.booth_id
        const deviceId = scan.device_id
        if (!boothId || !scan.booths || !deviceId) return

        // Track all unique devices across all booths
        allDevices.add(deviceId)

        if (!boothMap.has(boothId)) {
          boothMap.set(boothId, {
            booth_id: boothId,
            booth_name: scan.booths.name || 'Unknown Booth',
            sponsor_name: scan.booths.sponsor_name || 'Unknown Sponsor',
            sponsor_tier: scan.booths.sponsor_tier || 'Standard',
            total_scans: 0,
            unique_devices: new Set<string>()
          })
        }

        const boothData = boothMap.get(boothId)!
        boothData.total_scans++
        boothData.unique_devices.add(deviceId)
      })

      // Convert Sets to final analytics array with counts
      const analyticsArray = Array.from(boothMap.values()).map(b => ({
        booth_id: b.booth_id,
        booth_name: b.booth_name,
        sponsor_name: b.sponsor_name,
        sponsor_tier: b.sponsor_tier,
        total_scans: b.total_scans,
        unique_devices: b.unique_devices.size
      }))

      // Sort by total scans descending
      analyticsArray.sort((a, b) => b.total_scans - a.total_scans)

      setAnalytics(analyticsArray)

      // Calculate summary stats
      const totalScans = analyticsArray.reduce((sum, booth) => sum + booth.total_scans, 0)
      const uniqueDevices = allDevices.size
      const activeBooths = analyticsArray.length

      setSummary({
        totalScans,
        uniqueDevices,
        activeBooths
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (analytics.length === 0) {
      alert('No data to export')
      return
    }

    const selectedEvent = events.find(e => e.id === selectedEventId)
    const eventName = selectedEvent?.name || 'event'

    // Create CSV content
    const headers = ['Booth Name', 'Sponsor Name', 'Sponsor Tier', 'Total Scans', 'Unique Devices']
    const rows = analytics.map(booth => [
      booth.booth_name,
      booth.sponsor_name,
      booth.sponsor_tier,
      booth.total_scans.toString(),
      booth.unique_devices.toString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${eventName}_analytics_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTierColor = (tier: string) => {
    const tierLower = tier.toLowerCase()
    if (tierLower === 'gold') return 'bg-yellow-100 text-yellow-800'
    if (tierLower === 'silver') return 'bg-gray-100 text-gray-800'
    if (tierLower === 'bronze') return 'bg-orange-100 text-orange-800'
    return 'bg-blue-100 text-blue-800'
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MVP Analytics</h1>
          <p className="mt-2 text-gray-600">
            View anonymous scan data and booth engagement metrics.
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={analytics.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </button>
      </div>

      {/* Event Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select an Event --</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Scans</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalScans.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unique Devices</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.uniqueDevices.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Booths</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.activeBooths}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Booth Performance</h2>
              <p className="text-sm text-gray-500 mt-1">Breakdown of engagement by sponsor booth</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : analytics.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No data yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No scan data found for this event. Attendees need to scan booth QR codes first.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booth Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sponsor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Scans
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unique Devices
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.map((booth, index) => {
                      const engagementRate = summary.uniqueDevices > 0
                        ? ((booth.unique_devices / summary.uniqueDevices) * 100).toFixed(1)
                        : '0.0'

                      return (
                        <tr key={booth.booth_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index === 0 && (
                                <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                              )}
                              <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booth.booth_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booth.sponsor_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTierColor(booth.sponsor_tier)}`}>
                              {booth.sponsor_tier}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booth.total_scans.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booth.unique_devices.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {engagementRate}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Insights */}
          {analytics.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Key Insights</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>
                  • <strong>{analytics[0]?.sponsor_name}</strong> is the top-performing sponsor with{' '}
                  <strong>{analytics[0]?.total_scans}</strong> total scans from{' '}
                  <strong>{analytics[0]?.unique_devices}</strong> unique attendees.
                </li>
                <li>
                  • Average scans per booth:{' '}
                  <strong>{Math.round(summary.totalScans / summary.activeBooths)}</strong>
                </li>
                <li>
                  • Each attendee scanned an average of{' '}
                  <strong>{(summary.totalScans / summary.uniqueDevices).toFixed(1)}</strong> booths.
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
