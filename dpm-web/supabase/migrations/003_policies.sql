-- RLS Policies for MVP tables

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floorplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_qr_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualified_leads ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update their own profile
DROP POLICY IF EXISTS profiles_self ON public.profiles;
CREATE POLICY profiles_self_select ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_self_insert ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- events: organizer can read/update/delete their events; admins can read all
DROP POLICY IF EXISTS events_organizer ON public.events;
CREATE POLICY events_organizer_select ON public.events
  FOR SELECT USING (organizer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));
CREATE POLICY events_organizer_write ON public.events
  FOR ALL USING (organizer_id = auth.uid());

-- floorplans: owner can CRUD; admins can read
DROP POLICY IF EXISTS floorplans_owner ON public.floorplans;
CREATE POLICY floorplans_owner_select ON public.floorplans
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));
CREATE POLICY floorplans_owner_write ON public.floorplans
  FOR ALL USING (user_id = auth.uid());

-- map_qr_nodes: organizer/admin can read; organizer/admin can insert
DROP POLICY IF EXISTS map_qr_nodes_read ON public.map_qr_nodes;
CREATE POLICY map_qr_nodes_read ON public.map_qr_nodes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE e.id = map_qr_nodes.event_id
      AND (p.role = 'admin' OR e.organizer_id = p.id)
  ));
DROP POLICY IF EXISTS map_qr_nodes_write ON public.map_qr_nodes;
CREATE POLICY map_qr_nodes_write ON public.map_qr_nodes
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE e.id = map_qr_nodes.event_id
      AND (p.role = 'admin' OR e.organizer_id = p.id)
  ));

-- qualified_leads: staff can insert and read their own
DROP POLICY IF EXISTS qualified_leads_staff ON public.qualified_leads;
CREATE POLICY qualified_leads_staff_select ON public.qualified_leads
  FOR SELECT USING (staff_user_id = auth.uid());
CREATE POLICY qualified_leads_staff_insert ON public.qualified_leads
  FOR INSERT WITH CHECK (staff_user_id = auth.uid());

-- Notes:
-- Storage bucket 'floorplans' is managed via server with service role; public access for map JSON
