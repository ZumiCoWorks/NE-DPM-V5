-- Migration 002: QR Navigation and Lead Capture Tables
-- Created: 2025-11-11

-- 1. Create map_qr_nodes table for QR-based navigation
CREATE TABLE IF NOT EXISTS public.map_qr_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  qr_id_text TEXT NOT NULL,
  x_coord INTEGER NOT NULL,
  y_coord INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique QR IDs per event
  UNIQUE(event_id, qr_id_text)
);

-- Create index for faster lookups by event and QR ID
CREATE INDEX IF NOT EXISTS idx_map_qr_nodes_event_id ON public.map_qr_nodes(event_id);
CREATE INDEX IF NOT EXISTS idx_map_qr_nodes_qr_id ON public.map_qr_nodes(qr_id_text);

-- 2. Create qualified_leads table for B2B lead capture
CREATE TABLE IF NOT EXISTS public.qualified_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  staff_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_name TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional: prevent duplicate leads (same email) from same staff at same event
  UNIQUE(event_id, staff_user_id, lead_email)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_qualified_leads_event_id ON public.qualified_leads(event_id);
CREATE INDEX IF NOT EXISTS idx_qualified_leads_staff_user_id ON public.qualified_leads(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_qualified_leads_scanned_at ON public.qualified_leads(scanned_at DESC);

-- Add RLS policies for security
ALTER TABLE public.map_qr_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualified_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read map_qr_nodes
CREATE POLICY "map_qr_nodes_select_policy" ON public.map_qr_nodes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Only admins can insert/update/delete map_qr_nodes
CREATE POLICY "map_qr_nodes_insert_policy" ON public.map_qr_nodes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "map_qr_nodes_update_policy" ON public.map_qr_nodes
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "map_qr_nodes_delete_policy" ON public.map_qr_nodes
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Policy: Staff can read their own leads
CREATE POLICY "qualified_leads_select_policy" ON public.qualified_leads
  FOR SELECT
  USING (auth.uid() = staff_user_id OR auth.role() = 'authenticated');

-- Policy: Authenticated users can insert leads
CREATE POLICY "qualified_leads_insert_policy" ON public.qualified_leads
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only owner or admin can update their leads
CREATE POLICY "qualified_leads_update_policy" ON public.qualified_leads
  FOR UPDATE
  USING (auth.uid() = staff_user_id);

-- Policy: Only owner or admin can delete their leads
CREATE POLICY "qualified_leads_delete_policy" ON public.qualified_leads
  FOR DELETE
  USING (auth.uid() = staff_user_id);

-- Add comments for documentation
COMMENT ON TABLE public.map_qr_nodes IS 'Links QR codes to map coordinates for navigation';
COMMENT ON TABLE public.qualified_leads IS 'Stores B2B leads captured by staff from Quicket ticket scans';
