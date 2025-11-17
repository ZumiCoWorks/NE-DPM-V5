## Issue
- Runtime error: `ReferenceError: image is not defined` in `src/components/FloorplanCanvas.jsx` around the toolbar/zoom logic.
- This prevents the canvas from rendering; also saw 404s for `navigation_points` which should be non-blocking.

## Root Cause
- Event handlers (`zoomTo`, possibly `fitToViewport`) and conditional placeholders reference `image` without guarding for null/undefined; when the image isn’t yet loaded or failed, those paths still execute and break.

## Plan
### 1) Defensive Guards in FloorplanCanvas
- In `zoomTo(nextScale)`: if `!image`, compute stage centering using `stageDimensions` only; never read `image.width/height` when missing.
- In `fitToViewport()`: early return if `!image`; ensure default `stageDimensions` are set even before image loads.
- In toolbar handlers: call `zoomTo` which includes guards; never reference `image` directly.
- In placeholder rendering: no `image` references; only use `stageDimensions`.
- In wheel/pan handlers: null-check `stageRef.current` and pointer; guard scale math.

### 2) Initial Dimensions
- On mount, set a sensible default viewport (`stageDimensions = { width: 900, height: 600 }`) even before the image resolves.
- When image loads, fit and center; otherwise render placeholder.

### 3) Non-blocking POI Fetch
- Wrap `navigation_points` fetch in try/catch; if 404, skip and do not log as error (or log once as info). The editor should still load.

### 4) Verify and Test
- Hard reload `/admin/map-editor`.
- Confirm:
  - No runtime errors.
  - Toolbar visible; Reset view fits the image; zoom/pan works.
  - Upload floorplan with event selection saves to DB (with `event_id` and `user_id`).
- If `navigation_points` table doesn’t exist, the editor still renders without POIs.

## Outcome
- Stable canvas with visible controls and robust guards.
- No crashes when image isn’t ready.
- Editor functions for the MVP acceptance flows.
