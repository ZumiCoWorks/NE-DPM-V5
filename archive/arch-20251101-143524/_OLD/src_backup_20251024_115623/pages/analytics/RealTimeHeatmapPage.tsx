import React, { useState, useEffect, useRef } from 'react'
// Removed React Router dependencies
import { ArrowLeft, RefreshCw, Users, Clock, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface HeatZone {
  id: string
  name: string
  zone_type: string
  polygon_coordinates: { x: number; y: number }[]
  capacity?: number
}

interface VisitorData {
  id: string
  visitor_id: string
  x_coordinate: number
  y_coordinate: number
  timestamp: string
  dwell_time_seconds: number
  zone_id?: string
  heat_zones?: HeatZone
}

interface HeatmapData {
  zones: HeatZone[]
  visitorData: VisitorData[]
  timeRange: string
  totalVisitors: number
  lastUpdated: string
}

interface RealTimeHeatmapPageProps {
  eventId?: string
  onNavigateBack?: () => void
}

const RealTimeHeatmapPage: React.FC<RealTimeHeatmapPageProps> = ({ eventId, onNavigateBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('1h')
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchHeatmapData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        onNavigateBack?.()
        return
      }

      const params = new URLSearchParams({
        timeRange,
        ...(selectedZone && { zoneId: selectedZone })
      })

      const response = await fetch(`/api/analytics/heatmap/${eventId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data')
      }

      const data = await response.json()
      setHeatmapData(data)
    } catch (error) {
      console.error('Error fetching heatmap data:', error)
      toast.error('Failed to load heatmap data')
    } finally {
      setLoading(false)
    }
  }

  const drawHeatmap = () => {
    if (!heatmapData || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas size
    canvas.width = 800
    canvas.height = 600

    // Draw heat zones
    heatmapData.zones.forEach(zone => {
      if (!zone.polygon_coordinates || zone.polygon_coordinates.length === 0) return

      ctx.beginPath()
      const firstPoint = zone.polygon_coordinates[0]
      ctx.moveTo(firstPoint.x, firstPoint.y)
      
      zone.polygon_coordinates.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y)
      })
      
      ctx.closePath()
      
      // Zone background color based on type
      const zoneColors: { [key: string]: string } = {
        entrance: 'rgba(34, 197, 94, 0.2)',
        exit: 'rgba(239, 68, 68, 0.2)',
        booth: 'rgba(59, 130, 246, 0.2)',
        stage: 'rgba(168, 85, 247, 0.2)',
        food: 'rgba(245, 158, 11, 0.2)',
        restroom: 'rgba(156, 163, 175, 0.2)',
        general: 'rgba(107, 114, 128, 0.1)'
      }
      
      ctx.fillStyle = zoneColors[zone.zone_type] || zoneColors.general
      ctx.fill()
      
      ctx.strokeStyle = selectedZone === zone.id ? '#3b82f6' : '#6b7280'
      ctx.lineWidth = selectedZone === zone.id ? 3 : 1
      ctx.stroke()
      
      // Zone label
      const centerX = zone.polygon_coordinates.reduce((sum, p) => sum + p.x, 0) / zone.polygon_coordinates.length
      const centerY = zone.polygon_coordinates.reduce((sum, p) => sum + p.y, 0) / zone.polygon_coordinates.length
      
      ctx.fillStyle = '#1f2937'
      ctx.font = '12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(zone.name, centerX, centerY)
    })

    // Draw visitor data as heat points
    const visitorsByZone: { [key: string]: VisitorData[] } = {}
    heatmapData.visitorData.forEach(visitor => {
      const zoneId = visitor.zone_id || 'unknown'
      if (!visitorsByZone[zoneId]) {
        visitorsByZone[zoneId] = []
      }
      visitorsByZone[zoneId].push(visitor)
    })

    // Draw heat intensity
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(visitorsByZone).forEach(([zoneId, visitors]) => {
      if (visitors.length === 0) return

      visitors.forEach(visitor => {
        const intensity = Math.min(visitor.dwell_time_seconds / 300, 1) // Normalize to 0-1 based on 5 min max
        const radius = 3 + (intensity * 7) // 3-10px radius
        
        ctx.beginPath()
        ctx.arc(visitor.x_coordinate, visitor.y_coordinate, radius, 0, 2 * Math.PI)
        
        // Heat color gradient: blue (low) -> yellow -> red (high)
        const hue = (1 - intensity) * 240 // 240 = blue, 0 = red
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.6)`
        ctx.fill()
      })
    })
  }

  const handleZoneClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!heatmapData || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Check which zone was clicked
    for (const zone of heatmapData.zones) {
      if (!zone.polygon_coordinates) continue
      
      // Simple point-in-polygon check
      let inside = false
      const points = zone.polygon_coordinates
      
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        if (((points[i].y > y) !== (points[j].y > y)) &&
            (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
          inside = !inside
        }
      }
      
      if (inside) {
        setSelectedZone(selectedZone === zone.id ? null : zone.id)
        break
      }
    }
  }

  useEffect(() => {
    fetchHeatmapData()
  }, [eventId, timeRange, selectedZone])

  useEffect(() => {
    if (heatmapData) {
      drawHeatmap()
    }
  }, [heatmapData, selectedZone])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHeatmapData, 30000) // Refresh every 30 seconds
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [autoRefresh])

  const getZoneStats = (zoneId: string) => {
    if (!heatmapData) return null
    
    const zoneVisitors = heatmapData.visitorData.filter(v => v.zone_id === zoneId)
    const uniqueVisitors = new Set(zoneVisitors.map(v => v.visitor_id)).size
    const avgDwellTime = zoneVisitors.length > 0 
      ? zoneVisitors.reduce((sum, v) => sum + v.dwell_time_seconds, 0) / zoneVisitors.length 
      : 0
    
    return {
      visitors: uniqueVisitors,
      avgDwellTime: Math.round(avgDwellTime),
      totalInteractions: zoneVisitors.length
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading heatmap data...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">Real-Time Heatmap</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="15m">Last 15 minutes</option>
                <option value="1h">Last hour</option>
                <option value="6h">Last 6 hours</option>
                <option value="24h">Last 24 hours</option>
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
                onClick={fetchHeatmapData}
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stats Cards */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {heatmapData?.totalVisitors || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Time Range</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {timeRange === '15m' ? '15 min' : 
                     timeRange === '1h' ? '1 hour' :
                     timeRange === '6h' ? '6 hours' : '24 hours'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Zones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {heatmapData?.zones.length || 0}
                  </p>
                </div>
              </div>
            </div>
            
            {heatmapData?.lastUpdated && (
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Last updated:</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(heatmapData.lastUpdated).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>

          {/* Heatmap Canvas */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Visitor Heatmap</h3>
                <p className="text-sm text-gray-600">
                  Click on zones to filter data. Heat intensity shows visitor dwell time.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onClick={handleZoneClick}
                  className="w-full h-auto cursor-pointer"
                  style={{ maxHeight: '600px' }}
                />
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                    <span>Low Activity</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                    <span>Medium Activity</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                    <span>High Activity</span>
                  </div>
                </div>
                
                {selectedZone && (
                  <div className="text-blue-600 font-medium">
                    Zone selected: {heatmapData?.zones.find(z => z.id === selectedZone)?.name}
                  </div>
                )}
              </div>
            </div>
            
            {/* Zone Details */}
            {selectedZone && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Zone Analytics</h4>
                {(() => {
                  const stats = getZoneStats(selectedZone)
                  // Future use for zone-specific metadata
                  // const zone = heatmapData?.zones.find(z => z.id === selectedZone)
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{stats?.visitors || 0}</p>
                        <p className="text-sm text-gray-600">Unique Visitors</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{stats?.avgDwellTime || 0}s</p>
                        <p className="text-sm text-gray-600">Avg. Dwell Time</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{stats?.totalInteractions || 0}</p>
                        <p className="text-sm text-gray-600">Total Interactions</p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeHeatmapPage