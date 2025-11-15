-- Development seed data for DPM Web MVP
-- Run this after applying the main schema

-- Insert demo venue
INSERT INTO venues (
  name, 
  address, 
  description, 
  capacity, 
  venue_type, 
  contact_email, 
  contact_phone,
  status
) VALUES (
  'Demo Convention Center',
  '123 Main Street, Demo City, DC 12345',
  'A modern convention center with multiple halls and exhibition spaces',
  5000,
  'convention_center',
  'info@democonvention.com',
  '+1-555-123-4567',
  'active'
);

-- Insert demo event (requires an organizer user)
-- Note: This will need to be run after a user is created
-- INSERT INTO events (
--   name,
--   description,
--   start_time,
--   end_time,
--   venue_id,
--   organizer_id,
--   status
-- ) VALUES (
--   'Demo Tech Conference 2024',
--   'Annual technology conference featuring keynote speakers and workshops',
--   NOW() + INTERVAL '7 days',
--   NOW() + INTERVAL '9 days',
--   (SELECT id FROM venues WHERE name = 'Demo Convention Center' LIMIT 1),
--   'user-id-here', -- Replace with actual user ID
--   'published'
-- );

-- Insert demo AR campaign (requires organizer user)
-- INSERT INTO ar_campaigns (
--   owner_id,
--   event_id,
--   venue_id,
--   name,
--   description,
--   start_at,
--   end_at,
--   status,
--   reward_type,
--   reward_value
-- ) VALUES (
--   'user-id-here', -- Replace with actual user ID
--   (SELECT id FROM events WHERE name = 'Demo Tech Conference 2024' LIMIT 1),
--   (SELECT id FROM venues WHERE name = 'Demo Convention Center' LIMIT 1),
--   'Interactive Booth Experience',
--   'AR-powered interactive booth experience with prizes',
--   NOW() + INTERVAL '7 days',
--   NOW() + INTERVAL '9 days',
--   'active',
--   'points',
--   100
-- );

-- Grant permissions for development
-- These are already covered by RLS policies, but ensure they're working
GRANT SELECT ON profiles TO anon, authenticated;
GRANT SELECT ON venues TO anon, authenticated;
GRANT SELECT ON events TO anon, authenticated;
GRANT SELECT ON floorplans TO anon, authenticated;
GRANT SELECT ON map_qr_nodes TO anon, authenticated;
GRANT SELECT ON ar_campaigns TO anon, authenticated;

-- Insert function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (NEW.id, NEW.email, 'staff', '', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();