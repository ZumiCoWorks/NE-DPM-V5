-- NavEaze V4 Initial Database Schema
-- This migration creates the core tables for the NavEaze application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'event_organizer', 'venue_manager', 'advertiser')),
    avatar_url TEXT,
    phone TEXT,
    company TEXT,
    address TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    contact_email TEXT,
    contact_phone TEXT,
    amenities TEXT[],
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    max_attendees INTEGER CHECK (max_attendees > 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_event_dates CHECK (end_date > start_date)
);

-- Floorplans table
CREATE TABLE floorplans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    floor_number INTEGER DEFAULT 1,
    image_url TEXT,
    svg_data TEXT,
    scale_factor DECIMAL(10,6) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation points table
CREATE TABLE navigation_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floorplan_id UUID NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrance', 'exit', 'restroom', 'elevator', 'stairs', 'booth', 'stage', 'food', 'info', 'emergency', 'custom')),
    x_coordinate DECIMAL(10,6) NOT NULL,
    y_coordinate DECIMAL(10,6) NOT NULL,
    description TEXT,
    is_accessible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AR Advertisements table
CREATE TABLE ar_advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    advertiser_id UUID REFERENCES users(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', '3d_model', 'text')),
    content_url TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('location', 'qr_code', 'nfc', 'beacon')),
    trigger_data JSONB,
    position_data JSONB,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_campaign_dates CHECK (end_date IS NULL OR end_date > start_date)
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    event_data JSONB,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_venues_manager_id ON venues(manager_id);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_floorplans_venue_id ON floorplans(venue_id);
CREATE INDEX idx_navigation_points_floorplan_id ON navigation_points(floorplan_id);
CREATE INDEX idx_navigation_points_type ON navigation_points(type);
CREATE INDEX idx_ar_ads_advertiser_id ON ar_advertisements(advertiser_id);
CREATE INDEX idx_ar_ads_venue_id ON ar_advertisements(venue_id);
CREATE INDEX idx_ar_ads_event_id ON ar_advertisements(event_id);
CREATE INDEX idx_ar_ads_active ON ar_advertisements(is_active);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Spatial indexes for navigation
CREATE INDEX idx_navigation_points_coordinates ON navigation_points USING GIST (point(x_coordinate, y_coordinate));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_floorplans_updated_at BEFORE UPDATE ON floorplans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_navigation_points_updated_at BEFORE UPDATE ON navigation_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ar_advertisements_updated_at BEFORE UPDATE ON ar_advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE floorplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for venues table
CREATE POLICY "Venue managers can manage their venues" ON venues FOR ALL USING (
    manager_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Event organizers can view active venues" ON venues FOR SELECT USING (
    status = 'active' AND (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('event_organizer', 'admin'))
    )
);

-- RLS Policies for events table
CREATE POLICY "Event organizers can manage their events" ON events FOR ALL USING (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Venue managers can view events at their venues" ON events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM venues v 
        WHERE v.id = events.venue_id 
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- RLS Policies for floorplans table
CREATE POLICY "Venue managers can manage floorplans for their venues" ON floorplans FOR ALL USING (
    EXISTS (
        SELECT 1 FROM venues v 
        WHERE v.id = floorplans.venue_id 
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);
CREATE POLICY "Event organizers can view floorplans for their event venues" ON floorplans FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.venue_id = floorplans.venue_id 
        AND (e.organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- RLS Policies for navigation_points table
CREATE POLICY "Navigation points inherit floorplan permissions" ON navigation_points FOR ALL USING (
    EXISTS (
        SELECT 1 FROM floorplans f
        JOIN venues v ON v.id = f.venue_id
        WHERE f.id = navigation_points.floorplan_id
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- RLS Policies for ar_advertisements table
CREATE POLICY "Advertisers can manage their campaigns" ON ar_advertisements FOR ALL USING (
    advertiser_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Venue managers can view campaigns at their venues" ON ar_advertisements FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM venues v 
        WHERE v.id = ar_advertisements.venue_id 
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- RLS Policies for analytics_events table
CREATE POLICY "Users can view their own analytics" ON analytics_events FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can insert analytics events" ON analytics_events FOR INSERT WITH CHECK (true);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON venues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON floorplans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON navigation_points TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ar_advertisements TO authenticated;
GRANT SELECT, INSERT ON analytics_events TO authenticated;

-- Grant read access to anonymous users for public data
GRANT SELECT ON venues TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON floorplans TO anon;
GRANT SELECT ON navigation_points TO anon;
GRANT SELECT ON ar_advertisements TO anon;

-- Insert initial admin user (this will be created when first user registers)
-- The actual user creation will be handled by the application

COMMIT;