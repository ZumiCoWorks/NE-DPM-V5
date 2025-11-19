-- Temporarily disable RLS on profiles table to test
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Grant all permissions on profiles
GRANT ALL ON public.profiles TO anon, authenticated;

-- Also check if there are any specific RLS policies causing issues
-- and temporarily disable them
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Disable all RLS policies on profiles table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.profiles DISABLE POLICY %I;', policy_record.policyname);
        RAISE NOTICE 'Disabled policy: %', policy_record.policyname;
    END LOOP;
END
$$;