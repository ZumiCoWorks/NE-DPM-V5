## Current Status
- Frontend pages exist for auth, events, venues, profile, admin uploads, sponsor, floorplan, AR campaigns, dashboards.
- Backend provides protected CRUD for events/venues, profile read/update, dashboard stats, Quicket integration with mock/live modes, health checks.
- Supabase migrations and one Edge Function are present; frontend currently uses mock data by default.
- Env for server-side Supabase is set; remaining secrets (JWT, Quicket) need verification.

## Proposed Validation & Hardening
### Enable Live Data on Frontend
- Switch `src/services/api.ts` from `USE_MOCK_DATA = true` to live requests.
- Ensure `VITE_API_URL` points to the running backend; verify role-based guarded routes.

### Auth Consistency & Roles
- Confirm `users`/`profiles` schema alignment for roles.
- Verify JWT issuance and cookie handling in login/register.

### Events & Venues E2E
- Create/edit/delete events and venues via UI against live API.
- Confirm organizer/manager role gates using `authenticateToken` + `requireRole`.

### Attendees & Scans
- Test admin upload (`/api/attendees/admin/upload`).
- Log scans and view analytics endpoints; validate dev-only analytics protections.

### Sponsors & Leads
- Verify sponsor leads list and CSV export.
- Validate `POST /api/leads` ingestion flow.

### Quicket Integration
- Run `GET/POST` endpoints with `QUICKET_MOCK_MODE` off using real keys.
- Test `sync-event` writes to Supabase; reconcile attendee matching.

### AR Campaigns
- Confirm `ar_advertisements` schema and UI flows (create/edit/list) are wired.

### Cleanup & Deployment
- Remove/disable `_deprecated` and duplicate `* 2.ts` files.
- Ensure `api/index.ts` is the only backend entry; update docs accordingly.
- Configure Vercel env vars and verify rewrites.

### Smoke Tests
- Add/repair `scripts/smoke-test.js` to ping `health`, `events`, `venues` endpoints.

## Outcome
- A verified, live-data MVP with clear role gates, working Quicket sync, AR campaign management, and clean deployment. Confirm to proceed with these steps.