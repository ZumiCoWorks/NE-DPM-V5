-- ============================================
-- Fix Current User Role
-- ============================================
-- Purpose: Promote your current account to admin
-- Execute in: Supabase SQL Editor
-- ============================================

-- Step 1: View current users and their roles
SELECT 
  email,
  role,
  created_at,
  CASE 
    WHEN role = 'admin' THEN '👑 Admin'
    WHEN role = 'staff' THEN '👤 Staff'
    WHEN role = 'sponsor' THEN '💼 Sponsor'
    ELSE '❓ No Role'
  END as role_display
FROM profiles
ORDER BY created_at ASC;

-- Step 2: Update your user to admin
-- ⚠️ IMPORTANT: Replace 'admin@navease.com' with your actual email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@navease.com';  -- ← CHANGE THIS TO YOUR EMAIL

-- Step 3: Verify the update
SELECT 
  email,
  role,
  updated_at
FROM profiles
WHERE email = 'admin@navease.com';  -- ← CHANGE THIS TO YOUR EMAIL

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ User role updated to admin!';
  RAISE NOTICE '🔄 Please log out and log back in to see changes';
END $$;

-- Optional: View all users with their roles
SELECT 
  email,
  role,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at ASC;
