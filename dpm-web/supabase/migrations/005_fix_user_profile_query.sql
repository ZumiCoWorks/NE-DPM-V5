-- Fix user profile query issue
-- The problem is that we're using UUID generation for users.id instead of using auth.uid()

-- First, let's check if there are any existing users
SELECT COUNT(*) as user_count FROM users;

-- Check for duplicate records
SELECT id, email, COUNT(*) as count 
FROM users 
GROUP BY id, email 
HAVING COUNT(*) > 1;

-- The issue is likely that users.id should match auth.uid()
-- Let's update the users table to use auth.uid() as the primary key

-- Drop the existing default for id column
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

-- Update the RLS policies to ensure proper user access
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new RLS policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;