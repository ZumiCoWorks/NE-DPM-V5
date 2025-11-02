-- Fix RLS policy for users table to allow user registration
-- This migration adds the missing INSERT policy for the users table

-- Add INSERT policy for users table to allow authenticated users to create their own profiles
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Grant INSERT permission to authenticated role on users table
GRANT INSERT ON users TO authenticated;