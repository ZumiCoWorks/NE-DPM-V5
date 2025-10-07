-- Add missing profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Grant permissions for the new columns
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;