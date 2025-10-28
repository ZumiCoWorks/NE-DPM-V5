-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- CORE TABLES (From naveaze-v4)
-- ============================================================================

-- Users table (extends Supabase auth.users)
-- Drop and recreate if it exists
DROP TABLE IF EXISTS users CASCADE;

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
DROP TABLE IF EXISTS organizations CASCADE;

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
DROP TABLE IF EXISTS venues CASCADE;

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    capacity INTEGER CHECK (capacity > 0),
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
DROP TABLE IF EXISTS events CASCADE;

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    max_attendees INTEGER CHECK (max_attendees > 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_event_dates CHECK (end_date > start_date)
);

-- Floorplans table
DROP TABLE IF EXISTS floorplans CASCADE;

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
DROP TABLE IF EXISTS navigation_points CASCADE;

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

-- ============================================================================
-- B2B FEATURES (New)
-- ============================================================================

-- Booths table (sponsor booth configuration)
DROP TABLE IF EXISTS booths CASCADE;

CREATE TABLE booths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    navigation_point_id UUID REFERENCES navigation_points(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sponsor_name VARCHAR(200),
    sponsor_tier VARCHAR(50) DEFAULT 'Silver' CHECK (sponsor_tier IN ('Gold', 'Silver', 'Bronze', 'Standard')),
    sponsor_logo_url TEXT,
    sponsor_website TEXT,
    description TEXT,
    zone_name VARCHAR(100),
    x_coordinate DECIMAL(10,6) NOT NULL,
    y_coordinate DECIMAL(10,6) NOT NULL,
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CDV Reports table (Contextual Dwell Verification)
DROP TABLE IF EXISTS cdv_reports CASCADE;

CREATE TABLE cdv_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    booth_id UUID REFERENCES booths(id) ON DELETE SET NULL,
    mobile_user_id TEXT,
    quicket_order_id VARCHAR(100),
    quicket_user_id INTEGER,
    zone_name VARCHAR(200) NOT NULL,
    dwell_time_minutes DECIMAL(10,2) NOT NULL,
    active_engagement_status BOOLEAN DEFAULT false,
    x_coordinate DECIMAL(10,6),
    y_coordinate DECIMAL(10,6),
    session_id TEXT,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quicket Integrations table
DROP TABLE IF EXISTS quicket_integrations CASCADE;

CREATE TABLE quicket_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    user_token_encrypted TEXT,
    api_key_hint VARCHAR(20),
    mock_mode BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
    sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Engagement Sessions table
DROP TABLE IF EXISTS engagement_sessions CASCADE;

CREATE TABLE engagement_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile_user_id TEXT NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    booths_visited INTEGER DEFAULT 0,
    qr_codes_scanned INTEGER DEFAULT 0,
    total_dwell_minutes DECIMAL(10,2) DEFAULT 0,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
DROP TABLE IF EXISTS analytics_events CASCADE;
