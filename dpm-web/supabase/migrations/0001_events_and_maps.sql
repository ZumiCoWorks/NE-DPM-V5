-- Align schema around events as the canonical container
-- Tables: events, nodes, segments, pois, zones, vendors
-- Policies: owners (auth.uid() = events.user_id) can read/write; others denied

-- Extensions (Supabase generally has pgcrypto already; keep for portability)
create extension if not exists pgcrypto;

-- EVENTS
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  floorplan_image_url text,
  quicket_event_id text,
  scale_meters_per_pixel numeric,
  created_at timestamptz not null default now()
);

-- Ensure column exists if table predated this migration
alter table public.events add column if not exists user_id uuid;

-- MAP DATA TABLES
create table if not exists public.nodes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid,
  label text,
  x numeric not null,
  y numeric not null,
  created_at timestamptz not null default now()
);
-- Ensure required columns exist if table predated this migration
alter table public.nodes add column if not exists event_id uuid references public.events(id) on delete cascade;
create index if not exists idx_nodes_event_id on public.nodes(event_id);

create table if not exists public.segments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid,
  start_node_id uuid,
  end_node_id uuid,
  created_at timestamptz not null default now()
);
-- Ensure required columns exist if table predated this migration
alter table public.segments add column if not exists event_id uuid references public.events(id) on delete cascade;
create index if not exists idx_segments_event_id on public.segments(event_id);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid,
  name text not null,
  created_at timestamptz not null default now()
);
-- Ensure required columns exist if table predated this migration
alter table public.vendors add column if not exists event_id uuid references public.events(id) on delete cascade;
create index if not exists idx_vendors_event_id on public.vendors(event_id);

create table if not exists public.pois (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid,
  name text,
  x numeric not null,
  y numeric not null,
  vendor_id uuid references public.vendors(id) on delete set null,
  created_at timestamptz not null default now()
);
-- Ensure required columns exist if table predated this migration
alter table public.pois add column if not exists event_id uuid references public.events(id) on delete cascade;
alter table public.pois add column if not exists vendor_id uuid references public.vendors(id) on delete set null;
create index if not exists idx_pois_event_id on public.pois(event_id);
create index if not exists idx_pois_vendor_id on public.pois(vendor_id);

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid,
  name text,
  polygon jsonb, -- array of points or polygon representation
  created_at timestamptz not null default now()
);
-- Ensure required columns exist if table predated this migration
alter table public.zones add column if not exists event_id uuid references public.events(id) on delete cascade;
create index if not exists idx_zones_event_id on public.zones(event_id);

-- RLS
alter table public.events enable row level security;
alter table public.nodes enable row level security;
alter table public.segments enable row level security;
alter table public.pois enable row level security;
alter table public.vendors enable row level security;
alter table public.zones enable row level security;

-- Helper USING/ CHECK clauses
-- Owner condition: the authenticated user owns the event
-- We reference by event_id for child tables

-- EVENTS policies
drop policy if exists events_select_own on public.events;
drop policy if exists events_insert_own on public.events;
drop policy if exists events_update_own on public.events;
drop policy if exists events_delete_own on public.events;

create policy events_select_own on public.events
  for select using ( user_id = auth.uid() );

create policy events_insert_own on public.events
  for insert with check ( user_id = auth.uid() );

create policy events_update_own on public.events
  for update using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

create policy events_delete_own on public.events
  for delete using ( user_id = auth.uid() );

-- CHILD TABLE policies (nodes, segments, pois, vendors, zones)
-- Pattern: allow if the event referenced is owned by auth.uid()

drop policy if exists nodes_select_own_event on public.nodes;
drop policy if exists nodes_write_own_event on public.nodes;
create policy nodes_select_own_event on public.nodes
  for select using (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );
create policy nodes_write_own_event on public.nodes
  for all using (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );

drop policy if exists segments_select_own_event on public.segments;
drop policy if exists segments_write_own_event on public.segments;
create policy segments_select_own_event on public.segments
  for select using (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );
create policy segments_write_own_event on public.segments
  for all using (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );

drop policy if exists pois_select_own_event on public.pois;
drop policy if exists pois_write_own_event on public.pois;
create policy pois_select_own_event on public.pois
  for select using (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );
create policy pois_write_own_event on public.pois
  for all using (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );

drop policy if exists vendors_select_own_event on public.vendors;
drop policy if exists vendors_write_own_event on public.vendors;
create policy vendors_select_own_event on public.vendors
  for select using (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );
create policy vendors_write_own_event on public.vendors
  for all using (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );

drop policy if exists zones_select_own_event on public.zones;
drop policy if exists zones_write_own_event on public.zones;
create policy zones_select_own_event on public.zones
  for select using (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );
create policy zones_write_own_event on public.zones
  for all using (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );

-- Optional: grant authenticated role access through policies only
-- No explicit grants are needed beyond policies with RLS