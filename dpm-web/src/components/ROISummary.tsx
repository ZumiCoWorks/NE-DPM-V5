import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from './ui/loadingSpinner'
import { useDemoMode } from '../contexts/DemoModeContext'

interface LeadRow {
  id: string
  created_at?: string
  attendee_name?: string | null
  attendee_email?: string | null
  sponsor_id?: string | null
  user_id?: string | null
  ticket_id?: string | null
}

// Mock data for demo mode
const MOCK_LEADS: LeadRow[] = [
  { id: '1', created_at: new Date().toISOString(), attendee_name: 'John Smith', attendee_email: 'john@example.com', sponsor_id: 'Red Bull', user_id: 'Staff #1' },
  { id: '2', created_at: new Date(Date.now() - 3600000).toISOString(), attendee_name: 'Sarah Johnson', attendee_email: 'sarah@example.com', sponsor_id: 'Samsung', user_id: 'Staff #2' },
  { id: '3', created_at: new Date(Date.now() - 7200000).toISOString(), attendee_name: 'Mike Chen', attendee_email: 'mike@example.com', sponsor_id: 'Red Bull', user_id: 'Staff #1' },
  { id: '4', created_at: new Date(Date.now() - 10800000).toISOString(), attendee_name: 'Emma Davis', attendee_email: 'emma@example.com', sponsor_id: 'Coca-Cola', user_id: 'Staff #3' },
  { id: '5', created_at: new Date(Date.now() - 14400000).toISOString(), attendee_name: 'James Wilson', attendee_email: 'james@example.com', sponsor_id: 'Samsung', user_id: 'Staff #2' },
  { id: '6', created_at: new Date(Date.now() - 18000000).toISOString(), attendee_name: 'Lisa Brown', attendee_email: 'lisa@example.com', sponsor_id: 'Red Bull', user_id: 'Staff #1' },
  { id: '7', created_at: new Date(Date.now() - 21600000).toISOString(), attendee_name: 'David Lee', attendee_email: 'david@example.com', sponsor_id: 'Apple', user_id: 'Staff #4' },
  { id: '8', created_at: new Date(Date.now() - 25200000).toISOString(), attendee_name: 'Amy White', attendee_email: 'amy@example.com', sponsor_id: 'Coca-Cola', user_id: 'Staff #3' },
]

function startOfTodayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export const ROISummary: React.FC = () => {
  const { demoMode } = useDemoMode()
  const [loading, setLoading] = useState(true)
  const [totalLeads, setTotalLeads] = useState<number>(0)
  const [leadsToday, setLeadsToday] = useState<number>(0)
  const [recentLeads, setRecentLeads] = useState<LeadRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // Use mock data if demo mode is enabled
    if (demoMode) {
      setLoading(false)
      setTotalLeads(437) // Mock total
      setLeadsToday(23) // Mock today count
      setRecentLeads(MOCK_LEADS)
      setError(null)
      return
    }

    ; (async () => {
      try {
        setLoading(true)
        setError(null)

        if (!supabase) {
          if (mounted) setError('Supabase client not initialized.')
          return
        }

        // Total qualified leads
        const { data: totalRows, error: totalErr } = await supabase
          .from('qualified_leads')
          .select('id')

        if (totalErr) throw totalErr
        if (mounted) setTotalLeads(Array.isArray(totalRows) ? totalRows.length : 0)

        // Leads today
        const { data: todayRows, error: todayErr } = await supabase
          .from('qualified_leads')
          .select('id, created_at')

        if (todayErr) throw todayErr
        const todayStart = new Date(startOfTodayISO()).getTime()
        const todayCount = Array.isArray(todayRows)
          ? (todayRows as { created_at?: string }[]).filter(r => {
            const ts = r.created_at ? new Date(r.created_at).getTime() : 0
            return ts >= todayStart
          }).length
          : 0
        if (mounted) setLeadsToday(todayCount)

        // Recent leads list (limit 10)
        const { data: recent, error: recentErr } = await supabase
          .from('qualified_leads')
          .select('id, created_at, attendee_name, attendee_email, sponsor_id, user_id, ticket_id')
          .order('created_at', { ascending: false })
          .limit(10)

        if (recentErr) throw recentErr
        if (mounted) setRecentLeads((recent as LeadRow[]) || [])
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.warn('ROI Summary fetch error', msg)
        if (mounted) setError('Unable to load ROI data. Check Supabase connection and tables.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [demoMode])

  const bySponsor = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const l of recentLeads) {
      const key = l.sponsor_id || 'unknown'
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [recentLeads])

  const byStaff = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const l of recentLeads) {
      const key = l.user_id || 'unknown'
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [recentLeads])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">ROI Summary (MVP)</h2>
          {demoMode && (
            <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
              DEMO MODE
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Based on staff-mobile lead capture and attendee-mobile navigation flows. Shows total leads, today’s leads, and recent activity.
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Phase 3 Preview Banner (NEW) */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 shadow-lg text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">Phase 3: AR-Enhanced Analytics</h3>
              <p className="text-white/80 text-sm">See how AR navigation unlocks deeper sponsor insights</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full whitespace-nowrap">
            PREVIEW
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AR Engagement Rate */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-xs font-medium">AR Engagement Rate</p>
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-3xl font-bold">89%</p>
            <p className="text-white/60 text-xs mt-1">Attendees used AR wayfinding</p>
          </div>

          {/* Booth Visit Heatmap */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-xs font-medium">Avg. Booth Dwell Time</p>
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">4.2min</p>
            <p className="text-white/60 text-xs mt-1">+87% vs. non-AR guided visitors</p>
          </div>

          {/* Sponsor ROI */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-xs font-medium">AR-Driven Conversions</p>
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">63%</p>
            <p className="text-white/60 text-xs mt-1">Of AR users became qualified leads</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium mb-1">What Phase 3 Unlocks:</p>
              <ul className="text-sm text-white/80 space-y-1">
                <li>• <strong>Booth Visit Tracking:</strong> See which sponsors get the most AR-guided traffic</li>
                <li>• <strong>Journey Analytics:</strong> Map attendee flow patterns from entry to sponsor booths</li>
                <li>• <strong>Engagement Heatmaps:</strong> Visual data on where attendees spend time</li>
                <li>• <strong>Conversion Attribution:</strong> Prove AR-driven leads convert 3x better</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Current Phase 1 Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <p className="text-sm font-medium text-gray-500">Total Qualified Leads</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{totalLeads}</p>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <p className="text-sm font-medium text-gray-500">Leads Captured Today</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{leadsToday}</p>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Leads</h3>
          {recentLeads.length === 0 ? (
            <p className="text-gray-500">No leads captured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sponsor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{l.attendee_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{l.attendee_email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.sponsor_id || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.user_id || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.created_at ? new Date(l.created_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Simple breakdowns from recent data */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Recent Leads by Sponsor</h3>
            <ul className="space-y-1">
              {Object.entries(bySponsor).map(([sponsor, count]) => (
                <li key={sponsor} className="text-sm text-gray-700">{sponsor}: {count}</li>
              ))}
              {Object.keys(bySponsor).length === 0 && (
                <li className="text-sm text-gray-500">No data</li>
              )}
            </ul>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Recent Leads by Staff</h3>
            <ul className="space-y-1">
              {Object.entries(byStaff).map(([staff, count]) => (
                <li key={staff} className="text-sm text-gray-700">{staff}: {count}</li>
              ))}
              {Object.keys(byStaff).length === 0 && (
                <li className="text-sm text-gray-500">No data</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ROISummary