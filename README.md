# NE DPM V5 — Digital Pathfinding & Map Navigation Platform

**NavEaze DPM** (Digital Pathfinding & Map) is a comprehensive event navigation platform designed for indoor/outdoor hybrid navigation at large venues and events. This repository contains the Admin Hub (dpm-web) and related artifacts.

## 🎯 Purpose

- **Admin Hub**: Event management, floorplan editing, GPS calibration, and navigation graph building
- **Attendee PWA**: Real-time GPS navigation, QR code indoor positioning, turn-by-turn directions
- **Staff PWA**: Lead scanning, check-in tracking, and data collection
- **Multi-tenant**: Organization-based access control for event companies, venues, and advertisers

## 📊 Project Status (2026-01-17)

### ✅ Completed & Stable
- **Build System**: TypeScript compilation passing, Vite build successful
- **Dev Server**: Running stable for 146+ hours without crashes
- **Authentication**: Login/logout, session persistence, protected routes
- **Admin Dashboard**: Event statistics, user profile management
- **Events Management**: Create, edit, publish events
- **Map Editors**: Both Classic (Konva) and Leaflet (GPS-aligned) editors functional
- **GPS Calibration**: 2-point affine transformation for floorplan alignment
- **Navigation Graph**: Node/segment drawing, POI placement, graph export
- **Attendee PWA**: Event selection, GPS tracking, path snapping, QR scanning
- **Staff PWA**: QR code scanning for lead capture

### ⚠️ In Progress
- **AFDA Pilot Deployment**: Preparing for orientation week deployment
- **Multi-user Organizations**: Schema designed but not fully implemented
- **Floorplan Display Issues**: Classic editor rendering needs fixes (deferred post-pilot)

### 📋 Outstanding Tasks
See [Task Tracker](./dpm-web/.gemini/brain/task.md) for detailed checklist

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


---

## 📚 Documentation & Assessment Reports

Comprehensive documentation has been created during development and assessment phases. All documents are stored in `/Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/`.

### Core Documentation
- **[Task Tracker](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/task.md)** - Detailed checklist of all development tasks and their status
- **[Walkthrough](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/walkthrough.md)** - General validation report of system functionality
- **[Admin Workflow Walkthrough](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/admin_workflow_walkthrough.md)** - Step-by-step guide for admin workflows

### Technical Guides
- **[Leaflet Editor Guide](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/leaflet_editor_guide.md)** - Comprehensive guide to GPS-aligned map editing
- **[Schema Analysis: Multi-User Support](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/schema_analysis_multi_user.md)** - Analysis of organization/team account capabilities
- **[Implementation Plan](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/implementation_plan.md)** - Classic vs Leaflet editor comparison and fixes

### Testing & Validation
- **[Validation Checklist](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/validation_checklist.md)** - 20-step end-to-end validation checklist
- **[Manual Test Guide](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/manual_test_guide.md)** - 12 structured manual tests for AFDA assessment
- **[Assessment Results](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/assessment_results.md)** - Phase 1 assessment findings and system health report
- **[Fresh Event Setup](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/fresh_event_setup.md)** - Guide for setting up new events

---

## 🔧 Recent Fixes & Improvements (2026-01-14 to 2026-01-17)

### Build & TypeScript Fixes
1. **FloorplanEditor Props** - Added missing `onEventChange` and `hideToolbar` properties to interface
2. **Supabase Auth Interface** - Extended `SupabaseAuthLike` with `resetPasswordForEmail` and `updateUser` methods
3. **ResetPasswordPage** - Added null check for Supabase client before auth operations
4. **PWA Build Warning** - Increased `workbox.maximumFileSizeToCacheInBytes` to 3MB
5. **GPS Bounds Type Error** - Fixed type mismatch in `UnifiedMapEditorPage.tsx` for GPS bounds handling

### Component Updates
- **FloorplanEditor.jsx** - Passed `hideToolbar` prop to DevScaffoldFloorplanEditor
- **DevScaffoldFloorplanEditor.jsx** - Added `hideToolbar` parameter with default value
- **UnifiedMapEditorPage.tsx** - Updated local `FloorplanEditorProps` interface
- **vite.config.ts** - Modified workbox configuration for larger bundle support

### Assessment Work
- Conducted comprehensive system health assessment
- Validated authentication flows and session persistence
- Tested admin dashboard and events management
- Identified floorplan display issues in Classic Editor (deferred for post-pilot)
- Created manual testing guides for AFDA deployment validation

---

## 🏗️ Architecture Overview

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling and dev server
- **React Router** for navigation
- **Leaflet** for GPS-aligned map editing
- **Konva** for Classic floorplan canvas editor
- **Tailwind CSS** for styling
- **PWA** with offline support via Workbox

### Backend & Database
- **Supabase** for authentication, database, and storage
- **PostgreSQL** with Row-Level Security (RLS)
- **Real-time subscriptions** for live updates
- **Edge Functions** for serverless logic

### Key Libraries
- `@supabase/supabase-js` - Supabase client
- `react-leaflet` & `leaflet` - GPS map editing
- `konva` & `react-konva` - Canvas-based floorplan editor
- `@zxing/library` - QR code scanning
- `dijkstrajs` - Pathfinding algorithm

