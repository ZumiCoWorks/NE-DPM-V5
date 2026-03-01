import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import {
  Calendar,
  MapPin,
  Users,
  User,
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

      // 1. Garbage Collection: Fetch floorplan to get image URL before cascade delete
      const { data: floorplanData } = await supabase
        .from('floorplans')
        .select('image_url')
        .eq('event_id', eventId)
        .single()

      const floorplan = floorplanData as { image_url?: string } | null

      // 2. Delete Floorplan Image from Storage
      if (floorplan?.image_url) {
        try {
          // Extract filename from URL (assuming standard Supabase Storage URL format)
          const urlParts = floorplan.image_url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          if (fileName) {
            await supabase.storage.from('floorplans').remove([fileName])
            console.log('🗑️ Deleted floorplan image:', fileName)
          }
        } catch (err) {
          console.warn('Failed to delete floorplan image:', err)
        }
      }

      // 3. Delete Manifests from Storage (Try both buckets)
      const manifestName = `manifest_${eventId}.json`
      await supabase.storage.from('events').remove([manifestName])
      await supabase.storage.from('floorplans').remove([manifestName])
      console.log('🗑️ Deleted manifests:', manifestName)

      // 4. Delete Event Record (Cascade will handle DB relations)
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
          <h1 className="text-2xl font-semibold text-white/90">Events</h1>
          <p className="mt-1 text-sm text-white/50">
            Manage your events and track attendance
          </p>
        </div>
        <Link
          to="/events/create"
          className="inline-flex items-center px-4 py-2 border border-brand-red/50 text-sm font-medium rounded-lg shadow-sm text-brand-red bg-brand-red/10 hover:bg-brand-red/20 transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[#111113] border border-[#2A2A2A] rounded-xl shadow-sm">
        <div className="px-5 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-white/40" />
              </div>
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-[#2A2A2A] rounded-lg leading-5 bg-[#1C1C1F] text-white/90 placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors sm:text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-white/40" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as EventStatus)}
                className="block w-full pl-10 pr-3 py-2 border border-[#2A2A2A] rounded-lg leading-5 bg-[#1C1C1F] text-white/90 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors sm:text-sm appearance-none"
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
      <div className="bg-[#111113] border border-[#2A2A2A] shadow-sm overflow-hidden sm:rounded-xl">
        {filteredEvents.length > 0 ? (
          <ul className="divide-y divide-[#2A2A2A]">
            {filteredEvents.map((event) => (
              <li key={event.id} className="hover:bg-[#161618] transition-colors duration-200">
                <div className="px-5 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-[#1C1C1F] border border-[#3A3A3A] flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-white/50" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-semibold text-white/90 truncate">
                            {event.name}
                          </p>
                          <span className={cn(
                            'ml-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                            event.status === 'published' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                              event.status === 'draft' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
                                'bg-red-400/10 text-red-400 border-red-400/20'
                          )}>
                            {event.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-white/50">
                          <MapPin className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                          <p className="truncate">
                            {event.venue?.name} - {event.venue?.address}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-white/50">
                          <Calendar className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                          <p>
                            {formatDate(event.start_date)} - {formatDate(event.end_date)}
                          </p>
                        </div>
                        {event.max_attendees && (
                          <div className="mt-1 flex items-center text-xs text-white/50">
                            <Users className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                            <p>Max {event.max_attendees} attendees</p>
                          </div>
                        )}
                        {user?.role === 'admin' && event.organizer && (
                          <div className="mt-1 flex items-center text-xs text-white/50">
                            <User className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                            <p>Organizer: {event.organizer.full_name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:space-x-3">
                      <Link
                        to={`/events/${event.id}/setup`}
                        className="inline-flex items-center px-3 py-1.5 border border-[#3A3A3A] rounded-lg shadow-sm text-xs font-medium text-white/80 bg-[#1C1C1F] hover:bg-[#2A2A2A] hover:text-white transition-colors"
                        title="Continue event setup"
                      >
                        <svg className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Setup
                      </Link>
                      <div className="flex space-x-2">
                        <Link
                          to={`/events/${event.id}/edit`}
                          className="inline-flex items-center p-1.5 border border-[#3A3A3A] rounded-lg text-white/50 bg-[#1C1C1F] hover:bg-[#2A2A2A] hover:text-white transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={deleteLoading === event.id}
                          className="inline-flex items-center p-1.5 border border-red-500/20 rounded-lg text-red-400 bg-red-500/5 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading === event.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {event.description && (
                    <div className="mt-3 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="text-sm text-white/40">
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
          <div className="text-center py-16">
            <div className="mx-auto h-12 w-12 rounded-full bg-[#1C1C1F] border border-[#2A2A2A] flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-white/30" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-white/90">
              No events found
            </h3>
            <p className="mt-1 text-sm text-white/50 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first event.'}
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <div className="mt-6">
                <Link
                  to="/events/create"
                  className="inline-flex items-center px-4 py-2 border border-brand-red/50 text-sm font-medium rounded-lg shadow-sm text-brand-red bg-brand-red/10 hover:bg-brand-red/20 transition-colors"
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
