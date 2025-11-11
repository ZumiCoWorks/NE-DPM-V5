# Supabase Migrations

This folder contains SQL to align the database with the app’s MVP, using `events` as the canonical container for map data.

## Apply migration

Use one of the following approaches:

- SQL Editor: Open the Supabase project → SQL Editor → paste contents of `migrations/0001_events_and_maps.sql` → Run.
- CLI (if configured): `supabase db execute --file dpm-web/supabase/migrations/0001_events_and_maps.sql`

## Contents

- Tables: `events`, `nodes`, `segments`, `pois`, `zones`, `vendors`
- RLS policies: Only the event owner (`events.user_id = auth.uid()`) can read/write related rows.

## After applying

- Verify queries in the app return data when logged in as the event owner.
- Create at least one event via UI to test map editor inserts and reads.