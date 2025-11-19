-- Temporarily disable RLS on profiles table to test
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Grant all permissions on profiles
GRANT ALL ON public.profiles TO anon, authenticated;

-- Grant all permissions on users table as well
GRANT ALL ON public.users TO anon, authenticated;