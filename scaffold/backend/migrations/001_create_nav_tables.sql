-- Supabase/Postgres migration: create basic tables for NavEaze MVP

CREATE TABLE IF NOT EXISTS events (
  id serial PRIMARY KEY,
  name text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_maps (
  id serial PRIMARY KEY,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  storage_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pois (
  id serial PRIMARY KEY,
  map_id integer REFERENCES event_maps(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL, -- 'booth' | 'localization' | 'utility'
  x integer NOT NULL,
  y integer NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paths (
  id serial PRIMARY KEY,
  map_id integer REFERENCES event_maps(id) ON DELETE CASCADE,
  poi_id_start integer NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  poi_id_end integer NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  distance numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sponsors (
  id serial PRIMARY KEY,
  name text NOT NULL,
  contact_email text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id serial PRIMARY KEY,
  sponsor_id integer REFERENCES sponsors(id) ON DELETE SET NULL,
  attendee_ref text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendee_engagements (
  id serial PRIMARY KEY,
  attendee_id text,
  poi_id integer REFERENCES pois(id) ON DELETE SET NULL,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
