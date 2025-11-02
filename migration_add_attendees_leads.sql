-- Migration: add attendees, sponsors, staff_accounts, and leads tables (run in Supabase SQL editor)

create table if not exists attendees (
  id text primary key,
  email text,
  first_name text,
  last_name text,
  company text,
  job_title text,
  ticket_type text,
  event_id text,
  qr_code_id text unique,
  qr_code_data_url text,
  created_at timestamp with time zone default now()
);

create table if not exists sponsors (
  id text primary key,
  name text,
  contact_email text,
  logo_url text,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists staff_accounts (
  id text primary key,
  sponsor_id text references sponsors(id),
  email text,
  password_hash text,
  role text,
  created_at timestamp with time zone default now()
);

create table if not exists leads (
  id text primary key,
  sponsor_id text references sponsors(id),
  staff_id text,
  attendee_id text references attendees(id),
  event_id text,
  rating int,
  note text,
  timestamp timestamp with time zone default now()
);
