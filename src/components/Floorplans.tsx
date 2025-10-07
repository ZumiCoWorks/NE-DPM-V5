import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit3, Trash2, Map, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import FloorplanEditor from './FloorplanEditor'

interface Floorplan {
  id: string
  name: string
  floor_number: number
  venue_id: string
  image_url?: string
  created_at: string
  updated_at: string
}

interface Venue {
  id: string
  name: string
  address: string
}

interface FloorplansProps {
  venueId?: string
  onBack?: () => void
}

export default function Floorplans({ venueId, onBack }: FloorplansProps) {
  const [floorplans, setFloorplans] = useState<Floorplan[]>([])
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingFloorplan, setEditingFloorplan] = useState<Floorplan | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [selectedFloorplan, setSelectedFloorplan] = useState<Floorplan | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    floor_number: 1,
    image_url: ''
  })

  // Fetch venue details and floorplans
  useEffect(() => {
    if (venueId) {
      fetchVenueAndFloorplans()
    } else {
      setLoading(false)
    }
  }, [venueId, fetchVenueAndFloorplans])

  const fetchVenueAndFloorplans = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('Please log in to continue')
        return
      }

      // Fetch venue details
      const venueResponse = await fetch(`/api/venues/${venueId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!venueResponse.ok) {
        throw new Error('Failed to fetch venue')
      }

      const venueData = await venueResponse.json()
      setVenue(venueData.venue)
      
      // Fetch floorplans for this venue
      const floorplansResponse = await fetch(`/api/floorplans?venue_id=${venueId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!floorplansResponse.ok) {
        throw new Error('Failed to fetch floorplans')
      }

      const floorplansData = await floorplansResponse.json()
      setFloorplans(floorplansData.floorplans || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load venue data')
    } finally {
      setLoading(false)
    }
  }, [venueId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!venueId) {
      toast.error('Venue ID is required')
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('Please log in to continue')
        return
      }

      const url = editingFloorplan 
        ? `/api/floorplans/${editingFloorplan.id}`
        : '/api/floorplans'
      
      const method = editingFloorplan ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        venue_id: venueId
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save floorplan')
      }

      const data = await response.json()
      
      if (editingFloorplan) {
        setFloorplans(prev => prev.map(fp => 
          fp.id === editingFloorplan.id ? data.floorplan : fp
        ))
        toast.success('Floorplan updated successfully')
      } else {
        setFloorplans(prev => [...prev, data.floorplan])
        toast.success('Floorplan created successfully')
      }
      
      resetForm()
    } catch (error) {
      console.error('Error saving floorplan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save floorplan')
    }
  }

  const handleEdit = (floorplan: Floorplan) => {
    setEditingFloorplan(floorplan)
    setFormData({
      name: floorplan.name,
      floor_number: floorplan.floor_number,
      image_url: floorplan.image_url || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (floorplan: Floorplan) => {
    if (!confirm(`Are you sure you want to delete "${floorplan.name}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('Please log in to continue')
        return
      }

      const response = await fetch(`/api/floorplans/${floorplan.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete floorplan')
      }

      setFloorplans(prev => prev.filter(fp => fp.id !== floorplan.id))
      toast.success('Floorplan deleted successfully')
    } catch (error) {
      console.error('Error deleting floorplan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete floorplan')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      floor_number: 1,
      image_url: ''
    })
    setEditingFloorplan(null)
    setShowForm(false)
  }

  const openEditor = (floorplan: Floorplan) => {
    setSelectedFloorplan(floorplan)
    setShowEditor(true)
  }

  const handleEditorSave = async (data: any) => {
    // Here you would save the floorplan data (POIs, zones, emergency paths)
    // to your backend API
    console.log('Saving floorplan data:', data)
    toast.success('Floorplan configuration saved')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (showEditor && selectedFloorplan) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 p-4 bg-white border-b">
          <button
            onClick={() => {
              setShowEditor(false)
              setSelectedFloorplan(null)
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Floorplans
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-xl font-semibold">
            Editing: {selectedFloorplan.name}
          </h1>
          {venue && (
            <span className="text-gray-500">({venue.name})</span>
          )}
        </div>
        <FloorplanEditor
          floorplanId={selectedFloorplan.id}
          onSave={handleEditorSave}
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Floorplans
            </h1>
            {venue && (
              <p className="text-gray-600">{venue.name} - {venue.address}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Floorplan
        </button>
      </div>

      {/* Floorplans Grid */}
      {floorplans.length === 0 ? (
        <div className="text-center py-12">
          <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No floorplans yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first floorplan to start designing your venue layout.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Floorplan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {floorplans.map((floorplan) => (
            <div key={floorplan.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {floorplan.image_url && (
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  <img
                    src={floorplan.image_url}
                    alt={floorplan.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {floorplan.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Floor {floorplan.floor_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditor(floorplan)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Layout"
                    >
                      <Map className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(floorplan)}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      title="Edit Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(floorplan)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Created {new Date(floorplan.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingFloorplan ? 'Edit Floorplan' : 'Create New Floorplan'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor Number
                </label>
                <input
                  type="number"
                  value={formData.floor_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor_number: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/floorplan.jpg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingFloorplan ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
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