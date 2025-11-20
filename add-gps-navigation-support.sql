-- Add GPS navigation support for hybrid indoor/outdoor navigation
-- This enables events to use GPS coordinates alongside QR code positioning

-- 1. Add GPS fields to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS navigation_mode TEXT DEFAULT 'indoor' CHECK (navigation_mode IN ('indoor', 'outdoor', 'hybrid'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gps_center_lat DECIMAL(10, 8);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gps_center_lng DECIMAL(11, 8);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gps_bounds_ne_lat DECIMAL(10, 8);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gps_bounds_ne_lng DECIMAL(11, 8);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gps_bounds_sw_lat DECIMAL(10, 8);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gps_bounds_sw_lng DECIMAL(11, 8);

-- 2. Add GPS fields to venues table
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS gps_lat DECIMAL(10, 8);
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS gps_lng DECIMAL(11, 8);
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS gps_bounds_ne_lat DECIMAL(10, 8);
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS gps_bounds_ne_lng DECIMAL(11, 8);
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS gps_bounds_sw_lat DECIMAL(10, 8);
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS gps_bounds_sw_lng DECIMAL(11, 8);

-- 3. Add GPS fields to navigation_points table for hybrid positioning
ALTER TABLE public.navigation_points ADD COLUMN IF NOT EXISTS gps_lat DECIMAL(10, 8);
ALTER TABLE public.navigation_points ADD COLUMN IF NOT EXISTS gps_lng DECIMAL(11, 8);
ALTER TABLE public.navigation_points ADD COLUMN IF NOT EXISTS requires_qr_calibration BOOLEAN DEFAULT false;
ALTER TABLE public.navigation_points ADD COLUMN IF NOT EXISTS zone_type TEXT DEFAULT 'outdoor' CHECK (zone_type IN ('indoor', 'outdoor', 'transition'));

-- 4. Add QR code generation fields to navigation_points
ALTER TABLE public.navigation_points ADD COLUMN IF NOT EXISTS qr_code_data TEXT;
ALTER TABLE public.navigation_points ADD COLUMN IF NOT EXISTS qr_code_generated_at TIMESTAMPTZ;

-- 5. Create index for GPS lookups
CREATE INDEX IF NOT EXISTS idx_navigation_points_gps ON public.navigation_points(gps_lat, gps_lng) WHERE gps_lat IS NOT NULL AND gps_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_gps ON public.events(gps_center_lat, gps_center_lng) WHERE gps_center_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venues_gps ON public.venues(gps_lat, gps_lng) WHERE gps_lat IS NOT NULL;

-- 6. Add comments for documentation
COMMENT ON COLUMN events.navigation_mode IS 'Navigation mode: indoor (QR only), outdoor (GPS only), or hybrid (GPS + QR)';
COMMENT ON COLUMN navigation_points.zone_type IS 'Zone type: indoor (requires QR), outdoor (uses GPS), transition (switch point)';
COMMENT ON COLUMN navigation_points.requires_qr_calibration IS 'If true, attendee must scan QR code at this point for accurate positioning';
COMMENT ON COLUMN navigation_points.qr_code_data IS 'Generated QR code JSON data for printing';
