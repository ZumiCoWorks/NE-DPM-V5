import React, { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Map, Building } from 'lucide-react'
import { toast } from 'sonner'
import VenueForm from './VenueForm'
import { Venue } from '../services/api'

interface VenuesProps {
  onViewFloorplans?: (venueId: string) => void
}

export default function Venues({ onViewFloorplans }: VenuesProps) {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)

  // Fetch venues
  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('Please log in to continue')
        return
      }

      const response = await fetch('/api/venues', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch venues')
      }

      const data = await response.json()
      setVenues(data.venues || [])
    } catch (error) {
      console.error('Error fetching venues:', error)
      toast.error('Failed to load venues')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue)
    setShowForm(true)
  }

  const handleDelete = async (venue: Venue) => {
    if (!confirm(`Are you sure you want to delete "${venue.name}"? This will also delete all associated events and floorplans.`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('Please log in to continue')
        return
      }

      const response = await fetch(`/api/venues/${venue.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete venue')
      }

      setVenues(prev => prev.filter(v => v.id !== venue.id))
      toast.success('Venue deleted successfully')
    } catch (error) {
      console.error('Error deleting venue:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete venue')
    }
  }

  const handleFormSuccess = (venue: Venue) => {
    if (editingVenue) {
      setVenues(prev => prev.map(v => v.id === venue.id ? venue : v))
      toast.success('Venue updated successfully')
    } else {
      setVenues(prev => [...prev, venue])
      toast.success('Venue created successfully')
    }
    setShowForm(false)
    setEditingVenue(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingVenue(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (showForm) {
    return (
      <VenueForm
        venue={editingVenue}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venues</h1>
          <p className="text-gray-600">Manage your event venues and their floorplans</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Venue
        </button>
      </div>

      {/* Venues Grid */}
      {venues.length === 0 ? (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No venues yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first venue to start organizing events.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Venue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {venue.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {venue.address}
                    </p>
                    {venue.description && (
                      <p className="text-sm text-gray-500 mb-2">
                        {venue.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {onViewFloorplans && (
                      <button
                        onClick={() => onViewFloorplans(venue.id)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        title="Manage Floorplans"
                      >
                        <Map className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(venue)}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      title="Edit Venue"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(venue)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Venue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    {venue.capacity && (
                      <span>Capacity: {venue.capacity.toLocaleString()}</span>
                    )}
                  </div>
                  <span>
                    Created {new Date(venue.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {(venue.contact_email || venue.contact_phone) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {venue.contact_email && (
                        <div>Email: {venue.contact_email}</div>
                      )}
                      {venue.contact_phone && (
                        <div>Phone: {venue.contact_phone}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}