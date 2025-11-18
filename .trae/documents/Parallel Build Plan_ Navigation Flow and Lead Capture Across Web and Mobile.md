## Pivot Acknowledgement

We will develop `dpm-web`, `attendee-mobile`, and `staff-mobile` in parallel to deliver two end‑to‑end MVP flows: Navigation (web ↔ attendee) and Lead Capture (web ↔ staff). Scope remains locked to MVP features already scaffolded.

## How Navigation Works (Scan → Position → Route)

1. Scan QR: Attendee scans a “You Are Here” QR; the app reads `qr_id_text` and uses the current `event_id`.
2. Calibrate: Fetch `GET /api/editor/qr-nodes?event_id=<id>`; find the matching `qr_id_text` to get `(x_coord, y_coord)` on the floorplan.
3. Floorplan & Graph: Load `floorplans.image_url` and `floorplans/maps/<floorplan_id>.json` (nodes + segments + pois).
4. Blue Dot: Place a dot at `(x,y)` and snap to the nearest node in the graph.
5. Route: When a POI is selected, run Dijkstra/A\* from the snapped node to the POI’s nearest node; render a polyline overlay on the floorplan image.

## Data Contracts

* `map_qr_nodes(event_id, qr_id_text, x_coord, y_coord, created_at)`

* `floorplans(image_url, event_id, user_id)` and graph JSON: `{ nodes[{id,x,y}], segments[{id,start_node_id,end_node_id}], pois[{id,name,type,x,y}] }`

* `qualified_leads(event_id|null, staff_user_id, lead_name, lead_email, scanned_at)`

## Parallel Tasks (Immediate)

### dpm-web (Admin/Backend)

* Map Editor

  * Confirm event selection, floorplan upload (public URL), QR calibration save to `map_qr_nodes`.

  * Confirm draw‑path creates connected segments; Save (server) exports graph JSON and shows the public URL.

* Settings & Edge Function

  * Save Quicket API key on `/settings` with toast; verify edge function `get-quicket-lead` returns `{name,email}` with `Authorization` and `X-Quicket-Api-Key`.

* Auth & CORS

  * Ensure `/api/auth/set-role` works (token or dev fallback), and CORS includes local/tunnel origin.

### attendee-mobile

* Env/Auth

  * Wire Supabase with repo’s URL + anon key; minimal login (email/password) or anonymous mode (MVP) per current app structure.

* ScannerScreen

  * Implement QR scan (Expo Camera/BarcodeScanner), parse `qr_id_text`.

  * Fetch calibrations: `GET /api/editor/qr-nodes?event_id=<id>`; find `(x,y)` for the scanned QR.

* MapScreen

  * Load floorplan image and graph JSON.

  * Show blue dot at `(x,y)`; snap to nearest node; render route to selected POI using Dijkstra/A\* over `segments`.

* DirectoryScreen

  * List POIs (from `navigation_points` if present, else from graph JSON); tap → route.

### staff-mobile

* Env/Auth

  * Wire Supabase; staff login with same auth as web.

* ScannerScreen

  * Scan or enter ticket; call edge function `get-quicket-lead` with headers: `Authorization: Bearer <access_token>`, `X-Quicket-Api-Key`.

* QualifyLeadScreen

  * Display `{name,email}`; save to `qualified_leads` via Supabase REST/Client with `staff_user_id` and `scanned_at`.

## Acceptance Criteria

* Navigation Flow

  * Admin calibrates at least two QR nodes and saves graph JSON.

  * Attendee scans QR → blue dot appears at correct `(x,y)`; route renders to a POI.

* Lead Capture Flow

  * Staff logs in; scanning a ticket returns `{name,email}`; “Save Lead” inserts into `qualified_leads`; toast confirms.

## Monetization Positioning (Lecturer Feedback Aligned)

* MVP monetization is B2B: organizer/sponsor pays for ROI reporting (not attendee paywalls).

* What the MVP proves:

  * Navigation usage (blue‑dot position + route starts/finishes) and engagements at POIs (optional counters/dwell later).

  * Explicit ROI via `qualified_leads` (name/email captured by staff).

* Pricing remains in packages (Pilot/Pro/Enterprise); MVP focuses on proving data value, not attendee monetization.

## Timeline (Parallel)

* Day 0–1: Wire mobile env/auth; validate dpm‑web endpoints and edge function.

* Day 1–2: Implement attendee QR → position → route; implement staff ticket → lead save.

* Day 2: End‑to‑end tests across all three apps; tighten UX; demo.

## Risks & Mitigations

* Missing `navigation_points`: use POIs in export JSON until table exists.

* Token timing for role upsert: session guard in client; dev fallback on server.

* CORS mismatches: keep localhost/tunnel origins whitelisted.

## Deliverables

* Working Navigation Flow (web ↔ attendee) with calibration and routing.

* Working Lead Capture Flow (web ↔ staff) with shared edge function and table.

* Short validation checklist for demo (scan QR → route; scan ticket → save lead).

