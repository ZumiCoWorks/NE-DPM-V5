import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import { ArrowLeft, Calendar, MapPin, Users, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

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

interface FormErrors {
  name?: string
  description?: string
  start_date?: string
  end_date?: string
  venue_id?: string
  max_attendees?: string
  status?: string
  general?: string
  quicket_event_id?: string
  navigation_mode?: string
  gps_center_lat?: string
  gps_center_lng?: string
}

export const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  // Removed unused profile variable
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
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
  const [errors, setErrors] = useState<FormErrors>({})

  const fetchEvent = useCallback(async () => {
    if (!id) return

    try {
      if (!supabase) {
        console.warn('Supabase client not initialized when fetching event')
        setErrors({ general: 'Failed to load event details' })
        return
      }
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching event:', error)
        setErrors({ general: 'Failed to load event details' })
        return
      }

      if (event) {
        const e = event as {
          name?: string
          description?: string
          start_date?: string | Date
          end_date?: string | Date
          venue_id?: string
          max_attendees?: number | null
          status?: 'draft' | 'published'
          quicket_event_id?: string | null
          navigation_mode?: 'indoor' | 'outdoor' | 'hybrid'
          gps_center_lat?: number
          gps_center_lng?: number
        }
        setFormData({
          name: e.name || '',
          description: e.description || '',
          start_date: e.start_date ? new Date(e.start_date).toISOString().slice(0, 16) : '',
          end_date: e.end_date ? new Date(e.end_date).toISOString().slice(0, 16) : '',
          venue_id: e.venue_id || '',
          max_attendees: e.max_attendees ? String(e.max_attendees) : '',
          status: e.status || 'draft',
          quicket_event_id: e.quicket_event_id || '',
          navigation_mode: e.navigation_mode || 'hybrid',
          gps_center_lat: e.gps_center_lat ? String(e.gps_center_lat) : '',
          gps_center_lng: e.gps_center_lng ? String(e.gps_center_lng) : '',
        })
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      setErrors({ general: 'Failed to load event details' })
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchVenues = useCallback(async () => {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized when fetching venues')
        setVenues([])
        return
      }
      const { data: venuesData, error } = await supabase
        .from('venues')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name')

      if (error) {
        console.error('Error fetching venues:', error)
        return
      }

      setVenues((venuesData as Venue[]) || [])
    } catch (error) {
      console.error('Error fetching venues:', error)
    }
  }, [])

  useEffect(() => {
    if (id) {
      fetchEvent()
      fetchVenues()
    }
  }, [id])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

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
    }

    if (!formData.venue_id) {
      newErrors.venue_id = 'Please select a venue'
    }

    if (formData.max_attendees && parseInt(formData.max_attendees) < 1) {
      newErrors.max_attendees = 'Maximum attendees must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !id) return

    try {
      setSubmitting(true)
      setErrors({})

      if (!supabase) {
        setErrors({ general: 'Failed to update event. Please try again.' })
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
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        status: formData.status,
        updated_at: new Date().toISOString(),
        quicket_event_id: formData.quicket_event_id?.trim() || null,
        navigation_mode: formData.navigation_mode,
        gps_center_lat: formData.gps_center_lat ? parseFloat(formData.gps_center_lat) : null,
        gps_center_lng: formData.gps_center_lng ? parseFloat(formData.gps_center_lng) : null,
      }

      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)

      if (error) {
        console.error('Error updating event:', error)
        setErrors({ general: 'Failed to update event. Please try again.' })
        return
      }

      navigate('/events')
    } catch (error) {
      console.error('Error updating event:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Link
            to="/events"
            className="inline-flex items-center text-sm font-medium text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Events
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white/90">Edit Event</h1>
            <p className="mt-1 text-sm text-white/50">
              Update event details and settings.
            </p>
          </div>
          <Link
            to={`/events/${id}/sponsors`}
            className="inline-flex items-center px-4 py-2 border border-[#3A3A3A] shadow-sm text-sm font-medium rounded-lg text-white/90 bg-[#1C1C1F] hover:bg-[#2A2A2A] transition-all"
          >
            👥 Manage Sponsors
          </Link>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
            <div className="text-sm text-red-500">{errors.general}</div>
          </div>
        )}

        <div className="bg-[#111113] border border-[#2A2A2A] shadow-sm rounded-xl p-6">
          {/* Event Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-white/70">
              Event Name *
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-white/30" />
              </div>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={cn(
                  "block w-full pl-10 pr-3 py-2 border rounded-lg bg-[#1C1C1F] text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors sm:text-sm",
                  errors.name ? 'border-red-500/50' : 'border-[#2A2A2A]'
                )}
                placeholder="Enter event name"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-white/70">
              Description
            </label>
            <div className="mt-1 relative">
              <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                <FileText className="h-5 w-5 text-white/30" />
              </div>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={cn(
                  "block w-full pl-10 pr-3 py-2 border rounded-lg bg-[#1C1C1F] text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors sm:text-sm",
                  errors.description ? 'border-red-500/50' : 'border-[#2A2A2A]'
                )}
                placeholder="Enter event description"
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Quicket Event ID (optional) */}
          <div className="mb-6">
            <label htmlFor="quicket_event_id" className="block text-sm font-medium text-white/70">
              Quicket Event ID (optional)
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="quicket_event_id"
                value={formData.quicket_event_id}
                onChange={(e) => handleInputChange('quicket_event_id', e.target.value)}
                className="block w-full px-3 py-2 border border-[#2A2A2A] rounded-lg bg-[#1C1C1F] text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors sm:text-sm"
                placeholder="Link to an external Quicket event"
              />
            </div>
            {errors.quicket_event_id && (
              <p className="mt-1 text-sm text-red-500">{errors.quicket_event_id}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-white/70">
                Start Date & Time *
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className={cn(
                    "block w-full px-3 py-2 border rounded-lg bg-[#1C1C1F] text-white/90 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors sm:text-sm [color-scheme:dark]",
                    errors.start_date ? 'border-red-500/50' : 'border-[#2A2A2A]'
                  )}
                />
              </div>
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-white/70">
                End Date & Time *
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className={cn(
                    "block w-full px-3 py-2 border rounded-lg bg-[#1C1C1F] text-white/90 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors sm:text-sm [color-scheme:dark]",
                    errors.end_date ? 'border-red-500/50' : 'border-[#2A2A2A]'
                  )}
                />
              </div>
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Venue */}
          <div className="mb-6">
            <label htmlFor="venue_id" className="block text-sm font-medium text-white/70">
              Venue *
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-white/30" />
              </div>
              <select
                id="venue_id"
                value={formData.venue_id}
                onChange={(e) => handleInputChange('venue_id', e.target.value)}
                className={cn(
                  "block w-full pl-10 pr-3 py-2 border rounded-lg bg-[#1C1C1F] text-white/90 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors sm:text-sm appearance-none",
                  errors.venue_id ? 'border-red-500/50' : 'border-[#2A2A2A]'
                )}
              >
                <option value="" className="bg-[#1C1C1F]">Select a venue</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id} className="bg-[#1C1C1F]">
                    {venue.name} - {venue.address}
                  </option>
                ))}
              </select>
            </div>
            {errors.venue_id && (
              <p className="mt-1 text-sm text-red-500">{errors.venue_id}</p>
            )}
          </div>

          {/* Max Attendees */}
          <div className="mb-6">
            <label htmlFor="max_attendees" className="block text-sm font-medium text-white/70">
              Maximum Attendees
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-white/30" />
              </div>
              <input
                type="number"
                id="max_attendees"
                min="1"
                value={formData.max_attendees}
                onChange={(e) => handleInputChange('max_attendees', e.target.value)}
                className={cn(
                  "block w-full pl-10 pr-3 py-2 border rounded-lg bg-[#1C1C1F] text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors sm:text-sm",
                  errors.max_attendees ? 'border-red-500/50' : 'border-[#2A2A2A]'
                )}
                placeholder="Leave empty for unlimited"
              />
            </div>
            {errors.max_attendees && (
              <p className="mt-1 text-sm text-red-500">{errors.max_attendees}</p>
            )}
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-3">
              Event Status
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={formData.status === 'draft'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="h-4 w-4 bg-[#1C1C1F] border-[#3A3A3A] text-blue-600 focus:ring-blue-500/50"
                />
                <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Draft</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={formData.status === 'published'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="h-4 w-4 bg-[#1C1C1F] border-[#3A3A3A] text-blue-600 focus:ring-blue-500/50"
                />
                <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Published</span>
              </label>
            </div>
            <p className="mt-3 text-xs text-white/40">
              Draft events are not visible to attendees. Published events are live and accepting registrations.
            </p>
          </div>

          {/* Navigation Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-3">
              Navigation Mode *
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="navigation_mode"
                  value="indoor"
                  checked={formData.navigation_mode === 'indoor'}
                  onChange={(e) => handleInputChange('navigation_mode', e.target.value)}
                  className="h-4 w-4 bg-[#1C1C1F] border-[#3A3A3A] text-blue-600 focus:ring-blue-500/50"
                />
                <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Indoor Only (QR Codes)</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="navigation_mode"
                  value="outdoor"
                  checked={formData.navigation_mode === 'outdoor'}
                  onChange={(e) => handleInputChange('navigation_mode', e.target.value)}
                  className="h-4 w-4 bg-[#1C1C1F] border-[#3A3A3A] text-blue-600 focus:ring-blue-500/50"
                />
                <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Outdoor Only (GPS)</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="navigation_mode"
                  value="hybrid"
                  checked={formData.navigation_mode === 'hybrid'}
                  onChange={(e) => handleInputChange('navigation_mode', e.target.value)}
                  className="h-4 w-4 bg-[#1C1C1F] border-[#3A3A3A] text-blue-600 focus:ring-blue-500/50"
                />
                <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Hybrid (GPS + QR Codes)</span>
              </label>
            </div>
            <p className="mt-3 text-xs text-white/40">
              Hybrid mode uses GPS outdoors and allows QR code calibration for indoor accuracy.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-[#2A2A2A]">
            <Link
              to="/events"
              className="inline-flex items-center px-4 py-2 border border-[#3A3A3A] shadow-sm text-sm font-medium rounded-lg text-white/70 bg-[#1C1C1F] hover:bg-[#2A2A2A] hover:text-white transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                'Update Event'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
