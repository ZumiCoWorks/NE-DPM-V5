Nov 15 Pilot — Tasks & Issues

This file breaks the MVP into actionable issues and a suggested milestone for the Nov 15 pilot.

Milestone: NavEaze Nov 15 Pilot

Backend
- [ ] DB migration: create tables (see `scaffolds/backend/migrations/001_create_tables.sql`)
- [ ] Implement real endpoints in Node/Express or Supabase Edge Functions:
  - `GET /events/:id/map_data`
  - `POST /events/:id/engage`
  - `POST /leads/scan` (integrate Quicket)
  - `GET /sponsors/:id/analytics`
- [ ] Add authentication to sponsor endpoints (JWT / Supabase Auth)

Web (DPM Admin)
- [ ] Integrate `MapEditor.jsx` into `NavEazeDPM-main` app
- [ ] Implement image upload -> store in Supabase storage -> create event_map record
- [ ] POI plotting: save POI via API -> insert into `pois`
- [ ] Path drawing: save segments via API -> insert into `paths`
- [ ] QR generation: implement an endpoint to request printable QR images for POIs

Mobile (B2C Attendee)
- [ ] Map screen: fetch `map_data` and render pins + background
- [ ] QR scanner: localization QR sets `userLocation` and computes path to destination
- [ ] Pathfinding: implement client-side Dijkstra/A* across `paths` graph
- [ ] AR reward: scan sponsor QR -> call `POST /events/:id/engage` -> show badge

Mobile (B2B Staff)
- [ ] Scanner to capture Quicket ticket QR -> call `POST /leads/scan`
- [ ] Lead qualify screen to add notes and mark qualified

Ops / Pilot
- [ ] Print QR markers for localization and sponsor engagement
- [ ] Admin guide: where to place QR markers, testing checklist
- [ ] Rehearsal run-through to validate metrics

Suggested next actions:
1. Create issues for each bullet and assign owners.
2. Implement the backend endpoints and wire the `MapEditor` to them.
3. Build a small QA checklist and run one rehearsal on-site before Nov 15.
