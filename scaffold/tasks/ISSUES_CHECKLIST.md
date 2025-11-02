NavEaze Nov 15 pilot - issues checklist

Milestone: Nov 15 pilot - minimum viable features

- [ ] Backend: create Supabase schema (see `scaffold/backend/migrations/001_create_nav_tables.sql`)
- [ ] Backend: implement `GET /events/:id/map_data` (serve map_url, pois, paths)
- [ ] Backend: implement `POST /events/:id/engage` (log attendee engagements)
- [ ] Backend: implement `POST /leads/scan` and Quicket integration (demo mode ok)
- [ ] Web (Admin): MapEditor (upload map, add POIs, draw paths, save to backend)
- [ ] Web (Admin): Sponsor Management -> generate QR codes for POIs
- [ ] Mobile B2C: Map screen (render map + POIs), Directory, Scanner flow for localization + AR hunt
- [ ] Mobile B2B: Scanner to scan Quicket ticket, display attendee profile, save leads
- [ ] QA: End-to-end rehearsal with printed QR markers and a test event
- [ ] Docs: One-page admin guide for QR printing/placement and staff usage

Suggested small tasks (order of work):
1. Backend map_data endpoint + migration
2. Web MapEditor core (POI + Path creation)
3. Mobile B2C MapScreen + Scanner for localization
4. Small rehearsal and quick fixes
