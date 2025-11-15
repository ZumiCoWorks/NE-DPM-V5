-- Create floorplans table used by unified editor
-- Date: 2025-11-12

CREATE TABLE IF NOT EXISTS public.floorplans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  dimensions JSONB,
  scale_meters_per_pixel NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_floorplans_event ON public.floorplans(event_id);
CREATE INDEX IF NOT EXISTS idx_floorplans_user ON public.floorplans(user_id);

