import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Download, MapPin, QrCode, Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { 
  generateQRCodeDataURL, 
  generateQRBatchZip, 
  downloadBlob, 
  generateAnchorId,
  AnchorPoint 
} from '../utils/qrGenerator'

interface Event {
  id: string
  name: string
}

interface Booth {
  id: string
  name: string
}

export default function MVPSetupPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [booths, setBooths] = useState<Booth[]>([])
  const [floorplanImage, setFloorplanImage] = useState<string | null>(null)
  const [anchorPoints, setAnchorPoints] = useState<AnchorPoint[]>([])
  const [showAnchorModal, setShowAnchorModal] = useState(false)
  const [currentAnchor, setCurrentAnchor] = useState<Partial<AnchorPoint> | null>(null)
  const [qrPreview, setQrPreview] = useState<{ anchorId: string; dataUrl: string } | null>(null)
  const [loading, setLoading] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Fetch events on mount
  useEffect(() => {
    fetchEvents()
  }, [])

  // Fetch booths when event is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchBooths(selectedEvent)
    }
  }, [selectedEvent])

  // Redraw canvas when floorplan or anchors change
  useEffect(() => {
    if (floorplanImage) {
      drawCanvas()
    }
  }, [floorplanImage, anchorPoints])

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const data = await response.json()
      if (data.success && data.data) {
        setEvents(data.data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchBooths = async (eventId: string) => {
    try {
      // Mock booths for now - replace with actual API call
      const mockBooths: Booth[] = [
        { id: 'booth-1', name: 'Main Entrance' },
        { id: 'booth-2', name: 'Registration Desk' },
        { id: 'booth-3', name: 'Sponsor Booth A' },
        { id: 'booth-4', name: 'Sponsor Booth B' },
      ]
      setBooths(mockBooths)
    } catch (error) {
      console.error('Error fetching booths:', error)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFloorplanImage(result)
        
        // Load image for canvas
        const img = new Image()
        img.onload = () => {
          imageRef.current = img
          drawCanvas()
        }
        img.src = result
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    maxFiles: 1
  })

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = imageRef.current

    // Set canvas size to match image (max 800px width)
    const maxWidth = 800
    const scale = Math.min(1, maxWidth / img.width)
    canvas.width = img.width * scale
    canvas.height = img.height * scale

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Draw anchor points
    anchorPoints.forEach((anchor) => {
      const x = anchor.x * canvas.width
      const y = anchor.y * canvas.height

      // Draw pin icon
      ctx.fillStyle = anchor.type === 'qr' ? '#3b82f6' : '#10b981'
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, 2 * Math.PI)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw label
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(anchor.name, x, y - 15)
    })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedEvent || !floorplanImage) {
      alert('Please select an event and upload a floorplan first')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / canvas.width
    const y = (e.clientY - rect.top) / canvas.height

    // Create new anchor point
    const anchorId = generateAnchorId()
    setCurrentAnchor({
      id: anchorId,
      anchor_id: anchorId,
      event_id: selectedEvent,
      x,
      y,
      type: 'qr',
      name: `Anchor ${anchorPoints.length + 1}`
    })
    setShowAnchorModal(true)
  }

  const handleSaveAnchor = () => {
    if (!currentAnchor || !currentAnchor.name) {
      alert('Please enter an anchor name')
      return
    }

    const newAnchor: AnchorPoint = {
      id: currentAnchor.id || generateAnchorId(),
      anchor_id: currentAnchor.anchor_id || generateAnchorId(),
      event_id: currentAnchor.event_id || selectedEvent,
      name: currentAnchor.name,
      x: currentAnchor.x || 0,
      y: currentAnchor.y || 0,
      type: currentAnchor.type || 'qr',
      booth_id: currentAnchor.booth_id,
      booth_name: currentAnchor.booth_name
    }

    setAnchorPoints([...anchorPoints, newAnchor])
    setShowAnchorModal(false)
    setCurrentAnchor(null)
  }

  const handleDeleteAnchor = (anchorId: string) => {
    if (confirm('Are you sure you want to delete this anchor point?')) {
      setAnchorPoints(anchorPoints.filter(a => a.id !== anchorId))
    }
  }

  const handleGenerateSingleQR = async (anchor: AnchorPoint) => {
    try {
      setLoading(true)
      const dataUrl = await generateQRCodeDataURL(anchor.anchor_id, anchor.event_id)
      setQrPreview({ anchorId: anchor.id, dataUrl })
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAllQR = async () => {
    if (anchorPoints.length === 0) {
      alert('No anchor points to generate QR codes for')
      return
    }

    if (!selectedEvent) {
      alert('Please select an event')
      return
    }

    try {
      setLoading(true)
      const eventName = events.find(e => e.id === selectedEvent)?.name || 'Event'
      const zipBlob = await generateQRBatchZip(anchorPoints, eventName)
      downloadBlob(zipBlob, `${eventName.replace(/[^a-z0-9]/gi, '_')}_QR_Codes.zip`)
    } catch (error) {
      console.error('Error generating QR codes:', error)
      alert('Failed to generate QR codes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">MVP Setup</h1>
        <p className="mt-2 text-gray-600">
          Set up AR anchor points and generate QR codes for your event.
        </p>
      </div>

      {/* Event Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">1. Select Event</h2>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Select an Event --</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {/* Floorplan Upload */}
      {selectedEvent && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">2. Upload Floorplan</h2>
          
          {!floorplanImage ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {isDragActive
                  ? 'Drop the floorplan image here'
                  : 'Drag & drop a floorplan image, or click to select'}
              </p>
              <p className="text-sm text-gray-500 mt-2">PNG, JPG, or SVG up to 10MB</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">✓ Floorplan uploaded</p>
                <button
                  onClick={() => {
                    setFloorplanImage(null)
                    setAnchorPoints([])
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove & upload new
                </button>
              </div>

              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="border-2 border-gray-300 rounded-lg cursor-crosshair max-w-full"
              />

              <p className="text-sm text-gray-500 italic">
                💡 Click on the floorplan to place anchor points
              </p>
            </div>
          )}
        </div>
      )}

      {/* Anchor Points List */}
      {floorplanImage && anchorPoints.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">3. Anchor Points ({anchorPoints.length})</h2>
            <Button onClick={handleDownloadAllQR} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Download All QR Codes (ZIP)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anchorPoints.map((anchor) => (
              <div key={anchor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{anchor.name}</h3>
                    <p className="text-sm text-gray-500">
                      Type: <span className="capitalize">{anchor.type === 'qr' ? 'QR Code' : 'Image Target'}</span>
                    </p>
                    {anchor.booth_name && (
                      <p className="text-sm text-gray-500">Booth: {anchor.booth_name}</p>
                    )}
                    <p className="text-xs text-gray-400 font-mono mt-1">ID: {anchor.anchor_id.substring(0, 16)}...</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnchor(anchor.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={() => handleGenerateSingleQR(anchor)}
                    disabled={loading}
                    className="flex-1 text-sm"
                  >
                    <QrCode className="h-4 w-4 mr-1" />
                    Generate QR
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anchor Modal */}
      {showAnchorModal && currentAnchor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Anchor Point</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anchor Name *
                  </label>
                  <input
                    type="text"
                    value={currentAnchor.name || ''}
                    onChange={(e) => setCurrentAnchor({ ...currentAnchor, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Main Entrance QR"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={currentAnchor.type || 'qr'}
                    onChange={(e) => setCurrentAnchor({ ...currentAnchor, type: e.target.value as 'qr' | 'image_target' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="qr">QR Code</option>
                    <option value="image_target">Image Target</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Associate with Booth (optional)
                  </label>
                  <select
                    value={currentAnchor.booth_id || ''}
                    onChange={(e) => {
                      const boothId = e.target.value
                      const booth = booths.find(b => b.id === boothId)
                      setCurrentAnchor({
                        ...currentAnchor,
                        booth_id: boothId || undefined,
                        booth_name: booth?.name || undefined
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- No Booth --</option>
                    {booths.map((booth) => (
                      <option key={booth.id} value={booth.id}>
                        {booth.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAnchorModal(false)
                    setCurrentAnchor(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <Button onClick={handleSaveAnchor}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Add Anchor Point
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Preview Modal */}
      {qrPreview && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">QR Code Preview</h2>
                <button
                  onClick={() => setQrPreview(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <img src={qrPreview.dataUrl} alt="QR Code" className="w-64 h-64" />
                <p className="text-sm text-gray-600 mt-4">
                  {anchorPoints.find(a => a.id === qrPreview.anchorId)?.name}
                </p>
                <Button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = qrPreview.dataUrl
                    link.download = `${anchorPoints.find(a => a.id === qrPreview.anchorId)?.name.replace(/[^a-z0-9]/gi, '_')}_QR.png`
                    link.click()
                  }}
                  className="mt-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
