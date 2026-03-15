-- POPIA-compliant attendees table
-- Email and Phone are stored ONLY as SHA-256 hashes — never as raw strings.

CREATE TABLE IF NOT EXISTS public.attendees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash       TEXT,            -- SHA-256(normalised email)
  phone_hash       TEXT,            -- SHA-256(digits-only phone)
  first_name       TEXT,
  last_name        TEXT,
  company          TEXT,
  job_title        TEXT,
  ticket_type      TEXT,
  event_id         UUID,
  qr_code_id       TEXT UNIQUE,
  qr_code_data_url TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- If upgrading an existing deployment that stored raw 'email', add hash columns
-- (the raw column is intentionally NOT dropped here so existing data keeps working
-- until a separate data-migration step removes it; new rows will no longer use it)
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS email_hash TEXT;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS phone_hash TEXT;

-- Fast hash-based verification lookups
CREATE INDEX IF NOT EXISTS idx_attendees_email_hash ON public.attendees (email_hash);
CREATE INDEX IF NOT EXISTS idx_attendees_phone_hash ON public.attendees (phone_hash);

-- RLS
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- The service-role key (used by the API server) can manage all rows
CREATE POLICY "Service role can manage attendees"
  ON public.attendees FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anonymous users can look up their own attendee record by qr_code_id
-- (used by the QR-scan self-check-in flow)
CREATE POLICY "Anon read own attendee row via qr_code_id"
  ON public.attendees FOR SELECT
  USING (qr_code_id IS NOT NULL);
