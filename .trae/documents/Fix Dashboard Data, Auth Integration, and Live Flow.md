## Diagnosis
- Dashboard empty due to two root causes:
  - Auth token mismatch: frontend sends Supabase access tokens, backend expects its own JWT cookie (`auth-token`) → protected routes return 401, stats don’t load (`dpm-web/api/middleware/auth.ts:23-47`).
  - Stats queries reference non-existent tables (`venues`, `users`) → counts fail or return undefined (`dpm-web/api/index.ts:198-203`).
- Additional issues:
  - Frontend fetch doesn’t send cookies; even with backend JWT, calls won’t include it unless `credentials: 'include'`.
  - Role mismatch historically (backend vs frontend); we aligned backend to `profiles.role`, but dashboard still queries `users` and `venues`.
  - SettingsPage stores Quicket key in sessionStorage; server endpoints expect a header or server-side storage.
  - Floorplan editors reference tables not in migrations (`navigation_points`, `floorplans`, `nodes`, `segments`, `zones`); unified editor saves QR nodes correctly to `map_qr_nodes`, but legacy editor writes to `navigation_points`.
  - Legacy "Save (server)" posts to `http://localhost:3003/save_map` which is not part of the current backend.

## Fix Plan
### 1) Auth Integration & Requests
- Frontend: update `src/services/api.ts` to `credentials: 'include'` for all fetches so backend-set cookies are sent.
- Frontend: add a thin `authApi` calling `/api/auth/login|register|logout` and wire `AuthContext` to use backend auth for cookie-based sessions (still keep Supabase client for profile reads).
- Backend: extend `authenticateToken` to accept Supabase `Bearer` tokens by validating them via `supabaseAdmin.auth.getUser(token)` as a fallback when JWT verification fails.

### 2) Dashboard Stats
- Update stats queries:
  - Replace `users` with `profiles` (`id` count) in admin stats.
  - Confirm `venues` table exists; if not, add a migration for `venues` with minimal fields used by routes.
  - Keep `events` and `ar_advertisements` counts as-is.

### 3) Migrations
- Add `venues` table migration aligned to routes (name, address, capacity, contact info, timestamps).
- Optional: add minimal `floorplans` table for unified editor listing and reference (if desired to persist metadata beyond storage bucket).

### 4) Quicket Key Handling
- Add backend endpoint `/api/settings/quicket-key` to securely store/retrieve a user’s Quicket key (in `profiles` or a `user_settings` table with RLS restricting to owner).
- Update `SettingsPage.tsx` to read/write via this endpoint instead of sessionStorage.

### 5) Floorplan Editors
- Deprecate legacy `FloorplanEditorPage.tsx` path that writes to `navigation_points`; keep unified editor and ensure it only targets `map_qr_nodes` for QR calibration.
- Remove the external `save_map` call; use Supabase (or add an API route) for saving POIs/paths if needed later.

### 6) Frontend Config & Live Data
- Confirm `VITE_API_URL` and Supabase envs; mock mode remains disabled.
- Validate events/venues CRUD, dashboard stats, and QR calibration end-to-end on live API.

## Verification
- Login via backend auth; check cookie is set.
- Hit `/api/dashboard/stats` and confirm counts return for admin.
- Open unified editor with `?floorplanId=<id>&eventId=<id>`; place QR nodes; confirm inserts in `map_qr_nodes`.
- Run events/venues CRUD from UI with role gates enforced.

Confirm to proceed; I’ll implement the above changes and verify end-to-end.