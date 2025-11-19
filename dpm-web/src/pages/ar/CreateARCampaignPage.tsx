import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface Venue {
  id: string
  name: string
}

interface Event {
  id: string
  name: string
  venue_id: string
}

interface FormData {
  title: string
  description: string
  venue_id: string
  event_id: string
  content_type: 'image' | 'video' | '3d_model'
  content_url: string
  trigger_type: 'location' | 'image' | 'qr_code'
  trigger_data: Record<string, unknown>
  position_x: number
  position_y: number
  position_z: number
  rotation_x: number
  rotation_y: number
  rotation_z: number
  scale_factor: number
  budget: number
  start_date: string
  end_date: string
  target_audience: string
}

export const CreateARCampaignPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    venue_id: '',
    event_id: '',
    content_type: 'image',
    content_url: '',
    trigger_type: 'location',
    trigger_data: {},
    position_x: 0,
    position_y: 0,
    position_z: 0,
    rotation_x: 0,
    rotation_y: 0,
    rotation_z: 0,
    scale_factor: 1,
    budget: 0,
    start_date: '',
    end_date: '',
    target_audience: ''
  })

  useEffect(() => {
    fetchVenues()
  }, [])

  useEffect(() => {
    if (formData.venue_id) {
      fetchEvents(formData.venue_id)
    } else {
      setEvents([])
      setFormData(prev => ({ ...prev, event_id: '' }))
    }
  }, [formData.venue_id])

  const fetchVenues = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized')
        toast.error('Database connection not available')
        return
      }
      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setVenues((data as Venue[]) || [])
    } catch (error) {
      console.error('Error fetching venues:', error)
      toast.error('Failed to load venues')
    }
  }

  const fetchEvents = async (venueId: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized')
        toast.error('Database connection not available')
        return
      }
      const { data, error } = await supabase
        .from('events')
        .select('id, name, venue_id')
        .eq('venue_id', venueId)
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setEvents((data as Event[]) || [])
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('position_') || name.includes('rotation_') || name === 'scale_factor' || name === 'budget'
        ? parseFloat(value) || 0
        : value
    }))
  }

  const handleTriggerDataChange = (key: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      trigger_data: {
        ...prev.trigger_data,
        [key]: value
      }
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Campaign title is required')
      return false
    }
    if (!formData.venue_id) {
      toast.error('Please select a venue')
      return false
    }
    if (!formData.content_url.trim()) {
      toast.error('Content URL is required')
      return false
    }
    if (!formData.start_date) {
      toast.error('Start date is required')
      return false
    }
    if (!formData.end_date) {
      toast.error('End date is required')
      return false
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error('End date must be after start date')
      return false
    }
    if (formData.budget <= 0) {
      toast.error('Budget must be greater than 0')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      setLoading(true)
      
      if (!supabase) {
        console.error('Supabase client not initialized')
        toast.error('Database connection not available')
        return
      }
      
      const campaignData = {
        ...formData,
        advertiser_id: user?.id,
        event_id: formData.event_id || null,
        is_active: false, // Start as inactive
        current_views: 0,
        total_interactions: 0,
        click_through_rate: 0
      }
      
      const { error } = await supabase
        .from('ar_advertisements')
        .insert([campaignData])
      
      if (error) throw error
      
      toast.success('AR campaign created successfully!')
      navigate('/ar-campaigns')
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  const renderTriggerDataFields = () => {
    switch (formData.trigger_type) {
      case 'location':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={String(formData.trigger_data.latitude ?? '')}
                onChange={(e) => handleTriggerDataChange('latitude', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter latitude"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={String(formData.trigger_data.longitude ?? '')}
                onChange={(e) => handleTriggerDataChange('longitude', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter longitude"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radius (meters)
              </label>
              <input
                type="number"
                value={String(formData.trigger_data.radius ?? '')}
                onChange={(e) => handleTriggerDataChange('radius', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter radius in meters"
              />
            </div>
          </div>
        )
      case 'image':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Image URL
            </label>
            <input
              type="url"
              value={String(formData.trigger_data.image_url ?? '')}
              onChange={(e) => handleTriggerDataChange('image_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter target image URL"
            />
          </div>
        )
      case 'qr_code':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              QR Code Data
            </label>
            <input
              type="text"
              value={String(formData.trigger_data.qr_data ?? '')}
              onChange={(e) => handleTriggerDataChange('qr_data', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter QR code data"
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/ar-campaigns')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create AR Campaign</h1>
          <p className="text-sm text-gray-500">Set up a new augmented reality advertising campaign</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter campaign title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget ($) *
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter budget"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter campaign description"
              />
            </div>
          </div>

          {/* Location & Event */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Location &amp; Event</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue *
                </label>
                <select
                  name="venue_id"
                  value={formData.venue_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a venue</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event (Optional)
                </label>
                <select
                  name="event_id"
                  value={formData.event_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.venue_id}
                >
                  <option value="">Select an event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">AR Content</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content Type *
                </label>
                <select
                  name="content_type"
                  value={formData.content_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="3d_model">3D Model</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content URL *
                </label>
                <input
                  type="url"
                  name="content_url"
                  value={formData.content_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter content URL"
                  required
                />
              </div>
            </div>
          </div>

          {/* Trigger Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Trigger Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                name="trigger_type"
                value={formData.trigger_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="location">Location-based</option>
                <option value="image">Image Recognition</option>
                <option value="qr_code">QR Code</option>
              </select>
            </div>
            
            {renderTriggerDataFields()}
          </div>

          {/* Campaign Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Campaign Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Target Audience</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audience Description
              </label>
              <textarea
                name="target_audience"
                value={formData.target_audience}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your target audience"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/ar-campaigns')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}