import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ArrowLeft, Upload, MapPin, Zap, Globe, Shield, AlertTriangle } from 'lucide-react'
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

interface GeographicalZone {
  type: 'circle' | 'polygon'
  coordinates: number[][]
  radius?: number
  name: string
  description?: string
}

interface FormData {
  title: string
  description: string
  venue_id: string
  event_id: string
  content_type: 'image' | 'video' | '3d_model'
  content_url: string
  trigger_type: 'location' | 'marker' | 'face'
  trigger_data: Record<string, unknown>
  geographical_zones: GeographicalZone[]
  revenue_model: 'cpm' | 'cpc' | 'flat_rate'
  budget: number
  target_audience: string
  start_date: string
  end_date: string
  priority: number
}

export const CreateARCampaignPage: React.FC = () => {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [events, setEvents] = useState<Event[]>([])

  const [processingAsset, setProcessingAsset] = useState(false)
  const [assetProcessingStatus, setAssetProcessingStatus] = useState('')
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    venue_id: '',
    event_id: '',
    content_type: 'image',
    content_url: '',
    trigger_type: 'location',
    trigger_data: {},
    geographical_zones: [],
    revenue_model: 'cpm',
    budget: 1000,
    target_audience: '',
    start_date: '',
    end_date: '',
    priority: 1
  })

  useEffect(() => {
    fetchVenues()
  }, [])

  useEffect(() => {
    if (formData.venue_id) {
      fetchEvents(formData.venue_id)
    }
  }, [formData.venue_id])

  const fetchVenues = useCallback(async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/venues', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setVenues(data.venues || [])
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
      toast.error('Failed to load venues')
    }
  }, [getToken])

  const fetchEvents = useCallback(async (venueId: string) => {
    try {
      const token = await getToken()
      const response = await fetch(`/api/events?venue_id=${venueId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
    }
  }, [getToken])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/webp'],
      video: ['video/mp4', 'video/webm'],
      '3d_model': ['model/gltf+json', 'model/gltf-binary', 'application/octet-stream']
    }

    if (!allowedTypes[formData.content_type].includes(file.type)) {
      toast.error(`Invalid file type for ${formData.content_type}`)
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB')
      return
    }

    try {
      setProcessingAsset(true)
      setAssetProcessingStatus('Uploading asset...')
      
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('content_type', formData.content_type)
      formDataUpload.append('optimize_bandwidth', 'true')

      const token = await getToken()
      const response = await fetch('/api/ar-campaigns/upload-asset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      console.log('Upload result:', result)
      
      setAssetProcessingStatus('Processing with Zumi AI...')
      
      // Poll for processing status
      const pollProcessing = async (assetId: string) => {
        const token = await getToken()
        const statusResponse = await fetch(`/api/ar-campaigns/asset-status/${assetId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          
          if (statusData.status === 'completed') {
            setFormData(prev => ({ ...prev, content_url: statusData.optimized_url }))
            setAssetProcessingStatus('Asset processed successfully!')
            toast.success('Asset uploaded and optimized successfully')
            setProcessingAsset(false)
          } else if (statusData.status === 'failed') {
            throw new Error('Asset processing failed')
          } else {
            setAssetProcessingStatus(`Processing: ${statusData.progress || 0}%`)
            setTimeout(() => pollProcessing(assetId), 2000)
          }
        }
      }
      
      if (result.asset_id) {
        pollProcessing(result.asset_id)
      }
      
    } catch (error) {
      console.error('Error uploading asset:', error)
      toast.error('Failed to upload asset')
      setProcessingAsset(false)
      setAssetProcessingStatus('')
    }
  }

  const addGeographicalZone = () => {
    const newZone: GeographicalZone = {
      type: 'circle',
      coordinates: [[0, 0]], // Default coordinates
      radius: 100,
      name: `Zone ${formData.geographical_zones.length + 1}`,
      description: ''
    }
    setFormData(prev => ({
      ...prev,
      geographical_zones: [...prev.geographical_zones, newZone]
    }))
  }

  const updateGeographicalZone = (index: number, updates: Partial<GeographicalZone>) => {
    setFormData(prev => ({
      ...prev,
      geographical_zones: prev.geographical_zones.map((zone, i) => 
        i === index ? { ...zone, ...updates } : zone
      )
    }))
  }

  const removeGeographicalZone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      geographical_zones: prev.geographical_zones.filter((_, i) => i !== index)
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
    if (!formData.content_url) {
      toast.error('Please upload campaign content')
      return false
    }
    if (formData.geographical_zones.length === 0) {
      toast.error('At least one geographical zone is required')
      return false
    }
    if (!formData.start_date || !formData.end_date) {
      toast.error('Start and end dates are required')
      return false
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error('End date must be after start date')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      setLoading(true)
      
      const campaignData = {
        ...formData,
        trigger_data: formData.trigger_type === 'location' 
          ? { geographical_zones: formData.geographical_zones }
          : formData.trigger_data
      }
      
      const token = await getToken()
      const response = await fetch('/api/ar-campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create campaign')
      }
      
      const result = await response.json()
      toast.success('AR Campaign created successfully!')
      navigate('/ar-campaigns')
      
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign')
    } finally {
      setLoading(false)
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
          <p className="text-sm text-gray-500">Set up a new augmented reality campaign with geographical targeting</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-blue-500" />
              Basic Information
            </h3>
            
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
                  Revenue Model *
                </label>
                <select
                  name="revenue_model"
                  value={formData.revenue_model}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="cpm">CPM (Cost Per Mille)</option>
                  <option value="cpc">CPC (Cost Per Click)</option>
                  <option value="flat_rate">Flat Rate</option>
                </select>
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
                placeholder="Describe your AR campaign"
              />
            </div>
          </div>

          {/* Location & Event */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-500" />
              Location &amp; Event
            </h3>
            
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
                    <option key={venue.id} value={venue.id}>{venue.name}</option>
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
                  <option value="">No specific event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Geographical Zones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-purple-500" />
                Geographical Zones *
              </h3>
              <button
                type="button"
                onClick={addGeographicalZone}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Add Zone
              </button>
            </div>
            
            {formData.geographical_zones.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Globe className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No geographical zones defined</p>
                <p className="text-xs text-gray-400">Add zones to target specific areas for your AR campaign</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.geographical_zones.map((zone, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Zone {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeGeographicalZone(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zone Name
                        </label>
                        <input
                          type="text"
                          value={zone.name}
                          onChange={(e) => updateGeographicalZone(index, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Zone name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={zone.type}
                          onChange={(e) => updateGeographicalZone(index, { type: e.target.value as 'circle' | 'polygon' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="circle">Circle</option>
                          <option value="polygon">Polygon</option>
                        </select>
                      </div>
                      
                      {zone.type === 'circle' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Radius (meters)
                          </label>
                          <input
                            type="number"
                            value={zone.radius || 100}
                            onChange={(e) => updateGeographicalZone(index, { radius: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="10"
                            max="10000"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={zone.description || ''}
                        onChange={(e) => updateGeographicalZone(index, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Zone description (optional)"
                      />
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                      <p className="text-xs text-blue-600">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Coordinates will be set automatically based on venue location. You can adjust them later in the campaign editor.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AR Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-orange-500" />
              AR Content *
            </h3>
            
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
                  required
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="3d_model">3D Model</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Type *
                </label>
                <select
                  name="trigger_type"
                  value={formData.trigger_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="location">Location-based</option>
                  <option value="marker">Image Marker</option>
                  <option value="face">Face Detection</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Content *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {processingAsset ? (
                    <div className="space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-600">{assetProcessingStatus}</p>
                    </div>
                  ) : formData.content_url ? (
                    <div className="space-y-2">
                      <Shield className="mx-auto h-8 w-8 text-green-500" />
                      <p className="text-sm text-green-600">Asset uploaded and optimized successfully</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            onChange={handleFileUpload}
                            accept={formData.content_type === 'image' ? 'image/*' : formData.content_type === 'video' ? 'video/*' : '.gltf,.glb'}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formData.content_type === 'image' && 'PNG, JPG, WebP up to 50MB'}
                        {formData.content_type === 'video' && 'MP4, WebM up to 50MB'}
                        {formData.content_type === '3d_model' && 'GLTF, GLB up to 50MB'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Campaign Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  min="1"
                  required
                />
              </div>
              
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <input
                type="text"
                name="target_audience"
                value={formData.target_audience}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Young adults, Tech enthusiasts, Event attendees"
              />
            </div>
          </div>

          {/* Submit */}
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
              disabled={loading || processingAsset}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateARCampaignPage