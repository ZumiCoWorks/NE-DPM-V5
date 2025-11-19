-- Fix auth-related permissions and triggers
-- This addresses the "Database error saving new user" issue

-- Grant permissions on auth schema
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT ALL ON auth.users TO anon, authenticated;
GRANT ALL ON auth.identities TO anon, authenticated;
GRANT ALL ON auth.sessions TO anon, authenticated;
GRANT ALL ON auth.refresh_tokens TO anon, authenticated;

-- Fix any RLS policies that might be blocking auth operations
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.identities DISABLE ROW LEVEL SECURITY;

-- Grant permissions for user profile creation (if there's a trigger)
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- Ensure sequences are accessible
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated;

-- Grant execute permissions on auth functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated;