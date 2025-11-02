-- AFDA Grad Fest 2025 Event Setup
-- ⚠️ IMPORTANT: Run /supabase/migrations/001_complete_schema.sql FIRST!
-- Then run this file to set up AFDA Grad Fest event data
--
-- 📍 TODO: Update GPS coordinates for each booth!
--   1. Open Google Maps (maps.google.com)
--   2. Right-click on the physical booth location on AFDA campus
--   3. Click "What's here?"
--   4. Copy the GPS coordinates (e.g., -26.107500, 28.056000)
--   5. Replace the placeholder GPS coordinates in this file
--   6. NOTE: Some booths are already updated as examples (Film, Animation, Post-Production)

-- Check if venues table exists with correct schema
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'venues' AND column_name = 'capacity'
    ) THEN
        RAISE EXCEPTION 'Run 001_complete_schema.sql migration first!';
    END IF;
END $$;

-- 1. Create AFDA Venue
INSERT INTO venues (id, name, description, address, capacity, status, amenities)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'AFDA Campus',
  'AFDA Film School - Johannesburg Campus with indoor studios and outdoor courtyard',
  'Cnr Rabie & Bram Fischer Dr, Ferndale, Randburg, 2194',
  500,
  'active',
  ARRAY['WiFi', 'Parking', 'Catering', 'AV Equipment', 'Indoor/Outdoor Mix']
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  address = EXCLUDED.address;

-- 2. Create AFDA Grad Fest Event
INSERT INTO events (id, name, description, start_date, end_date, venue_id, status, max_attendees)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'AFDA Grad Fest 2025',
  'Annual graduation festival showcasing student work, industry booths, and networking opportunities',
  '2025-11-15 09:00:00+02',
  '2025-11-15 17:00:00+02',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'active',
  500
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date;

