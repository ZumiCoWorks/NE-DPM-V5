# NE DPM V5

Monorepo for the DPM MVP. Includes web app with Express backend, mobile apps, and Supabase schema.

## Repository Structure
- `dpm-web/` — Vite React frontend and Express API
- `staff-mobile/` — staff scanning app (Expo)
- `attendee-mobile/` — attendee app (Expo)
- `dpm-web/supabase/` — migrations and edge functions

## Quick Start (Web + API)
1. `cd dpm-web`
2. `npm install`
3. Configure environment:
   - Frontend (`dpm-web/.env.local`):
     - `VITE_SUPABASE_URL=https://<your-project>.supabase.co`
     - `VITE_SUPABASE_ANON_KEY=<anon-key>`
   - Backend (`dpm-web/.env`):
     - `SUPABASE_URL=https://<your-project>.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
     - `JWT_SECRET=<random-string>`
     - `FRONTEND_URL=http://localhost:5173` (optional)
   - Do not commit secrets. Rotate keys as needed.
4. Development:
   - Full app: `npm run dev` (frontend + API)
   - API only: `npm run server:dev` (defaults to `PORT=3001`)
   - Health check: `GET http://localhost:3001/api/health`

## Backend Overview
- Entry (local): `dpm-web/api/server.ts`
- Entry (serverless/Vercel): `dpm-web/api/index.ts` with `vercel.json` rewrites
- Supabase admin client: `dpm-web/api/lib/supabase.ts`
- Auth middleware: `dpm-web/api/middleware/auth.ts`
- Routes: `dpm-web/api/routes/*` (events, venues, booths, attendees, scans, leads, sponsors, tickets, quicket, analytics)

## Supabase
- Migrations: `dpm-web/supabase/migrations`
- Edge Functions: `dpm-web/supabase/functions`

## Deployment
- Vercel SPA + API rewrites configured in `dpm-web/vercel.json`
- Ensure production env vars are set in the hosting provider

## Troubleshooting
- Port in use: set `PORT` (e.g., `PORT=3002 npm run server:dev`)
- Missing Supabase vars: the API will fail to boot; verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Avoid `_deprecated/` folders; current code lives outside those directories

## Recent Work and Architecture Decisions

### Repository Organization
- Consolidated active development in `dpm-web/` (Vite React + Express API).
- Any experimental or predecessor structure (e.g., `dpm-web-new/`) remains as reference but is not the primary target; current app and API run from `dpm-web/`.

### Event Creation and Editing
- Fixed NOT NULL constraint failures by sending both `start_date`/`end_date` and `start_time`/`end_time` derived from the `datetime-local` inputs.
  - Create: `dpm-web/src/pages/events/CreateEventPage.tsx`
  - Edit: `dpm-web/src/pages/events/EditEventPage.tsx`
  - Behavior: converts local `datetime-local` strings to ISO (`.toISOString()`) and includes date+time fields in inserts/updates.

### Storage Uploads (Floorplans)
- Added server-side upload route using Supabase service role to avoid Storage RLS friction and auto-create the `floorplans` bucket when missing.
  - Route: `dpm-web/api/routes/storage.ts`
  - Mounted at: `/api/storage/upload/floorplan` in `dpm-web/api/index.ts`
  - Client: `dpm-web/src/components/DevScaffoldFloorplanEditor.jsx` sends `Authorization: Bearer <supabase access_token>` and receives a public URL.
- Floorplan DB insert saved minimal fields initially, then aligned with intended schema to include `dimensions` and `user_id` once available.

### Auth Middleware
- Relaxed token handling to accept valid Supabase `access_token` even if `profiles` lookup is temporarily blocked.
  - File: `dpm-web/api/middleware/auth.ts`
  - Effect: Authenticated routes like storage/editor work reliably during early-stage profile provisioning.

### Editor Persistence (POIs, QR Calibration, Map Graph)
- POIs: Persisted to `navigation_points` via server route.
  - `POST /api/editor/poi` (file: `dpm-web/api/routes/editor.ts`)
  - Client wiring in `DevScaffoldFloorplanEditor.jsx` when adding POIs.
