## Overview
- Rebuild a clean DPM web app in a new folder with a verified Organizer/Admin flow: onboarding → event setup → floorplan upload → QR calibration → live dashboard → export/ROI.
- Tech: Vite + React + TS (frontend), Express (serverless-compatible) + Supabase (auth + DB).

## Project Structure
- `dpm-web-new/`
  - `client/` (Vite React)
  - `server/` (Express API)
  - `supabase/` (migrations, seed, storage buckets)

## Frontend (client)
- Stack: `react`, `react-router-dom`, `@supabase/supabase-js`, `tailwindcss`
- Pages:
  - Auth: `Login`, `Register`, `RoleSelector`
  - Dashboard (role-aware): Admin, Staff, Sponsor
  - Events: List, Create, Edit
  - Venues: List, Create, Edit
  - Profile, Settings (Quicket key)
  - Unified Map Editor (admin): upload floorplan, add POIs/paths, calibrate QR nodes
- Components: `ProtectedRoute`, `Layout`, UI (Button/Card/Input/Modal/Spinner)
- AuthContext:
  - Supabase client with `persistSession: true, autoRefreshToken: true`
  - Methods: `login`, `logout`, `register`, `fetchProfile`
- API client:
  - Fetch wrapper with `credentials: 'include'` and Bearer header support
  - Base URL from `VITE_API_URL`
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

## Backend (server)
- Entry: `server/index.ts` (Express)
- Middleware:
  - CORS: allow `http://localhost:5173` and `http://localhost:5174`
  - Cookies, JSON body parsing
  - Auth: accept Supabase Bearer token; optional JWT cookie on `/api/auth/login`
- Routes:
  - `/api/health`
  - `/api/auth/login|register|logout`
  - `/api/profile` (GET, PUT)
  - `/api/venues` (GET, GET/:id, POST, PUT/:id, DELETE/:id)
  - `/api/events` (GET, GET/:id, POST, PUT/:id, DELETE/:id)
  - `/api/dashboard/stats` (role-aware)
  - `/api/settings/quicket-key` (GET, PUT)
  - `/api/quicket/events|guests|match-attendee|sync-event` (reads stored key; supports `usertoken`)
- Roles: `admin`, `event_organizer`, `venue_manager`, `staff`, `sponsor`

## Supabase (supabase/migrations)
- Tables:
  - `profiles(id uuid pk → auth.users.id, email text, role text, first_name, last_name, quicket_api_key text, created_at timestamptz)`
  - `venues(id uuid pk, name text, address text, description text, capacity int, venue_type text, contact_email text, contact_phone text, organization_id uuid, status text, created_at, updated_at)`
  - `events(id uuid pk, name text, description text, start_time timestamptz, end_time timestamptz, venue_id uuid fk → venues.id, organizer_id uuid fk → auth.users.id, status text check in ('draft','published','cancelled'), created_at, updated_at)`
  - `floorplans(id uuid pk, event_id uuid fk → events.id, user_id uuid fk → auth.users.id, name text, image_url text, scale_meters_per_pixel numeric, created_at)`
  - `map_qr_nodes(id uuid pk, event_id uuid fk → events.id, qr_code_id text, x numeric, y numeric, floor text, created_at)`
  - `ar_campaigns(id uuid pk, owner_id uuid fk → profiles.id, event_id uuid fk → events.id, venue_id uuid fk → venues.id, name text, description text, start_at timestamptz, end_at timestamptz, status text, reward_type text, reward_value int, created_at, updated_at)`
  - Optional: `leads`, `attendee_scans` for ROI and scan analytics
- Policies:
  - `map_qr_nodes`: admin-only select/insert/update/delete via `profiles.role='admin'`
  - `ar_campaigns`: owner/admin RLS for CRUD
- Seed (dev only): insert demo venue/event/campaign
- Storage: bucket `floorplans` for images

## Unified Map Editor
- Admin-only page
- Features: upload floorplan (to storage), draw/add POIs and paths, calibrate QR nodes
- Save: `event_id`, `qr_code_id`, `x`, `y` to `map_qr_nodes`

## Dashboard
- Admin: cards for total events, venues, users, campaigns; Quick Actions (Create Event, Map Editor, Settings, AR Campaigns); recent activity
- Staff: cards for events and venues; Quick Actions (Profile, Settings); recent activity
- Sponsor: leads list/export (CSV)

## Quicket Integration
- Settings saves subscriber API key to `profiles`
- API routes read stored key if `x-quicket-api-key` header absent
- `usertoken` header supported for endpoints requiring user context
- Sync route: pulls events/guests and upserts into Supabase

## Commands
- Frontend:
  - `npm create vite@latest client -- --template react-ts`
  - `cd client && npm i react-router-dom @supabase/supabase-js tailwindcss postcss autoprefixer && npx tailwindcss init -p`
- Backend:
  - `mkdir server && npm init -y && npm i express cors cookie-parser jsonwebtoken dotenv zod`
  - `npm i -D tsx typescript @types/node @types/express @types/cors @types/cookie-parser`
- Supabase CLI:
  - `npx supabase init`
  - `npx supabase link` (select project)
  - Place SQL files under `supabase/migrations` and run `npx supabase db push`

## Environment
- `server/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `FRONTEND_URL=http://localhost:5173`
- `client/.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL=http://localhost:3002/api`

## Verification
- Health: `GET /api/health`
- Auth: login via UI; fallback: `POST /api/auth/login` for cookie
- Dashboard: `GET /api/dashboard/stats`
- Venues/Events: CRUD
- Map editor: calibration inserts in `map_qr_nodes`
- Quicket: `GET /api/quicket/events` with saved key; add `usertoken` when required
- Smoke test: script to ping health/stats/events/venues

## Acceptance Criteria
- Organizer can: login → create venue → create event → upload floorplan → calibrate QR nodes → view dashboard stats → export sponsor leads.
- Staff sees meaningful dashboard.
- Quicket routes work with stored key; support `usertoken`.
- Ports and CORS aligned; no 401/422 in normal flow.

## Timeline (estimate)
- Phase 1 (Schema/Auth): 1–2 days
- Phase 2 (API/Editor): 2–3 days
- Phase 3 (Frontend Pages/Dashboard): 2–3 days
- Phase 4 (Cleanup/Seeds/Tests): 1–2 days

Confirm and I’ll scaffold the new folder (`dpm-web-new`) and implement step-by-step with migrations, code, and tests.