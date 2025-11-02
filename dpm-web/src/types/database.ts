export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'event_organizer' | 'venue_manager' | 'advertiser'
          organization_id: string | null
          avatar_url: string | null
          phone: string | null
          company: string | null
          address: string | null
          bio: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'event_organizer' | 'venue_manager' | 'advertiser'
          organization_id?: string | null
          avatar_url?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          bio?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'event_organizer' | 'venue_manager' | 'advertiser'
          organization_id?: string | null
          avatar_url?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          bio?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          type: 'event_company' | 'venue' | 'advertising_agency'
          description: string | null
          website: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'event_company' | 'venue' | 'advertising_agency'
          description?: string | null
          website?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'event_company' | 'venue' | 'advertising_agency'
          description?: string | null
          website?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          state: string
          country: string
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          capacity: number | null
          venue_type: string
          description: string | null
          amenities: Json | null
          contact_info: Json | null
          organization_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          state: string
          country: string
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          capacity?: number | null
          venue_type: string
          description?: string | null
          amenities?: Json | null
          contact_info?: Json | null
          organization_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          state?: string
          country?: string
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          capacity?: number | null
          venue_type?: string
          description?: string | null
          amenities?: Json | null
          contact_info?: Json | null
          organization_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          description: string | null
          event_type: string
          start_date: string
          end_date: string
          venue_id: string
          organizer_id: string
          capacity: number | null
          ticket_price: number | null
          status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
          registration_url: string | null
          event_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          event_type: string
          start_date: string
          end_date: string
          venue_id: string
          organizer_id: string
          capacity?: number | null
          ticket_price?: number | null
          status?: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
          registration_url?: string | null
          event_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          event_type?: string
          start_date?: string
          end_date?: string
          venue_id?: string
          organizer_id?: string
          capacity?: number | null
          ticket_price?: number | null
          status?: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
          registration_url?: string | null
          event_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      floorplans: {
        Row: {
          id: string
          venue_id: string
          name: string
          floor_level: number
          image_url: string | null
          svg_data: string | null
          scale_factor: number | null
          dimensions: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          name: string
          floor_level?: number
          image_url?: string | null
          svg_data?: string | null
          scale_factor?: number | null
          dimensions?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          name?: string
          floor_level?: number
          image_url?: string | null
          svg_data?: string | null
          scale_factor?: number | null
          dimensions?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      navigation_points: {
        Row: {
          id: string
          floorplan_id: string
          name: string
          point_type: 'entrance' | 'exit' | 'booth' | 'amenity' | 'landmark' | 'junction'
          x_coordinate: number
          y_coordinate: number
          z_coordinate: number | null
          description: string | null
          metadata: Json | null
          is_accessible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          floorplan_id: string
          name: string
          point_type: 'entrance' | 'exit' | 'booth' | 'amenity' | 'landmark' | 'junction'
          x_coordinate: number
          y_coordinate: number
          z_coordinate?: number | null
          description?: string | null
          metadata?: Json | null
          is_accessible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          floorplan_id?: string
          name?: string
          point_type?: 'entrance' | 'exit' | 'booth' | 'amenity' | 'landmark' | 'junction'
          x_coordinate?: number
          y_coordinate?: number
          z_coordinate?: number | null
          description?: string | null
          metadata?: Json | null
          is_accessible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ar_advertisements: {
        Row: {
          id: string
          campaign_name: string
          advertiser_id: string
          event_id: string | null
          venue_id: string | null
          ad_type: 'banner' | 'interactive' | 'video' | '3d_model'
          content_url: string
          trigger_conditions: Json | null
          placement_rules: Json | null
          start_date: string
          end_date: string
          budget: number | null
          impressions: number
          clicks: number
          status: 'draft' | 'active' | 'paused' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_name: string
          advertiser_id: string
          event_id?: string | null
          venue_id?: string | null
          ad_type: 'banner' | 'interactive' | 'video' | '3d_model'
          content_url: string
          trigger_conditions?: Json | null
          placement_rules?: Json | null
          start_date: string
          end_date: string
          budget?: number | null
          impressions?: number
          clicks?: number
          status?: 'draft' | 'active' | 'paused' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_name?: string
          advertiser_id?: string
          event_id?: string | null
          venue_id?: string | null
          ad_type?: 'banner' | 'interactive' | 'video' | '3d_model'
          content_url?: string
          trigger_conditions?: Json | null
          placement_rules?: Json | null
          start_date?: string
          end_date?: string
          budget?: number | null
          impressions?: number
          clicks?: number
          status?: 'draft' | 'active' | 'paused' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          event_type: string
          user_id: string | null
          session_id: string
          event_data: Json
          timestamp: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          user_id?: string | null
          session_id: string
          event_data: Json
          timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string | null
          session_id?: string
          event_data?: Json
          timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}