-- NavEaze V5 DPM MVP - Row Level Security Policies
-- This migration sets up RLS policies for secure data access

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Venues table policies
CREATE POLICY "Organizers can view their own venues" ON venues
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Organizers can create venues" ON venues
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organizers can update their own venues" ON venues
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Organizers can delete their own venues" ON venues
    FOR DELETE USING (auth.uid() = owner_id);

-- Events table policies
CREATE POLICY "Organizers can view their own events" ON events
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own events" ON events
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own events" ON events
    FOR DELETE USING (auth.uid() = organizer_id);

-- Floorplans table policies
CREATE POLICY "Organizers can view floorplans of their venues" ON floorplans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM venues 
            WHERE venues.id = floorplans.venue_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can create floorplans for their venues" ON floorplans
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM venues 
            WHERE venues.id = venue_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update floorplans of their venues" ON floorplans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM venues 
            WHERE venues.id = floorplans.venue_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can delete floorplans of their venues" ON floorplans
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM venues 
            WHERE venues.id = floorplans.venue_id 
            AND venues.owner_id = auth.uid()
        )
    );

-- Navigation nodes table policies
CREATE POLICY "Organizers can view navigation nodes of their venues" ON navigation_nodes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM floorplans 
            JOIN venues ON venues.id = floorplans.venue_id
            WHERE floorplans.id = navigation_nodes.floorplan_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can create navigation nodes for their venues" ON navigation_nodes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM floorplans 
            JOIN venues ON venues.id = floorplans.venue_id
            WHERE floorplans.id = floorplan_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update navigation nodes of their venues" ON navigation_nodes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM floorplans 
            JOIN venues ON venues.id = floorplans.venue_id
            WHERE floorplans.id = navigation_nodes.floorplan_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can delete navigation nodes of their venues" ON navigation_nodes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM floorplans 
            JOIN venues ON venues.id = floorplans.venue_id
            WHERE floorplans.id = navigation_nodes.floorplan_id 
            AND venues.owner_id = auth.uid()
        )
    );

-- Navigation paths table policies
CREATE POLICY "Organizers can view navigation paths of their venues" ON navigation_paths
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM floorplans 
            JOIN venues ON venues.id = floorplans.venue_id
            WHERE floorplans.id = navigation_paths.floorplan_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can create navigation paths for their venues" ON navigation_paths
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM floorplans 
            JOIN venues ON venues.id = floorplans.venue_id
            WHERE floorplans.id = floorplan_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update navigation paths of their venues" ON navigation_paths
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM floorplans 
            JOIN venues ON venues.id = floorplans.venue_id
            WHERE floorplans.id = navigation_paths.floorplan_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can delete navigation paths of their venues" ON navigation_paths
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM floorplans 
            JOIN venues ON venues.id = floorplans.venue_id
            WHERE floorplans.id = navigation_paths.floorplan_id 
            AND venues.owner_id = auth.uid()
        )
    );

-- AR campaigns table policies
CREATE POLICY "Organizers can view AR campaigns of their venues" ON ar_campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM venues 
            WHERE venues.id = ar_campaigns.venue_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can create AR campaigns for their venues" ON ar_campaigns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM venues 
            WHERE venues.id = venue_id 
            AND venues.owner_id = auth.uid()
        ) AND auth.uid() = creator_id
    );

CREATE POLICY "Organizers can update AR campaigns of their venues" ON ar_campaigns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM venues 
            WHERE venues.id = ar_campaigns.venue_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can delete AR campaigns of their venues" ON ar_campaigns
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM venues 
            WHERE venues.id = ar_campaigns.venue_id 
            AND venues.owner_id = auth.uid()
        )
    );

-- AR assets table policies
CREATE POLICY "Organizers can view AR assets of their campaigns" ON ar_assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ar_campaigns 
            JOIN venues ON venues.id = ar_campaigns.venue_id
            WHERE ar_campaigns.id = ar_assets.campaign_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can create AR assets for their campaigns" ON ar_assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ar_campaigns 
            JOIN venues ON venues.id = ar_campaigns.venue_id
            WHERE ar_campaigns.id = campaign_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update AR assets of their campaigns" ON ar_assets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ar_campaigns 
            JOIN venues ON venues.id = ar_campaigns.venue_id
            WHERE ar_campaigns.id = ar_assets.campaign_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can delete AR assets of their campaigns" ON ar_assets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ar_campaigns 
            JOIN venues ON venues.id = ar_campaigns.venue_id
            WHERE ar_campaigns.id = ar_assets.campaign_id 
            AND venues.owner_id = auth.uid()
        )
    );

-- AR zones table policies
CREATE POLICY "Organizers can view AR zones of their campaigns" ON ar_zones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ar_campaigns 
            JOIN venues ON venues.id = ar_campaigns.venue_id
            WHERE ar_campaigns.id = ar_zones.campaign_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can create AR zones for their campaigns" ON ar_zones
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ar_campaigns 
            JOIN venues ON venues.id = ar_campaigns.venue_id
            WHERE ar_campaigns.id = campaign_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update AR zones of their campaigns" ON ar_zones
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ar_campaigns 
            JOIN venues ON venues.id = ar_campaigns.venue_id
            WHERE ar_campaigns.id = ar_zones.campaign_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can delete AR zones of their campaigns" ON ar_zones
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ar_campaigns 
            JOIN venues ON venues.id = ar_campaigns.venue_id
            WHERE ar_campaigns.id = ar_zones.campaign_id 
            AND venues.owner_id = auth.uid()
        )
    );

-- Grant permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON venues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON floorplans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON navigation_nodes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON navigation_paths TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ar_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ar_assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ar_zones TO authenticated;

-- Grant basic read access to anon role for public data
GRANT SELECT ON venues TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON floorplans TO anon;
GRANT SELECT ON navigation_nodes TO anon;
GRANT SELECT ON navigation_paths TO anon;