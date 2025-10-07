import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, Move, Square, Navigation, Save, Trash2, Edit3, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface POI {
  id: string
  name: string
  type: 'entrance' | 'exit' | 'restroom' | 'food' | 'info' | 'emergency' | 'custom'
  x: number
  y: number
  description?: string
}

interface Zone {
  id: string
  name: string
  type: 'general' | 'vip' | 'restricted' | 'emergency'
  x: number
  y: number
  width: number
  height: number
  color: string
}

interface EmergencyPath {
  id: string
  name: string
  points: { x: number; y: number }[]
  fromPOI: string
  toPOI: string
  isCompliant: boolean
  safetyFeatures: {
    widthMeters: number
    emergencyLighting: boolean
    accessibilityCompliant: boolean
    fireRating?: string
  }
}

interface FloorplanEditorProps {
  floorplanId?: string
  onSave: (data: {
    pois: POI[]
    zones: Zone[]
    emergencyPaths: EmergencyPath[]
    complianceStatus: ComplianceStatus
  }) => void
}

interface ComplianceStatus {
  isCompliant: boolean
  emergencyExits: number
  emergencyPaths: number
  accessibilityCompliant: boolean
  issues: string[]
  lastValidated: string
}

const GRID_SIZE = 20
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

const POI_TYPES = [
  { type: 'entrance', label: 'Entrance', color: '#10b981' },
  { type: 'exit', label: 'Exit', color: '#ef4444' },
  { type: 'restroom', label: 'Restroom', color: '#3b82f6' },
  { type: 'food', label: 'Food & Drink', color: '#f59e0b' },
  { type: 'info', label: 'Information', color: '#8b5cf6' },
  { type: 'emergency', label: 'Emergency', color: '#dc2626' },
  { type: 'custom', label: 'Custom', color: '#6b7280' }
] as const

const ZONE_TYPES = [
  { type: 'general', label: 'General Area', color: '#e5e7eb' },
  { type: 'vip', label: 'VIP Area', color: '#fbbf24' },
  { type: 'restricted', label: 'Restricted Area', color: '#f87171' },
  { type: 'emergency', label: 'Emergency Zone', color: '#fca5a5' }
] as const

