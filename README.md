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

