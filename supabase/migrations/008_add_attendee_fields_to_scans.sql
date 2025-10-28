-- Add attendee fields to anonymous_scans for optional ticket-linked analytics
-- Idempotent: only add columns if they don't already exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anonymous_scans' AND column_name = 'attendee_id'
  ) THEN
    ALTER TABLE anonymous_scans ADD COLUMN attendee_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anonymous_scans' AND column_name = 'attendee_name'
  ) THEN
    ALTER TABLE anonymous_scans ADD COLUMN attendee_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anonymous_scans' AND column_name = 'ticket_tier'
  ) THEN
    ALTER TABLE anonymous_scans ADD COLUMN ticket_tier TEXT;
  END IF;
END $$;

COMMENT ON COLUMN anonymous_scans.attendee_id IS 'Optional attendee identifier (e.g., email hash or Quicket-derived ID)';
COMMENT ON COLUMN anonymous_scans.attendee_name IS 'Optional attendee name from Quicket lookup';
COMMENT ON COLUMN anonymous_scans.ticket_tier IS 'Optional ticket tier from Quicket';


