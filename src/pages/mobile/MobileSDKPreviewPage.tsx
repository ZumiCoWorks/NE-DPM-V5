import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Smartphone, Play, Pause, RotateCcw, MapPin, Shield, Zap, Eye, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Venue {
  id: string
  name: string
}

interface PreviewConfig {
  venue_id: string
  user_location: { latitude: number; longitude: number }
  device_type: 'ios' | 'android'
  screen_size: 'small' | 'medium' | 'large'
  network_speed: 'slow' | 'medium' | 'fast'
  ar_enabled: boolean
  emergency_mode: boolean
}

interface PreviewData {
  venue_info: {
    id: string
    name: string
    floors: number
  }
  map_data: {
    optimized_size_kb: number
    load_time_ms: number
    cache_hit: boolean
  }
  emergency_data: {
    nodes_count: number
    paths_count: number
    compliance_score: number
    response_time_ms: number
  }
  ar_campaigns: {
    active_count: number
    assets_size_kb: number
    zones_triggered: number
  }
  performance: {
    api_response_time: number
    memory_usage_mb: number
    battery_impact: 'low' | 'medium' | 'high'
    network_usage_kb: number
  }
}

interface LogData {
  [key: string]: string | number | boolean | null
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'warning' | 'error'
  category: string
  message: string
  data?: LogData
}

function MobileSDKPreviewPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  
  const getToken = async () => {
    // Mock token for preview purposes
    return 'mock-token'
  }
  const [previewConfig, setPreviewConfig] = useState<PreviewConfig>({
    venue_id: '',
    user_location: { latitude: 37.7749, longitude: -122.4194 },
    device_type: 'ios',
    screen_size: 'medium',
    network_speed: 'medium',
    ar_enabled: true,
    emergency_mode: false
  })
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'logs' | 'testing'>('overview')
  const simulationInterval = useRef<NodeJS.Timeout | null>(null)

  const addLog = useCallback((level: LogEntry['level'], category: string, message: string, data?: LogData) => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    }
    setLogs(prev => [newLog, ...prev].slice(0, 100)) // Keep last 100 logs
  }, [])

  const fetchVenues = useCallback(async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/venues', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setVenues(data.venues || [])
        if (data.venues?.length > 0) {
          setPreviewConfig(prev => ({ ...prev, venue_id: data.venues[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
      toast.error('Failed to load venues')
    }
  }, [])

  const fetchPreviewData = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch('/api/mobile-sdk/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(previewConfig)
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewData(data.preview_data)
        addLog('info', 'SDK', 'Preview data loaded successfully', data.preview_data)
      } else {
        addLog('error', 'SDK', 'Failed to load preview data')
      }
    } catch (error) {
      console.error('Error fetching preview data:', error)
      addLog('error', 'SDK', 'Network error while loading preview data')
      toast.error('Failed to load preview data')
    } finally {
      setLoading(false)
    }
  }, [previewConfig, addLog])

  useEffect(() => {
    fetchVenues()
  }, [fetchVenues])

  useEffect(() => {
    if (previewConfig.venue_id && !isSimulating) {
      fetchPreviewData()
    }
  }, [previewConfig.venue_id, isSimulating, fetchPreviewData])

  const startSimulation = () => {
    setIsSimulating(true)
    addLog('info', 'Simulation', 'Started mobile SDK simulation')
    
    simulationInterval.current = setInterval(() => {
      // Simulate real-time updates
      setPreviewData(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          performance: {
            ...prev.performance,
            api_response_time: Math.random() * 200 + 50,
            memory_usage_mb: Math.random() * 50 + 100,
            network_usage_kb: prev.performance.network_usage_kb + Math.random() * 10
          },
          map_data: {
            ...prev.map_data,
            load_time_ms: Math.random() * 500 + 200
          }
        }
      })
      
      // Add random log entries
      const logTypes = ['info', 'warning'] as const
      const categories = ['Map', 'AR', 'Emergency', 'Network']
      const messages = {
        Map: ['Map tiles loaded', 'POI data updated', 'User location updated'],
        AR: ['AR session started', 'Asset loaded', 'Zone triggered'],
        Emergency: ['Emergency data synced', 'Route calculated', 'Compliance checked'],
        Network: ['API call completed', 'Cache hit', 'Data compressed']
      }
      
      if (Math.random() > 0.7) {
        const category = categories[Math.floor(Math.random() * categories.length)]
        const messageList = messages[category as keyof typeof messages]
        const message = messageList[Math.floor(Math.random() * messageList.length)]
        const level = logTypes[Math.floor(Math.random() * logTypes.length)]
        
        addLog(level, category, message)
      }
    }, 2000)
  }

  const stopSimulation = () => {
    setIsSimulating(false)
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current)
      simulationInterval.current = null
    }
    addLog('info', 'Simulation', 'Stopped mobile SDK simulation')
  }

  const resetSimulation = () => {
    stopSimulation()
    setLogs([])
    fetchPreviewData()
    addLog('info', 'Simulation', 'Reset simulation data')
  }

  const downloadLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()} [${log.category}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n\n')
    
    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mobile-sdk-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Logs downloaded successfully')
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBatteryImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const mockPreviewData: PreviewData = {
    venue_info: {
      id: previewConfig.venue_id || 'venue_123',
      name: venues.find(v => v.id === previewConfig.venue_id)?.name || 'Sample Venue',
      floors: 3
    },
    map_data: {
      optimized_size_kb: 245,
      load_time_ms: 320,
      cache_hit: true
    },
    emergency_data: {
      nodes_count: 12,
      paths_count: 8,
      compliance_score: 95,
      response_time_ms: 45
    },
    ar_campaigns: {
      active_count: 3,
      assets_size_kb: 1200,
      zones_triggered: 1
    },
    performance: {
      api_response_time: 120,
      memory_usage_mb: 125,
      battery_impact: 'low',
      network_usage_kb: 450
    }
  }

  const displayData = previewData || mockPreviewData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mobile SDK Preview</h1>
          <p className="text-sm text-gray-500">Test and preview mobile SDK functionality in real-time</p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Smartphone className="h-5 w-5 mr-2 text-blue-500" />
            Simulation Configuration
          </h3>
          <div className="flex items-center space-x-2">
            {!isSimulating ? (
              <button
                onClick={startSimulation}
                disabled={!previewConfig.venue_id || loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Simulation
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Pause className="h-4 w-4 mr-2" />
                Stop Simulation
              </button>
            )}
            <button
              onClick={resetSimulation}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <select
              value={previewConfig.venue_id}
              onChange={(e) => setPreviewConfig(prev => ({ ...prev, venue_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSimulating}
            >
              <option value="">Select a venue</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
            <select
              value={previewConfig.device_type}
              onChange={(e) => setPreviewConfig(prev => ({ ...prev, device_type: e.target.value as 'ios' | 'android' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSimulating}
            >
              <option value="ios">iOS</option>
              <option value="android">Android</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Network Speed</label>
            <select
              value={previewConfig.network_speed}
              onChange={(e) => setPreviewConfig(prev => ({ ...prev, network_speed: e.target.value as 'slow' | 'medium' | 'fast' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSimulating}
            >
              <option value="slow">Slow (2G)</option>
              <option value="medium">Medium (3G)</option>
              <option value="fast">Fast (4G/5G)</option>
            </select>
          </div>
          <div className="flex items-center space-x-4 pt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={previewConfig.ar_enabled}
                onChange={(e) => setPreviewConfig(prev => ({ ...prev, ar_enabled: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isSimulating}
              />
              <span className="ml-2 text-sm text-gray-700">AR Enabled</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={previewConfig.emergency_mode}
                onChange={(e) => setPreviewConfig(prev => ({ ...prev, emergency_mode: e.target.checked }))}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                disabled={isSimulating}
              />
              <span className="ml-2 text-sm text-gray-700">Emergency Mode</span>
            </label>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {isSimulating && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <RefreshCw className="h-5 w-5 text-green-500 animate-spin" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Simulation Running
              </p>
              <p className="text-sm text-green-700">
                Real-time data updates are being simulated for {displayData.venue_info.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: Eye },
              { id: 'performance', name: 'Performance', icon: Zap },
              { id: 'logs', name: 'Logs', icon: RefreshCw },
              { id: 'testing', name: 'Testing', icon: Smartphone }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as 'overview' | 'performance' | 'logs' | 'testing')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                  {tab.id === 'logs' && logs.length > 0 && (
                    <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-1 text-xs rounded-full">
                      {logs.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <MapPin className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Map Data</p>
                      <p className="text-2xl font-bold text-blue-600">{displayData.map_data.optimized_size_kb}KB</p>
                      <p className="text-xs text-blue-700">Load time: {displayData.map_data.load_time_ms}ms</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-red-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-900">Emergency</p>
                      <p className="text-2xl font-bold text-red-600">{displayData.emergency_data.compliance_score}%</p>
                      <p className="text-xs text-red-700">{displayData.emergency_data.nodes_count} nodes, {displayData.emergency_data.paths_count} paths</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Zap className="h-8 w-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-900">AR Campaigns</p>
                      <p className="text-2xl font-bold text-purple-600">{displayData.ar_campaigns.active_count}</p>
                      <p className="text-xs text-purple-700">{displayData.ar_campaigns.assets_size_kb}KB assets</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Smartphone className="h-8 w-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Performance</p>
                      <p className="text-2xl font-bold text-green-600">{displayData.performance.memory_usage_mb}MB</p>
                      <p className="text-xs text-green-700">Battery: {displayData.performance.battery_impact}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Venue Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Venue Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{displayData.venue_info.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Floors:</span>
                    <span className="ml-2 text-gray-600">{displayData.venue_info.floors}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Device:</span>
                    <span className="ml-2 text-gray-600 capitalize">{previewConfig.device_type}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">API Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Response Time</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(displayData.performance.api_response_time, { good: 100, warning: 200 })}`}>
                        {Math.round(displayData.performance.api_response_time)}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Memory Usage</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(displayData.performance.memory_usage_mb, { good: 100, warning: 150 })}`}>
                        {Math.round(displayData.performance.memory_usage_mb)}MB
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Network Usage</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(displayData.performance.network_usage_kb)}KB
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Battery Impact</span>
                      <span className={`text-sm font-medium capitalize ${getBatteryImpactColor(displayData.performance.battery_impact)}`}>
                        {displayData.performance.battery_impact}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Data Loading</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Map Load Time</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(displayData.map_data.load_time_ms, { good: 300, warning: 500 })}`}>
                        {Math.round(displayData.map_data.load_time_ms)}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Emergency Data</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(displayData.emergency_data.response_time_ms, { good: 50, warning: 100 })}`}>
                        {displayData.emergency_data.response_time_ms}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cache Hit Rate</span>
                      <span className="text-sm font-medium text-green-600">
                        {displayData.map_data.cache_hit ? '100%' : '0%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">SDK Logs ({logs.length})</h4>
                <button
                  onClick={downloadLogs}
                  disabled={logs.length === 0}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Logs
                </button>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-400 text-sm">No logs available. Start simulation to see real-time logs.</p>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={`ml-2 ${
                          log.level === 'error' ? 'text-red-400' :
                          log.level === 'warning' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-blue-400 ml-2">[{log.category}]</span>
                        <span className="text-white ml-2">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'testing' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Smartphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">SDK Testing Tools</h3>
                <p className="text-gray-500 mb-4">Advanced testing features coming soon</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50" disabled>
                    <div className="text-sm font-medium text-gray-400">Load Testing</div>
                    <div className="text-xs text-gray-400 mt-1">Simulate high traffic</div>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50" disabled>
                    <div className="text-sm font-medium text-gray-400">Error Simulation</div>
                    <div className="text-xs text-gray-400 mt-1">Test error handling</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MobileSDKPreviewPage