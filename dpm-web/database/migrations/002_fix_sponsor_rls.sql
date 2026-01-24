-- Migration: Fix sponsors RLS policies
-- Created: 2026-01-24
-- Description: Updates RLS policies to allow broader access to sponsors table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view sponsors for their events" ON public.sponsors;
DROP POLICY IF EXISTS "Users can create sponsors for their events" ON public.sponsors;
DROP POLICY IF EXISTS "Users can update sponsors for their events" ON public.sponsors;
DROP POLICY IF EXISTS "Users can delete sponsors for their events" ON public.sponsors;
DROP POLICY IF EXISTS "Sponsors can view their own record via token" ON public.sponsors;
DROP POLICY IF EXISTS "Sponsors can complete their signup" ON public.sponsors;

-- NEW POLICIES: More permissive for authenticated users

-- Policy: Authenticated users can view all sponsors (for now - can restrict later)
CREATE POLICY "Authenticated users can view sponsors"
  ON public.sponsors FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create sponsors
CREATE POLICY "Authenticated users can create sponsors"
  ON public.sponsors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update sponsors
CREATE POLICY "Authenticated users can update sponsors"
  ON public.sponsors FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Authenticated users can delete sponsors
CREATE POLICY "Authenticated users can delete sponsors"
  ON public.sponsors FOR DELETE
  TO authenticated
  USING (true);

-- Policy: Allow public access for signup completion (via token)
CREATE POLICY "Public can view sponsors via signup token"
  ON public.sponsors FOR SELECT
  TO anon
  USING (signup_token IS NOT NULL);

-- Policy: Allow public to update their own sponsor record during signup
CREATE POLICY "Public can complete signup via token"
  ON public.sponsors FOR UPDATE
  TO anon
  USING (signup_token IS NOT NULL AND signup_completed = FALSE);

COMMENT ON POLICY "Authenticated users can view sponsors" ON public.sponsors IS 'Allow authenticated users to view sponsors';
COMMENT ON POLICY "Public can view sponsors via signup token" ON public.sponsors IS 'Allow sponsors to view their record via signup token';
