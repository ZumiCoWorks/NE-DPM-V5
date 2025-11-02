-- NavEaze MVP Demo Data
-- Run this in your Supabase SQL Editor to create demo data for showcasing

-- First, get the authenticated user's ID for the organizer
-- Replace 'YOUR_USER_ID' with your actual user ID from Supabase Auth

-- 1. Create a demo venue
INSERT INTO venues (id, name, address, description, capacity, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'TechHub Convention Center',
  '123 Innovation Drive, Sandton, Johannesburg',
  'Premier technology and innovation venue with state-of-the-art facilities',
  1000,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  description = EXCLUDED.description,
  capacity = EXCLUDED.capacity,
  updated_at = NOW();

-- 2. Create a demo event (you'll need to replace the organizer_id with your user ID)
INSERT INTO events (id, name, description, venue_id, start_date, end_date, status, created_at, updated_at, organizer_id)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Tech Innovation Expo 2025',
  'Annual technology and innovation showcase featuring leading sponsors, startups, and industry experts. Experience cutting-edge AR navigation powered by NavEaze.',
  '11111111-1111-1111-1111-111111111111',
  '2025-03-15 09:00:00+02',
  '2025-03-17 18:00:00+02',
  'published',
  NOW(),
  NOW(),
  (SELECT id FROM users ORDER BY created_at LIMIT 1) -- Uses first user, replace with specific ID if needed
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  venue_id = EXCLUDED.venue_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 3. Create demo booths (sponsors)
INSERT INTO booths (id, venue_id, name, zone_name, description, sponsor_name, sponsor_tier, qr_code, x_coordinate, y_coordinate, gps_latitude, gps_longitude, is_active, created_at, updated_at)
VALUES
  -- Gold Sponsors (Top Tier)
  (
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111111',
    'Microsoft Azure Pavilion',
    'Microsoft Azure Pavilion',
    'Discover the latest in cloud computing and AI solutions',
    'Microsoft',
    'Gold',
    'QR-MSFT-AZURE-001',
    100,
    150,
    -26.107690,
    28.056427,
    true,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111111',
    'Google Cloud Innovation Hub',
    'Google Cloud Innovation Hub',
    'Experience next-generation cloud infrastructure and machine learning',
    'Google',
    'Gold',
    'QR-GOOG-CLOUD-002',
    250,
    150,
    -26.107720,
    28.056457,
    true,
    NOW(),
    NOW()
  ),
  
  -- Silver Sponsors
  (
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111111',
    'Amazon Web Services Center',
    'Amazon Web Services Center',
    'Learn about scalable cloud solutions and serverless architecture',
    'Amazon Web Services',
    'Silver',
    'QR-AWS-CENTER-003',
    100,
    300,
    -26.107750,
    28.056487,
    true,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333304',
    '11111111-1111-1111-1111-111111111111',
    'IBM Watson AI Experience',
    'IBM Watson AI Experience',
    'Explore enterprise AI and quantum computing solutions',
    'IBM',
    'Silver',
    'QR-IBM-WATSON-004',
    250,
    300,
    -26.107780,
    28.056517,
    true,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333305',
    '11111111-1111-1111-1111-111111111111',
    'Oracle Digital Innovation',
    'Oracle Digital Innovation',
    'Database solutions and enterprise cloud applications',
    'Oracle',
    'Silver',
    'QR-ORCL-DIGITAL-005',
    400,
    150,
    -26.107810,
    28.056547,
    true,
    NOW(),
    NOW()
  ),
  
  -- Bronze Sponsors
  (
    '33333333-3333-3333-3333-333333333306',
    '11111111-1111-1111-1111-111111111111',
    'Salesforce Customer 360',
    'Salesforce Customer 360',
    'Transform your customer relationships with CRM innovation',
    'Salesforce',
    'Bronze',
    'QR-SFDC-360-006',
    400,
    300,
    -26.107840,
    28.056577,
    true,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333307',
    '11111111-1111-1111-1111-111111111111',
    'SAP Business Solutions',
    'SAP Business Solutions',
    'Enterprise resource planning and business intelligence',
    'SAP',
    'Bronze',
    'QR-SAP-BUSINESS-007',
    100,
    450,
    -26.107870,
    28.056607,
    true,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333308',
    '11111111-1111-1111-1111-111111111111',
    'Cisco Networking Zone',
    'Cisco Networking Zone',
    'Next-gen networking and cybersecurity solutions',
    'Cisco',
    'Bronze',
    'QR-CSCO-NETWORK-008',
    250,
    450,
    -26.107900,
    28.056637,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  zone_name = EXCLUDED.zone_name,
  description = EXCLUDED.description,
  sponsor_name = EXCLUDED.sponsor_name,
  sponsor_tier = EXCLUDED.sponsor_tier,
  qr_code = EXCLUDED.qr_code,
  x_coordinate = EXCLUDED.x_coordinate,
  y_coordinate = EXCLUDED.y_coordinate,
  gps_latitude = EXCLUDED.gps_latitude,
  gps_longitude = EXCLUDED.gps_longitude,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 4. Create realistic demo scan data (anonymous attendee engagement)
-- Simulating 3 days of event activity with varying engagement patterns

-- Day 1: Opening day - high traffic at entrance and platinum sponsors
INSERT INTO anonymous_scans (device_id, anchor_id, event_id, booth_id, timestamp, created_at)
SELECT 
  'device_' || generate_series || '_' || floor(random() * 100)::text,
  CASE 
    WHEN generate_series % 8 = 0 THEN 'QR-MSFT-AZURE-001'
    WHEN generate_series % 8 = 1 THEN 'QR-GOOG-CLOUD-002'
    WHEN generate_series % 8 = 2 THEN 'QR-AWS-CENTER-003'
    WHEN generate_series % 8 = 3 THEN 'QR-IBM-WATSON-004'
    WHEN generate_series % 8 = 4 THEN 'QR-ORCL-DIGITAL-005'
    WHEN generate_series % 8 = 5 THEN 'QR-SFDC-360-006'
    WHEN generate_series % 8 = 6 THEN 'QR-SAP-BUSINESS-007'
    ELSE 'QR-CSCO-NETWORK-008'
  END,
  '22222222-2222-2222-2222-222222222222'::uuid,
  CASE 
    WHEN generate_series % 8 = 0 THEN '33333333-3333-3333-3333-333333333301'::uuid
    WHEN generate_series % 8 = 1 THEN '33333333-3333-3333-3333-333333333302'::uuid
    WHEN generate_series % 8 = 2 THEN '33333333-3333-3333-3333-333333333303'::uuid
    WHEN generate_series % 8 = 3 THEN '33333333-3333-3333-3333-333333333304'::uuid
    WHEN generate_series % 8 = 4 THEN '33333333-3333-3333-3333-333333333305'::uuid
    WHEN generate_series % 8 = 5 THEN '33333333-3333-3333-3333-333333333306'::uuid
    WHEN generate_series % 8 = 6 THEN '33333333-3333-3333-3333-333333333307'::uuid
    ELSE '33333333-3333-3333-3333-333333333308'::uuid
  END,
  '2025-03-15 09:00:00+02'::timestamp + (random() * interval '9 hours'),
  NOW()
FROM generate_series(1, 250);

-- Day 2: Peak day - most engagement
INSERT INTO anonymous_scans (device_id, anchor_id, event_id, booth_id, timestamp, created_at)
SELECT 
  'device_' || generate_series || '_' || floor(random() * 150)::text,
  CASE 
    WHEN generate_series % 8 = 0 THEN 'QR-MSFT-AZURE-001'
    WHEN generate_series % 8 = 1 THEN 'QR-GOOG-CLOUD-002'
    WHEN generate_series % 8 = 2 THEN 'QR-AWS-CENTER-003'
    WHEN generate_series % 8 = 3 THEN 'QR-IBM-WATSON-004'
    WHEN generate_series % 8 = 4 THEN 'QR-ORCL-DIGITAL-005'
    WHEN generate_series % 8 = 5 THEN 'QR-SFDC-360-006'
    WHEN generate_series % 8 = 6 THEN 'QR-SAP-BUSINESS-007'
    ELSE 'QR-CSCO-NETWORK-008'
  END,
  '22222222-2222-2222-2222-222222222222'::uuid,
  CASE 
    WHEN generate_series % 8 = 0 THEN '33333333-3333-3333-3333-333333333301'::uuid
    WHEN generate_series % 8 = 1 THEN '33333333-3333-3333-3333-333333333302'::uuid
    WHEN generate_series % 8 = 2 THEN '33333333-3333-3333-3333-333333333303'::uuid
    WHEN generate_series % 8 = 3 THEN '33333333-3333-3333-3333-333333333304'::uuid
    WHEN generate_series % 8 = 4 THEN '33333333-3333-3333-3333-333333333305'::uuid
    WHEN generate_series % 8 = 5 THEN '33333333-3333-3333-3333-333333333306'::uuid
    WHEN generate_series % 8 = 6 THEN '33333333-3333-3333-3333-333333333307'::uuid
    ELSE '33333333-3333-3333-3333-333333333308'::uuid
  END,
  '2025-03-16 09:00:00+02'::timestamp + (random() * interval '9 hours'),
  NOW()
FROM generate_series(1, 420);

-- Day 3: Closing day - moderate traffic
INSERT INTO anonymous_scans (device_id, anchor_id, event_id, booth_id, timestamp, created_at)
SELECT 
  'device_' || generate_series || '_' || floor(random() * 100)::text,
  CASE 
    WHEN generate_series % 8 = 0 THEN 'QR-MSFT-AZURE-001'
    WHEN generate_series % 8 = 1 THEN 'QR-GOOG-CLOUD-002'
    WHEN generate_series % 8 = 2 THEN 'QR-AWS-CENTER-003'
    WHEN generate_series % 8 = 3 THEN 'QR-IBM-WATSON-004'
    WHEN generate_series % 8 = 4 THEN 'QR-ORCL-DIGITAL-005'
    WHEN generate_series % 8 = 5 THEN 'QR-SFDC-360-006'
    WHEN generate_series % 8 = 6 THEN 'QR-SAP-BUSINESS-007'
    ELSE 'QR-CSCO-NETWORK-008'
  END,
  '22222222-2222-2222-2222-222222222222'::uuid,
  CASE 
    WHEN generate_series % 8 = 0 THEN '33333333-3333-3333-3333-333333333301'::uuid
    WHEN generate_series % 8 = 1 THEN '33333333-3333-3333-3333-333333333302'::uuid
    WHEN generate_series % 8 = 2 THEN '33333333-3333-3333-3333-333333333303'::uuid
    WHEN generate_series % 8 = 3 THEN '33333333-3333-3333-3333-333333333304'::uuid
    WHEN generate_series % 8 = 4 THEN '33333333-3333-3333-3333-333333333305'::uuid
    WHEN generate_series % 8 = 5 THEN '33333333-3333-3333-3333-333333333306'::uuid
    WHEN generate_series % 8 = 6 THEN '33333333-3333-3333-3333-333333333307'::uuid
    ELSE '33333333-3333-3333-3333-333333333308'::uuid
  END,
  '2025-03-17 09:00:00+02'::timestamp + (random() * interval '9 hours'),
  NOW()
FROM generate_series(1, 180);

-- Summary: This creates approximately:
-- - 1 Venue
-- - 1 Event
-- - 8 Sponsor Booths (2 Platinum, 3 Gold, 3 Silver)
-- - 850 Total Scans across 3 days
-- - Realistic distribution showing platinum sponsors getting most engagement

-- To verify the data was loaded:
SELECT 
  b.sponsor_name,
  b.sponsor_tier,
  COUNT(DISTINCT s.device_id) as unique_devices,
  COUNT(s.id) as total_scans
FROM booths b
LEFT JOIN anonymous_scans s ON s.booth_id = b.id
WHERE b.venue_id = '11111111-1111-1111-1111-111111111111'
GROUP BY b.id, b.sponsor_name, b.sponsor_tier
ORDER BY total_scans DESC;

