-- Enable Realtime for safety_alerts table (Critical for Dashboard)
alter publication supabase_realtime add table safety_alerts;

-- Allow public read access to safety_alerts (For Demo Dashboard)
create policy "Enable read access for all users"
on "public"."safety_alerts"
as PERMISSIVE
for SELECT
to public
using (true);

-- Allow public insert access (For Attendee PWA Distress Button)
create policy "Enable insert for all users"
on "public"."safety_alerts"
as PERMISSIVE
for INSERT
to public
with check (true);

-- Allow public update access (For Staff App resolving alerts)
create policy "Enable update for all users"
on "public"."safety_alerts"
as PERMISSIVE
for UPDATE
to public
using (true);
