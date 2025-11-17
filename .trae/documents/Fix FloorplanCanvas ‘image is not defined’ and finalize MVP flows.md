## Problem
- Runtime error: `ReferenceError: image is not defined` in `src/components/FloorplanCanvas.jsx` (around toolbar/zoom handlers). This prevents the Map Editor canvas from rendering.
- Cause: helper functions reference `image.width/height` even when `image` hasn’t loaded yet (null) or the closure has stale bindings.

## Fix Plan
### 1) Make image size explicit and guarded
- In `src/components/FloorplanCanvas.jsx`:
  - Add `const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null)`.
  - In the `useImage` load effect: when `image` is truthy, set `imgSize = { width: image.width, height: image.height }`.
  - Update `fitToViewport` and `zoomTo` to use `imgSize` instead of `image`; if `imgSize` is null, use `stageDimensions` only, and skip centering against image dimensions.
  - Guard all handlers (wheel/pan) from accessing `image` directly; use `stageRef.current` and state.
  - Keep placeholder rendering based only on `stageDimensions` so it never touches `image`.

### 2) Initialize safe defaults
- Set a default viewport (`stageDimensions = { width: 900, height: 600 }`) before image loads.
- On `Reset view`, if `imgSize` is missing, just center the stage and keep scale at 1.

### 3) Non‑blocking POIs fetch
- In `DevScaffoldFloorplanEditor.jsx`, wrap `navigation_points` fetch in try/catch and treat 404/missing table as empty result (no console error spam). The editor should continue without POIs.

### 4) Verify editor UX end‑to‑end
- Hard reload `/admin/map-editor`.
- Confirm:
  - No runtime errors.
  - Toolbar visible; zoom in/out and Reset view work.
  - Upload floorplan with selected event saves to DB with `event_id` and `user_id`; image renders.
  - Add QR node (`test-qr-1`) and verify insert in `map_qr_nodes`.

### 5) MVP flows completion
- Admin flow: register/login, role selection, settings save, event create, floorplan upload and calibration — verified.
- Staff flow: restricted Layout shows Lead Scanner, fetch ticket via edge function, save lead to `qualified_leads` with success toast — verified.

## Outcome
- Stable Map Editor canvas with guarded image access.
- No crashes when image is not yet loaded.
- Both MVP flows pass acceptance checks.
