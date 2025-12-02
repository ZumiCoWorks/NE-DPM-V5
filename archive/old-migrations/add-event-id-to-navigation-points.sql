-- Add event_id column to navigation_points table
-- This allows filtering navigation points by event

ALTER TABLE public.navigation_points
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Create index for faster event-based queries
CREATE INDEX IF NOT EXISTS idx_navigation_points_event ON public.navigation_points(event_id);

-- Comment
COMMENT ON COLUMN navigation_points.event_id IS 'Event that this navigation point belongs to';
