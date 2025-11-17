## Scope
- Add an explicit QR Calibration mode and guidance in Map Editor.
- Keep storage and graph JSON approach; no new complex migrations.
- Deliver Admin Setup and Staff Lead Capture flows end-to-end.

## UI Changes (Map Editor)
- Add mode: `calibrate` alongside `poi`, `node`, `draw-path`.
- Calibration panel:
  - Event selector (pre-filled from header)
  - Input `QR Code ID`
  - Instruction: “Click on the floorplan where this QR physically sits”
  - Success banner with `(x, y)`; list existing calibrations for the selected Event.
- Mode hints under toolbar:
  - `calibrate`: placement instructions
  - `draw-path`: “Click to create connected segments; routing requires segments”
- Export visibility:
  - After Save (server), show map JSON public URL and a “Download JSON” button.

## Backend (Lightweight)
- Add list endpoint: `GET /api/editor/qr-nodes?event_id=<uuid>`
  - Returns `{ qr_id_text, x_coord, y_coord, created_at }` for the Event.
- Keep existing `POST /api/editor/qr-node` for saving calibrations.

## Data Flow
- Floorplan saved with `event_id` + `user_id` (already wired).
- Calibration: click in `calibrate` mode calls `POST /api/editor/qr-node` with `{ event_id, qr_id_text, x_coord, y_coord }`.
- Paths: `draw-path` auto-connects segments; manual `segment` connects nodes.
- Export: Save (server) writes `{ nodes, segments, pois }` JSON to `floorplans/maps/<floorplan_id>.json` (public).

## Attendee Navigation (PWA)
- Scan QR → lookup `map_qr_nodes` by Event + `qr_id_text` → get `(x, y)`.
- Snap to nearest node from `maps/<floorplan_id>.json`.
- Run Dijkstra/A* over segments; render route; optional AR-lite marker anchored by QR.

## Verification
- Admin: upload floorplan, calibrate `test-qr-1`, see calibration list, draw connected paths, Save (server).
- Staff: fetch ticket in Lead Scanner, save lead, success toast; restricted Layout verified.

## Out of Scope (MVP Lock)
- No Quicket event sync.
- No relational nodes/segments migrations now.
- No separate staff-mobile app.

## Delivery
- Implement UI changes and list endpoint.
- Validate both flows and share exact screen steps and DB rows to confirm Done.