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
          <h1 className="text-2xl font-semibold text-white/90">Venues</h1>
          <p className="mt-1 text-sm text-white/50">
            Manage venue locations and their details
          </p>
        </div>
        <Link
          to="/venues/create"
          className="inline-flex items-center px-4 py-2 border border-brand-red/50 text-sm font-medium rounded-lg shadow-sm text-brand-red bg-brand-red/10 hover:bg-brand-red/20 transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Add Venue
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
                placeholder="Search venues..."
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
                onChange={(e) => setStatusFilter(e.target.value as VenueStatus)}
                className="block w-full pl-10 pr-3 py-2 border border-[#2A2A2A] rounded-lg leading-5 bg-[#1C1C1F] text-white/90 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors sm:text-sm appearance-none"
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
      <div className="bg-[#111113] border border-[#2A2A2A] shadow-sm overflow-hidden sm:rounded-xl">
        {filteredVenues.length > 0 ? (
          <ul className="divide-y divide-[#2A2A2A]">
            {filteredVenues.map((venue) => (
              <li key={venue.id} className="hover:bg-[#161618] transition-colors duration-200">
                <div className="px-5 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-[#1C1C1F] border border-[#3A3A3A] flex items-center justify-center">
                          <Building className="h-5 w-5 text-white/50" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-semibold text-white/90 truncate">
                            {venue.name}
                          </p>
                          <span className={cn(
                            'ml-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                            venue.status === 'active' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                              venue.status === 'inactive' ? 'bg-[#1C1C1F] text-white/50 border-[#3A3A3A]' :
                                'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                          )}>
                            {venue.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-white/50">
                          <MapPin className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                          <p className="truncate">{venue.address}</p>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-white/50">
                          {venue.capacity && (
                            <div className="flex items-center">
                              <Users className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                              <p>Capacity: {venue.capacity.toLocaleString()}</p>
                            </div>
                          )}
                          {venue.contact_phone && (
                            <div className="flex items-center">
                              <Phone className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                              <p>{venue.contact_phone}</p>
                            </div>
                          )}
                          {venue.contact_email && (
                            <div className="flex items-center">
                              <Mail className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                              <p>{venue.contact_email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:space-x-2">
                      <Link
                        to={`/venues/${venue.id}/edit`}
                        className="inline-flex items-center p-1.5 border border-[#3A3A3A] rounded-lg text-white/50 bg-[#1C1C1F] hover:bg-[#2A2A2A] hover:text-white transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteVenue(venue.id)}
                        disabled={deleteLoading === venue.id}
                        className="inline-flex items-center p-1.5 border border-red-500/20 rounded-lg text-red-400 bg-red-500/5 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="mt-3 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="text-sm text-white/40">
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
          <div className="text-center py-16">
            <div className="mx-auto h-12 w-12 rounded-full bg-[#1C1C1F] border border-[#2A2A2A] flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-white/30" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-white/90">
              No venues found
            </h3>
            <p className="mt-1 text-sm text-white/50 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first venue.'}
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <div className="mt-6">
                <Link
                  to="/venues/create"
                  className="inline-flex items-center px-4 py-2 border border-brand-red/50 text-sm font-medium rounded-lg shadow-sm text-brand-red bg-brand-red/10 hover:bg-brand-red/20 transition-colors"
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
