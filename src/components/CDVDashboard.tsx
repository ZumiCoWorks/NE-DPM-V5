/**
 * CDV (Contextual Dwell Verification) Dashboard Component
 * Real-time intelligence display for B2B organizers and sponsors
 */

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Brain, Users, Clock, TrendingUp, AlertCircle, CheckCircle, Activity } from 'lucide-react'
import { HeatmapVisualizer } from './HeatmapVisualizer'

interface CDVReport {
  id: string
  attendee_id: string
  dwell_time_minutes: number
  active_engagement_status: boolean
  zone_name: string
  zone_coordinates: any
  created_at: string
  event_id?: string
  venue_id?: string
  session_id?: string
}

interface CDVStats {
  totalReports: number
  activeEngagements: number
  engagementRate: number
  avgDwellTime: number
  recentActivity: number
}

export const CDVDashboard: React.FC = () => {
  const [reports, setReports] = useState<CDVReport[]>([])
  const [stats, setStats] = useState<CDVStats>({
    totalReports: 0,
    activeEngagements: 0,
    engagementRate: 0,
    avgDwellTime: 0,
    recentActivity: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  // Fetch initial CDV reports
  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cdv_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setReports(data || [])
      calculateStats(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching CDV reports:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }, [])

  // Calculate statistics from reports
  const calculateStats = (reportData: CDVReport[]) => {
    const totalReports = reportData.length
    const activeEngagements = reportData.filter(r => r.active_engagement_status).length
    const engagementRate = totalReports > 0 ? (activeEngagements / totalReports) * 100 : 0
    const avgDwellTime = totalReports > 0 
      ? reportData.reduce((sum, r) => sum + r.dwell_time_minutes, 0) / totalReports 
      : 0

    // Recent activity (last 5 minutes for demo purposes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentActivity = reportData.filter(r => new Date(r.created_at) > fiveMinutesAgo).length

    setStats({
      totalReports,
      activeEngagements,
      engagementRate: Math.round(engagementRate * 100) / 100,
      avgDwellTime: Math.round(avgDwellTime * 100) / 100,
      recentActivity
    })
  }

  // Set up real-time subscription
  useEffect(() => {
    fetchReports()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('cdv_reports_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cdv_reports'
        },
        (payload) => {
          console.log('New CDV report received:', payload)
          const newReport = payload.new as CDVReport
          
          setReports(prev => [newReport, ...prev.slice(0, 49)]) // Keep latest 50
          calculateStats([newReport, ...reports])
          setIsLive(true)
          
          // Show live indicator for 3 seconds
          setTimeout(() => setIsLive(false), 3000)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchReports, reports])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading CDV Intelligence...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="mr-2 h-6 w-6 text-blue-600" />
            Verified Event Intelligence (VEI)
          </h2>
          <p className="text-gray-600 mt-1">
            Real-time Contextual Dwell Verification dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isLive && (
            <div className="flex items-center text-green-600 animate-pulse">
              <Activity className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">LIVE</span>
            </div>
          )}
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Quicket EMS API Connected (Mock)
          </div>
        </div>
      </div>

      {/* Quicket EMS Integration Status */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              External EMS Integration Status
            </h3>
            <p className="text-blue-700 text-sm mb-3">
              Validating API-First, non-EMS strategy with live attendee data source
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-green-700">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">Quicket API</span>
              </div>
              <div className="text-gray-600">•</div>
              <div className="text-blue-700">
                <span className="font-medium">Status:</span> Connected & Streaming
              </div>
              <div className="text-gray-600">•</div>
              <div className="text-blue-700">
                <span className="font-medium">Data Type:</span> Real-time Attendee IDs
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">EMS Connected</div>
              <div className="text-xs text-gray-500">Mock Integration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalReports}</p>
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
              <p className="text-xl font-bold text-gray-900">{stats.activeEngagements}</p>
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
              <p className="text-xl font-bold text-gray-900">{stats.engagementRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg Dwell Time</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgDwellTime}m</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Activity className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-xl font-bold text-gray-900">{stats.recentActivity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Error: {error}</span>
        </div>
      )}

      {/* CDV Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Live CDV Reports</h3>
          <p className="text-sm text-gray-600 mt-1">
            Real-time engagement data from B2C mobile app
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No CDV Reports Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Waiting for B2C app engagement triggers...
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Test the API:</strong> Send a POST request to{' '}
                <code className="bg-blue-100 px-1 rounded">/api/cdv-report</code>{' '}
                to see real-time updates here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dwell Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report, index) => (
                  <tr 
                    key={report.id} 
                    className={`${index === 0 && isLive ? 'bg-green-50 animate-pulse' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.attendee_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.zone_name || 'High-Value Zone'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.dwell_time_minutes}m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.active_engagement_status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {report.active_engagement_status ? 'YES' : 'NO'}
                      </span>
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

      {/* Heatmap Visualizer */}
      <div className="mt-8">
        <HeatmapVisualizer />
      </div>
    </div>
  )
}