import React, { useState, useEffect } from 'react'
// Removed React Router dependencies
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Clock, Users, MapPin, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface BottleneckAlert {
  id: string
  event_id: string
  zone_id: string
  alert_type: 'congestion' | 'capacity_exceeded' | 'slow_movement' | 'emergency_path_blocked'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  current_occupancy: number
  max_capacity: number
  created_at: string
  resolved_at?: string
  resolved_by?: string
  zone_name?: string
  zone_type?: string
}

interface AlertStats {
  total: number
  active: number
  resolved: number
  critical: number
  avgResolutionTime: number
}

interface BottleneckData {
  alerts: BottleneckAlert[]
  stats: AlertStats
  lastUpdated: string
}

interface BottleneckAlertPageProps {
  eventId?: string
  onNavigateBack?: () => void
}

const BottleneckAlertPage: React.FC<BottleneckAlertPageProps> = ({ 
  eventId,
  onNavigateBack 
}) => {
  const [alertData, setAlertData] = useState<BottleneckData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchBottleneckData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        onNavigateBack?.()
        return
      }

      const params = new URLSearchParams()
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)

      const response = await fetch(`/api/analytics/bottlenecks/${eventId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bottleneck data')
      }

      const data = await response.json()
      setAlertData(data)
    } catch (error) {
      console.error('Error fetching bottleneck data:', error)
      toast.error('Failed to load bottleneck alerts')
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/analytics/bottlenecks/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to resolve alert')
      }

      toast.success('Alert resolved successfully')
      fetchBottleneckData() // Refresh data
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast.error('Failed to resolve alert')
    }
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200',
          icon: '🚨',
          label: 'Critical'
        }
      case 'high':
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-100',
          border: 'border-orange-200',
          icon: '⚠️',
          label: 'High'
        }
      case 'medium':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          border: 'border-yellow-200',
          icon: '⚡',
          label: 'Medium'
        }
      case 'low':
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          border: 'border-blue-200',
          icon: 'ℹ️',
          label: 'Low'
        }
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          icon: '📋',
          label: 'Unknown'
        }
    }
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'congestion': return 'Congestion'
      case 'capacity_exceeded': return 'Capacity Exceeded'
      case 'slow_movement': return 'Slow Movement'
      case 'emergency_path_blocked': return 'Emergency Path Blocked'
      default: return type
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffMs = now.getTime() - alertTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const getOccupancyPercentage = (current: number, max: number) => {
    return max > 0 ? Math.round((current / max) * 100) : 0
  }

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-100'
    if (percentage >= 80) return 'text-orange-600 bg-orange-100'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  useEffect(() => {
    fetchBottleneckData()
  }, [eventId, selectedSeverity, selectedStatus])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchBottleneckData, 15000) // Refresh every 15 seconds
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [autoRefresh])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading bottleneck alerts...</p>
        </div>
      </div>
    )
  }

  const filteredAlerts = alertData?.alerts || []
  // const activeAlerts = filteredAlerts.filter(alert => !alert.resolved_at) // Future use for filtering
  const criticalAlerts = filteredAlerts.filter(alert => alert.severity === 'critical' && !alert.resolved_at)

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
              <h1 className="text-xl font-semibold text-gray-900">Bottleneck Alert Dashboard</h1>
              {criticalAlerts.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              
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
                onClick={fetchBottleneckData}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alertData?.stats.total || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-orange-600">
                  {alertData?.stats.active || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {alertData?.stats.resolved || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {alertData?.stats.critical || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDuration(alertData?.stats.avgResolutionTime || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? 's' : ''} Require Immediate Attention
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  These alerts may impact visitor safety or event operations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Bottleneck Alerts ({filteredAlerts.length})
            </h3>
          </div>
          
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts Found</h3>
              <p className="text-gray-600">
                {selectedSeverity !== 'all' || selectedStatus !== 'all' 
                  ? 'No alerts match your current filters.' 
                  : 'All systems are running smoothly!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAlerts.map((alert) => {
                const severityConfig = getSeverityConfig(alert.severity)
                const occupancyPercentage = getOccupancyPercentage(alert.current_occupancy, alert.max_capacity)
                const occupancyColor = getOccupancyColor(occupancyPercentage)
                
                return (
                  <div key={alert.id} className={`p-6 ${alert.severity === 'critical' && !alert.resolved_at ? 'bg-red-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-lg">{severityConfig.icon}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityConfig.bg} ${severityConfig.color}`}>
                            {severityConfig.label}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getAlertTypeLabel(alert.alert_type)}
                          </span>
                          {alert.resolved_at && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{alert.message}</h4>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{alert.zone_name || `Zone ${alert.zone_id}`}</span>
                            {alert.zone_type && (
                              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs capitalize">
                                {alert.zone_type}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>
                              {alert.current_occupancy}/{alert.max_capacity} 
                              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${occupancyColor}`}>
                                {occupancyPercentage}%
                              </span>
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{formatTimeAgo(alert.created_at)}</span>
                          </div>
                        </div>
                        
                        {alert.resolved_at && (
                          <div className="text-sm text-green-600">
                            Resolved {formatTimeAgo(alert.resolved_at)}
                            {alert.resolved_by && ` by ${alert.resolved_by}`}
                          </div>
                        )}
                      </div>
                      
                      {!alert.resolved_at && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="ml-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Last Updated */}
        {alertData?.lastUpdated && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Last updated: {new Date(alertData.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BottleneckAlertPage