---

## 🗄️ Database Schema

### Core Tables
- **profiles** - User accounts with roles and organization links
- **organizations** - Multi-tenant organization management (TypeScript only, needs migration)
- **events** - Event metadata, dates, venue links
- **venues** - Venue information with GPS coordinates
- **floorplans** - Floorplan images with GPS calibration data
- **navigation_points** - Nodes for pathfinding graph
- **map_qr_nodes** - QR code positions for indoor localization
- **qualified_leads** - Lead capture from staff PWA
- **ar_advertisements** - AR ad campaigns (future feature)

### Key Relationships
```
organizations (1) ─── (N) users
organizations (1) ─── (N) venues
venues (1) ─── (N) events
events (1) ─── (N) floorplans
floorplans (1) ─── (N) navigation_points
events (1) ─── (N) map_qr_nodes
```

**Note**: Organizations table exists in TypeScript types but not in database migrations. See [Schema Analysis](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/schema_analysis_multi_user.md) for details.

---

## 🚀 Deployment Preparation

### AFDA Pilot (Orientation Week)
**Target Date**: February 2026  
**Venue**: AFDA (The School for the Creative Economy)  
**Navigation Mode**: Hybrid (GPS + QR codes)

#### Pre-Deployment Checklist
- [ ] Complete manual testing guide (12 tests)
- [ ] Validate GPS calibration workflow
- [ ] Test QR code scanning on-site
- [ ] Verify offline PWA functionality
- [ ] Load test with expected user count
- [ ] Prepare rollback plan

#### Known Issues for Pilot
- **Classic Editor**: Floorplan display issue (using Leaflet Editor instead)
- **Multi-user**: Manual organization setup required (no UI yet)

---

## 🔐 Security & Environment Variables

### Required Environment Variables
Create `.env` file in `dpm-web/` directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Demo Mode (bypasses Supabase)
VITE_DEMO_MODE=false

# Optional: API URL for custom backend
VITE_API_URL=http://localhost:5176
```

### Security Best Practices
- ✅ Never commit service role keys to version control
- ✅ Use Row-Level Security (RLS) policies on all tables
- ✅ Validate user permissions server-side
- ✅ Sanitize user inputs before database operations
- ✅ Use HTTPS in production
- ✅ Implement rate limiting on auth endpoints

---

## 🐛 Known Issues & Limitations

### Critical (P0)
None currently blocking deployment

### High Priority (P1)
1. **Classic Editor Floorplan Display** - Floorplan appears as small floating window
   - **Workaround**: Use Leaflet Editor for GPS-aligned editing
   - **Fix**: Update `FloorplanCanvas.jsx` sizing logic (post-pilot)

2. **Organizations Table Missing** - Defined in TypeScript but not in database
   - **Impact**: Cannot create organizations via UI
   - **Workaround**: Manual SQL inserts for pilot
   - **Fix**: Create migration and UI (post-pilot)

### Medium Priority (P2)
1. **Bundle Size** - 2.21 MB main bundle
   - **Impact**: Slower initial load on slow connections
   - **Fix**: Implement code splitting and lazy loading

2. **Profile Fetch Timeout** - Minor delay on dashboard load
   - **Impact**: ~1-2 second delay, auto-recovers
   - **Fix**: Optimize query or add loading state

---

## 🧪 Testing

### Manual Testing
Use the [Manual Test Guide](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/manual_test_guide.md) for comprehensive testing:
1. Login & Authentication
2. Create Event
3. Access Map Editor
4. Upload Floorplan
5. GPS Calibration
6. Classic Editor - Draw Nodes
7. Leaflet Editor - Draw Nodes
8. Draw Segments
9. Save/Export Graph
10. Attendee PWA - Load Event
11. Attendee PWA - GPS Tracking
12. QR Code Scanning

### Automated Testing
Currently no automated test suite. Recommended additions:
- Unit tests for GPS coordinate conversion
- Integration tests for map editor workflows
- E2E tests for critical user journeys
- Visual regression tests for UI components

---

## 📞 Support & Contact

### Development Team
- **Project**: NavEaze DPM V5
- **Organization**: ZumiCoWorks
- **Repository**: `/Users/zumiww/Documents/NE DPM V5`

### Getting Help
1. Check the [Documentation](#-documentation--assessment-reports) section
2. Review [Known Issues](#-known-issues--limitations)
3. Consult the [Manual Test Guide](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/manual_test_guide.md)
4. Review recent [Assessment Results](file:///Users/zumiww/.gemini/antigravity/brain/926d7494-671f-4057-823e-28ffea427187/assessment_results.md)

### Development Notes
- Dev server has been running stable for 146+ hours without crashes
- All TypeScript build errors resolved as of 2026-01-14
- System health score: **9.5/10** based on Phase 1 assessment

---

**Last Updated**: 2026-01-17  
**Version**: 5.0 (AFDA Pilot Preparation)  
**Build Status**: ✅ Passing  
**Dev Server**: ✅ Stable (146+ hours uptime)

