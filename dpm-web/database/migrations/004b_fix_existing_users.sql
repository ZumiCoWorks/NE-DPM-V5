-- Fix: Initialize onboarding_checklist for existing users
-- Run this if the checklist isn't updating

-- Update all existing profiles that have NULL onboarding_checklist
UPDATE profiles 
SET onboarding_checklist = '{
  "event_created": false,
  "floorplan_uploaded": false,
  "sponsors_added": false,
  "event_published": false
}'::jsonb
WHERE onboarding_checklist IS NULL;

-- Verify the update
SELECT id, email, onboarding_checklist, onboarding_dismissed 
FROM profiles 
LIMIT 5;
