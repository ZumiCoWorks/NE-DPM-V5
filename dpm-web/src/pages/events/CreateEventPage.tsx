import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import { ArrowLeft, Calendar, MapPin, Users, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Venue {
  id: string
  name: string
  address: string
}

interface EventFormData {
  name: string
  description: string
  start_date: string
  end_date: string
  venue_id: string
  max_attendees: string
  status: 'draft' | 'published'
  quicket_event_id?: string
  navigation_mode: 'indoor' | 'outdoor' | 'hybrid'
  gps_center_lat?: string
  gps_center_lng?: string
}

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const demoMode = (import.meta as { env: Record<string, string> }).env.VITE_DEMO_MODE === 'true'
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [venuesLoading, setVenuesLoading] = useState(true)
  const [showNewVenue, setShowNewVenue] = useState(false)
  const [newVenueName, setNewVenueName] = useState('')
  const [newVenueAddress, setNewVenueAddress] = useState('')
  const [newVenueLoading, setNewVenueLoading] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    venue_id: '',
    max_attendees: '',
    status: 'draft',
    quicket_event_id: '',
    navigation_mode: 'hybrid',
    gps_center_lat: '',
    gps_center_lng: '',
  })
  const [errors, setErrors] = useState<Partial<EventFormData>>({})

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      setVenuesLoading(true)
      if (demoMode || !supabase) {
        console.warn('Supabase client not initialized when fetching venues')
        setVenues([])
        return
      }
      
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name')

      if (error) {
        console.error('Error fetching venues:', error)
        return
      }

      setVenues((data as Venue[]) || [])
    } catch (error) {
      console.error('Error fetching venues:', error)
    } finally {
      setVenuesLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<EventFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required'
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (startDate >= endDate) {
        newErrors.end_date = 'End date must be after start date'
      }
      
      if (startDate < new Date()) {
        newErrors.start_date = 'Start date cannot be in the past'
      }
    }

    if (!formData.venue_id) {
      newErrors.venue_id = 'Please select a venue'
    }

    if (formData.max_attendees && parseInt(formData.max_attendees) <= 0) {
      newErrors.max_attendees = 'Max attendees must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user) {
      return
    }

    try {
      setLoading(true)
      if (demoMode || !supabase) {
        navigate('/events')
        return
      }
      
      const startISO = new Date(formData.start_date).toISOString()
      const endISO = new Date(formData.end_date).toISOString()
      const eventData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: startISO,
        end_date: endISO,
        start_time: startISO,
        end_time: endISO,
        venue_id: formData.venue_id,
        organizer_id: user.id,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        status: formData.status,
        quicket_event_id: formData.quicket_event_id?.trim() || null,
        navigation_mode: formData.navigation_mode,
        gps_center_lat: formData.gps_center_lat ? parseFloat(formData.gps_center_lat) : null,
        gps_center_lng: formData.gps_center_lng ? parseFloat(formData.gps_center_lng) : null,
      }

      const { error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()

      if (error) {
        console.error('Error creating event:', error)
        alert('Failed to create event. Please try again.')
        return
      }

      navigate('/events')
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAddVenue = async () => {
    try {
      setNewVenueLoading(true)
      if (!newVenueName.trim() || !newVenueAddress.trim()) return
      if (demoMode || !supabase) {
        const v: Venue = { id: `demo-venue-${Date.now()}`, name: newVenueName.trim(), address: newVenueAddress.trim() }
        setVenues(prev => [v, ...prev])
        setFormData(prev => ({ ...prev, venue_id: v.id }))
      } else {
        const { data, error } = await supabase
          .from('venues')
          .insert({ name: newVenueName.trim(), address: newVenueAddress.trim(), status: 'active' })
          .select('id, name, address')
          .single()
        if (error) return
        const v = data as Venue
        setVenues(prev => [v, ...prev])
        setFormData(prev => ({ ...prev, venue_id: v.id }))
      }
      setShowNewVenue(false)
      setNewVenueName('')
      setNewVenueAddress('')
    } finally {
      setNewVenueLoading(false)
    }
  }

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/events"
          className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up a new event with venue and attendance details
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Event Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Event Name *
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter event name"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <div className="mt-1 relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your event..."
            />
          </div>
        </div>

        {/* Quicket Event ID (optional) */}
        <div>
          <label htmlFor="quicket_event_id" className="block text-sm font-medium text-gray-700">
            Quicket Event ID (optional)
          </label>
          <input
            type="text"
            id="quicket_event_id"
            value={formData.quicket_event_id}
            onChange={(e) => handleInputChange('quicket_event_id', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Link to an external Quicket event"
          />
        </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Start Date & Time *
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.start_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                End Date & Time *
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.end_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Venue Selection */}
          <div>
            <label htmlFor="venue_id" className="block text-sm font-medium text-gray-700">
              Venue *
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="venue_id"
                value={formData.venue_id}
                onChange={(e) => handleInputChange('venue_id', e.target.value)}
                disabled={venuesLoading}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.venue_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {venuesLoading ? 'Loading venues...' : 'Select a venue'}
                </option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.address}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowNewVenue((v) => !v)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                {showNewVenue ? 'Cancel' : 'Add Venue'}
              </button>
            </div>
            {showNewVenue && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new_venue_name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    id="new_venue_name"
                    type="text"
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Venue name"
                  />
                </div>
                <div>
                  <label htmlFor="new_venue_address" className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    id="new_venue_address"
                    type="text"
                    value={newVenueAddress}
                    onChange={(e) => setNewVenueAddress(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Venue address"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleQuickAddVenue}
                    disabled={newVenueLoading || !newVenueName.trim() || !newVenueAddress.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {newVenueLoading ? 'Saving...' : 'Save Venue'}
                  </button>
                </div>
              </div>
            )}
            {errors.venue_id && (
              <p className="mt-1 text-sm text-red-600">{errors.venue_id}</p>
            )}
          </div>

          {/* Max Attendees */}
          <div>
            <label htmlFor="max_attendees" className="block text-sm font-medium text-gray-700">
              Maximum Attendees
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="max_attendees"
                min="1"
                value={formData.max_attendees}
                onChange={(e) => handleInputChange('max_attendees', e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.max_attendees ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Leave empty for unlimited"
              />
            </div>
            {errors.max_attendees && (
              <p className="mt-1 text-sm text-red-600">{errors.max_attendees}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <div className="mt-1">
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Draft events are not visible to attendees. Published events are live and accepting registrations.
            </p>
          </div>

          {/* Navigation Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Navigation Mode *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="navigation_mode"
                  value="indoor"
                  checked={formData.navigation_mode === 'indoor'}
                  onChange={(e) => handleInputChange('navigation_mode', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Indoor Only (QR Codes)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="navigation_mode"
                  value="outdoor"
                  checked={formData.navigation_mode === 'outdoor'}
                  onChange={(e) => handleInputChange('navigation_mode', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Outdoor Only (GPS)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="navigation_mode"
                  value="hybrid"
                  checked={formData.navigation_mode === 'hybrid'}
                  onChange={(e) => handleInputChange('navigation_mode', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Hybrid (GPS + QR Codes)</span>
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Hybrid mode uses GPS outdoors and allows QR code calibration for indoor accuracy.
            </p>
          </div>

          {/* GPS Center Coordinates - Show if outdoor or hybrid */}
          {(formData.navigation_mode === 'outdoor' || formData.navigation_mode === 'hybrid') && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-3">GPS Event Center</h3>
              <p className="text-sm text-gray-600 mb-3">
                Set the center point for your outdoor event venue. Attendees will use GPS for navigation.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gps_center_lat" className="block text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    type="number"
                    id="gps_center_lat"
                    step="0.000001"
                    value={formData.gps_center_lat}
                    onChange={(e) => handleInputChange('gps_center_lat', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="-25.7461"
                  />
                </div>
                <div>
                  <label htmlFor="gps_center_lng" className="block text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    type="number"
                    id="gps_center_lng"
                    step="0.000001"
                    value={formData.gps_center_lng}
                    onChange={(e) => handleInputChange('gps_center_lng', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="28.1881"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                💡 Tip: Right-click on Google Maps and copy the coordinates, or use your phone's GPS app.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              to="/events"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
