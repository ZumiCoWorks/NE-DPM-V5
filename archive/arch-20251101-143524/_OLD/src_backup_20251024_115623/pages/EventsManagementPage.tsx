import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar, MapPin, Users } from 'lucide-react'

interface Event {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  start_date: string
  end_date: string
  venue_id: string
  venues?: {
    id: string
    name: string
    address: string
  }
  created_at?: string
}

interface Venue {
  id: string
  name: string
  address: string
}

export function EventsManagementPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue_id: '',
    start_date: '',
    end_date: '',
    status: 'draft' as Event['status']
  })

  useEffect(() => {
    fetchEvents()
    fetchVenues()
  }, [])

  const fetchEvents = async () => {
    try {
      // For now, use mock data (will be replaced with real API call)
      const mockEvents: Event[] = [
        {
          id: 'event-001',
          name: 'Tech Expo 2025',
          description: 'Annual technology and innovation showcase',
          status: 'active',
          start_date: '2025-11-01T09:00:00Z',
          end_date: '2025-11-01T18:00:00Z',
          venue_id: 'venue-001',
          venues: {
            id: 'venue-001',
            name: 'Convention Center Hall A',
            address: '123 Main Street, Downtown'
          }
        },
        {
          id: 'event-002',
          name: 'Food & Wine Festival',
          description: 'Celebrate local cuisine and craft beverages',
          status: 'active',
          start_date: '2025-11-15T12:00:00Z',
          end_date: '2025-11-15T22:00:00Z',
          venue_id: 'venue-002',
          venues: {
            id: 'venue-002',
            name: 'Riverside Park',
            address: '456 River Road, Waterfront'
          }
        }
      ]
      setEvents(mockEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVenues = async () => {
    try {
      // Mock venues for now
      const mockVenues: Venue[] = [
        { id: 'venue-001', name: 'Convention Center Hall A', address: '123 Main Street' },
        { id: 'venue-002', name: 'Riverside Park', address: '456 River Road' }
      ]
      setVenues(mockVenues)
    } catch (error) {
      console.error('Error fetching venues:', error)
    }
  }

  const handleCreateEvent = async () => {
    try {
      console.log('Creating event:', formData)
      // TODO: API call to create event
      // For now, just close modal and refresh
      setShowCreateModal(false)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  const handleUpdateEvent = async () => {
    try {
      console.log('Updating event:', editingEvent?.id, formData)
      // TODO: API call to update event
      setEditingEvent(null)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    
    try {
      console.log('Deleting event:', eventId)
      // TODO: API call to delete event
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const openEditModal = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      name: event.name,
      description: event.description || '',
      venue_id: event.venue_id,
      start_date: event.start_date.slice(0, 16),
      end_date: event.end_date.slice(0, 16),
      status: event.status
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      venue_id: '',
      start_date: '',
      end_date: '',
      status: 'draft'
    })
  }

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure events that will appear in the B2C mobile app
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Event
        </button>
      </div>

      {/* Events List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Event
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      {event.description && (
                        <div className="text-sm text-gray-500">{event.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <div>
                        <div className="font-medium">{event.venues?.name}</div>
                        <div className="text-gray-500">{event.venues?.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div>{new Date(event.start_date).toLocaleDateString()}</div>
                      <div className="text-gray-500">to {new Date(event.end_date).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(event)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center ml-4"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingEvent) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tech Expo 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Annual technology and innovation showcase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue *
                  </label>
                  <select
                    value={formData.venue_id}
                    onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a venue</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} - {venue.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Event['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingEvent(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


