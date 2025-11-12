import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
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

      const eventData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        venue_id: formData.venue_id,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        status: formData.status,
        updated_at: new Date().toISOString(),
        quicket_event_id: formData.quicket_event_id?.trim() || null,
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
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Events
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update event details and settings.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{errors.general}</div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          {/* Event Name */}
          <div className="mb-6">
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
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <div className="mt-1 relative">
              <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter event description"
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Quicket Event ID (optional) */}
          <div className="mb-6">
            <label htmlFor="quicket_event_id" className="block text-sm font-medium text-gray-700">
              Quicket Event ID (optional)
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="quicket_event_id"
                value={formData.quicket_event_id}
                onChange={(e) => handleInputChange('quicket_event_id', e.target.value)}
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Link to an external Quicket event"
              />
            </div>
            {errors.quicket_event_id && (
              <p className="mt-1 text-sm text-red-600">{errors.quicket_event_id}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
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

          {/* Venue */}
          <div className="mb-6">
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
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.venue_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a venue</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.address}
                  </option>
                ))}
              </select>
            </div>
            {errors.venue_id && (
              <p className="mt-1 text-sm text-red-600">{errors.venue_id}</p>
            )}
          </div>

          {/* Max Attendees */}
          <div className="mb-6">
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
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Event Status
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={formData.status === 'draft'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Draft</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={formData.status === 'published'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Published</span>
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Draft events are not visible to attendees. Published events are live and accepting registrations.
            </p>
          </div>

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
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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