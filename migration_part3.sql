        WHERE v.id = floorplans.venue_id 
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- Navigation points policies
CREATE POLICY "Public can view navigation points" ON navigation_points FOR SELECT USING (true);
CREATE POLICY "Venue managers can manage navigation points" ON navigation_points FOR ALL USING (
    EXISTS (
        SELECT 1 FROM floorplans f
        JOIN venues v ON v.id = f.venue_id
        WHERE f.id = navigation_points.floorplan_id
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- Booths policies
CREATE POLICY "Public can view active booths" ON booths FOR SELECT USING (is_active = true);
CREATE POLICY "Venue managers can manage booths at their venues" ON booths FOR ALL USING (
    EXISTS (
        SELECT 1 FROM venues v 
        WHERE v.id = booths.venue_id 
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    ) OR
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = booths.event_id 
        AND (e.organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- CDV Reports policies
CREATE POLICY "Organizers can view CDV reports for their events" ON cdv_reports FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = cdv_reports.event_id 
        AND (e.organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    ) OR
    EXISTS (
        SELECT 1 FROM venues v 
        WHERE v.id = cdv_reports.venue_id 
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);
CREATE POLICY "Public can insert CDV reports" ON cdv_reports FOR INSERT WITH CHECK (true);

-- Quicket Integrations policies
CREATE POLICY "Users can manage their own Quicket integration" ON quicket_integrations FOR ALL USING (organizer_id = auth.uid());

-- Engagement Sessions policies
CREATE POLICY "Organizers can view sessions for their events" ON engagement_sessions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = engagement_sessions.event_id 
        AND (e.organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);
CREATE POLICY "Public can insert engagement sessions" ON engagement_sessions FOR INSERT WITH CHECK (true);

-- Analytics events policies
CREATE POLICY "Users can view their own analytics" ON analytics_events FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can insert analytics events" ON analytics_events FOR INSERT WITH CHECK (true);

-- Data consents policies (POPIA/GDPR)
CREATE POLICY "Mobile apps can insert consent records" ON data_consents FOR INSERT WITH CHECK (true);
CREATE POLICY "Mobile apps can update consent records" ON data_consents FOR UPDATE USING (true);
CREATE POLICY "Admins can view all consent records" ON data_consents FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Data deletion requests policies (POPIA/GDPR - Right to be Forgotten)
CREATE POLICY "Mobile apps can create deletion requests" ON data_deletion_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all deletion requests" ON data_deletion_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update deletion requests" ON data_deletion_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Data access requests policies (POPIA/GDPR - Right to Access)
CREATE POLICY "Mobile apps can create access requests" ON data_access_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all access requests" ON data_access_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update access requests" ON data_access_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Data audit log policies (POPIA/GDPR - Accountability)
CREATE POLICY "System can insert audit log entries" ON data_audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view audit log" ON data_audit_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Booth engagement summary
CREATE OR REPLACE VIEW booth_engagement_summary AS
SELECT 
    b.id as booth_id,
    b.name as booth_name,
    b.sponsor_name,
    b.sponsor_tier,
    b.venue_id,
    b.event_id,
    COUNT(c.id) as total_engagements,
    COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) as active_engagements,
    COUNT(CASE WHEN c.active_engagement_status = false THEN 1 END) as passive_engagements,
    AVG(c.dwell_time_minutes) as avg_dwell_time,
    SUM(c.dwell_time_minutes) as total_dwell_time,
    COUNT(DISTINCT c.mobile_user_id) as unique_visitors,
    COUNT(DISTINCT c.quicket_order_id) as verified_attendees
FROM booths b
LEFT JOIN cdv_reports c ON b.id = c.booth_id
WHERE b.is_active = true
GROUP BY b.id, b.name, b.sponsor_name, b.sponsor_tier, b.venue_id, b.event_id;

-- Event performance summary
CREATE OR REPLACE VIEW event_performance_summary AS
SELECT 
    e.id as event_id,
    e.name as event_name,
    e.status,
    e.start_date,
    e.end_date,
    v.name as venue_name,
    COUNT(DISTINCT c.mobile_user_id) as total_unique_users,
    COUNT(DISTINCT c.quicket_order_id) as verified_attendees,
    COUNT(c.id) as total_engagements,
    COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) as active_engagements,
    AVG(c.dwell_time_minutes) as avg_dwell_time,
    SUM(c.dwell_time_minutes) as total_dwell_minutes,
    COUNT(DISTINCT es.id) as total_sessions
FROM events e
JOIN venues v ON e.venue_id = v.id
LEFT JOIN cdv_reports c ON e.id = c.event_id
LEFT JOIN engagement_sessions es ON e.id = es.event_id
GROUP BY e.id, e.name, e.status, e.start_date, e.end_date, v.name;

-- Sponsor ROI summary
CREATE OR REPLACE VIEW sponsor_roi_summary AS
SELECT 
    b.sponsor_name,
    b.sponsor_tier,
    e.name as event_name,
    v.name as venue_name,
    COUNT(DISTINCT c.mobile_user_id) as unique_visitors,
    COUNT(DISTINCT c.quicket_order_id) as verified_attendees,
    COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) as active_engagements,
    AVG(c.dwell_time_minutes) as avg_dwell_time,
    SUM(c.dwell_time_minutes) as total_dwell_time,
    CASE b.sponsor_tier
        WHEN 'Gold' THEN COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) * 15.00
        WHEN 'Silver' THEN COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) * 10.00
        WHEN 'Bronze' THEN COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) * 5.00
        ELSE COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) * 3.00
    END as estimated_revenue
FROM booths b
JOIN venues v ON b.venue_id = v.id
LEFT JOIN events e ON b.event_id = e.id
LEFT JOIN cdv_reports c ON b.id = c.booth_id
WHERE b.is_active = true
GROUP BY b.sponsor_name, b.sponsor_tier, e.name, v.name;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON venues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON floorplans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON navigation_points TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON booths TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cdv_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quicket_integrations TO authenticated;
GRANT SELECT, INSERT ON engagement_sessions TO authenticated;
GRANT SELECT, INSERT ON analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON data_consents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON data_deletion_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON data_access_requests TO authenticated;
GRANT SELECT, INSERT ON data_audit_log TO authenticated;

-- Anonymous user grants (for mobile app)
GRANT SELECT ON venues TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON floorplans TO anon;
GRANT SELECT ON navigation_points TO anon;
GRANT SELECT ON booths TO anon;
GRANT INSERT ON cdv_reports TO anon;
GRANT INSERT ON engagement_sessions TO anon;
GRANT INSERT ON analytics_events TO anon;
GRANT INSERT, UPDATE ON data_consents TO anon;
GRANT INSERT ON data_deletion_requests TO anon;
GRANT INSERT ON data_access_requests TO anon;

-- Grant view access
GRANT SELECT ON booth_engagement_summary TO authenticated;
GRANT SELECT ON event_performance_summary TO authenticated;
GRANT SELECT ON sponsor_roi_summary TO authenticated;

COMMIT;

