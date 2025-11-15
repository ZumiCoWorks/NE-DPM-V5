## Objective
Bring the original `dpm-web` online quickly (frontend + backend + Supabase) by applying minimal fixes inspired by the clean patterns in `dpm-web-new`.

## Step 1: Environment Setup
- Backend env (`dpm-web/.env`): set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `FRONTEND_URL=http://localhost:5173`.
  - Env is loaded early in `api/index.ts:1–10` and `api/lib/supabase.ts:6–13`.
- Frontend env (`dpm-web/.env` or `.env.local`): set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_DEMO_MODE=false`.
- Confirm Vite proxy for API (`dpm-web/vite.config.ts:27–46`) points `/api` to `http://localhost:3001`.

## Step 2: Start Servers
- Backend: `npm run server:dev` (nodemon → `api/index.ts`; see `dpm-web/nodemon.json:5`).
- Frontend: `npm run client:dev` (port `5173`).
- Health: `GET http://localhost:3001/api/health` (returns JSON) `dpm-web/api/index.ts:53–59`.

## Step 3: Minimal Auth Fix (users → profiles)
- `dpm-web/api/auth/register.ts`
  - Replace reads/writes to `users` with `profiles`:
    - Existing check: `dpm-web/api/auth/register.ts:22–27` → `.from('profiles')`.
    - Insert profile: `dpm-web/api/auth/register.ts:65–77` → `.from('profiles')` with `{ id, email, role, full_name | first_name/last_name }` per your schema.
  - Keep `id = authData.user.id` and `email`, `role` consistent.
- Middleware already queries `profiles` for auth (`dpm-web/api/middleware/auth.ts:66–73`).
- Login already reads `profiles` (`dpm-web/api/auth/login.ts:37–46`).

## Step 4: Verify Auth Flow
- Register via frontend; confirm `auth-token` cookie is set.
- `GET /api/profile` returns `id, email, full_name/role` (`dpm-web/api/index.ts:80–122`).
- Access protected routes:
  - Venues (`dpm-web/api/routes/venues.ts:16–29`) + role guards wired in `dpm-web/api/index.ts:73–78`.

## Step 5: Organizer Core Loop Smoke Test
- Create Venue (`POST /api/venues`).
- Create Event (`POST /api/events`).
- Load Unified Map Editor page; ensure rendering with current data. Seed minimal data if needed.

## Step 6: Defer Non‑Critical Differences
- Dashboard stats reference `ar_advertisements` (`dpm-web/api/index.ts:228–276`). If your DB uses `ar_campaigns`, temporarily skip/guard these queries; align later.

## Step 7: Troubleshooting Checklist
- 401s: ensure `JWT_SECRET` and cookie set; CORS allow origin (`dpm-web/api/index.ts:31–45`).
- Supabase errors: confirm `SUPABASE_URL`, keys, and table names (`profiles`, `venues`, `events`).
- Frontend API calls: Vite proxy active (`vite.config.ts:27–46`).

## Deliverables (≈1–2 hours)
- Running original frontend (`5173`) and backend (`3001`).
- Registration/login issuing JWT and populating `profiles`.
- Organizer can create venues and events via the UI.
- Dashboard loads; AR stats deferred if table mismatch exists.

## After Confirmation
I will: set env files, update `register.ts` to use `profiles`, start both servers, and verify the full flow end‑to‑end.