-- High-Value Zones (HVZ) Table for Geofencing and CDV Revenue Attribution
-- Links floorplan zones to CDV reports for sponsor monetization

CREATE TABLE hvz_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floorplan_id UUID REFERENCES floorplans(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    zone_name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50) NOT NULL, -- 'sponsor_booth', 'vip', 'food_court', 'stage', 'general'
    -- Simple rectangle geometry for soft launch
    x_coordinate DECIMAL(10,2) NOT NULL,
    y_coordinate DECIMAL(10,2) NOT NULL, 
    width DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    -- Revenue tracking fields
    sponsor_name VARCHAR(100), -- Which sponsor paid for this zone
    hourly_rate DECIMAL(10,2), -- Revenue per hour for this zone
    priority_level INTEGER DEFAULT 1, -- 1=highest value, 5=lowest value
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_hvz_zones_floorplan_id ON hvz_zones(floorplan_id);
CREATE INDEX idx_hvz_zones_event_id ON hvz_zones(event_id);
CREATE INDEX idx_hvz_zones_active ON hvz_zones(is_active);
CREATE INDEX idx_hvz_zones_priority ON hvz_zones(priority_level);

-- Enable RLS
ALTER TABLE hvz_zones ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see HVZ zones for their own events
CREATE POLICY "Users can view their own HVZ zones" ON hvz_zones 
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

-- Policy: Users can manage zones for their events
CREATE POLICY "Users can manage their own HVZ zones" ON hvz_zones 
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hvz_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hvz_zones_updated_at
    BEFORE UPDATE ON hvz_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_hvz_zones_updated_at();