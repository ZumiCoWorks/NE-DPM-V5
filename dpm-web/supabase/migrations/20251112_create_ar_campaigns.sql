-- Migration: Create AR Campaigns table with basic RLS
-- Purpose: Enable organizers to define AR reward campaigns linked to events/venues

-- Table: public.ar_campaigns
create table if not exists public.ar_campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  event_id uuid,
  venue_id uuid,
  name text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','active','paused','completed')),
  reward_type text default 'points' check (reward_type in ('points','coupon','badge')),
  reward_value integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_dates check (end_at > start_at),
  constraint fk_owner foreign key (owner_id) references public.profiles(id) on delete cascade,
  constraint fk_event foreign key (event_id) references public.events(id) on delete set null,
  constraint fk_venue foreign key (venue_id) references public.venues(id) on delete set null
);

-- Helpful indexes for common queries
create index if not exists ar_campaigns_owner_idx on public.ar_campaigns(owner_id);
create index if not exists ar_campaigns_event_idx on public.ar_campaigns(event_id);
create index if not exists ar_campaigns_venue_idx on public.ar_campaigns(venue_id);
create index if not exists ar_campaigns_status_start_idx on public.ar_campaigns(status, start_at);

-- Enable Row Level Security
alter table public.ar_campaigns enable row level security;

-- Policies: owners can manage their rows; admins (per profiles.role) have full access
create policy "ar_campaigns_select_owner_or_admin" on public.ar_campaigns
  for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "ar_campaigns_insert_owner_or_admin" on public.ar_campaigns
  for insert
  with check (
    owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "ar_campaigns_update_owner_or_admin" on public.ar_campaigns
  for update
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "ar_campaigns_delete_owner_or_admin" on public.ar_campaigns
  for delete
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Notes:
-- - updated_at is set by application writes; add a trigger later if needed.
-- - reward_type/reward_value are intentionally simple for MVP; extend as needed.