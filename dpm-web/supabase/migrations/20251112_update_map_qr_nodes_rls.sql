-- Tighten RLS policies for map_qr_nodes to admin-only
-- Date: 2025-11-12

-- Ensure table exists and RLS is enabled
ALTER TABLE public.map_qr_nodes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'map_qr_nodes' AND policyname = 'map_qr_nodes_select_policy'
  ) THEN
    DROP POLICY "map_qr_nodes_select_policy" ON public.map_qr_nodes;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'map_qr_nodes' AND policyname = 'map_qr_nodes_insert_policy'
  ) THEN
    DROP POLICY "map_qr_nodes_insert_policy" ON public.map_qr_nodes;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'map_qr_nodes' AND policyname = 'map_qr_nodes_update_policy'
  ) THEN
    DROP POLICY "map_qr_nodes_update_policy" ON public.map_qr_nodes;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'map_qr_nodes' AND policyname = 'map_qr_nodes_delete_policy'
  ) THEN
    DROP POLICY "map_qr_nodes_delete_policy" ON public.map_qr_nodes;
  END IF;
END $$;

-- Admin-only policies using profiles.role
CREATE POLICY map_qr_nodes_admin_select ON public.map_qr_nodes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY map_qr_nodes_admin_insert ON public.map_qr_nodes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY map_qr_nodes_admin_update ON public.map_qr_nodes
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

CREATE POLICY map_qr_nodes_admin_delete ON public.map_qr_nodes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

