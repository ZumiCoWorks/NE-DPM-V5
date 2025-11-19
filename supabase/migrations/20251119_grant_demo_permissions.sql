-- Grant insert permissions for demo purposes
-- This allows lead capture and attendee scans without authentication

-- Grant insert permissions to anon for leads and attendee_scans
GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.attendee_scans TO anon;

-- Also grant select so they can verify their data
GRANT SELECT ON public.leads TO anon;
GRANT SELECT ON public.attendee_scans TO anon;