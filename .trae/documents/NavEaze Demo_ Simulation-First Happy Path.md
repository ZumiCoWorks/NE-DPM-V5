## Objectives
- Keep attendee demo live: compute navigation paths at runtime.
- Apply your brand colors and logo for a finished, non-dev look.

## Live Pathfinding (Minimal Changes)
- Client-side compute: reuse Dijkstra from `DevScaffoldFloorplanEditor` to compute shortest paths.
- Graph source: fetch floorplan graph JSON (nodes + segments + POIs) from a stable Supabase Storage URL saved via `POST /api/editor/map`.
- Attendee flow in `dpm-web/src/pages/mobile/AttendeePWA.tsx`:
  1) On QR scan, read `(x,y)` from `/api/editor/qr-nodes?event_id=...&qr_code_id=...`.
  2) Find nearest graph node to `(x,y)`.
  3) When destination is selected, resolve its nearest node.
  4) Run Dijkstra → `nodePathToCoords` → set `highlightPath`.
  5) Render path using `FloorplanCanvas` (already supports `highlightPath`).
- Shared module: extract helpers into `src/lib/pathfinding.ts` to avoid duplication.

## Branding Integration (Using Your SVG)
- Logo: use `/Users/zumiww/Documents/NE DPM V5/PGDI8 [Recovered].svg`.
  - Copy to `dpm-web/public/nav-eaze-logo.svg` for easy serving.
  - Place in header: `dpm-web/src/components/Layout.tsx` brand block.
- Color palette (from your SVG):
  - Primary: `#ed1c24`
  - Darker: `#b2151b`
  - Deep: `#770e12`
  - Deepest: `#3b0709`
  - Neutrals: `#000`, `#fff`
- Quick UI updates (no Tailwind config required):
  - Replace `bg-blue-600` with `bg-[#ed1c24]` and hover `bg-[#b2151b]`.
  - Replace `text-blue-600`, `focus:ring-blue-500` with `text-[#ed1c24]`, `focus:ring-[#ed1c24]`.
  - Apply to AttendeePWA primary buttons, tab active states, and key headers.

## Touch Points
- `dpm-web/src/components/DevScaffoldFloorplanEditor.jsx` → extract pathfinding helpers.
- `dpm-web/src/components/FloorplanCanvas.jsx` → already renders `highlightPath`.
- `dpm-web/src/pages/mobile/AttendeePWA.tsx` → fetch graph, compute path, render.
- `dpm-web/src/components/Layout.tsx` → brand logo in header.
- `dpm-web/public/` → add `nav-eaze-logo.svg`; optional: `floorplan.json` fallback if storage URL is not ready.

## Verification
- Start client → scan → select destination → path draws → steps update → success badge shows.
- Visual check: brand red applied to key UI, logo visible in header.

## Inputs Needed
- Floorplan graph JSON URL for the event demo (from the editor save).
- Confirmation to place the SVG into `dpm-web/public/nav-eaze-logo.svg` for serving.

Approve to proceed and I’ll wire up live pathfinding and apply your brand colors/logo immediately.