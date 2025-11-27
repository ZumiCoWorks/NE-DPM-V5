import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useDemoMode } from '../../contexts/DemoModeContext'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import { MapPin, Building, Users, Plus, Edit, Trash2, Search, Filter, Phone, Mail } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Venue {
  id: string
  name: string
  description: string | null
  address: string
  capacity: number | null
  venue_type: string | null
  contact_email: string | null
  contact_phone: string | null
  status: 'active' | 'inactive' | 'maintenance' | string
  created_at: string
}

type VenueStatus = 'all' | 'active' | 'inactive' | 'maintenance'

export const VenuesPage: React.FC = () => {
  const { user } = useAuth()
  const { demoMode } = useDemoMode()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<VenueStatus>('all')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const fetchVenues = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // DEMO MODE: Mock Venues
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Fake loading delay
        setVenues([
          {
            id: 'demo-1',
            name: 'AFDA',
            description: 'Main convention center for tech events',
            address: '41 Flame Ave',
            capacity: 5000,
            venue_type: 'Convention Center',
            contact_email: 'info@afda.co.za',
            contact_phone: '+27 21 123 4567',
            status: 'active',
            created_at: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            name: 'Cape Town Convention Center',
            description: 'Main convention center for tech events',
            address: '1 Lower Long Street, Cape Town',
            capacity: 10000,
            venue_type: 'Convention Center',
            contact_email: 'info@cticc.co.za',
            contact_phone: '+27 21 410 5000',
            status: 'active',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'demo-3',
            name: 'V&A Waterfront Pavilion',
            description: 'Outdoor venue for summer events',
            address: 'Victoria & Alfred Waterfront, Cape Town',
            capacity: 2000,
            venue_type: 'Outdoor',
            contact_email: 'events@waterfront.co.za',
            contact_phone: '+27 21 408 7600',
            status: 'maintenance',
            created_at: new Date(Date.now() - 172800000).toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }

      if (!supabase) {
        console.error('Supabase client not initialized')
        return;
      }

      const { data, error } = await supabase
        .from('venues')
        .select('id, name, description, address, capacity, venue_type, contact_email, contact_phone, status, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching venues:', error)
        return
      }

      setVenues((data as Venue[]) || [])
    } catch (error) {
      console.error('Error fetching venues:', error)
    } finally {
      setLoading(false)
    }
  }, [user, demoMode])

  useEffect(() => {
    fetchVenues()
  }, [fetchVenues])

  const handleDeleteVenue = async (venueId: string) => {
    // Prevent deletion in demo mode
    if (demoMode) {
      alert('Cannot delete venues in demo mode. Toggle off demo mode in the sidebar to manage real data.');
      return;
    }

    if (!confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      return
    }

    try {
      setDeleteLoading(venueId)

      if (!supabase) {
        console.error('Supabase client not initialized')
        alert('Database connection not available')
        return
      }

      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId)

      if (error) {
        console.error('Error deleting venue:', error)
        alert('Failed to delete venue. Please try again.')
        return
      }

      // Remove from local state
      setVenues(venues.filter(venue => venue.id !== venueId))
    } catch (error) {
      console.error('Error deleting venue:', error)
      alert('Failed to delete venue. Please try again.')
    } finally {
      setDeleteLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (venue.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || venue.status === statusFilter
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
          <h1 className="text-2xl font-bold text-gray-900">Venues</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage venue locations and their details
          </p>
        </div>
        <Link
          to="/venues/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Add Venue
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
                placeholder="Search venues..."
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
                onChange={(e) => setStatusFilter(e.target.value as VenueStatus)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Venues List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredVenues.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredVenues.map((venue) => (
              <li key={venue.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Building className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {venue.name}
                          </p>
                          <span className={cn(
                            'ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                            getStatusColor(venue.status)
                          )}>
                            {venue.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          <p className="truncate">{venue.address}</p>
                        </div>
                        {venue.capacity && (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <Users className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            <p>Capacity: {venue.capacity.toLocaleString()}</p>
                          </div>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          {venue.contact_phone && (
                            <div className="flex items-center">
                              <Phone className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              <p>{venue.contact_phone}</p>
                            </div>
                          )}
                          {venue.contact_email && (
                            <div className="flex items-center">
                              <Mail className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              <p>{venue.contact_email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/venues/${venue.id}/edit`}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteVenue(venue.id)}
                        disabled={deleteLoading === venue.id}
                        className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteLoading === venue.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {venue.description && (
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="text-sm text-gray-500">
                          {venue.description}
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
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No venues found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first venue.'}
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <div className="mt-6">
                <Link
                  to="/venues/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-4 w-4" />
                  Add Venue
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default VenuesPage