-- 3. Create Floorplan for AFDA Campus
INSERT INTO floorplans (id, venue_id, name, floor_number, scale_factor, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'AFDA Campus Main Floor',
  1,
  1.0,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- 4. Create Booths for AFDA Grad Fest
-- Note: Coordinates are approximate - update these after your campus walkthrough

-- Film School Booth (Outdoor Courtyard)
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier, zone_name,
  description, x_coordinate, y_coordinate, gps_latitude, gps_longitude, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Film School Showcase',
  'AFDA Film Department',
  'Gold',
  'Film Building',
  'Explore filmmaking programs, student films, and industry connections',
  30.0, 40.0, -- x,y for 2D map display
  -26.107500, 28.056000, -- TODO: Get real GPS from Google Maps for Film building entrance
  'AFDA_BOOTH_FILM_10000000-0000-0000-0000-000000000001',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Animation Studio Booth
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier, zone_name,
  description, x_coordinate, y_coordinate, gps_latitude, gps_longitude, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Animation Studio',
  'AFDA Animation Department',
  'Gold',
  'Animation Lab',
  '3D animation, motion graphics, and VFX showcases',
  45.0, 60.0,
  -26.107520, 28.056020, -- TODO: Get real GPS from Google Maps
  'AFDA_BOOTH_ANIMATION_10000000-0000-0000-0000-000000000002',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Post-Production Booth
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier, zone_name,
  description, x_coordinate, y_coordinate, gps_latitude, gps_longitude, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Post-Production Lab',
  'AFDA Post-Production',
  'Silver',
  'Post-Production Suite',
  'Editing suites, color grading, and sound design',
  60.0, 30.0,
  -26.107540, 28.056040, -- TODO: Get real GPS from Google Maps
  'AFDA_BOOTH_POSTPROD_10000000-0000-0000-0000-000000000003',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Screenwriting Booth
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Screenwriting Corner',
  'AFDA Writing Department',
  'Silver',
  'Script development, story workshops, and writer networking',
  -26.107560,
  28.056060,
  'AFDA_BOOTH_SCREENWRITING_10000000-0000-0000-0000-000000000004',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Acting & Performance Booth
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Acting Studio',
  'AFDA Performance Arts',
  'Silver',
  'Live performances, audition workshops, industry casting directors',
  -26.107580,
  28.056080,
  'AFDA_BOOTH_ACTING_10000000-0000-0000-0000-000000000005',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Industry Partners Booth (Outdoor)
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000006'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Industry Partners',
  'Film & TV Production Companies',
  'Gold',
  'Connect with leading production houses and agencies',
  -26.107600,
  28.056100,
  'AFDA_BOOTH_INDUSTRY_10000000-0000-0000-0000-000000000006',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Equipment Showcase
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000007'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Camera & Equipment',
  'Panavision / RED Cameras',
  'Bronze',
  'Latest camera tech, lenses, and production equipment',
  -26.107620,
  28.056120,
  'AFDA_BOOTH_EQUIPMENT_10000000-0000-0000-0000-000000000007',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Student Showcase Booth
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000008'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Graduate Film Showcase',
  'Class of 2025',
  'Standard',
  'Final year student films screening continuously',
  -26.107640,
  28.056140,
  'AFDA_BOOTH_SHOWCASE_10000000-0000-0000-0000-000000000008',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Alumni Network Booth
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000009'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'AFDA Alumni Network',
  'AFDA Alumni Association',
  'Silver',
  'Connect with successful graduates working in the industry',
  -26.107660,
  28.056160,
  'AFDA_BOOTH_ALUMNI_10000000-0000-0000-0000-000000000009',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Careers & Placement Booth
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000010'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Careers & Internships',
  'AFDA Career Services',
  'Standard',
  'Job opportunities, internships, and industry placement',
  -26.107680,
  28.056180,
  'AFDA_BOOTH_CAREERS_10000000-0000-0000-0000-000000000010',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- NavEaze Showcase Booth (YOUR BOOTH!)
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000011'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'NavEaze Demo Booth',
  'NavEaze Platform',
  'Gold',
  'See the platform live! AR navigation + engagement analytics demo',
  -26.107700,
  28.056200,
  'AFDA_BOOTH_NAVEAZE_10000000-0000-0000-0000-000000000011',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Food & Refreshments (Outdoor)
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000012'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Food Court',
  'Campus Catering',
  'Standard',
  'Refreshments, snacks, and coffee',
  -26.107720,
  28.056220,
  'AFDA_BOOTH_FOOD_10000000-0000-0000-0000-000000000012',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Virtual Production Booth (Indoor Studio)
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000013'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Virtual Production Studio',
  'Unreal Engine / LED Walls',
  'Gold',
  'Experience the future of filmmaking with LED volume stages',
  -26.107460,
  28.055960,
  'AFDA_BOOTH_VP_10000000-0000-0000-0000-000000000013',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Sound Design Booth (Indoor)
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000014'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Sound Design Lab',
  'AFDA Audio Department',
  'Silver',
  'Foley, ADR, mixing, and immersive audio experiences',
  -26.107480,
  28.055980,
  'AFDA_BOOTH_SOUND_10000000-0000-0000-0000-000000000014',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Photography Booth
INSERT INTO booths (
  id, venue_id, event_id, name, sponsor_name, sponsor_tier,
  description, x_coordinate, y_coordinate, qr_code, is_active
) VALUES (
  '10000000-0000-0000-0000-000000000015'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Still Photography',
  'AFDA Photography',
  'Bronze',
  'Cinematography and still photography exhibition',
  -26.107500,
  28.056000,
  'AFDA_BOOTH_PHOTO_10000000-0000-0000-0000-000000000015',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Verify data
SELECT 'Venue created:' as status, name FROM venues WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
SELECT 'Event created:' as status, name, start_date FROM events WHERE id = '00000000-0000-0000-0000-000000000002'::uuid;
SELECT 'Booths created:' as status, COUNT(*) as booth_count FROM booths WHERE event_id = '00000000-0000-0000-0000-000000000002'::uuid;

-- List all booths
SELECT 
  name,
  sponsor_tier,
  qr_code,
  x_coordinate,
  y_coordinate
FROM booths 
WHERE event_id = '00000000-0000-0000-0000-000000000002'::uuid
ORDER BY name;

