-- NavEaze V4 Initial Database Schema
-- This migration creates the core tables for the NavEaze platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'event_organizer', 'venue_manager', 'advertiser')) DEFAULT 'event_organizer',
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE public.organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'pro', 'enterprise')) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues table
CREATE TABLE public.venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  location GEOGRAPHY(POINT, 4326),
  contact_email TEXT,
  contact_phone TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue_id UUID REFERENCES venues(id),
  organizer_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')) DEFAULT 'draft',
  max_attendees INTEGER,
  registration_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Floorplans table
CREATE TABLE public.floorplans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  venue_id UUID REFERENCES venues(id),
  event_id UUID REFERENCES events(id),
  floor_level INTEGER DEFAULT 1,
  image_url TEXT,
  svg_data JSONB,
  scale_factor DECIMAL(10,6),
  origin_point GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation points table
CREATE TABLE public.navigation_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  floorplan_id UUID REFERENCES floorplans(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('entrance', 'exit', 'booth', 'amenity', 'landmark', 'waypoint')) NOT NULL,
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  floor_coordinates JSONB NOT NULL, -- {x, y} coordinates on the floorplan
  metadata JSONB DEFAULT '{}',
  is_accessible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AR Advertisements table
CREATE TABLE public.ar_advertisements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  advertiser_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  navigation_point_id UUID REFERENCES navigation_points(id),
  content_type TEXT CHECK (content_type IN ('image', 'video', '3d_model', 'interactive')) NOT NULL,
  content_url TEXT NOT NULL,
  trigger_radius DECIMAL(8,2) DEFAULT 5.0, -- meters
  display_duration INTEGER DEFAULT 10, -- seconds
  max_daily_views INTEGER DEFAULT 1000,
  current_daily_views INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'pending_approval', 'active', 'paused', 'expired')) DEFAULT 'draft',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE public.analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  event_id UUID REFERENCES events(id),
  navigation_point_id UUID REFERENCES navigation_points(id),
  ar_ad_id UUID REFERENCES ar_advertisements(id),
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Create indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_venues_organization_id ON venues(organization_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_floorplans_venue_id ON floorplans(venue_id);
CREATE INDEX idx_floorplans_event_id ON floorplans(event_id);
CREATE INDEX idx_navigation_points_floorplan_id ON navigation_points(floorplan_id);
CREATE INDEX idx_navigation_points_type ON navigation_points(type);
CREATE INDEX idx_ar_ads_event_id ON ar_advertisements(event_id);
CREATE INDEX idx_ar_ads_advertiser_id ON ar_advertisements(advertiser_id);
CREATE INDEX idx_ar_ads_status ON ar_advertisements(status);
CREATE INDEX idx_analytics_events_event_id ON analytics_events(event_id);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);

-- Create spatial indexes
CREATE INDEX idx_venues_location ON venues USING GIST(location);
CREATE INDEX idx_navigation_points_coordinates ON navigation_points USING GIST(coordinates);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE floorplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (to be expanded based on business rules)
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_floorplans_updated_at BEFORE UPDATE ON floorplans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navigation_points_updated_at BEFORE UPDATE ON navigation_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ar_advertisements_updated_at BEFORE UPDATE ON ar_advertisements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();