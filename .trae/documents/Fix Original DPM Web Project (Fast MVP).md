## Objective
Bring the original `dpm-web` online quickly (frontend + backend + Supabase) by applying minimal, surgical fixes inspired by the clean patterns in `dpm-web-new`.

## Key Fixes
- Ensure correct environment variables for both backend and frontend.
- Align auth register flow to write into `profiles` (not `users`).
- Keep organizer core loop working: auth → venues → events → floorplan upload.
- Defer non-critical AR/analytics differences until later.

## Step 1: Environment Setup
- Backend env: `dpm-web/.env`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET` (any strong random string)
  - `FRONTEND_URL=http://localhost:5173`
  - Backend loads env at startup in `api/index.ts:1–10` and `api/lib/supabase.ts:6–13`.
- Frontend env: `dpm-web/.env` (or `.env.local`)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - Optional: `VITE_DEMO_MODE=false` (set `true` to demo UI without backend)
- Confirm `vite.config.ts` proxies `/api` to `http://localhost:3001` (vite.config.ts:27–46).

## Step 2: Launch Servers
- Backend: `npm run server:dev` (nodemon → `api/index.ts`; nodemon.json:5)
- Frontend: `npm run client:dev` (port `5173`)
- Health check:
  - Backend: `GET http://localhost:3001/api/health` (api/index.ts:53–59)

## Step 3: Fix Auth Registration Table
- Problem: `api/auth/register.ts` writes to `users` but rest of code uses `profiles`.
- Change target table to `profiles` and keep id/email/role fields aligned.
  - Read existing create logic in `api/auth/register.ts:65–77` → switch `.from('users')` to `.from('profiles')`.
  - If your `profiles` schema uses `first_name`/`last_name`, split `full_name` before insert; otherwise persist `full_name`.
- Middleware already reads `profiles` (api/middleware/auth.ts:66–73) and protects routes.

## Step 4: Verify Auth Flow
- Register via frontend Register page; confirm HTTP-only cookie `auth-token` is set.
- Call `GET /api/profile` to verify profile (api/index.ts:80–122).
- Login via frontend; confirm protected endpoints work:
  - Venues routes guarded by role (api/index.ts:73–78; api/routes/venues.ts:13–29).

## Step 5: Organizer Core Loop Smoke Test
- Create venue → `POST /api/venues`.
- Create event → `POST /api/events`.
- Open Unified Map Editor pages in the original UI to confirm they render (data can be added incrementally).

## Step 6: Defer Non-Critical Schema Differences
- Dashboard stats reference `ar_advertisements` (api/index.ts:228–276). If your DB uses `ar_campaigns`, temporarily skip these stats or adjust later.
- Keep focus on Organizer flow and basic CRUD.

## Step 7: Troubleshooting Checklist
- 401 on protected routes → ensure `JWT_SECRET` matches and cookies are sent; check CORS origins in `api/index.ts:31–45`.
- Supabase errors → validate URL/keys and table names (`profiles`, `venues`, `events`).
- Frontend API calls → ensure `vite.config.ts` proxy is active.
- Optional: Install React Developer Tools to inspect components quickly during debugging.

## Deliverables (1–2 hours)
- Original frontend on `http://localhost:5173` and backend on `http://localhost:3001`.
- Working registration/login issuing JWT and populating `profiles`.
- Organizer can create venues and events via the UI.
- Dashboard loads (with AR stats deferred if table name mismatch exists).

## Optional Enhancements (Later)
- Align AR table names (`ar_advertisements` → `ar_campaigns`) and update queries.
- Add robust error handling and typed responses for routes.
- Replace any legacy utilities with the cleaner service patterns from `dpm-web-new`.