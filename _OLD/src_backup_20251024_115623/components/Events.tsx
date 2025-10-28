import React, { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Calendar, Building } from 'lucide-react'
import { toast } from 'sonner'
import EventForm from './EventForm'
import { Event, Venue } from '../services/api'

export default function Events() {
  const [events, setEvents] = useState<Event[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  // Fetch events and venues
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('Please log in to continue')
        return
      }

      // Fetch events and venues in parallel
      const [eventsResponse, venuesResponse] = await Promise.all([
        fetch('/api/events', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/venues', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ])

      if (!eventsResponse.ok || !venuesResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [eventsData, venuesData] = await Promise.all([
        eventsResponse.json(),
        venuesResponse.json()
      ])

      setEvents(eventsData.events || [])
      setVenues(venuesData.venues || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setShowForm(true)
  }

  const handleDelete = async (event: Event) => {
    if (!confirm(`Are you sure you want to delete "${event.name}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('Please log in to continue')
        return
      }

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete event')
      }

      setEvents(prev => prev.filter(e => e.id !== event.id))
      toast.success('Event deleted successfully')
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete event')
    }
  }

  const handleFormSuccess = (event: Event) => {
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === event.id ? event : e))
      toast.success('Event updated successfully')
    } else {
      setEvents(prev => [...prev, event])
      toast.success('Event created successfully')
    }
    setShowForm(false)
    setEditingEvent(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingEvent(null)
  }

  const getVenueName = (venueId: string) => {
    const venue = venues.find(v => v.id === venueId)
    return venue ? venue.name : 'Unknown Venue'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
      <EventForm
        event={editingEvent}
        venues={venues}
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
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Manage your events and their configurations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No events yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first event to start organizing.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {event.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {event.description}
                      </p>
                    )}
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {getVenueName(event.venue_id)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.start_date).toLocaleDateString()}
                      </div>
                      {event.max_attendees && (
                        <div>Max Attendees: {event.max_attendees.toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(event)}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      title="Edit Event"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span>
                    {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                  </span>
                  <span>
                    Created {new Date(event.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}