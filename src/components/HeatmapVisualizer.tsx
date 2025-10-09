/**
 * Heatmap Visualizer Component
 * Shows real-time visual updates on floorplan when CDV data is received
 */

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Activity, Eye, EyeOff, RefreshCw } from 'lucide-react'

interface CDVReport {
  id: string
  attendee_id: string
  dwell_time_minutes: number
  active_engagement_status: boolean
  zone_name: string
  zone_coordinates: {
    x: number
    y: number
    width: number
    height: number
  }
  created_at: string
}

interface HeatmapVisualizerProps {
  floorplanImage?: string
  className?: string
}

export const HeatmapVisualizer: React.FC<HeatmapVisualizerProps> = ({ 
  floorplanImage,
  className = ''
}) => {
  const [reports, setReports] = useState<CDVReport[]>([])
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Sample floorplan for demo if none provided
  const defaultFloorplan = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjNmNGY2IiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPCEtLSBSb29tcyAtLT4KICAgIDxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSI4MCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjMzc0MTUxIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iOTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzM3NDE1MSI+U3BvbnNvciBBPC90ZXh0PgogICAgCiAgICA8cmVjdCB4PSIyMDAiIHk9IjUwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiMzNzQxNTEiIHN0cm9rZS13aWR0aD0iMSIvPgogICAgPHRleHQgeD0iMjYwIiB5PSIxMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzM3NDE1MSI+UHJvZHVjdCBEZW1vPC90ZXh0PgogICAgCiAgICA8cmVjdCB4PSI0MDAiIHk9IjUwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9Ijg1IiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiMzNzQxNTEiIHN0cm9rZS13aWR0aD0iMSIvPgogICAgPHRleHQgeD0iNDU1IiB5PSIxMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzM3NDE1MSI+VklQIExvdW5nZTwvdGV4dD4KICAgIAogICAgPCEtLSBFbnRyYW5jZSAtLT4KICAgIDxyZWN0IHg9IjI3NSIgeT0iMzUwIiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNmZGU2OGEiIHN0cm9rZT0iIzk5NjMwMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8dGV4dCB4PSIzMDAiIHk9IjM4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk2MzAzIj5FbnRyYW5jZTwvdGV4dD4KPC9zdmc+"

  // Fetch CDV reports
  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('cdv_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching CDV reports:', error)
    }
  }

  // Draw heatmap on canvas
  const drawHeatmap = () => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !showHeatmap) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Create heatmap data from reports
    const heatmapData = new Map()
    const recentReports = reports.filter(r => {
      const reportTime = new Date(r.created_at)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      return reportTime > fiveMinutesAgo
    })

    // Aggregate activity by zone
    recentReports.forEach(report => {
      if (report.zone_coordinates) {
        const key = `${report.zone_coordinates.x},${report.zone_coordinates.y}`
        const existing = heatmapData.get(key) || { 
          ...report.zone_coordinates, 
          count: 0, 
          engagements: 0,
          zone_name: report.zone_name 
        }
        existing.count += 1
        if (report.active_engagement_status) {
          existing.engagements += 1
        }
        heatmapData.set(key, existing)
      }
    })

    // Draw heatmap zones
    heatmapData.forEach((zoneData) => {
      const intensity = Math.min(zoneData.count / 3, 1) // Max intensity at 3+ activities
      const engagementRatio = zoneData.engagements / zoneData.count
      
      // Color based on activity and engagement
      let color = 'rgba(59, 130, 246, ' // Blue base
      if (engagementRatio > 0.7) {
        color = 'rgba(34, 197, 94, ' // Green for high engagement
      } else if (engagementRatio > 0.3) {
        color = 'rgba(251, 191, 36, ' // Yellow for medium engagement  
      } else {
        color = 'rgba(239, 68, 68, ' // Red for low engagement
      }
      
      // Draw zone with intensity-based opacity
      ctx.fillStyle = color + (0.2 + intensity * 0.6) + ')'
      ctx.fillRect(zoneData.x, zoneData.y, zoneData.width, zoneData.height)
      
      // Draw border
      ctx.strokeStyle = color.replace('rgba', 'rgb').replace(/, [0-9.]+\)/, ')')
      ctx.lineWidth = 2
      ctx.strokeRect(zoneData.x, zoneData.y, zoneData.width, zoneData.height)
      
      // Draw activity indicator
      if (zoneData.count > 0) {
        ctx.fillStyle = color.replace('rgba', 'rgb').replace(/, [0-9.]+\)/, ')')
        ctx.font = 'bold 12px Arial'
        ctx.fillText(
          `${zoneData.count}`, 
          zoneData.x + 5, 
          zoneData.y + 15
        )
        
        // Draw engagement indicator
        ctx.font = '10px Arial'
        ctx.fillText(
          `${Math.round(engagementRatio * 100)}%`, 
          zoneData.x + 5, 
          zoneData.y + zoneData.height - 5
        )
      }
    })

    // Draw live activity pulses for very recent reports (last 10 seconds)
    const veryRecentReports = reports.filter(r => {
      const reportTime = new Date(r.created_at)
      const tenSecondsAgo = new Date(Date.now() - 10 * 1000)
      return reportTime > tenSecondsAgo
    })

    veryRecentReports.forEach(report => {
      if (report.zone_coordinates) {
        const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5 // Pulsing effect
        ctx.strokeStyle = `rgba(34, 197, 94, ${pulse})`
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
        ctx.strokeRect(
          report.zone_coordinates.x - 2, 
          report.zone_coordinates.y - 2, 
          report.zone_coordinates.width + 4, 
          report.zone_coordinates.height + 4
        )
        ctx.setLineDash([])
      }
    })
  }

  // Set up real-time subscription
  useEffect(() => {
    fetchReports()

    const subscription = supabase
      .channel('heatmap_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cdv_reports'
        },
        (payload) => {
          console.log('New CDV report for heatmap:', payload)
          setReports(prev => [payload.new as CDVReport, ...prev.slice(0, 19)])
          setIsLive(true)
          setTimeout(() => setIsLive(false), 3000)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Redraw when reports change
  useEffect(() => {
    const interval = setInterval(drawHeatmap, 100) // Update animation every 100ms
    return () => clearInterval(interval)
  }, [reports, showHeatmap])

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Real-Time Heatmap Visualizer
          </h3>
          <p className="text-sm text-gray-600">
            Visual representation of High-Value Zone activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isLive && (
            <div className="flex items-center text-green-600 animate-pulse">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span className="text-xs font-medium">LIVE UPDATE</span>
            </div>
          )}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            {showHeatmap ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showHeatmap ? 'Hide' : 'Show'} Heatmap
          </button>
          <button
            onClick={fetchReports}
            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
        <img
          ref={imageRef}
          src={floorplanImage || defaultFloorplan}
          alt="Floorplan with Heatmap"
          className="max-w-full h-auto"
          onLoad={() => {
            const canvas = canvasRef.current
            const image = imageRef.current
            if (canvas && image) {
              canvas.width = image.clientWidth
              canvas.height = image.clientHeight
              drawHeatmap()
            }
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 bg-opacity-60 border border-green-600 rounded"></div>
          <span>High Engagement (&gt;70%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-400 bg-opacity-60 border border-yellow-600 rounded"></div>
          <span>Medium Engagement (30-70%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 bg-opacity-60 border border-red-600 rounded"></div>
          <span>Low Engagement (&lt;30%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-green-500 border-dashed rounded"></div>
          <span>Live Activity</span>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        Showing activity for the last 5 minutes • Updates in real-time • {reports.length} total reports
      </div>
    </div>
  )
}