export default function FloorplanEditor({ floorplanId, onSave }: FloorplanEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<'select' | 'poi' | 'zone' | 'path'>('select')
  const [selectedPOIType, setSelectedPOIType] = useState<POI['type']>('entrance')
  const [selectedZoneType, setSelectedZoneType] = useState<Zone['type']>('general')
  const [pois, setPois] = useState<POI[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [emergencyPaths, setEmergencyPaths] = useState<EmergencyPath[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDrawingZone, setIsDrawingZone] = useState(false)
  const [zoneStart, setZoneStart] = useState<{ x: number; y: number } | null>(null)
  const [isDrawingPath, setIsDrawingPath] = useState(false)
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[]>([])  
  const [complianceMode, setComplianceMode] = useState(false)
  const [showCompliancePanel, setShowCompliancePanel] = useState(false)
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>({
    isCompliant: false,
    emergencyExits: 0,
    emergencyPaths: 0,
    accessibilityCompliant: false,
    issues: [],
    lastValidated: new Date().toISOString()
  })
  const [showPOIForm, setShowPOIForm] = useState(false)
  const [newPOIPosition, setNewPOIPosition] = useState<{ x: number; y: number } | null>(null)

  // Snap to grid function
  const snapToGrid = useCallback((x: number, y: number) => {
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE
    }
  }, [])

  // Get canvas coordinates from mouse event
  const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }, [])

  // Draw grid on canvas
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    
    // Vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }
    
    // Horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }
  }, [])

  // Draw zones
  const drawZones = useCallback((ctx: CanvasRenderingContext2D) => {
    zones.forEach(zone => {
      ctx.fillStyle = zone.color + '40' // Add transparency
      ctx.strokeStyle = zone.color
      ctx.lineWidth = 2
      
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height)
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height)
      
      // Draw zone label
      ctx.fillStyle = '#374151'
      ctx.font = '12px sans-serif'
      ctx.fillText(zone.name, zone.x + 5, zone.y + 15)
    })
  }, [zones])

  // Draw POIs with emergency indicators
  const drawPOIs = useCallback((ctx: CanvasRenderingContext2D) => {
    pois.forEach(poi => {
      const poiType = POI_TYPES.find(t => t.type === poi.type)
      const color = poiType?.color || '#6b7280'
      const isEmergencyPOI = poi.type === 'emergency' || poi.type === 'exit'
      
      // Draw POI circle with emergency highlighting
      ctx.fillStyle = color
      ctx.strokeStyle = selectedItem === poi.id ? '#000000' : color
      ctx.lineWidth = selectedItem === poi.id ? 3 : (isEmergencyPOI && complianceMode ? 3 : 2)
      
      ctx.beginPath()
      ctx.arc(poi.x, poi.y, isEmergencyPOI && complianceMode ? 10 : 8, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      
      // Draw emergency indicator
      if (isEmergencyPOI && complianceMode) {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 8px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('E', poi.x, poi.y + 2)
      }
      
      // Draw POI label
      ctx.fillStyle = '#374151'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      const textWidth = ctx.measureText(poi.name).width
      ctx.fillText(poi.name, poi.x, poi.y + (isEmergencyPOI && complianceMode ? 25 : 20))
    })
  }, [pois, selectedItem, complianceMode])

  // Draw emergency paths with compliance indicators
  const drawEmergencyPaths = useCallback((ctx: CanvasRenderingContext2D) => {
    emergencyPaths.forEach(path => {
      if (path.points.length < 2) return
      
      // Color based on compliance status
      const strokeColor = path.isCompliant ? '#10b981' : '#dc2626'
      const dashPattern = path.isCompliant ? [] : [5, 5]
      
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = complianceMode ? 5 : 3
      ctx.setLineDash(dashPattern)
      
      ctx.beginPath()
      ctx.moveTo(path.points[0].x, path.points[0].y)
      
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y)
      }
      
      ctx.stroke()
      ctx.setLineDash([])
      
      // Draw compliance indicator at midpoint
      if (complianceMode && path.points.length >= 2) {
        const midIndex = Math.floor(path.points.length / 2)
        const midPoint = path.points[midIndex]
        
        ctx.fillStyle = path.isCompliant ? '#10b981' : '#dc2626'
        ctx.beginPath()
        ctx.arc(midPoint.x, midPoint.y, 6, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw compliance symbol
        ctx.fillStyle = 'white'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(path.isCompliant ? '✓' : '!', midPoint.x, midPoint.y + 3)
      }
      
      // Draw arrow at the end
      const lastPoint = path.points[path.points.length - 1]
      const secondLastPoint = path.points[path.points.length - 2]
      const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x)
      
      ctx.fillStyle = strokeColor
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(
        lastPoint.x - 10 * Math.cos(angle - Math.PI / 6),
        lastPoint.y - 10 * Math.sin(angle - Math.PI / 6)
      )
      ctx.lineTo(
        lastPoint.x - 10 * Math.cos(angle + Math.PI / 6),
        lastPoint.y - 10 * Math.sin(angle + Math.PI / 6)
      )
      ctx.closePath()
      ctx.fill()
    })
  }, [emergencyPaths])

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw grid
    drawGrid(ctx)
    
    // Draw zones
    drawZones(ctx)
    
    // Draw emergency paths
    drawEmergencyPaths(ctx)
    
    // Draw POIs
    drawPOIs(ctx)
    
    // Draw current zone being drawn
    if (isDrawingZone && zoneStart) {
      const zoneType = ZONE_TYPES.find(t => t.type === selectedZoneType)
      const color = zoneType?.color || '#e5e7eb'
      
      ctx.strokeStyle = color
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 2
      ctx.strokeRect(zoneStart.x, zoneStart.y, 100, 100) // Preview size
      ctx.setLineDash([])
    }
    
    // Draw current path being drawn
    if (isDrawingPath && pathPoints.length > 0) {
      ctx.strokeStyle = '#dc2626'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      
      ctx.beginPath()
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y)
      
      for (let i = 1; i < pathPoints.length; i++) {
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y)
      }
      
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [drawGrid, drawZones, drawEmergencyPaths, drawPOIs, isDrawingZone, zoneStart, selectedZoneType, isDrawingPath, pathPoints])

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)
    const snappedCoords = snapToGrid(coords.x, coords.y)
    
    if (tool === 'poi') {
      setNewPOIPosition(snappedCoords)
      setShowPOIForm(true)
    } else if (tool === 'zone') {
      if (!isDrawingZone) {
        setIsDrawingZone(true)
        setZoneStart(snappedCoords)
      } else {
        // Finish drawing zone
        if (zoneStart) {
          const width = Math.abs(snappedCoords.x - zoneStart.x)
          const height = Math.abs(snappedCoords.y - zoneStart.y)
          const x = Math.min(zoneStart.x, snappedCoords.x)
          const y = Math.min(zoneStart.y, snappedCoords.y)
          
          const zoneType = ZONE_TYPES.find(t => t.type === selectedZoneType)
          const newZone: Zone = {
            id: Date.now().toString(),
            name: `${zoneType?.label || 'Zone'} ${zones.length + 1}`,
            type: selectedZoneType,
            x,
            y,
            width: Math.max(width, 40),
            height: Math.max(height, 40),
            color: zoneType?.color || '#e5e7eb'
          }
          
          setZones(prev => [...prev, newZone])
          setIsDrawingZone(false)
          setZoneStart(null)
          toast.success('Zone created successfully')
        }
      }
    } else if (tool === 'path') {
      if (!isDrawingPath) {
        setIsDrawingPath(true)
        setPathPoints([snappedCoords])
      } else {
        setPathPoints(prev => [...prev, snappedCoords])
      }
    }
  }, [tool, getCanvasCoordinates, snapToGrid, isDrawingZone, zoneStart, selectedZoneType, zones.length, isDrawingPath])

  // Handle POI form submission
  const handlePOISubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newPOIPosition) return
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    
    if (!name.trim()) {
      toast.error('POI name is required')
      return
    }
    
    const newPOI: POI = {
      id: Date.now().toString(),
      name: name.trim(),
      type: selectedPOIType,
      x: newPOIPosition.x,
      y: newPOIPosition.y,
      description: description.trim() || undefined
    }
    
    setPois(prev => [...prev, newPOI])
    setShowPOIForm(false)
    setNewPOIPosition(null)
    toast.success('POI added successfully')
  }, [newPOIPosition, selectedPOIType])

  // Finish drawing emergency path
  const finishEmergencyPath = useCallback(() => {
    if (pathPoints.length < 2) {
      toast.error('Emergency path must have at least 2 points')
      return
    }
    
    const newPath: EmergencyPath = {
      id: Date.now().toString(),
      name: `Emergency Path ${emergencyPaths.length + 1}`,
      points: pathPoints,
      fromPOI: '',
      toPOI: '',
      isCompliant: false, // Default to non-compliant until validated
      safetyFeatures: {
        widthMeters: 1.2, // Default minimum width
        emergencyLighting: false,
        accessibilityCompliant: false
      }
    }
    
    setEmergencyPaths(prev => [...prev, newPath])
    setIsDrawingPath(false)
    setPathPoints([])
    toast.success('Emergency path created successfully')
    
    // Trigger compliance check
    validateCompliance()
  }, [pathPoints, emergencyPaths.length, validateCompliance])

  // Validate compliance
  const validateCompliance = useCallback(() => {
    const emergencyExits = pois.filter(poi => poi.type === 'exit' || poi.type === 'emergency').length
    const emergencyPathsCount = emergencyPaths.length
    const accessibilityCompliant = emergencyPaths.every(path => path.safetyFeatures.accessibilityCompliant)
    
    const issues: string[] = []
    
    if (emergencyExits < 2) {
      issues.push('Minimum 2 emergency exits required')
    }
    
    if (emergencyPathsCount < 1) {
      issues.push('At least 1 emergency path required')
    }
    
    if (!accessibilityCompliant) {
      issues.push('All emergency paths must be accessibility compliant')
    }
    
    emergencyPaths.forEach((path, index) => {
      if (path.safetyFeatures.widthMeters < 1.2) {
        issues.push(`Emergency path ${index + 1} width below minimum 1.2m`)
      }
      if (!path.safetyFeatures.emergencyLighting) {
        issues.push(`Emergency path ${index + 1} missing emergency lighting`)
      }
    })
    
    const isCompliant = issues.length === 0
    
    setComplianceStatus({
      isCompliant,
      emergencyExits,
      emergencyPaths: emergencyPathsCount,
      accessibilityCompliant,
      issues,
      lastValidated: new Date().toISOString()
    })
    
    if (isCompliant) {
      toast.success('Floorplan is compliant with safety regulations')
    } else {
      toast.warning(`${issues.length} compliance issues found`)
    }
  }, [pois, emergencyPaths])
  
  // Save floorplan data
  const handleSave = useCallback(() => {
    validateCompliance()
    onSave({ pois, zones, emergencyPaths, complianceStatus })
    toast.success('Floorplan saved successfully')
  }, [pois, zones, emergencyPaths, complianceStatus, onSave, validateCompliance])

  // Delete selected item
  const deleteSelectedItem = useCallback(() => {
    if (!selectedItem) return
    
    setPois(prev => prev.filter(poi => poi.id !== selectedItem))
    setZones(prev => prev.filter(zone => zone.id !== selectedItem))
    setEmergencyPaths(prev => prev.filter(path => path.id !== selectedItem))
    setSelectedItem(null)
    toast.success('Item deleted successfully')
  }, [selectedItem])

  // Effect to redraw canvas
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool('select')}
            className={`p-2 rounded ${tool === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <Move className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('poi')}
            className={`p-2 rounded ${tool === 'poi' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('zone')}
            className={`p-2 rounded ${tool === 'zone' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('path')}
            className={`p-2 rounded ${tool === 'path' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <Navigation className="w-4 h-4" />
          </button>
          
          <div className="border-l border-gray-300 h-8 mx-2"></div>
          
          <button
            onClick={() => setComplianceMode(!complianceMode)}
            className={`p-2 rounded flex items-center gap-1 ${complianceMode ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            title="Toggle compliance mode"
          >
            <Shield className="w-4 h-4" />
            <span className="text-xs">Compliance</span>
          </button>
          
          <button
            onClick={() => setShowCompliancePanel(!showCompliancePanel)}
            className={`p-2 rounded flex items-center gap-1 ${showCompliancePanel ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            title="Show compliance panel"
          >
            {complianceStatus.isCompliant ? 
              <CheckCircle className="w-4 h-4 text-green-600" /> : 
              <XCircle className="w-4 h-4 text-red-600" />
            }
            <span className="text-xs">Status</span>
          </button>
          
          <button
            onClick={validateCompliance}
            className="p-2 rounded bg-orange-500 text-white flex items-center gap-1"
            title="Validate compliance"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Validate</span>
          </button>
        </div>
        
        <div className="h-6 w-px bg-gray-300" />
        
        {tool === 'poi' && (
          <select
            value={selectedPOIType}
            onChange={(e) => setSelectedPOIType(e.target.value as POI['type'])}
            className="px-3 py-1 border rounded"
          >
            {POI_TYPES.map(type => (
              <option key={type.type} value={type.type}>{type.label}</option>
            ))}
          </select>
        )}
        
        {tool === 'zone' && (
          <select
            value={selectedZoneType}
            onChange={(e) => setSelectedZoneType(e.target.value as Zone['type'])}
            className="px-3 py-1 border rounded"
          >
            {ZONE_TYPES.map(type => (
              <option key={type.type} value={type.type}>{type.label}</option>
            ))}
          </select>
        )}
        
        {tool === 'path' && isDrawingPath && (
          <button
            onClick={finishEmergencyPath}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Finish Path
          </button>
        )}
        
        <div className="flex-1" />
        
        {selectedItem && (
          <button
            onClick={deleteSelectedItem}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 p-4 bg-gray-50">
        <div className="flex gap-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            className="border bg-white cursor-crosshair"
          />
          
          {showCompliancePanel && (
            <div className="w-80 bg-white border border-gray-300 rounded-lg p-4 h-fit">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5" />
                <h3 className="font-semibold">Compliance Status</h3>
                {complianceStatus.isCompliant ? 
                  <CheckCircle className="w-5 h-5 text-green-600" /> : 
                  <XCircle className="w-5 h-5 text-red-600" />
                }
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Emergency Exits:</span>
                  <span className={`text-sm font-medium ${
                    complianceStatus.emergencyExits >= 2 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {complianceStatus.emergencyExits}/2 minimum
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Emergency Paths:</span>
                  <span className={`text-sm font-medium ${
                    complianceStatus.emergencyPaths >= 1 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {complianceStatus.emergencyPaths}/1 minimum
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accessibility:</span>
                  <span className={`text-sm font-medium ${
                    complianceStatus.accessibilityCompliant ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {complianceStatus.accessibilityCompliant ? 'Compliant' : 'Non-compliant'}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Issues ({complianceStatus.issues.length})</h4>
                  {complianceStatus.issues.length === 0 ? (
                    <p className="text-sm text-green-600">No compliance issues found</p>
                  ) : (
                    <ul className="space-y-1">
                      {complianceStatus.issues.map((issue, index) => (
                        <li key={index} className="text-sm text-red-600 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500">
                    Last validated: {new Date(complianceStatus.lastValidated).toLocaleString()}
                  </p>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Legend</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-green-500"></div>
                      <span>Compliant emergency path</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-red-500 border-dashed border border-red-500"></div>
                      <span>Non-compliant emergency path</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">E</div>
                      <span>Emergency POI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* POI Form Modal */}
      {showPOIForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add Point of Interest</h3>
            <form onSubmit={handlePOISubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter POI name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Add POI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPOIForm(false)
                    setNewPOIPosition(null)
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}