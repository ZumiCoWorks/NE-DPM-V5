-- NavEaze V5 DPM MVP - Initial Database Schema
-- This migration creates all the core tables for the organizer portal

-- Users Table (Organizers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    organization VARCHAR(100),
    role VARCHAR(20) DEFAULT 'organizer' CHECK (role IN ('organizer', 'venue_manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Venues Table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address TEXT,
    contact_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_venues_owner_id ON venues(owner_id);
CREATE INDEX idx_venues_name ON venues(name);

-- Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);

-- Floorplans Table
CREATE TABLE floorplans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_metadata JSONB,
    scale_factor FLOAT DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_floorplans_venue_id ON floorplans(venue_id);

-- Navigation Nodes Table
CREATE TABLE navigation_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floorplan_id UUID NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('poi', 'entrance', 'exit', 'restroom', 'elevator', 'stairs', 'emergency_exit', 'first_aid')),
    x_coordinate FLOAT NOT NULL,
    y_coordinate FLOAT NOT NULL,
    is_emergency_exit BOOLEAN DEFAULT FALSE,
    is_first_aid BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_navigation_nodes_floorplan_id ON navigation_nodes(floorplan_id);
CREATE INDEX idx_navigation_nodes_type ON navigation_nodes(type);
CREATE INDEX idx_navigation_nodes_emergency ON navigation_nodes(is_emergency_exit);

-- Navigation Paths Table
CREATE TABLE navigation_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floorplan_id UUID NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    from_node_id UUID NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    weight FLOAT DEFAULT 1.0,
    is_emergency_path BOOLEAN DEFAULT FALSE,
    is_accessible BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_path UNIQUE(from_node_id, to_node_id)
);

CREATE INDEX idx_navigation_paths_floorplan_id ON navigation_paths(floorplan_id);
CREATE INDEX idx_navigation_paths_from_node ON navigation_paths(from_node_id);
CREATE INDEX idx_navigation_paths_to_node ON navigation_paths(to_node_id);
CREATE INDEX idx_navigation_paths_emergency ON navigation_paths(is_emergency_path);

-- AR Campaigns Table
CREATE TABLE ar_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ar_campaigns_venue_id ON ar_campaigns(venue_id);
CREATE INDEX idx_ar_campaigns_creator_id ON ar_campaigns(creator_id);
CREATE INDEX idx_ar_campaigns_status ON ar_campaigns(status);

-- AR Assets Table
CREATE TABLE ar_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES ar_campaigns(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('3d_model', 'video', 'image', 'audio')),
    file_url TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ar_assets_campaign_id ON ar_assets(campaign_id);
CREATE INDEX idx_ar_assets_type ON ar_assets(asset_type);

-- AR Zones Table
CREATE TABLE ar_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES ar_campaigns(id) ON DELETE CASCADE,
    floorplan_id UUID NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    polygon_coordinates JSONB NOT NULL,
    trigger_asset_id UUID REFERENCES ar_assets(id) ON DELETE SET NULL,
    trigger_conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ar_zones_campaign_id ON ar_zones(campaign_id);
CREATE INDEX idx_ar_zones_floorplan_id ON ar_zones(floorplan_id);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE floorplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_zones ENABLE ROW LEVEL SECURITY;

-- Sample organizer user for testing
INSERT INTO users (email, password_hash, full_name, organization, role)
VALUES (
    'demo@naveaze.com',
    '$2b$10$example_hash_replace_with_real_hash',
    'Demo Organizer',
    'NavEaze Demo',
    'organizer'
);