## Objective
Deliver a working app immediately, then restore full auth/data flows without back-and-forth.

## Phase 0: Immediate Working UI (Demo Mode)
- Set `VITE_DEMO_MODE=true` in `dpm-web/.env.local`.
- Restart frontend (`npm run client:dev`).
- Result: UI works without auth; Role Selector functions; you can demo Organizer flow screens.

## Phase 1: Unify Environment to ONE Supabase Project
- Choose the resolving project: `https://uzhfjyoztmirybnyifnu.supabase.co`.
- Update these files to use ONLY this project:
  - `dpm-web/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL=http://localhost:5173`.
  - `dpm-web/.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL=http://localhost:3001/api`.
- Restart backend (`npm run server:dev`) and frontend.

## Phase 2: Fix RLS for profiles (Remove Recursion)
- In Supabase SQL Editor (for `uzhfjyoz...`):
  1. Disable RLS temporarily to seed profile:
     - `ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;`
  2. Seed role via backend dev endpoint or Role Selector (calls `/api/dev/set-role`).
  3. Re-enable with minimal self-access policies:
     - `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
     - `CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);`
     - `CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);`
     - `CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);`
- Ensure signups are enabled in Supabase Auth settings to avoid 422.

## Phase 3: Backend Role Seeding Path (Dev)
- Use existing endpoint `POST /api/dev/set-role` to upsert `profiles` with service role key.
- This bypasses RLS during development and prevents client-side 500s.

## Phase 4: Verification (Organizer Core Loop)
- Login/Register → Role Selector → choose "Event Admin".
- Dashboard loads (ignore AR stats if table mismatch).
- Create Venue → Create Event.
- Open Map Editor page and confirm it renders.

## Phase 5: Clean-Up
- Turn off Demo Mode (`VITE_DEMO_MODE=false`).
- Keep policies minimal and non-recursive.
- Ensure both folders stop referencing other Supabase projects to avoid confusion.

## Deliverables
- Working UI immediately via Demo Mode.
- Unified envs to `uzhfjyoztmirybnyifnu`.
- Fixed RLS with minimal policies.
- Verified Organizer flow end-to-end.

## After Confirmation
I will: 
1) enable Demo Mode for instant UI; 
2) update envs to the unified project; 
3) apply the RLS SQL and seed your profile; 
4) verify login/role, venues/events; 
5) switch Demo Mode off.