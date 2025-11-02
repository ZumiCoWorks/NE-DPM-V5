-- NavEaze V5 DPM MVP - AI & Compliance Enhancements
-- This migration adds AI analysis fields and compliance validation features

-- Add API key and role enhancements to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR(255) UNIQUE DEFAULT gen_random_uuid()::text;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('organizer', 'venue_manager', 'api_consumer'));

-- Add compliance data to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS compliance_data JSONB DEFAULT '{}';

-- Add AI analysis fields to floorplans table
ALTER TABLE floorplans ADD COLUMN IF NOT EXISTS ai_analysis_results JSONB DEFAULT '{}';
ALTER TABLE floorplans ADD COLUMN IF NOT EXISTS poi_suggestions JSONB DEFAULT '[]';
ALTER TABLE floorplans ADD COLUMN IF NOT EXISTS compliance_validated BOOLEAN DEFAULT FALSE;

-- Add emergency node field to navigation_nodes table
ALTER TABLE navigation_nodes ADD COLUMN IF NOT EXISTS is_emergency_node BOOLEAN DEFAULT FALSE;
ALTER TABLE navigation_nodes DROP CONSTRAINT IF EXISTS navigation_nodes_type_check;
ALTER TABLE navigation_nodes ADD CONSTRAINT navigation_nodes_type_check CHECK (type IN ('poi', 'entrance', 'exit', 'restroom', 'elevator', 'stairs', 'emergency_exit', 'first_aid', 'evacuation_zone'));

-- Add compliance and safety fields to navigation_paths table
ALTER TABLE navigation_paths ADD COLUMN IF NOT EXISTS compliance_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE navigation_paths ADD COLUMN IF NOT EXISTS safety_properties JSONB DEFAULT '{}';

-- Add emergency compliance constraint
ALTER TABLE navigation_paths DROP CONSTRAINT IF EXISTS emergency_compliance;
ALTER TABLE navigation_paths ADD CONSTRAINT emergency_compliance CHECK (
    CASE WHEN is_emergency_path = true 
    THEN compliance_validated = true 
    ELSE true END
);

-- Update AR campaigns table with revenue and SDK fields
ALTER TABLE ar_campaigns ADD COLUMN IF NOT EXISTS geographical_zones JSONB DEFAULT '[]';
ALTER TABLE ar_campaigns ADD COLUMN IF NOT EXISTS revenue_model VARCHAR(50) DEFAULT 'freemium';
ALTER TABLE ar_campaigns ADD COLUMN IF NOT EXISTS sdk_ready BOOLEAN DEFAULT FALSE;
ALTER TABLE ar_campaigns DROP CONSTRAINT IF EXISTS ar_campaigns_revenue_model_check;
ALTER TABLE ar_campaigns ADD CONSTRAINT ar_campaigns_revenue_model_check CHECK (revenue_model IN ('freemium', 'premium', 'enterprise'));

-- Update AR assets table with AI processing fields
ALTER TABLE ar_assets ADD COLUMN IF NOT EXISTS optimized_url TEXT;
ALTER TABLE ar_assets ADD COLUMN IF NOT EXISTS ai_processing_metadata JSONB DEFAULT '{}';
ALTER TABLE ar_assets ADD COLUMN IF NOT EXISTS bandwidth_optimized BOOLEAN DEFAULT FALSE;

-- Create new indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_floorplans_compliance ON floorplans(compliance_validated) WHERE compliance_validated = true;
CREATE INDEX IF NOT EXISTS idx_navigation_paths_compliance ON navigation_paths(compliance_validated) WHERE compliance_validated = true;
CREATE INDEX IF NOT EXISTS idx_ar_campaigns_sdk_ready ON ar_campaigns(sdk_ready) WHERE sdk_ready = true;
CREATE INDEX IF NOT EXISTS idx_ar_assets_bandwidth ON ar_assets(bandwidth_optimized) WHERE bandwidth_optimized = true;

-- Update RLS policies for API access
DROP POLICY IF EXISTS "API access control" ON users;
CREATE POLICY "API access control" ON users
    FOR ALL USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'api_consumer');

-- Grant permissions for API access
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;

-- Update sample user with API key
UPDATE users SET api_key = gen_random_uuid()::text WHERE email = 'demo@naveaze.com' AND api_key IS NULL;