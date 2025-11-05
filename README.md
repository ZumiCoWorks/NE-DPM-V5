## NE DPM V5 — Developer README (Local dev & stabilization notes)

This repository contains the dpm-web (Admin Hub) and related artifacts for the "NE DPM V5" project.

Purpose
-------
- Stabilize the Admin Hub (dpm-web) so it can act as the source-of-truth for the mobile apps.
- Provide a working local dev environment, minimal DB objects for local testing, and API-level test artifacts (Postman collection).

Quick status (short)
---------------------
- The Vite frontend and a small local admin Express server were wired to run concurrently for local development.
- Multiple runtime import and TypeScript issues were fixed (named exports, JSX syntax errors, small type shims).
- A Postman collection for local and Supabase tests is present at `postman/NE-DPM-V5-collection.json`.
- Minimal DB tables and a development-safe RPC stub were created to allow the Map Editor workflows to run locally. Some fixes are intentionally temporary (noted below).

Prerequisites
-------------
- Node.js (16+ recommended) and npm.
- A Supabase project (for remote testing) or a local dev Supabase instance.
- Required environment variables (create a `.env` file in the `dpm-web` root or set in your shell):
  - VITE_SUPABASE_URL — your Supabase URL (e.g. https://your-project.supabase.co)
  - VITE_SUPABASE_ANON_KEY — anon/public key used by the frontend
  - SUPABASE_SERVICE_ROLE_KEY — (only for admin scripts/local server; do NOT commit to git)

Dev server (frontend + admin server)
-----------------------------------
1. Install dependencies

```bash
cd dpm-web
npm install
```

2. Start dev servers (project uses concurrent servers)

```bash
npm run dev
# or the repository-specific script that starts the Vite client (default: 5173) and local admin server (default: 5176)
```

3. Open the frontend at: http://localhost:5173
   Local admin server health: http://localhost:5176/

Key developer files & directories
---------------------------------
- `src/pages/MapEditorPage.tsx` — Main map/floorplan editor. Integrates with Supabase tables and RPCs.
- `src/components/FloorplanCanvas.jsx` — Konva canvas & drawing utilities (named export added).
- `src/components/ImageUploader.jsx` — Upload helper for Supabase storage (named export added).
- `src/hooks/useScreenSize.js` — Screen size helper (named export added).
- `api/server.ts` — Small Express admin server for local checks (listens on 5176 by default).
- `postman/NE-DPM-V5-collection.json` — Postman collection for Local & Supabase tests (import into Postman).

What was done (summary)
------------------------
- Fixed several runtime import errors by adding named exports where components were imported as named but exported as default.
- Resolved JSX parsing issues (unclosed tags) and small syntax errors preventing builds.
- Added a `SettingsPage` and wired routes for Settings and Vendor Signup in the app router and sidebar.
- Created a Postman collection containing requests for:
  - Local admin endpoints
  - Supabase REST (tables & RPC)
  - Supabase Functions (vendor-signup)
  - Supabase Storage file upload and Auth signup
- Created minimal DB objects and a development-safe RPC stub (`create_event_from_template`) to let the Map Editor and event creation flows execute for local testing.
- Applied temporary TypeScript casts for quick fixes (e.g., `(currentUser as any).id`) to unblock compilation.

Shortcomings & temporary decisions (known issues)
------------------------------------------------
- Several TypeScript casts were applied as a temporary measure. These should be replaced with proper `AuthContext`/`User` types.
- The DB changes applied for local testing are minimal development helpers and should be replaced by formal migration files in `migrations/` before production use.
- Sponsor management features remain placeholder and need wiring to Supabase tables.

Postman collection & environment
--------------------------------
- Import `postman/NE-DPM-V5-collection.json` into Postman.
- Create an environment with the following variables (placeholders in collection):
  - local_api_base = http://localhost:5176
  - supabase_url = https://your-project.supabase.co
  - supabase_anon_key = <ANON_KEY>
  - supabase_service_role_key = <SERVICE_ROLE_KEY>
  - user_jwt = <USER_JWT>  (set after signup/auth)
  - user_id = <USER_ID>    (set after profile creation)
  - floorplan_id, vendor_id, template_id, file_name — used by specific requests

Suggested Postman run order (manual guidance)
1. Local: Health — check admin server at `{{local_api_base}}/`
2. Supabase Auth: Sign up — create a test user (copy returned JWT)
3. Supabase: GET/Create floorplans — use service role key for table insert or use authenticated user flow
4. Supabase Storage: upload floorplan image — upload a small PNG to `floorplans` bucket
5. Supabase RPC: create_event_from_template — test the RPC that creates an event/floorplan from a template
6. Supabase Functions: vendor-signup — test vendor signup link generation

Security notes
--------------
- Never commit `SUPABASE_SERVICE_ROLE_KEY` or any private keys to version control.
- Keep service role keyed requests server-side only. The frontend uses the anon key for normal operations.

Development hygiene & next steps
-------------------------------
1. Replace temporary `(currentUser as any)` casts with properly typed auth context and strengthen TypeScript types.
2. Extract DB changes into formal migration files and add them to `migrations/` (or the project's migration flow).
3. Wire SponsorManagement and other placeholder UIs to live Supabase data.
4. Add a small test suite (unit / integration) to validate core behaviors (MapEditor create/delete flows, RPCs).
5. Consider adding a CONTRIBUTING.md describing local environment secrets and migration practices.

Where to look for related changes
---------------------------------
- `src/pages/MapEditorPage.tsx` — many of the edits and temporary casts live here.
- `src/components/*` — small fixes (named exports) applied to many components to match imports.
- `postman/NE-DPM-V5-collection.json` — Postman test definitions and placeholders for environment variables.

If something's broken when you run dev
-------------------------------------
- Confirm `.env` values are set and accurate.
- Ensure the `floorplans` storage bucket exists in Supabase if using storage features.
- Check the local admin server logs (port 5176) for RPC or admin endpoint errors.
- If a TS compile error mentions `.id` on `User`, search for `(currentUser as any).id` as a temporary workaround—plan to replace with proper typing.

Contact / Notes
---------------
This README is intended as a developer-facing quickstart specific to the stabilization work done so far. For questions or to hand off next tasks, review the `postman` collection, `src/pages/MapEditorPage.tsx`, and `api/server.ts` first.

---
Last update: 2025-11-05
