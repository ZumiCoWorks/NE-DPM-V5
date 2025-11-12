import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface LeadRow {
  id: string
  created_at?: string
  attendee_name?: string | null
  attendee_email?: string | null
  sponsor_id?: string | null
  user_id?: string | null
  ticket_id?: string | null
}

function startOfTodayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export const ROISummary: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [totalLeads, setTotalLeads] = useState<number>(0)
  const [leadsToday, setLeadsToday] = useState<number>(0)
  const [recentLeads, setRecentLeads] = useState<LeadRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
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
  }, [])

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
        <h2 className="text-2xl font-bold text-gray-900">ROI Summary (MVP)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Based on staff-mobile lead capture and attendee-mobile navigation flows. Shows total leads, today’s leads, and recent activity.
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Stats */}
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