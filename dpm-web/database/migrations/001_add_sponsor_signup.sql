-- Migration: Create sponsors table
-- Created: 2026-01-24
-- Description: Creates sponsors table with signup functionality
-- Note: This is separate from vendors table (vendors operate booths, sponsors pay for them)

-- Create sponsors table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  booth_location TEXT,
  signup_token UUID UNIQUE,
  signup_completed BOOLEAN DEFAULT FALSE,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsors_event_id ON public.sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_signup_token ON public.sponsors(signup_token) WHERE signup_token IS NOT NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sponsors for events they organize
CREATE POLICY "Users can view sponsors for their events"
  ON public.sponsors FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id = auth.uid()
    )
  );

-- Policy: Users can insert sponsors for their events
CREATE POLICY "Users can create sponsors for their events"
  ON public.sponsors FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id = auth.uid()
    )
  );

-- Policy: Users can update sponsors for their events
CREATE POLICY "Users can update sponsors for their events"
  ON public.sponsors FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id = auth.uid()
    )
  );

-- Policy: Users can delete sponsors for their events
CREATE POLICY "Users can delete sponsors for their events"
  ON public.sponsors FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id = auth.uid()
    )
  );

-- Policy: Allow sponsors to view their own record via signup token (for onboarding)
CREATE POLICY "Sponsors can view their own record via token"
  ON public.sponsors FOR SELECT
  USING (signup_token IS NOT NULL);

-- Policy: Allow sponsors to update their own record via signup token (for onboarding)
CREATE POLICY "Sponsors can complete their signup"
  ON public.sponsors FOR UPDATE
  USING (signup_token IS NOT NULL AND signup_completed = FALSE);

-- Add comments
COMMENT ON TABLE public.sponsors IS 'Event sponsors with self-service onboarding';
COMMENT ON COLUMN public.sponsors.signup_token IS 'Unique token for sponsor self-service onboarding';
COMMENT ON COLUMN public.sponsors.signup_completed IS 'Whether sponsor has completed the signup process';
COMMENT ON COLUMN public.sponsors.tier IS 'Sponsor tier: bronze, silver, gold, or platinum';
COMMENT ON COLUMN public.sponsors.booth_location IS 'Physical location of sponsor booth at event';
