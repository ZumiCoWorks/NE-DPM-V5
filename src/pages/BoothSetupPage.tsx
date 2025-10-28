import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, MapPin, QrCode, RefreshCw } from 'lucide-react'

interface Venue {
  id: string
  name: string
  address: string
  description?: string
  capacity?: number
  booths?: Booth[]
}

interface Booth {
  id: string
  venue_id: string
  name: string
  zone_name: string
  x_coordinate: number
  y_coordinate: number
  qr_code: string
  sponsor_name?: string
  sponsor_tier?: string
}

export default function BoothSetupPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [booths, setBooths] = useState<Booth[]>([])
  const [loading, setLoading] = useState(true)
  const [showVenueModal, setShowVenueModal] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [showBoothModal, setShowBoothModal] = useState(false)
  const [editingBooth, setEditingBooth] = useState<Booth | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [boothFormData, setBoothFormData] = useState({
    name: '',
    sponsor_name: '',
    sponsor_tier: 'silver',
    x_coordinate: 0,
    y_coordinate: 0
  })
  const [venueFormData, setVenueFormData] = useState({
    name: '',
    address: '',
    description: '',
    capacity: 0
  })

  useEffect(() => {
    fetchVenues()
  }, [])

  useEffect(() => {
    if (selectedVenue) {
      fetchBooths(selectedVenue.id)
    }
  }, [selectedVenue])

  useEffect(() => {
    if (selectedVenue && canvasRef.current) {
      drawCanvas()
    }
  }, [selectedVenue, booths])

  const fetchVenues = async () => {
    try {
      // Mock venues
      const mockVenues: Venue[] = [
        {
          id: 'venue-001',
          name: 'Convention Center Hall A',
          address: '123 Main Street, Downtown',
          description: 'Large exhibition hall with 50+ booths',
          capacity: 500
        },
        {
          id: 'venue-002',
          name: 'Riverside Park',
          address: '456 River Road, Waterfront',
          description: 'Outdoor venue with 30+ food stalls',
          capacity: 300
        }
      ]
      setVenues(mockVenues)
      if (mockVenues.length > 0 && !selectedVenue) {
        setSelectedVenue(mockVenues[0])
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBooths = async (venueId: string) => {
    try {
      // Mock booths
      const mockBooths: Booth[] = [
        { id: 'booth-001', venue_id: venueId, name: 'Microsoft', zone_name: 'Microsoft', x_coordinate: 50, y_coordinate: 50, qr_code: 'BOOTH-MS-001', sponsor_tier: 'platinum' },
        { id: 'booth-002', venue_id: venueId, name: 'Google', zone_name: 'Google', x_coordinate: 150, y_coordinate: 50, qr_code: 'BOOTH-GOOG-002', sponsor_tier: 'gold' },
        { id: 'booth-003', venue_id: venueId, name: 'Apple', zone_name: 'Apple', x_coordinate: 250, y_coordinate: 50, qr_code: 'BOOTH-AAPL-003', sponsor_tier: 'platinum' }
      ]
      setBooths(mockBooths)
    } catch (error) {
      console.error('Error fetching booths:', error)
    }
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let i = 0; i <= canvas.width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i <= canvas.height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Draw booths
    booths.forEach((booth) => {
      // Draw booth rectangle
      const tierColors: Record<string, string> = {
        platinum: '#6366f1',
        gold: '#f59e0b',
        silver: '#9ca3af'
      }
      ctx.fillStyle = tierColors[booth.sponsor_tier || 'silver'] || '#9ca3af'
      ctx.fillRect(booth.x_coordinate - 20, booth.y_coordinate - 20, 40, 40)

      // Draw booth border
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(booth.x_coordinate - 20, booth.y_coordinate - 20, 40, 40)

      // Draw booth label
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(booth.name.substring(0, 8), booth.x_coordinate, booth.y_coordinate)
    })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicked on existing booth
    const clickedBooth = booths.find(
      (b) =>
        x >= b.x_coordinate - 20 &&
        x <= b.x_coordinate + 20 &&
        y >= b.y_coordinate - 20 &&
        y <= b.y_coordinate + 20
    )

    if (clickedBooth) {
      openEditBoothModal(clickedBooth)
    } else {
      // Create new booth at click location
      setBoothFormData({
        ...boothFormData,
        x_coordinate: Math.round(x),
        y_coordinate: Math.round(y)
      })
      setShowBoothModal(true)
    }
  }

  const openEditBoothModal = (booth: Booth) => {
    setEditingBooth(booth)
    setBoothFormData({
      name: booth.name,
      sponsor_name: booth.sponsor_name || '',
      sponsor_tier: booth.sponsor_tier || 'silver',
      x_coordinate: booth.x_coordinate,
      y_coordinate: booth.y_coordinate
    })
    setShowBoothModal(true)
  }

  const handleCreateBooth = async () => {
    if (!selectedVenue) return
    
    try {
      console.log('Creating booth:', boothFormData)
      // TODO: API call to create booth
      setShowBoothModal(false)
      resetBoothForm()
      fetchBooths(selectedVenue.id)
    } catch (error) {
      console.error('Error creating booth:', error)
    }
  }

  const handleUpdateBooth = async () => {
    if (!editingBooth) return

    try {
      console.log('Updating booth:', editingBooth.id, boothFormData)
      // TODO: API call to update booth
      setShowBoothModal(false)
      setEditingBooth(null)
      resetBoothForm()
      if (selectedVenue) fetchBooths(selectedVenue.id)
    } catch (error) {
      console.error('Error updating booth:', error)
    }
  }

  const handleDeleteBooth = async (boothId: string) => {
    if (!confirm('Are you sure you want to delete this booth?')) return

    try {
      console.log('Deleting booth:', boothId)
      // TODO: API call to delete booth
      if (selectedVenue) fetchBooths(selectedVenue.id)
    } catch (error) {
      console.error('Error deleting booth:', error)
    }
  }

  const handleRegenerateQR = async (boothId: string) => {
    try {
      console.log('Regenerating QR for booth:', boothId)
      // TODO: API call to regenerate QR
      if (selectedVenue) fetchBooths(selectedVenue.id)
    } catch (error) {
      console.error('Error regenerating QR:', error)
    }
  }

  const handleCreateVenue = async () => {
    try {
      console.log('Creating venue:', venueFormData)
      // TODO: API call to create venue
      setShowVenueModal(false)
      resetVenueForm()
      fetchVenues()
    } catch (error) {
      console.error('Error creating venue:', error)
    }
  }

  const handleUpdateVenue = async () => {
    if (!editingVenue) return

    try {
      console.log('Updating venue:', editingVenue.id, venueFormData)
      // TODO: API call to update venue
      setShowVenueModal(false)
      setEditingVenue(null)
      resetVenueForm()
      fetchVenues()
    } catch (error) {
      console.error('Error updating venue:', error)
    }
  }

  const handleDeleteVenue = async (venueId: string) => {
    if (!confirm('Are you sure you want to delete this venue? All booths will be deleted.')) return

    try {
      console.log('Deleting venue:', venueId)
      // TODO: API call to delete venue
      fetchVenues()
    } catch (error) {
      console.error('Error deleting venue:', error)
    }
  }

  const openEditVenueModal = (venue: Venue) => {
    setEditingVenue(venue)
    setVenueFormData({
      name: venue.name,
      address: venue.address,
      description: venue.description || '',
      capacity: venue.capacity || 0
    })
    setShowVenueModal(true)
  }

  const resetBoothForm = () => {
    setBoothFormData({
      name: '',
      sponsor_name: '',
      sponsor_tier: 'silver',
      x_coordinate: 0,
      y_coordinate: 0
    })
  }

  const resetVenueForm = () => {
    setVenueFormData({
      name: '',
      address: '',
      description: '',
      capacity: 0
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left Panel - Venues List */}
      <div className="col-span-1">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Venues</h2>
            <button
              onClick={() => setShowVenueModal(true)}
              className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            {venues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => setSelectedVenue(venue)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedVenue?.id === venue.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{venue.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{venue.address}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {venue.booths?.length || 0} booths
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditVenueModal(venue)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteVenue(venue.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Panel - Canvas */}
      <div className="col-span-2">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {selectedVenue?.name || 'Select a venue'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Click on the canvas to place a new booth, or click on existing booths to edit
            </p>
          </div>

          {selectedVenue && (
            <>
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                onClick={handleCanvasClick}
                className="border-2 border-gray-200 rounded-lg cursor-crosshair"
              />

              {/* Booths List */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Booths ({booths.length})</h3>
                <div className="grid grid-cols-2 gap-3">
                  {booths.map((booth) => (
                    <div
                      key={booth.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">{booth.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Position: ({booth.x_coordinate}, {booth.y_coordinate})
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              booth.sponsor_tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                              booth.sponsor_tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booth.sponsor_tier}
                            </span>
                            <QrCode className="h-3 w-3 text-gray-400" title={booth.qr_code} />
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => openEditBoothModal(booth)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleRegenerateQR(booth.id)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Regenerate QR Code"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteBooth(booth.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Venue Modal */}
      {showVenueModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingVenue ? 'Edit Venue' : 'Create New Venue'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
                  <input
                    type="text"
                    value={venueFormData.name}
                    onChange={(e) => setVenueFormData({ ...venueFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Convention Center Hall A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    value={venueFormData.address}
                    onChange={(e) => setVenueFormData({ ...venueFormData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="123 Main Street, Downtown"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={venueFormData.description}
                    onChange={(e) => setVenueFormData({ ...venueFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Large exhibition hall"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={venueFormData.capacity}
                    onChange={(e) => setVenueFormData({ ...venueFormData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowVenueModal(false)
                    setEditingVenue(null)
                    resetVenueForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingVenue ? handleUpdateVenue : handleCreateVenue}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingVenue ? 'Update Venue' : 'Create Venue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booth Modal */}
      {showBoothModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingBooth ? 'Edit Booth' : 'Create New Booth'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booth Name *</label>
                  <input
                    type="text"
                    value={boothFormData.name}
                    onChange={(e) => setBoothFormData({ ...boothFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Microsoft"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Name</label>
                  <input
                    type="text"
                    value={boothFormData.sponsor_name}
                    onChange={(e) => setBoothFormData({ ...boothFormData, sponsor_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Microsoft Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Tier</label>
                  <select
                    value={boothFormData.sponsor_tier}
                    onChange={(e) => setBoothFormData({ ...boothFormData, sponsor_tier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="platinum">Platinum</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
                    <input
                      type="number"
                      value={boothFormData.x_coordinate}
                      onChange={(e) => setBoothFormData({ ...boothFormData, x_coordinate: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
                    <input
                      type="number"
                      value={boothFormData.y_coordinate}
                      onChange={(e) => setBoothFormData({ ...boothFormData, y_coordinate: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {editingBooth && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">QR Code</p>
                        <p className="text-xs text-gray-500 font-mono">{editingBooth.qr_code}</p>
                      </div>
                      <button
                        onClick={() => handleRegenerateQR(editingBooth.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBoothModal(false)
                    setEditingBooth(null)
                    resetBoothForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingBooth ? handleUpdateBooth : handleCreateBooth}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingBooth ? 'Update Booth' : 'Create Booth'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
