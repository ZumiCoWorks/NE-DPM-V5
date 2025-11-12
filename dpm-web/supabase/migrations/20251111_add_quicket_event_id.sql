-- Add Quicket Event ID column to events table for linking external events
alter table if exists public.events
  add column if not exists quicket_event_id text;

-- Optional index for faster lookups by Quicket Event ID (safe to keep simple for MVP)
-- create index if not exists events_quicket_event_id_idx on public.events (quicket_event_id);