- QR Node Calibration: Persisted to `map_qr_nodes` per event via server route.
  - `POST /api/editor/qr-node` (file: `dpm-web/api/routes/editor.ts`)
  - Client wiring in `DevScaffoldFloorplanEditor.jsx` when adding nodes with a QR ID.
- Map Graph Save (nodes, segments, pois): Added route to upload a JSON snapshot to Storage for simple, reliable versioning.
  - `POST /api/editor/map` (file: `dpm-web/api/routes/editor.ts`)
  - Stores JSON at `floorplans/maps/<floorplan_id>.json` (public) for mobile consumption.
  - Client wiring in `DevScaffoldFloorplanEditor.jsx` `handleSaveMap`.

### Supabase Schema and Migrations
- Relevant migrations are tracked under `dpm-web/supabase/migrations/`:
  - `20251112_create_floorplans.sql` defines `floorplans` table (including `dimensions`, `user_id`, `scale_meters_per_pixel`).
  - `002_qr_navigation_and_leads.sql` and `20251112_update_map_qr_nodes_rls.sql` define `map_qr_nodes` and tighten RLS to admin-only via `profiles.role`.

### Dev Server and Ports
- Frontend dev server: `http://localhost:5174/`
- API dev server: defaults to `PORT=3001`. If port is busy, set `PORT` or stop the other instance.
- CORS allows `http://localhost:5173` and `http://localhost:5174`.

### Debugging (React DevTools)
- For component inspection and profiling, install React Developer Tools in your browser.
- Safari: `npm install -g react-devtools` then add `<script src="http://localhost:8097"></script>` during local debugging.

### Additional Troubleshooting
- DNS errors (`net::ERR_NAME_NOT_RESOLVED`): verify the exact Supabase `API URL` and keys from Project Settings; update `.env.local` and `.env` with those values (no quotes/backticks). Clear `sb-...` storage and cookies, then hard refresh.
- PostgREST 400/204 (missing columns): align table schema with UI fields (see Schema Alignment above).
- CORS/401: backend `FRONTEND_URL` must match the dev port Vite uses (5173 or 5174). Restart API after changing.

## Mobile Navigation Plan (Attendee App)

### Data Sources
- Floorplan image: `floorplans.image_url` (uploaded via server route).
- POIs: read from `navigation_points` for a selected `floorplan_id`.
- QR calibration: `map_qr_nodes` entries per event to snap user location to known coordinates.
- Graph JSON: `floorplans/maps/<floorplan_id>.json` containing `nodes`, `segments`, and `pois` snapshot.

### On-Device Flow
- Build adjacency list from `segments` between `nodes`.
- Determine start location:
  - Scan QR → resolve calibration (`map_qr_nodes`) → snap to nearest graph node.
  - Fall back to last-known node or selected node if no QR.
- Compute route (Dijkstra or A*) from start node to target node (nearest to POI or selected node).
- Render path as polyline over the floorplan image; update progressively as user advances or scans new QR.
- Cache graph JSON and POIs for offline-friendly behavior; re-sync when online.

### Why This Approach
- Simplifies persistence and aligns with MVP: backend stores path data; mobile computes navigation locally.
- Avoids early DB schema complexity by versioning the entire graph as JSON in Storage while still supporting relational POIs and QR calibration.

## Environment Configuration
- Frontend: `dpm-web/.env.local`
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_API_URL` for pointing to the API base (defaults to `http://localhost:3001/api`).
- Backend: `dpm-web/.env`
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `FRONTEND_URL`.
- Never commit secrets to source control; rotate keys regularly.

## Quick Reference (Paths)
- Storage route: `dpm-web/api/routes/storage.ts` → `POST /api/storage/upload/floorplan`
- Editor routes: `dpm-web/api/routes/editor.ts` → `POST /api/editor/qr-node`, `POST /api/editor/poi`, `POST /api/editor/map`
- Auth middleware: `dpm-web/api/middleware/auth.ts`
- Editor client: `dpm-web/src/components/DevScaffoldFloorplanEditor.jsx`
- Events pages: `dpm-web/src/pages/events/*`
