import React, { useState, useEffect } from 'react'
// Removed React Router dependencies
import { ArrowLeft, RefreshCw, TrendingUp, Clock, Users, BarChart3, Download } from 'lucide-react'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Future use for granular engagement tracking
// interface EngagementMetric {
//   id: string
//   event_id: string
//   zone_id: string
//   metric_type: string
//   value: number
//   timestamp: string
//   zone_name?: string
// }

interface VelocityData {
  timestamp: string
  visitors: number
  avgDwellTime: number
  engagementScore: number
  throughput: number
}

interface ZoneEngagement {
  zone_id: string
  zone_name: string
  zone_type: string
  total_visitors: number
  avg_dwell_time: number
  engagement_score: number
  peak_hour: string
  conversion_rate?: number
}

interface EngagementReport {
  velocityData: VelocityData[]
  zoneEngagement: ZoneEngagement[]
  totalMetrics: {
    totalVisitors: number
    avgEngagementScore: number
    peakHour: string
    totalDwellTime: number
  }
  timeRange: string
  lastUpdated: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface EngagementVelocityPageProps {
  eventId?: string
  onNavigateBack?: () => void
}

const EngagementVelocityPage: React.FC<EngagementVelocityPageProps> = ({ eventId, onNavigateBack }) => {
  const [reportData, setReportData] = useState<EngagementReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24h')
  const [selectedMetric, setSelectedMetric] = useState('engagement_score')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchEngagementData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        onNavigateBack?.()
        return
      }

      const params = new URLSearchParams({
        timeRange,
        metric: selectedMetric
      })

      const response = await fetch(`/api/analytics/engagement/${eventId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch engagement data')
      }

      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching engagement data:', error)
      toast.error('Failed to load engagement data')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token || !reportData) return

      const csvData = [
        ['Zone Name', 'Zone Type', 'Total Visitors', 'Avg Dwell Time (s)', 'Engagement Score', 'Peak Hour'],
        ...reportData.zoneEngagement.map(zone => [
          zone.zone_name,
          zone.zone_type,
          zone.total_visitors.toString(),
          zone.avg_dwell_time.toString(),
          zone.engagement_score.toFixed(2),
          zone.peak_hour
        ])
      ]

      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `engagement-report-${eventId}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export report')
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: 'High', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 60) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-100' }
  }

  useEffect(() => {
    fetchEngagementData()
  }, [eventId, timeRange, selectedMetric])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchEngagementData, 60000) // Refresh every minute
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading engagement data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigateBack?.()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 border-l border-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Engagement Velocity Reports</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="1h">Last hour</option>
                <option value="6h">Last 6 hours</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
              
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="engagement_score">Engagement Score</option>
                <option value="dwell_time">Dwell Time</option>
                <option value="visitor_count">Visitor Count</option>
                <option value="throughput">Throughput</option>
              </select>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Auto-refresh</span>
              </label>
              
              <button
                onClick={exportReport}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              
              <button
                onClick={fetchEngagementData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData?.totalMetrics.totalVisitors?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData?.totalMetrics.avgEngagementScore?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Peak Hour</p>
                <p className="text-lg font-semibold text-gray-900">
                  {reportData?.totalMetrics.peakHour || 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Dwell Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDuration(reportData?.totalMetrics.totalDwellTime || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Velocity Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Velocity Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData?.velocityData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${formatTime(value)}`}
                  formatter={(value: number, name: string) => [
                    name === 'avgDwellTime' ? formatDuration(value) : 
                    name === 'engagementScore' ? `${value.toFixed(1)}%` : value,
                    name === 'visitors' ? 'Visitors' :
                    name === 'avgDwellTime' ? 'Avg Dwell Time' :
                    name === 'engagementScore' ? 'Engagement Score' : 'Throughput'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Visitors"
                />
                <Line 
                  type="monotone" 
                  dataKey="engagementScore" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Engagement %"
                />
                <Line 
                  type="monotone" 
                  dataKey="throughput" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Throughput"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Zone Engagement Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Zone Engagement Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData?.zoneEngagement.map((zone, index) => ({
                    name: zone.zone_name,
                    value: zone.total_visitors,
                    fill: COLORS[index % COLORS.length]
                  })) || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData?.zoneEngagement.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Visitors']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Performance Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Zone Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Dwell Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peak Hour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.zoneEngagement.map((zone) => {
                  const engagement = getEngagementLevel(zone.engagement_score)
                  return (
                    <tr key={zone.zone_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{zone.zone_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {zone.zone_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {zone.total_visitors.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(zone.avg_dwell_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {zone.engagement_score.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {zone.peak_hour}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${engagement.bg} ${engagement.color}`}>
                          {engagement.level}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Last Updated */}
        {reportData?.lastUpdated && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Last updated: {new Date(reportData.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EngagementVelocityPage