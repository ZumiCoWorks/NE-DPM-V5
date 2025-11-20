-- Add floorplan calibration for GPS alignment
-- This ensures floorplan images are properly oriented and scaled to GPS coordinates

-- 1. Add calibration fields to floorplans table
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS rotation_degrees DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS gps_top_left_lat DECIMAL(10, 8);
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS gps_top_left_lng DECIMAL(11, 8);
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS gps_top_right_lat DECIMAL(10, 8);
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS gps_top_right_lng DECIMAL(11, 8);
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS gps_bottom_left_lat DECIMAL(10, 8);
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS gps_bottom_left_lng DECIMAL(11, 8);
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS gps_bottom_right_lat DECIMAL(10, 8);
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS gps_bottom_right_lng DECIMAL(11, 8);
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS calibration_method TEXT CHECK (calibration_method IN ('manual', 'gps_corners', 'qr_points', 'auto'));
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS is_calibrated BOOLEAN DEFAULT false;

-- 2. Add image dimensions for proper scaling
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS image_width INTEGER;
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS image_height INTEGER;

-- 3. Add compass bearing (which way is "up" on the map)
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS north_bearing_degrees DECIMAL(5, 2) DEFAULT 0;

-- Comments
COMMENT ON COLUMN floorplans.rotation_degrees IS 'Clockwise rotation of floorplan image in degrees (0 = North is up)';
COMMENT ON COLUMN floorplans.north_bearing_degrees IS 'Compass bearing of the "up" direction on the map (0 = North, 90 = East, etc.)';
COMMENT ON COLUMN floorplans.calibration_method IS 'How floorplan was calibrated: manual (set corners), gps_corners (walk corners), qr_points (3+ QR scans), auto (from event bounds)';
COMMENT ON COLUMN floorplans.is_calibrated IS 'Whether floorplan has been calibrated for accurate GPS positioning';
COMMENT ON COLUMN floorplans.gps_top_left_lat IS 'GPS latitude of top-left corner of floorplan image';
