-- Fix RLS policies for navigation_points and navigation_segments
-- Allow public read access for attendee PWA
-- Date: 2025-11-28

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
  USING (true);

-- Admin-only write access
CREATE POLICY "navigation_points_admin_insert" ON public.navigation_points
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "navigation_points_admin_update" ON public.navigation_points
  FOR UPDATE
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
  USING (true);

-- Admin-only write access
CREATE POLICY "navigation_segments_admin_insert" ON public.navigation_segments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "navigation_segments_admin_update" ON public.navigation_segments
  FOR UPDATE
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
  USING (true);

-- Admin-only write access
CREATE POLICY "floorplans_admin_insert" ON public.floorplans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "floorplans_admin_update" ON public.floorplans
  FOR UPDATE
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
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
