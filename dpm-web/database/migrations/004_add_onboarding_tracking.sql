-- Migration: Add onboarding progress tracking
-- Created: 2026-01-24
-- Description: Tracks user onboarding checklist completion

-- Add onboarding checklist progress
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB DEFAULT '{
  "event_created": false,
  "floorplan_uploaded": false,
  "sponsors_added": false,
  "event_published": false
}'::jsonb;

-- Add dismissal flag
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_dismissed BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN profiles.onboarding_checklist IS 'Tracks completion of onboarding steps';
COMMENT ON COLUMN profiles.onboarding_dismissed IS 'Whether user dismissed the onboarding checklist';
