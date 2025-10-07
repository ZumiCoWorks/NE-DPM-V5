-- Update user roles to support NavEaze V4 role-based access control
-- This migration adds support for event_organizer, venue_manager, and advertiser roles

-- First, update the users table role constraint to include new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role::text = ANY (ARRAY[
    'admin'::character varying, 
    'user'::character varying,
    'event_organizer'::character varying,
    'venue_manager'::character varying,
    'advertiser'::character varying
  ]::text[]));

-- Update the user_roles table to support the new role types
-- Add check constraint for valid roles in user_roles table
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role::text = ANY (ARRAY[
    'admin',
    'event_organizer',
    'venue_manager', 
    'advertiser',
    'user'
  ]));

-- Add check constraint for valid resource types
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_resource_type_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_resource_type_check 
  CHECK (resource_type::text = ANY (ARRAY[
    'event',
    'venue',
    'floorplan',
    'ar_zone',
    'global'
  ]));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_resource ON user_roles(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create a function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
  user_uuid UUID,
  required_role TEXT,
  resource_type_param TEXT DEFAULT NULL,
  resource_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin (has global access)
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_uuid AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check specific role permissions
  IF resource_type_param IS NULL THEN
    -- Check global role
    RETURN EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = user_uuid 
        AND role = required_role 
        AND resource_type IS NULL
    );
  ELSE
    -- Check resource-specific role
    RETURN EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = user_uuid 
        AND role = required_role 
        AND resource_type = resource_type_param 
        AND (resource_id_param IS NULL OR resource_id = resource_id_param)
    );
  END IF;
END;
$$;

-- Create RLS policies for role-based access

-- Events table policies
DROP POLICY IF EXISTS "event_organizers_can_manage_events" ON events;
CREATE POLICY "event_organizers_can_manage_events" ON events
  FOR ALL USING (
    check_user_permission(auth.uid(), 'event_organizer', 'event', id) OR
    check_user_permission(auth.uid(), 'admin') OR
    created_by = auth.uid()
  );

-- Floorplans table policies  
DROP POLICY IF EXISTS "venue_managers_can_manage_floorplans" ON floorplans;
CREATE POLICY "venue_managers_can_manage_floorplans" ON floorplans
  FOR ALL USING (
    check_user_permission(auth.uid(), 'venue_manager', 'floorplan', id) OR
    check_user_permission(auth.uid(), 'event_organizer', 'event', event_id) OR
    check_user_permission(auth.uid(), 'admin')
  );

-- AR zones table policies
DROP POLICY IF EXISTS "advertisers_can_manage_ar_zones" ON ar_zones;
CREATE POLICY "advertisers_can_manage_ar_zones" ON ar_zones
  FOR ALL USING (
    check_user_permission(auth.uid(), 'advertiser', 'ar_zone', id) OR
    check_user_permission(auth.uid(), 'venue_manager', 'floorplan', floorplan_id) OR
    check_user_permission(auth.uid(), 'admin') OR
    user_id = auth.uid()
  );

-- User roles table policies
DROP POLICY IF EXISTS "admins_can_manage_user_roles" ON user_roles;
CREATE POLICY "admins_can_manage_user_roles" ON user_roles
  FOR ALL USING (
    check_user_permission(auth.uid(), 'admin')
  );

-- Allow users to view their own roles
DROP POLICY IF EXISTS "users_can_view_own_roles" ON user_roles;
CREATE POLICY "users_can_view_own_roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT ON user_roles TO anon, authenticated;
GRANT SELECT ON users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission TO anon, authenticated;

-- Insert some default role assignments for testing
-- Note: These will be replaced with actual user assignments in production
INSERT INTO user_roles (user_id, role, resource_type, permissions) 
SELECT 
  id,
  'admin',
  'global',
  '{"all": true}'::jsonb
FROM users 
WHERE role = 'admin'
ON CONFLICT DO NOTHING;

-- Create a view for easier role checking
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  u.role as primary_role,
  ur.role as assigned_role,
  ur.resource_type,
  ur.resource_id,
  ur.permissions
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id;

-- Grant access to the view
GRANT SELECT ON user_permissions TO authenticated;

COMMIT;