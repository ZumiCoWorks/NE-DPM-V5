-- ============================================
-- NavEase Role Management - FIXED Trigger
-- ============================================
-- Purpose: Automatically assign admin role to first user,
--          organizer role to all subsequent users (instead of staff)
-- Execute in: Supabase SQL Editor
-- ============================================

-- Step 1: Create the auto-admin function (FIXED)
CREATE OR REPLACE FUNCTION auto_assign_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user (no other users exist)
  IF NOT EXISTS (SELECT 1 FROM users WHERE id != NEW.id) THEN
    -- Make first user admin
    NEW.role := 'admin';
    RAISE NOTICE 'First user detected - assigning admin role';
  ELSE
    -- All other users default to organizer (if role is NULL)
    -- CHANGED FROM 'staff' TO 'organizer'
    IF NEW.role IS NULL THEN
      NEW.role := 'organizer';
      RAISE NOTICE 'Subsequent user - assigning organizer role';
    ELSE
      RAISE NOTICE 'User registered with role: %', NEW.role;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS assign_first_admin ON users;

-- Step 3: Create the trigger (ON USERS TABLE, NOT PROFILES)
CREATE TRIGGER assign_first_admin
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_first_admin();

-- Step 4: Verify trigger was created
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled
FROM pg_trigger 
WHERE tgname = 'assign_first_admin';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed auto-admin trigger installed!';
  RAISE NOTICE '📝 First user will automatically become admin';
  RAISE NOTICE '👥 All other users default to ORGANIZER (not staff)';
  RAISE NOTICE '🎯 User-selected roles will be preserved';
END $$;
