import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import {
  ArrowLeft,
  Save,
  Move,
  MapPin,
  Trash2,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react'
import { cn } from '../../lib/utils'
const UnifiedFloorplanEditor = React.lazy(() => import('../../components/FloorplanEditor'))

interface NavigationPoint {
  id: string
  x: number
  y: number
  type: 'entrance' | 'exit' | 'booth' | 'stage' | 'restroom' | 'food' | 'info'
  label: string
  description?: string
}

interface Floorplan {
  id: string
  name: string
  venue_id: string
  image_url: string | null
  width: number
  height: number
  scale: number
}

type Tool = 'select' | 'add-point' | 'move'
type PointType = NavigationPoint['type']

export const FloorplanEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  // Removed unused profile variable
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [floorplan, setFloorplan] = useState<Floorplan | null>(null)
  const [navigationPoints, setNavigationPoints] = useState<NavigationPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool>('select')
  const [selectedPointType, setSelectedPointType] = useState<PointType>('entrance')
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  // Removed unused drag state variables

  const fetchFloorplan = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      
      // Fetch floorplan
      const { data: floorplanData, error: floorplanError } = await supabase
        .from('floorplans')
        .select('*')
        .eq('id', id)
        .single()

      if (floorplanError) {
        console.error('Error fetching floorplan:', floorplanError)
        return
      }

      setFloorplan(floorplanData)

      // Fetch navigation points
      const { data: pointsData, error: pointsError } = await supabase
        .from('navigation_points')
        .select('*')
        .eq('floorplan_id', id)

      if (pointsError) {
        console.error('Error fetching navigation points:', pointsError)
        return
      }

      // Map database fields to NavigationPoint interface
      const mappedPoints: NavigationPoint[] = ((pointsData as unknown[]) || []).map((pointRaw: unknown) => {
        const point = pointRaw as Record<string, unknown>
        return {
          id: String(point['id'] ?? ''),
          x: Number(point['x_coordinate'] ?? 0),
          y: Number(point['y_coordinate'] ?? 0),
          type: (point['point_type'] === 'landmark' ? 'stage' :
                 point['point_type'] === 'amenity' ? 'restroom' :
                 (point['point_type'] as NavigationPoint['type'] || 'booth')) as NavigationPoint['type'],
          label: String(point['name'] ?? ''),
          description: point['description'] ? String(point['description']) : undefined
        }
      })
      
      setNavigationPoints(mappedPoints)
    } catch (error) {
      console.error('Error fetching floorplan data:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !floorplan) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context
    ctx.save()

    // Apply zoom and pan
    ctx.scale(zoom, zoom)
    ctx.translate(pan.x, pan.y)

    // Draw background grid
    drawGrid(ctx, canvas.width / zoom, canvas.height / zoom)

    // Draw floorplan image if available
    if (floorplan.image_url) {
      // In a real implementation, you would load and draw the image
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, floorplan.width, floorplan.height)
      ctx.strokeStyle = '#d1d5db'
      ctx.strokeRect(0, 0, floorplan.width, floorplan.height)
    } else {
      // Draw placeholder rectangle
      ctx.fillStyle = '#f9fafb'
      ctx.fillRect(0, 0, floorplan.width, floorplan.height)
      ctx.strokeStyle = '#d1d5db'
      ctx.strokeRect(0, 0, floorplan.width, floorplan.height)
      
      // Draw placeholder text
      ctx.fillStyle = '#6b7280'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Floorplan Image', floorplan.width / 2, floorplan.height / 2)
    }

    // Draw navigation points
    navigationPoints.forEach(point => {
      drawNavigationPoint(ctx, point, point.id === selectedPoint)
    })

    // Restore context
    ctx.restore()
  }, [floorplan, navigationPoints, zoom, pan, selectedPoint])

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 0.5

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const drawNavigationPoint = (ctx: CanvasRenderingContext2D, point: NavigationPoint, isSelected: boolean) => {
    const colors = {
      entrance: '#10b981',
      exit: '#ef4444',
      booth: '#3b82f6',
      stage: '#8b5cf6',
      restroom: '#f59e0b',
      food: '#f97316',
      info: '#06b6d4',
    }

    const color = colors[point.type] || '#6b7280'
    const radius = isSelected ? 12 : 8

    // Draw point
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI)
    ctx.fill()

    // Draw border if selected
    if (isSelected) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Draw label
    ctx.fillStyle = '#1f2937'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(point.label, point.x, point.y - radius - 5)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !floorplan) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x * zoom) / zoom
    const y = (e.clientY - rect.top - pan.y * zoom) / zoom

    if (selectedTool === 'add-point') {
      addNavigationPoint(x, y)
    } else if (selectedTool === 'select') {
      selectPointAt(x, y)
    }
  }

  const addNavigationPoint = (x: number, y: number) => {
    const newPoint: NavigationPoint = {
      id: `temp-${Date.now()}`,
      x,
      y,
      type: selectedPointType,
      label: `${selectedPointType} ${navigationPoints.length + 1}`,
    }

    setNavigationPoints([...navigationPoints, newPoint])
    setSelectedPoint(newPoint.id)
  }

  const selectPointAt = (x: number, y: number) => {
    const clickedPoint = navigationPoints.find(point => {
      const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2)
      return distance <= 12
    })

    setSelectedPoint(clickedPoint?.id || null)
  }

  const deleteSelectedPoint = () => {
    if (!selectedPoint) return

    setNavigationPoints(navigationPoints.filter(point => point.id !== selectedPoint))
    setSelectedPoint(null)
  }

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.1))
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const saveFloorplan = async () => {
    if (!floorplan || !id) return

    try {
      setSaving(true)

      // Save navigation points
      const pointsToSave = navigationPoints.map(point => ({
        floorplan_id: id,
        name: point.label,
        point_type: point.type === 'stage' ? 'landmark' : 
                   point.type === 'restroom' ? 'amenity' : 
                   point.type === 'food' ? 'amenity' : 
                   point.type === 'info' ? 'landmark' : 
                   point.type as 'entrance' | 'exit' | 'booth',
        x_coordinate: point.x,
        y_coordinate: point.y,
        description: point.description || null,
        is_accessible: true
      }))

      // Delete existing points and insert new ones
      await supabase
        .from('navigation_points')
        .delete()
        .eq('floorplan_id', id)

      if (pointsToSave.length > 0) {
        const { error } = await supabase
          .from('navigation_points')
          .insert(pointsToSave as unknown as Record<string, unknown>[])

        if (error) {
          console.error('Error saving navigation points:', error)
          alert('Failed to save navigation points. Please try again.')
          return
        }
      }

      alert('Floorplan saved successfully!')
      fetchFloorplan() // Refresh data
    } catch (error) {
      console.error('Error saving floorplan:', error)
      alert('Failed to save floorplan. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getPointTypeColor = (type: PointType) => {
    const colors = {
      entrance: 'bg-green-100 text-green-800',
      exit: 'bg-red-100 text-red-800',
      booth: 'bg-blue-100 text-blue-800',
      stage: 'bg-purple-100 text-purple-800',
      restroom: 'bg-yellow-100 text-yellow-800',
      food: 'bg-orange-100 text-orange-800',
      info: 'bg-cyan-100 text-cyan-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  useEffect(() => {
    if (id) {
      fetchFloorplan()
    }
  }, [id, fetchFloorplan])

  useEffect(() => {
    drawCanvas()
  }, [floorplan, navigationPoints, zoom, pan, selectedPoint, drawCanvas])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!floorplan) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Floorplan not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested floorplan could not be loaded.</p>
        <Link
          to="/floorplans"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
        >
          Back to Floorplans
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <Link
            to="/floorplans"
            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-medium text-gray-900">{floorplan.name}</h1>
            <p className="text-sm text-gray-500">Floorplan Editor</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={saveFloorplan}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </button>
          {/* Link to unified editor for advanced Konva-based editing */}
          {id && (
            <Link
              to={`/admin/unified-map-editor?floorplanId=${id}`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ml-2"
            >
              Open Unified Editor
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-6">
          {/* Tools */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Tools</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedTool('select')}
                className={cn(
                  'w-full flex items-center px-3 py-2 text-sm rounded-md',
                  selectedTool === 'select'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Move className="h-4 w-4 mr-2" />
                Select
              </button>
              <button
                onClick={() => setSelectedTool('add-point')}
                className={cn(
                  'w-full flex items-center px-3 py-2 text-sm rounded-md',
                  selectedTool === 'add-point'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Point
              </button>
            </div>
          </div>

          {/* Point Types */}
          {selectedTool === 'add-point' && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Point Type</h3>
              <div className="space-y-1">
                {(['entrance', 'exit', 'booth', 'stage', 'restroom', 'food', 'info'] as PointType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedPointType(type)}
                    className={cn(
                      'w-full flex items-center px-3 py-2 text-sm rounded-md capitalize',
                      selectedPointType === type
                        ? getPointTypeColor(type)
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* View Controls */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">View</h3>
            <div className="space-y-2">
              <button
                onClick={handleZoomIn}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <ZoomIn className="h-4 w-4 mr-2" />
                Zoom In
              </button>
              <button
                onClick={handleZoomOut}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <ZoomOut className="h-4 w-4 mr-2" />
                Zoom Out
              </button>
              <button
                onClick={resetView}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset View
              </button>
            </div>
          </div>

          {/* Selected Point */}
          {selectedPoint && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Selected Point</h3>
              <div className="space-y-2">
                <button
                  onClick={deleteSelectedPoint}
                  className="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-100 rounded-md"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Point
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            className="cursor-crosshair"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}