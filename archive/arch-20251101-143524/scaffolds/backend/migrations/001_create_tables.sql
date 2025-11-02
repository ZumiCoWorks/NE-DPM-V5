-- Supabase / PostgreSQL migration for NavEaze MVP
-- Creates core tables: events, event_maps, pois, paths, sponsors, leads, attendee_engagements

CREATE TABLE IF NOT EXISTS events (
  id serial PRIMARY KEY,
  name text NOT NULL,
  start_ts timestamptz,
  end_ts timestamptz,
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
  type text NOT NULL, -- 'booth','utility','localization'
  x numeric NOT NULL,
  y numeric NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paths (
  id serial PRIMARY KEY,
  map_id integer REFERENCES event_maps(id) ON DELETE CASCADE,
  poi_id_start integer REFERENCES pois(id) ON DELETE CASCADE,
  poi_id_end integer REFERENCES pois(id) ON DELETE CASCADE,
  distance numeric,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sponsors (
  id serial PRIMARY KEY,
  name text NOT NULL,
  contact jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id serial PRIMARY KEY,
  sponsor_id integer REFERENCES sponsors(id) ON DELETE CASCADE,
  attendee_profile jsonb,
  notes text,
  qualified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendee_engagements (
  id serial PRIMARY KEY,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  poi_id integer REFERENCES pois(id) ON DELETE SET NULL,
  attendee_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
