-- Create navigation_points table for the Map Editor
CREATE TABLE IF NOT EXISTS public.navigation_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floorplan_id UUID REFERENCES public.floorplans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  point_type TEXT NOT NULL CHECK (point_type IN ('poi', 'node', 'entrance', 'exit', 'booth')),
  x_coordinate NUMERIC NOT NULL,
  y_coordinate NUMERIC NOT NULL,
  description TEXT,
  icon_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.navigation_points ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all navigation points
CREATE POLICY "Allow authenticated read access"
ON public.navigation_points
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert/update/delete their own organization's points
CREATE POLICY "Allow authenticated write access"
ON public.navigation_points
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role has full access"
ON public.navigation_points
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.navigation_points TO authenticated;
GRANT ALL ON public.navigation_points TO service_role;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_navigation_points_floorplan ON public.navigation_points(floorplan_id);
