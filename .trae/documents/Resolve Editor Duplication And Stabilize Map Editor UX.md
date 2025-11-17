## Findings
- Active editor path: `pages/admin/MapEditor.jsx` → lazy-imports `components/FloorplanEditor.jsx` → uses `components/DevScaffoldFloorplanEditor.jsx` → imports `components/FloorplanCanvas.jsx`.
- Duplicate components exist under `components/scaffold/` (e.g., `scaffold/FloorplanCanvas.jsx`, `scaffold/ImageUploader.jsx`, `scaffold/POIForm.jsx`). Only `ImageUploader` and `POIForm` are intentionally imported from `scaffold/`. The canvas used by the Map Editor is the top-level `components/FloorplanCanvas.jsx`.
- This duplication can cause confusion when edits are made to the scaffold canvas instead of the active canvas. Similar risks exist for other “2.ts” duplicate files under `api/*` (e.g., `auth 2.ts`, `supabase 2.ts`) and `_deprecated/` folders.
- A 404 on `navigation_points` indicates the table may not exist in your live Supabase project or is under a different schema; the editor should guard against this.

## Plan
### 1) Unify Editor Imports
- Ensure `DevScaffoldFloorplanEditor.jsx` consistently imports the active canvas: `./FloorplanCanvas` (already correct). Add a header comment clarifying the active paths and that `scaffold/*` contains only helper components (ImageUploader, POIForm). 
- Audit for any other references to `scaffold/FloorplanCanvas.jsx`; replace with `./FloorplanCanvas` if found.

### 2) Stabilize Canvas UX
- Keep all zoom/pan/fit logic in `components/FloorplanCanvas.jsx`:
  - Visible toolbar with Zoom In/Out and Reset View.
  - Fit-to-viewport on image load and when pressing Reset.
  - Wheel zoom (cursor-centered) and Alt+drag/middle-button pan.
- Add defensive placeholder when image URL fails to load.

### 3) Event Linking And Save
- Require event selection/paste before saving a floorplan; save with both `event_id` and `user_id` to satisfy NOT NULL constraints.
- In the setup modal, populate the event dropdown (organizer’s events) and mirror the selected event in the editor header.

### 4) Guard Missing Tables
- Wrap `navigation_points` fetch in a safe guard: if 404 or table missing, log and continue without blocking the editor.
- Optional: add a small “No POIs yet” indication when none are present.

### 5) Reduce Duplication Confusion
- Add header comments to duplicated files (e.g., `components/scaffold/*`) marking them as helpers only.
- Remove or archive the `* 2.ts` duplicates under `api/` to avoid accidental imports; keep the canonical files (`auth.ts`, `supabase.ts`) in use.
- Keep `_deprecated/` ignored; add a note that it is not part of the active app.

### 6) Validation
- Hard reload the app and verify:
  - Event dropdown shows your manual event.
  - Upload floorplan with event selection saves to DB; image renders.
  - Zoom/pan toolbar is visible; Reset fits the image.
  - Add QR node (`test-qr-1`) and confirm insert in `map_qr_nodes`.
  - Staff scanner flow works (fetch lead → save → toast).

## Outcome
- Clear, single source of truth for the canvas component.
- Predictable editor behavior with visible controls.
- No confusion from scaffold duplicates or `* 2.ts` files.
- End-to-end flows aligned with MVP acceptance criteria.
