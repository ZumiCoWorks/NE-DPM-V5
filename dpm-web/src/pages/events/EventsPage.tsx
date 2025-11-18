import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
} from 'lucide-react'
import { formatDate, cn } from '../../lib/utils'

interface Event {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  venue_id: string
  organizer_id: string
  status: 'draft' | 'published' | 'cancelled'
  max_attendees: number | null
  created_at: string
  venue?: {
    name: string
    address: string
  }
  organizer?: {
    full_name: string
  }
}

type EventStatus = 'all' | 'draft' | 'published' | 'cancelled'

export const EventsPage: React.FC = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<EventStatus>('all')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      if (!supabase) {
        console.error('Supabase client not initialized')
        return
      }
      
      // Fetch raw events without embedded relations to avoid schema/relationship mismatch
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      // Filter by organizer if not admin
      if (user.role !== 'admin') {
        query = query.eq('organizer_id', user.id)
      }

      const { data: eventsData, error } = await query

      if (error) {
        console.error('Error fetching events:', error)
        return
      }

      const baseEvents: Event[] = (eventsData || []) as unknown as Event[]

      // Hydrate venue details
      const venueIds = Array.from(new Set(baseEvents.map(e => e.venue_id).filter(Boolean)))
      let venuesMap: Record<string, { name: string; address: string }> = {}
      if (venueIds.length) {
        const { data: venues } = await supabase
          .from('venues')
          .select('id, name, address')
          .in('id', venueIds)
        venuesMap = Object.fromEntries((venues as any[] || []).map((v: any) => [v.id as string, { name: v.name as string, address: (v.address as string) || '' }]))
      }

      // Optional: hydrate organizer (profiles) for admin view
      let profilesMap: Record<string, { full_name: string }> = {}
      if (user?.role === 'admin') {
        const organizerIds = Array.from(new Set(baseEvents.map(e => e.organizer_id).filter(Boolean)))
        if (organizerIds.length) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', organizerIds)
          profilesMap = Object.fromEntries((profiles as any[] || []).map((p: any) => {
            const email = (p.email as string) || ''
            const name = email ? (email.split('@')[0] || email) : 'Organizer'
            return [p.id as string, { full_name: name }]
          }))
        }
      }

      const hydrated = baseEvents.map(e => ({
        ...e,
        venue: e.venue_id ? venuesMap[e.venue_id] : undefined,
        organizer: e.organizer_id && profilesMap[e.organizer_id] ? profilesMap[e.organizer_id] : undefined,
      }))

      setEvents(hydrated)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    try {
      setDeleteLoading(eventId)
      
      if (!supabase) {
        console.error('Supabase client not initialized')
        alert('Database connection not available')
        return
      }
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) {
        console.error('Error deleting event:', error)
        alert('Failed to delete event. Please try again.')
        return
      }

      // Remove from local state
      setEvents(events.filter(event => event.id !== eventId))
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event. Please try again.')
    } finally {
      setDeleteLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your events and track attendance
          </p>
        </div>
        <Link
          to="/events/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as EventStatus)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredEvents.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredEvents.map((event) => (
              <li key={event.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Calendar className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {event.name}
                          </p>
                          <span className={cn(
                            'ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                            getStatusColor(event.status)
                          )}>
                            {event.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          <p className="truncate">
                            {event.venue?.name} - {event.venue?.address}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          <p>
                            {formatDate(event.start_date)} - {formatDate(event.end_date)}
                          </p>
                        </div>
                        {event.max_attendees && (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <Users className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            <p>Max {event.max_attendees} attendees</p>
                          </div>
                        )}
                        {user?.role === 'admin' && event.organizer && (
                          <div className="mt-2 text-sm text-gray-500">
                            Organizer: {event.organizer.full_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/events/${event.id}/edit`}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        disabled={deleteLoading === event.id}
                        className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteLoading === event.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {event.description && (
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="text-sm text-gray-500">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No events found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first event.'}
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <div className="mt-6">
                <Link
                  to="/events/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
