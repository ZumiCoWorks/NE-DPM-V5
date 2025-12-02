-- Fix RLS policies for navigation_points and navigation_segments
-- Version 2: Grant table permissions + RLS policies
-- Date: 2025-11-28

-- =============================================
-- GRANT TABLE PERMISSIONS
-- =============================================

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.navigation_points TO anon, authenticated;
GRANT SELECT ON public.navigation_segments TO anon, authenticated;
GRANT SELECT ON public.floorplans TO anon, authenticated;

-- =============================================
-- NAVIGATION_POINTS
-- =============================================

-- Enable RLS
ALTER TABLE public.navigation_points ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "navigation_points_public_select" ON public.navigation_points;
DROP POLICY IF EXISTS "navigation_points_admin_insert" ON public.navigation_points;
DROP POLICY IF EXISTS "navigation_points_admin_update" ON public.navigation_points;
DROP POLICY IF EXISTS "navigation_points_admin_delete" ON public.navigation_points;

-- Allow public read access (for attendee PWA)
CREATE POLICY "navigation_points_public_select" ON public.navigation_points
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin-only write access
CREATE POLICY "navigation_points_admin_insert" ON public.navigation_points
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "navigation_points_admin_update" ON public.navigation_points
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "navigation_points_admin_delete" ON public.navigation_points
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =============================================
-- NAVIGATION_SEGMENTS
-- =============================================

-- Enable RLS
ALTER TABLE public.navigation_segments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "navigation_segments_public_select" ON public.navigation_segments;
DROP POLICY IF EXISTS "navigation_segments_admin_insert" ON public.navigation_segments;
DROP POLICY IF EXISTS "navigation_segments_admin_update" ON public.navigation_segments;
DROP POLICY IF EXISTS "navigation_segments_admin_delete" ON public.navigation_segments;

-- Allow public read access (for attendee PWA)
CREATE POLICY "navigation_segments_public_select" ON public.navigation_segments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin-only write access
CREATE POLICY "navigation_segments_admin_insert" ON public.navigation_segments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "navigation_segments_admin_update" ON public.navigation_segments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "navigation_segments_admin_delete" ON public.navigation_segments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =============================================
-- FLOORPLANS (also needed for PWA)
-- =============================================

-- Enable RLS
ALTER TABLE public.floorplans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "floorplans_public_select" ON public.floorplans;
DROP POLICY IF EXISTS "floorplans_admin_insert" ON public.floorplans;
DROP POLICY IF EXISTS "floorplans_admin_update" ON public.floorplans;
DROP POLICY IF EXISTS "floorplans_admin_delete" ON public.floorplans;

-- Allow public read access (for attendee PWA)
CREATE POLICY "floorplans_public_select" ON public.floorplans
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin-only write access
CREATE POLICY "floorplans_admin_insert" ON public.floorplans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "floorplans_admin_update" ON public.floorplans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "floorplans_admin_delete" ON public.floorplans
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =============================================
-- VERIFY POLICIES
-- =============================================

-- Show all policies for navigation_points
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('navigation_points', 'navigation_segments', 'floorplans')
ORDER BY tablename, policyname;
