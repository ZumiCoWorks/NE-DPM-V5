-- 1. Create Profiles Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Events Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create POIs Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'poi', -- 'poi', 'localization'
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Leads Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID,
  attendee_name TEXT,
  attendee_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Engagements Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID,
  attendee_id UUID,
  poi_id UUID REFERENCES public.pois(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create the Auth Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a new row into public.profiles, copying the id and email
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT DO NOTHING; -- If user already exists, do nothing
  RETURN NEW;
END;
$$;

-- 7. Create the Auth Trigger (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;