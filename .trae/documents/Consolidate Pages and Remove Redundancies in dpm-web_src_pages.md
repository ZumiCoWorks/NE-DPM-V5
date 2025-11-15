## Goal
Remove duplicated/unused pages, consolidate to a single set of canonical routes, and verify end-to-end functionality for the MVP. If blockers remain, provide a ready-to-run SOLO Builder prompt to rebuild cleanly.

## Inventory & References
- Enumerate pages under `dpm-web/src/pages` and `_deprecated/`.
- Locate router definitions (`src/App.tsx`, `src/main.tsx`) and map which pages are actually routed.
- For each page, search references (`import`, `lazy`, `Link to`, `navigate('/…')`) to determine usage.

## Canonical Choices
- Dashboard: keep ONE—recommend `DashboardPage.tsx` (role-aware, Supabase-backed). Mark `Dashboard.tsx` for removal unless it’s the routed target.
- Map Editor: keep `admin/UnifiedMapEditorPage.tsx` as the canonical editor. Mark `DevFloorplanEditorPage.tsx` as dev-only (behind a dev flag) or remove if not needed.
- Floorplan: keep `floorplan/FloorplanEditorPage.tsx` ONLY as a link/visualizer to the unified editor. Remove legacy save-to-`navigation_points` flows if not routed.
- Auth: keep `auth/LoginPage.tsx`, `auth/RegisterPage.tsx` and `RoleSelectorPage.tsx`.
- Events/Venues/Profile/Sponsor: keep routed pages (`events/*`, `venues/*`, `profile/ProfilePage.tsx`, `sponsor/SponsorLeadsPage.tsx`).
- Remove `_deprecated/` pages and any `* 2.tsx` duplicates where canonical equivalents exist.

## Routing Consolidation
- In `src/App.tsx` (and any layout wrappers), ensure routes point only to canonical pages:
  - `/dashboard` → `DashboardPage.tsx`
  - `/admin/unified-map-editor` → `UnifiedMapEditorPage.tsx`
  - `/floorplans/:id` → `FloorplanEditorPage.tsx` (links to unified editor)
  - `/events/*`, `/venues/*`, `/profile`, `/settings`, `/sponsor`
- Remove routes to `Dashboard.tsx` and `DevFloorplanEditorPage.tsx` unless explicitly kept for a dev-only path.

## Removal Criteria
- Unreferenced: no route/path imports and no component usage.
- Duplicates: files with `* 2.tsx`, legacy copies under `_deprecated/`.
- Legacy flows: pages saving to old tables (`navigation_points`) if not used.

## Minimal Code Changes
- Delete unused pages/files per criteria above.
- Update any links that still point to removed pages.
- Keep a single Dashboard implementation.
- Gate `DevFloorplanEditorPage.tsx` behind `NODE_ENV === 'development'` if retained.

## Verification
- Run backend and frontend.
- Login and visit `/dashboard`: stats and recent activity load.
- Navigate to events/venues/profile/sponsor pages: ensure requests work with live API.
- Open unified editor with `?floorplanId=<id>&eventId=<id>` and perform QR calibration.

## Fallback: SOLO Builder Prompt
If consolidation reveals deeper architectural issues or functionality gaps, use this prompt:

"""
Rebuild the NavEaze DPM web app MVP with a clean architecture.

Requirements:
- Frontend: Vite + React + TypeScript; React Router; Tailwind; role-aware `ProtectedRoute`; `AuthContext` backed by Supabase.
- Backend: Express (serverless-compatible entry), `/api/health`, `/api/auth/*`, protected CRUD for `/api/events`, `/api/venues`, `/api/profile`, `/api/dashboard/stats`.
- Auth: Accept Supabase `Authorization: Bearer <access_token>` for protected routes. Optional cookie JWT.
- Supabase: Use `profiles` for role; migrations for `events`, `venues`, `profiles`, `ar_advertisements`, `map_qr_nodes`, `floorplans`. RLS: `map_qr_nodes` admin-only.
- Editor: One unified admin map editor page; upload floorplan, add POIs, draw paths, calibrate QR nodes saved to `map_qr_nodes` with `event_id`, `qr_id_text`, `x_coord`, `y_coord`.
- Quicket: Settings page saves API key server-side; routes read from user profile when header missing; mock mode toggle.
- Config: `.env.local` for client (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`), `.env` for server (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`). Prefer `@dotenvx/dotenvx` for encrypted env files.
- Pages: One Dashboard (role-aware), Events (list/create/edit), Venues (list/create/edit), Profile, Settings, Sponsor Leads, Unified Map Editor. Remove duplicates and deprecated files.
- DX: Dev seed endpoint to populate demo data (venues, events, campaigns) in development.

Deliverables:
- Clean repo structure without duplicates/deprecated pages.
- Working routes and pages wired to live API.
- Verified end-to-end: login, dashboard stats, events/venues CRUD, unified QR calibration, Quicket sync.
"""

Confirm and I will proceed to implement the consolidation, remove unused files, update routes, and verify functionality; or apply the SOLO Builder prompt if you prefer a fresh rebuild.