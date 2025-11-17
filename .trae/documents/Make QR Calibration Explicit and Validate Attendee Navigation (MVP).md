## Current Calibration Behavior
- Calibration writes to `map_qr_nodes` when you are in `node` mode, have selected an Event, and have entered a QR Code ID. The click on the floorplan saves `{ event_id, qr_id_text, x_coord, y_coord }`.
- This exists but is not discoverable enough; there’s no dedicated “Calibrate” UX and no list of existing calibrations.

## What We’ll Implement (No scope creep; MVP only)
### 1) Calibration UX
- Add a clear “Calibrate QR” mode next to `poi`, `node`, `draw-path`.
- Show a small panel with:
  - Event selector (pre-filled from header)
  - Input: `QR Code ID` (e.g., `test-qr-1`)
  - Short instructions: “Click on the floorplan where this QR is physically placed”
  - Save banner on success (with the exact saved coordinates)
- Add a read-only list of existing calibrations for the selected Event with: `qr_id_text`, `x_coord`, `y_coord`.
- Validation: disable save if Event is not selected or QR ID empty.

### 2) Editor Guidance (No new features, just clarity)
- Show mode hints under the toolbar:
  - `calibrate`: “Click to place calibration for the QR ID”
  - `draw-path`: “Click to create connected segments; paths require segments”
- Keep segments as JSON for routing; no new tables needed.

### 3) Data Model (Existing)
- `map_qr_nodes`: `{ event_id uuid, qr_id_text text, x_coord int, y_coord int, created_at timestamptz }`
- `floorplans`: already saved with `event_id` and `user_id`.
- Graph JSON: `{ nodes, segments, pois }` saved to Storage for client-side routing.

### 4) Attendee PWA Navigation Logic (How it uses calibration)
- On scan: read QR Code ID → fetch `map_qr_nodes` for the current Event → obtain `(x_coord, y_coord)`
- Snap to nearest node in the loaded graph (from `maps/<floorplan_id>.json`)
- Compute route to target POI using Dijkstra/A* over segments
- Render route over the map; optionally overlay AR-lite markers anchored by the QR position

### 5) Verification Steps
- Admin:
  1. Select Event, upload floorplan
  2. Switch to `calibrate`, enter QR Code ID, click on floorplan
  3. See success banner + calibration in the list; verify row in `map_qr_nodes`
  4. Switch to `draw-path`, click to make connected segments; Save (server)
- Attendee PWA (simulation in web):
  1. Simulate scan by entering QR Code ID
  2. Confirm position snap to nearest node
  3. Select POI; route appears

### 6) Limitations (Conscious MVP choices)
- POIs persistence is optional; if `navigation_points` doesn’t exist, include POIs in the JSON export only
- No Quicket event sync; event creation remains manual

## Outcome
- Clear calibration UX that explicitly ties digital coordinates to real QR placement
- Validated attendee navigation flow using the saved graph JSON and calibration anchors
- Entirely within current MVP scope; no new complex migrations or Storage policy changes