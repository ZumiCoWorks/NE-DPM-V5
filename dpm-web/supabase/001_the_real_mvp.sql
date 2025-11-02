-- 1. Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- 2. Create Profiles Table (for login)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Trigger to run the function on new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Create Leads Table (for B2B App)
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    event_id UUID,
    sponsor_id UUID,
    attendee_id TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    job_title TEXT,
    notes TEXT
);

-- 6. Create Attendee Scans Table (for B2C App)
CREATE TABLE public.attendee_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    event_id UUID,
    attendee_id TEXT,
    poi_id UUID,
    scan_type TEXT DEFAULT 'ar_hunt'
);

-- 7. Add RLS (Security) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendee_scans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own profile
CREATE POLICY "Allow users to read their own profile"
ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy: Allow all (public) access to scans for now
CREATE POLICY "Enable read access for all users"
ON public.attendee_scans
FOR SELECT USING (true);

-- Policy: Allow all (public) access to leads for now
CREATE POLICY "Enable read access for all users"
ON public.leads
FOR SELECT USING (true);

-- Policy: Allow all (public) insert to scans
CREATE POLICY "Enable insert for all users"
ON public.attendee_scans
FOR INSERT WITH CHECK (true);

-- Policy: Allow all (public) insert to leads
CREATE POLICY "Enable insert for all users"
ON public.leads
FOR INSERT WITH CHECK (true);