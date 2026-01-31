-- Migration: Add zone types and sponsor linking
-- Created: 2026-01-24
-- Description: Adds zone categorization (VIP, Food Court, etc.) and sponsor linking to zones table

-- Add zone type column with 7 predefined types
ALTER TABLE public.zones 
ADD COLUMN IF NOT EXISTS zone_type TEXT DEFAULT 'general' 
CHECK (zone_type IN ('general', 'restricted', 'food_court', 'stage', 'entrance', 'parking', 'vip'));

-- Add sponsor link for zone-based analytics
ALTER TABLE public.zones 
ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE SET NULL;

-- Add floorplan reference for Leaflet editor
ALTER TABLE public.zones
ADD COLUMN IF NOT EXISTS floorplan_id UUID REFERENCES public.floorplans(id) ON DELETE CASCADE;

-- Add styling configuration (color, opacity, etc.)
ALTER TABLE public.zones
ADD COLUMN IF NOT EXISTS style JSONB DEFAULT '{"color": "#3388ff", "fillOpacity": 0.2}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zones_event_id ON public.zones(event_id);
CREATE INDEX IF NOT EXISTS idx_zones_floorplan_id ON public.zones(floorplan_id);
CREATE INDEX IF NOT EXISTS idx_zones_sponsor_id ON public.zones(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_zones_zone_type ON public.zones(zone_type);

-- Add comments
COMMENT ON COLUMN public.zones.zone_type IS 'Category of zone: general, vip, food_court, stage, entrance, parking, or restricted';
COMMENT ON COLUMN public.zones.sponsor_id IS 'Optional link to sponsor for zone-based analytics';
COMMENT ON COLUMN public.zones.floorplan_id IS 'Reference to floorplan for Leaflet editor zones';
COMMENT ON COLUMN public.zones.style IS 'JSON styling configuration (color, fillOpacity, dashArray)';
