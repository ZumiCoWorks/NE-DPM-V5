-- Supabase/Postgres migration: create basic tables for NavEaze MVP

-- Use UUIDs for primary keys to remain compatible with Supabase default IDs.
-- Requires the pgcrypto extension for gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  storage_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid REFERENCES event_maps(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL, -- 'booth' | 'localization' | 'utility'
  x integer NOT NULL,
  y integer NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid REFERENCES event_maps(id) ON DELETE CASCADE,
  poi_id_start uuid NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  poi_id_end uuid NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  distance numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid REFERENCES sponsors(id) ON DELETE SET NULL,
  attendee_ref text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendee_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id text,
  poi_id uuid REFERENCES pois(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
