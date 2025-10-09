/**
 * HVZ Floorplan Editor Component
 * Enhanced floorplan editor with High-Value Zone (HVZ) coordinate definition
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Save, MapPin, Target, Trash2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface HVZCoordinates {
  x: number
  y: number
  width: number
  height: number
  name: string
  color: string
}

interface FloorplanData {
  id?: string
  venue_id: string
  name: string
  image_url: string
  hvz_coordinates?: HVZCoordinates[]
}

interface HVZFloorplanEditorProps {
  venueId?: string
  onSave?: (floorplan: FloorplanData) => void
}

export const HVZFloorplanEditor: React.FC<HVZFloorplanEditorProps> = ({ 
  venueId, 
  onSave 
}) => {
  const [floorplanImage, setFloorplanImage] = useState<string | null>(null)
  const [hvzZones, setHvzZones] = useState<HVZCoordinates[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentZone, setCurrentZone] = useState<Partial<HVZCoordinates> | null>(null)
  const [showZones, setShowZones] = useState(true)
  const [saving, setSaving] = useState(false)
  const [floorplanName, setFloorplanName] = useState('')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image upload
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setFloorplanImage(imageUrl)
        if (!floorplanName) {
          setFloorplanName(file.name.replace(/\.[^/.]+$/, ''))
        }
      }
      reader.readAsDataURL(file)
    }
  }, [floorplanName])

  // Draw zones on canvas
  const drawZones = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !showZones) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw zones
    hvzZones.forEach((zone) => {
      ctx.strokeStyle = zone.color
      ctx.fillStyle = zone.color + '40' // 25% opacity
      ctx.lineWidth = 2
      
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height)
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height)
      
      // Draw zone label
      ctx.fillStyle = zone.color
      ctx.font = '14px Arial'
      ctx.fillText(zone.name, zone.x + 5, zone.y - 5)
    })

    // Draw current zone being drawn
    if (currentZone && currentZone.x !== undefined && currentZone.y !== undefined && 
        currentZone.width !== undefined && currentZone.height !== undefined) {
      ctx.strokeStyle = '#3B82F6'
      ctx.fillStyle = '#3B82F640'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      
      ctx.fillRect(currentZone.x, currentZone.y, currentZone.width, currentZone.height)
      ctx.strokeRect(currentZone.x, currentZone.y, currentZone.width, currentZone.height)
      ctx.setLineDash([])
    }
  }, [hvzZones, currentZone, showZones])

  // Handle mouse events for drawing zones
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    setCurrentZone({ x, y, width: 0, height: 0 })
  }, [isDrawing])

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentZone || currentZone.x === undefined || currentZone.y === undefined) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const currentX = event.clientX - rect.left
    const currentY = event.clientY - rect.top
    
    setCurrentZone(prev => prev ? {
      ...prev,
      width: currentX - prev.x!,
      height: currentY - prev.y!
    } : null)
  }, [isDrawing, currentZone])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentZone || 
        currentZone.x === undefined || currentZone.y === undefined ||
        currentZone.width === undefined || currentZone.height === undefined) return
    
    // Only add zone if it has meaningful size
    if (Math.abs(currentZone.width) > 10 && Math.abs(currentZone.height) > 10) {
      const newZone: HVZCoordinates = {
        x: currentZone.width < 0 ? currentZone.x + currentZone.width : currentZone.x,
        y: currentZone.height < 0 ? currentZone.y + currentZone.height : currentZone.y,
        width: Math.abs(currentZone.width),
        height: Math.abs(currentZone.height),
        name: `HVZ-${hvzZones.length + 1}`,
        color: '#3B82F6'
      }
      
      setHvzZones(prev => [...prev, newZone])
    }
    
    setCurrentZone(null)
    setIsDrawing(false)
  }, [isDrawing, currentZone, hvzZones.length])

  // Save floorplan with HVZ data
  const handleSave = async () => {
    if (!floorplanImage || !venueId || !floorplanName.trim()) {
      alert('Please provide a floorplan image, venue ID, and name')
      return
    }

    setSaving(true)
    try {
      // For demo purposes, we'll save to local storage
      // In production, this would upload to Supabase storage and save to database
      const floorplanData: FloorplanData = {
        venue_id: venueId,
        name: floorplanName,
        image_url: floorplanImage,
        hvz_coordinates: hvzZones
      }

      // Save to localStorage for demo
      const savedFloorplans = JSON.parse(localStorage.getItem('hvz_floorplans') || '[]')
      const newFloorplan = { ...floorplanData, id: Date.now().toString() }
      savedFloorplans.push(newFloorplan)
      localStorage.setItem('hvz_floorplans', JSON.stringify(savedFloorplans))

      onSave?.(newFloorplan)
      alert('Floorplan with HVZ coordinates saved successfully!')
    } catch (error) {
      console.error('Error saving floorplan:', error)
      alert('Error saving floorplan')
    } finally {
      setSaving(false)
    }
  }

  // Update canvas drawing when zones change
  useEffect(() => {
    drawZones()
  }, [drawZones])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          HVZ Floorplan Editor
        </h2>
        <p className="text-gray-600">
          Upload a floorplan and define High-Value Zones (HVZ) for CDV tracking.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Floorplan Name
          </label>
          <input
            type="text"
            value={floorplanName}
            onChange={(e) => setFloorplanName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter floorplan name"
          />
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Image
        </button>

        <button
          onClick={() => setIsDrawing(!isDrawing)}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            isDrawing 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <Target className="w-4 h-4 mr-2" />
          {isDrawing ? 'Stop Drawing' : 'Draw HVZ'}
        </button>

        <button
          onClick={() => setShowZones(!showZones)}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          {showZones ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showZones ? 'Hide Zones' : 'Show Zones'}
        </button>

        <button
          onClick={() => setHvzZones([])}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          disabled={hvzZones.length === 0}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Zones
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !floorplanImage || !floorplanName.trim()}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Floorplan'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Floorplan Display */}
      {floorplanImage ? (
        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="relative">
            <img
              ref={imageRef}
              src={floorplanImage}
              alt="Floorplan"
              className="max-w-full h-auto"
              onLoad={() => {
                const canvas = canvasRef.current
                const image = imageRef.current
                if (canvas && image) {
                  canvas.width = image.offsetWidth
                  canvas.height = image.offsetHeight
                  drawZones()
                }
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ pointerEvents: isDrawing ? 'auto' : 'none' }}
            />
          </div>
          
          {isDrawing && (
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
              Click and drag to define High-Value Zone
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No floorplan uploaded</p>
          <p className="text-sm text-gray-500">
            Click "Upload Image" to add a 2D floorplan
          </p>
        </div>
      )}

      {/* HVZ List */}
      {hvzZones.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            High-Value Zones ({hvzZones.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hvzZones.map((zone, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{zone.name}</h4>
                  <button
                    onClick={() => setHvzZones(prev => prev.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Position: ({zone.x}, {zone.y})</div>
                  <div>Size: {zone.width} × {zone.height}</div>
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-2" 
                      style={{ backgroundColor: zone.color }}
                    ></div>
                    Color: {zone.color}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}