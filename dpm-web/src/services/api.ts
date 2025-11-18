import { supabase } from '../lib/supabase'
import { mockApiResponses } from './mockData'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK_DATA = false // Set to false to use real API

// Helper function to get auth headers
const getAuthHeaders = async () => {
  if (!supabase) {
    return {
      'Content-Type': 'application/json',
    }
  }
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      'Authorization': `Bearer ${session.access_token}`
    })
  }
}

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Return mock data if enabled
  if (USE_MOCK_DATA) {
    const mockResponse = mockApiResponses[endpoint as keyof typeof mockApiResponses]
    if (mockResponse) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200))
      return mockResponse.data
    }
  }

  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    },
    credentials: 'include'
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Events API
export const eventsApi = {
  // Get all events
  getAll: () => apiRequest('/events'),
  
  // Get event by ID
  getById: (id: string) => apiRequest(`/events/${id}`),
  
  // Create new event
  create: (eventData: {
    name: string
    description?: string
    venue_id: string
    start_date: string
    end_date: string
    status?: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
  }) => apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  }),
  
  // Update event
  update: (id: string, eventData: Partial<{
    name: string
    description: string
    venue_id: string
    start_date: string
    end_date: string
    status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
  }>) => apiRequest(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData)
  }),
  
  // Delete event
  delete: (id: string) => apiRequest(`/events/${id}`, {
    method: 'DELETE'
  })
}

// Venues API
export const venuesApi = {
  // Get all venues
  getAll: () => apiRequest('/venues'),
  
  // Get venue by ID
  getById: (id: string) => apiRequest(`/venues/${id}`),
  
  // Create new venue
  create: (venueData: {
    name: string
    address: string
    description?: string
    capacity?: number
    venue_type?: string
    contact_info?: ContactInfo
  }) => apiRequest('/venues', {
    method: 'POST',
    body: JSON.stringify(venueData)
  }),
  
  // Update venue
  update: (id: string, venueData: Partial<{
    name: string
    address: string
    description: string
    capacity: number
    venue_type: string
    contact_info: ContactInfo
  }>) => apiRequest(`/venues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(venueData)
  }),
  
  // Delete venue
  delete: (id: string) => apiRequest(`/venues/${id}`, {
    method: 'DELETE'
  })
}

// Types
export interface ContactInfo {
  phone?: string
  email?: string
  website?: string
  manager_name?: string
  emergency_contact?: string
}

export interface Event {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  venue_id: string
  status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
  max_attendees?: number
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  name: string
  address: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  description?: string
  capacity?: number
  venue_type?: string
  contact_info?: ContactInfo
  contact_email?: string
  contact_phone?: string
  created_at: string
  updated_at: string
}
