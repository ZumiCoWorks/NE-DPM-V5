import React, { useState, useEffect } from 'react'
import { Brain, Users, TrendingUp, CheckCircle, RefreshCw, DollarSign, Target, Award } from 'lucide-react'

interface CDVReport {
  id: string
  attendee_id: string
  quicket_attendee_id?: string
  dwell_time_minutes: number
  active_engagement_status: boolean
  zone_name: string
  created_at: string
  revenue_impact?: {
    sponsor: string
    hourly_rate: number
    estimated_value: number
  }
}

interface ZoneRevenue {
  zone_name: string
  sponsor: string
  visit_count: number
  total_revenue: number
  avg_dwell_minutes: number
  engagement_rate: number
  hourly_rate: number
}

interface RevenueAttribution {
  total_revenue: number
  currency: string
  zones: ZoneRevenue[]
  summary: {
    total_visits: number
    zones_tracked: number
    highest_revenue_zone: string
    highest_engagement_zone: string
  }
}

export const CDVDashboard: React.FC = () => {
  const [reports, setReports] = useState<CDVReport[]>([])
  const [revenueData, setRevenueData] = useState<RevenueAttribution | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRevenueView, setShowRevenueView] = useState(false)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/cdv-report')
      const data = await response.json()
      if (data.success) {
        setReports(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching CDV reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRevenueAttribution = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/cdv-report/revenue-attribution/event-1')
      const data = await response.json()
      if (data.success) {
        setRevenueData(data)
      }
    } catch (err) {
      console.error('Error fetching revenue attribution:', err)
    }
  }

  useEffect(() => {
    fetchReports()
    fetchRevenueAttribution()
    const interval = setInterval(() => {
      fetchReports()
      fetchRevenueAttribution()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const totalReports = reports.length
  const activeEngagements = reports.filter(r => r.active_engagement_status).length
  const engagementRate = totalReports > 0 ? Math.round((activeEngagements / totalReports) * 10000) / 100 : 0
  const totalRevenue = revenueData?.total_revenue || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="mr-2 h-6 w-6 text-blue-600" />
            CDV Intelligence Dashboard 🇿🇦
          </h2>
          <p className="text-gray-600 mt-1">Real-time Contextual Dwell Verification &amp; Revenue Attribution</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Quicket SA Connected
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-xl font-bold text-gray-900">{totalReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Engagements</p>
              <p className="text-xl font-bold text-gray-900">{activeEngagements}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
              <p className="text-xl font-bold text-gray-900">{engagementRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow p-6">
          <div className="flex items-center text-white">
            <div className="p-2 bg-white bg-opacity-30 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Total Revenue</p>
              <p className="text-xl font-bold">R{totalRevenue.toLocaleString()}</p>
              <p className="text-xs opacity-90">South African Rand</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setShowRevenueView(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !showRevenueView ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Target className="inline h-4 w-4 mr-1" />
            Live Reports
          </button>
          <button
            onClick={() => setShowRevenueView(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showRevenueView ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Award className="inline h-4 w-4 mr-1" />
            Revenue Attribution
          </button>
        </div>
      </div>

      {!showRevenueView ? (
        /* Live Reports Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Live CDV Reports</h3>
            <p className="text-sm text-gray-600 mt-1">Real-time engagement data from B2C app</p>
          </div>

          {reports.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No CDV Reports Yet</h3>
              <p className="text-gray-600 mb-4">Send test data to /api/cdv-report to see results</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quicket ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dwell Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.slice(0, 50).map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {report.quicket_attendee_id || report.attendee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.zone_name || 'Unknown'}
                        {report.revenue_impact && (
                          <div className="text-xs text-gray-500">{report.revenue_impact.sponsor}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.dwell_time_minutes.toFixed(1)}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          report.active_engagement_status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {report.active_engagement_status ? 'ACTIVE' : 'PASSIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.revenue_impact ? (
                          <span className="text-green-600">R{report.revenue_impact.estimated_value.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Revenue Attribution View */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-600" />
              Revenue Attribution by HVZ (High-Value Zones)
            </h3>
            <p className="text-sm text-gray-600 mt-1">Sponsor ROI tracking for South African events</p>
          </div>

          {!revenueData || revenueData.zones.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Revenue Data Yet</h3>
              <p className="text-gray-600">Zone-based revenue tracking will appear here</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">Top Revenue Zone</p>
                  <p className="text-lg font-bold text-gray-900">{revenueData.summary.highest_revenue_zone}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">Top Engagement Zone</p>
                  <p className="text-lg font-bold text-gray-900">{revenueData.summary.highest_engagement_zone}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">Zones Tracked</p>
                  <p className="text-lg font-bold text-gray-900">{revenueData.summary.zones_tracked}</p>
                </div>
              </div>

              {/* Zone Revenue Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone / Sponsor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visits</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Dwell</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {revenueData.zones.map((zone, index) => (
                      <tr key={index} className="hover:bg-yellow-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{zone.zone_name}</div>
                          <div className="text-xs text-gray-500">{zone.sponsor}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {zone.visit_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {zone.avg_dwell_minutes.toFixed(1)} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ maxWidth: '100px' }}>
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${zone.engagement_rate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-700">{zone.engagement_rate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          R{zone.hourly_rate.toFixed(2)}/hr
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-green-600">
                            R{zone.total_revenue.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-yellow-50">
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        TOTAL REVENUE:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl font-bold text-green-600">
                          R{revenueData.total_revenue.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
