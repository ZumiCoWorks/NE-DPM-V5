# Attendee App — Web PWA or Expo Go

This folder contains the attendee-facing app. You can ship the MVP as a web app (PWA) with no store approvals, or run the same experience via Expo Go for pilot distribution.

## Options

- Web PWA (recommended for pilots)
- Expo Go (public-facing alternative; users install Expo Go)

## Data Model and Sources

- Floorplan image: `floorplans.image_url`
- POIs: `navigation_points` filtered by `floorplan_id`
- QR calibration: `map_qr_nodes` per `event_id`
- Graph JSON snapshot: `floorplans/maps/<floorplan_id>.json` (nodes, segments, pois)

These are produced by the organizer using the `dpm-web` editor:
- Upload floorplan image
- Add POIs and QR calibrations
- Save the map graph (nodes/segments/pois) to Storage

## Web PWA Approach

- Camera + QR: use `getUserMedia` and a JS QR library (e.g., `qr-scanner`, `jsQR`) to read QR codes for location anchoring
- Routing: fetch `maps/<floorplan_id>.json`, build adjacency from `segments`, compute route (Dijkstra/A*), render a polyline over the floorplan image
- POIs: fetch from `navigation_points` (via API) and present tappable targets
- AR-lite: overlay directional markers on the camera feed anchored by QR scans; skip WebXR for MVP
- Auth: use Supabase session (same credentials as `dpm-web`) for protected routes; graph JSON can be public Storage URL

### PWA Quick Start

- Integrate attendee screens under `dpm-web` (easiest path):
  - Create `Scanner`, `Map`, and `Directory` pages; reuse routes and Supabase client
  - Use `VITE_API_URL` to call editor/POI endpoints
- Or build a standalone PWA in this folder using your preferred bundler (Vite/Next) and point to the same API

## Expo Go Approach

- Pros: no App Store review, fast pilot distribution
- Cons: requires Expo Go app, limited native modules

### Expo Go Quick Start

- Install dependencies: `npm install`
- Start in tunnel mode (easiest for devices): `npx expo start --tunnel`
- Scan the QR with Expo Go to open the app

### Expo Web (for PWA-like testing)

- Run: `npx expo start --web`
- Build static web: `npx expo export:web`

## Environment and Config

- API base for attendee app: `http://localhost:3001/api` during local dev
- Supabase project URL and anon key: reuse from `dpm-web/.env.local`
- Public Storage URL for graph JSON:
  - `https://<project-ref>.supabase.co/storage/v1/object/public/floorplans/maps/<floorplan_id>.json`

## Data Fetching

- Floorplan image: read directly from `image_url`
- POIs: `GET` via API (or Supabase client) for `navigation_points` where `floorplan_id = <id>`
- Graph JSON: fetch the public URL (no auth needed), or use Supabase storage client
- QR calibration: optional read from `map_qr_nodes` for event context; the organizer sets anchors per event

## Navigation Flow (MVP)

1. Load floorplan image and POIs for the selected floorplan
2. Load graph JSON and build adjacency list from `segments`
3. Scan QR to anchor user location; snap to nearest node
4. Compute route to the target POI (nearest node) using Dijkstra/A*
5. Render the path on map; optionally overlay directional markers on camera feed (AR-lite)

## Validation and Metrics

- Route success rate and time-to-POI
- POI visits and dwell time (engagement)
- Staff scans (leads) from the companion staff app

## Notes

- For pilots, prefer the Web PWA inside `dpm-web` to avoid App Store delays
- Keep Expo Go as a fallback when device APIs beyond web are needed
- Use authenticated API calls for editor actions; map JSON can remain public for faster mobile consumption
