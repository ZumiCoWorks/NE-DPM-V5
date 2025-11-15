## Goals
- Deliver a clean, fully functional DPM web app MVP centered on the Event Organizer/Admin flow: onboarding → event setup → map/QR calibration → live monitoring → export/ROI.
- Eliminate duplicates/deprecated code, normalize schema, simplify auth, and make role-based dashboards meaningful.

## Architecture
### Frontend (Vite + React + TypeScript)
- Routing: React Router with `ProtectedRoute` and role-based redirects.
- State/Auth: `AuthContext` backed by Supabase Auth; session persistence (`persistSession: true`).
- UI: Tailwind, reusable components (Button/Card/Modal/Input), dashboard widgets, unified map editor.
- API client: lightweight wrapper around fetch with `credentials: 'include'` and `Authorization: Bearer` support; base from `VITE_API_URL`.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.

### Backend (Express, serverless-compatible entry)
- Single entry (`api/index.ts`) with CORS, cookies, JSON body parsing.
- Auth middleware: accept Supabase Bearer tokens; optional JWT cookie issued on `/api/auth/login` for UI convenience.
- Routes:
  - `/api/auth/login|register|logout`
  - `/api/profile` (GET/PUT)
  - `/api/events` CRUD (linked to `venue_id`, uses `start_time/end_time`, `status`)
  - `/api/venues` CRUD
  - `/api/dashboard/stats` (role-aware)
  - `/api/attendees/admin/upload`
  - `/api/scans` (log + analytics)
  - `/api/quicket/*` (uses stored subscriber key; supports `usertoken` header)
  - Health: `/api/health`
- Security: CORS `origin` from `FRONTEND_URL` (support 5173/5174); rate limiting optional.

## Database (Supabase)
### Schema (normalized)
- `profiles(id, email, role, first_name, last_name, quicket_api_key, created_at)` (FK → `auth.users`)
- `venues(id, name, address, description, capacity, venue_type, contact_email, contact_phone, organization_id, status, created_at, updated_at)`
- `events(id, name, description, start_time, end_time, venue_id, organizer_id, status, created_at, updated_at)`
- `floorplans(id, event_id, user_id, name, image_url, scale_meters_per_pixel, created_at)`
- `map_qr_nodes(id, event_id, qr_code_id, x, y, floor, created_at)`
- `ar_campaigns(id, owner_id, event_id, venue_id, name, description, start_at, end_at, status, reward_type, reward_value, created_at, updated_at)`
- `leads`, `attendee_scans` (as needed for MVP)

### Policies
- Admin-only RLS for `map_qr_nodes` (via `profiles.role='admin'`).
- Owner/admin RLS for `ar_campaigns`.

### Migrations
- Create/update tables and missing columns (e.g., `events.venue_id`, `events.status`).
- Seed script for demo venue/event/campaign.

## Unified Map/QR Editor
- Single page for admins: upload floorplan, add POIs/nodes/paths, calibrate QR nodes.
- Calibration saves (`event_id`, `qr_code_id`, `x`, `y`) to `map_qr_nodes`.
- Floorplan images stored in Supabase Storage; metadata in `floorplans`.

## Dashboards & UX
- Role-aware dashboard cards and Quick Actions:
  - Admin: Create Event/Venue, Map Editor, Settings, AR Campaigns, stats (events/venues/users/campaigns).
  - Staff: Recent events/venues counts, Profile, Settings.
  - Sponsor: Leads list/export.
- Recent Activity stream for admin/staff.

## Quicket Integration
- Settings page saves subscriber API key to `profiles`.
- Routes read stored key when header not provided; add `usertoken` for endpoints requiring user context.
- Sync endpoint: import events/guests → upsert into Supabase.

## Codebase Cleanup
- Remove `_deprecated/` and `* 2.tsx` duplicates.
- Consolidate to canonical pages/components.
- Pin dev ports, ensure CORS supports the current frontend port.

## Dev Experience & Security
- Env: optional switch to `@dotenvx/dotenvx` for encrypted `.env` management.
- Scripts: `client:dev`, `server:dev`, `dev` (concurrently), `smoke-test` for health/stat checks.
- Logging: concise server logs; frontend console de-duped (remove redundant auth calls).

## Testing
- Smoke tests: health, auth, events/venues CRUD, dashboard stats.
- E2E: critical Organizer flow (login → create venue/event → map/QR calibration → export leads).

## Delivery Plan
### Phase 1: Schema & Auth Simplification (1–2 days)
- Apply migrations; align API to schema (events `venue_id/status`).
- Accept Supabase Bearer; optional cookie JWT issue on login.

### Phase 2: API & Editor (2–3 days)
- Implement clean routes; unify map editor; calibrate QR nodes.

### Phase 3: Frontend Pages & Dashboard (2–3 days)
- Role-aware Dashboard; Events/Venues/Profile/Settings; sponsor leads.

### Phase 4: Cleanup, Seeds, Tests (1–2 days)
- Remove deprecated code; add `smoke-test`; seed data; write basic E2E.

## Acceptance Criteria
- Organizer can: login → create venue → create event (linked to venue) → upload floorplan → calibrate QR nodes → view dashboard stats → export sponsor leads.
- Staff sees non-empty dashboard with relevant actions.
- Quicket endpoints work using stored key; authenticated endpoints support `usertoken`.
- No 401/422 in normal auth flow; CORS allows frontend port.

## Rollback & Data Safety
- Migrations isolated, reversible; seed only in development.
- No secrets committed; env keys kept local.

Confirm and I will begin rebuilding in this structured order and deliver a fully working MVP, with verifiable tests and seeds. 