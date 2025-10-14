-- South African Demo Venue Data for showcase
-- These venues represent typical SA event locations

INSERT INTO venues (id, name, address, description, capacity, amenities, created_at) VALUES
('venue-sa-1', 'Sandton Convention Centre', '161 Maude Street, Sandton, Johannesburg, 2196', 'Premier convention centre in the heart of Africa''s financial district', 12000, '["Wi-Fi", "Parking", "Catering", "Audio/Visual", "Security", "Load Shedding Backup"]', NOW()),
('venue-sa-2', 'Cape Town International Convention Centre', '1 Lower Long Street, Cape Town, 8001', 'World-class venue with Table Mountain views', 8500, '["Wi-Fi", "Parking", "Catering", "Ocean Views", "Backup Power", "Halaal Options"]', NOW()),
('venue-sa-3', 'Durban ICC', '45 Ordnance Road, Durban, 4001', 'Leading venue on KwaZulu-Natal coast', 6000, '["Wi-Fi", "Parking", "Catering", "Beach Access", "Climate Control", "Generator Backup"]', NOW()),
('venue-sa-4', 'Vodacom Park', 'Jan Shoba Street, Bloemfontein, 9301', 'Multi-purpose stadium and events venue', 45000, '["Parking", "Catering", "Security", "VIP Boxes", "Large Screens", "Backup Power"]', NOW());

-- South African Demo Events
INSERT INTO events (id, name, description, venue_id, start_date, end_date, organizer_id, status, created_at) VALUES
('event-sa-1', 'AfricaCom 2025', 'Africa''s largest tech and telecoms event featuring MTN, Vodacom, and Cell C', 'venue-sa-1', '2025-11-15 09:00:00+02', '2025-11-17 18:00:00+02', 'mock-organizer-1', 'active', NOW()),
('event-sa-2', 'Cape Town Design Expo', 'Celebrating South African creativity with Discovery Bank sponsorship', 'venue-sa-2', '2025-12-05 10:00:00+02', '2025-12-07 17:00:00+02', 'mock-organizer-1', 'planning', NOW()),
('event-sa-3', 'KZN Business Summit', 'Premier business networking with Standard Bank and Nedbank', 'venue-sa-3', '2026-01-20 08:00:00+02', '2026-01-22 16:00:00+02', 'mock-organizer-1', 'planning', NOW());