import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Use placeholder values for demo mode when env vars are missing
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== 'false'
const DEMO_SUPABASE_URL = 'https://demo.supabase.co'
const DEMO_SUPABASE_KEY = 'demo-key'

// Create client with actual or demo credentials
export const supabase = createClient(
  supabaseUrl || DEMO_SUPABASE_URL,
  supabaseAnonKey || DEMO_SUPABASE_KEY
)

// Database types for TypeScript
export interface User {
  id: string
  email: string
  full_name: string
  organization?: string
  role: 'organizer' | 'venue_manager'
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  owner_id: string
  name: string
  description?: string
  address?: string
  contact_info?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  organizer_id: string
  venue_id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface Floorplan {
  id: string
  venue_id: string
  image_url: string
  image_metadata?: Record<string, unknown>
  scale_factor: number
  created_at: string
  updated_at: string
}

export interface NavigationNode {
  id: string
  floorplan_id: string
  name: string
  type: 'poi' | 'entrance' | 'exit' | 'restroom' | 'elevator' | 'stairs' | 'emergency_exit' | 'first_aid'
  x_coordinate: number
  y_coordinate: number
  is_emergency_exit: boolean
  is_first_aid: boolean
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface NavigationPath {
  id: string
  floorplan_id: string
  from_node_id: string
  to_node_id: string
  weight: number
  is_emergency_path: boolean
  is_accessible: boolean
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ARCampaign {
  id: string
  venue_id: string
  creator_id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface ARAsset {
  id: string
  campaign_id: string
  name: string
  asset_type: '3d_model' | 'video' | 'image' | 'audio'
  file_url: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ARZone {
  id: string
  campaign_id: string
  floorplan_id: string
  name: string
  polygon_coordinates: number[][]
  trigger_asset_id?: string
  trigger_conditions?: Record<string, unknown>
  created_at: string
  updated_at: string
}