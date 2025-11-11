-- Grant required privileges to the `authenticated` role.
-- RLS policies already enforce row-level access; these grants enable table-level operations.

-- Ensure the authenticated role can use the public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Events and related editor tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nodes    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.segments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pois     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vendors  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.zones    TO authenticated;

-- Profiles and vendor signup tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles       TO authenticated;

-- Optional: future-proof by granting on future tables in this schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;