-- Fix the signup trigger to work with actual database schema
-- The profiles table has: id, email, role, first_name, last_name (NOT full_name)

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function that matches the actual schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_name_value TEXT;
  first_name_value TEXT;
  last_name_value TEXT;
BEGIN
  -- Get full name from metadata if provided
  full_name_value := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  
  -- Split into first and last name (simple split on first space)
  IF full_name_value != '' THEN
    first_name_value := split_part(full_name_value, ' ', 1);
    -- Get everything after first space as last name
    last_name_value := NULLIF(trim(substring(full_name_value from position(' ' in full_name_value))), '');
  ELSE
    -- Default to email username if no name provided
    first_name_value := split_part(NEW.email, '@', 1);
    last_name_value := NULL;
  END IF;

  -- Insert profile with correct column names
  INSERT INTO public.profiles (
    id, 
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    first_name_value,
    last_name_value,
    'admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail auth user creation
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
