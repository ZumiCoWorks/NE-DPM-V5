## Scope Lock
- Only complete two flows in `dpm-web`: Admin Setup and Staff Lead Capture.
- No Quicket event sync; event creation is manual.
- The “Staff App” is a web page inside `dpm-web` (StaffScannerPage). No separate mobile app.

## Flow 1: Admin Setup Journey
### A. Auth and Role Enforcement
- Verify register → login works and redirects to role selection when `profiles.role` is missing.
- Ensure role selection persists to `profiles` via existing backend route (`/api/dev/set-role` in dev or Supabase upsert in prod).
- Confirm Admin users can access Admin-only pages.

### B. Settings: Quicket API Key
- Use existing endpoints:
  - `GET /api/settings/quicket-key` to load saved key
  - `PUT /api/settings/quicket-key` to save key (with toast on success)
- Ensure SettingsPage.tsx calls these endpoints and shows user feedback.

### C. Event Creation (Manual)
- In `CreateEventPage.tsx`, ensure the payload includes both time and date fields.
- Confirm a minimal insert works with required columns and navigates to Events.
- Add basic validation (name required; venue optional for MVP); show toast on success/failure.

### D. Map Calibration (Critical)
- In `MapEditor.jsx`, wire QR node creation to the server route:
  - `POST /api/editor/qr-node` with `{ event_id, qr_id_text, x_coord, y_coord }`
- UI actions:
  - Input: Event ID
  - Input: QR Code ID (`test-qr-1`)
  - Mode: Draw Node; click map to add
- Persist calibration; confirm row in `map_qr_nodes`.

### E. Verification for Flow 1
- Register and set Admin role.
- Save Quicket API key; verify toast.
- Create event manually; verify it appears in Events list.
- Calibrate map: add `test-qr-1`, verify insert in `map_qr_nodes`.

## Flow 2: Staff Lead Capture Journey (Web)
### A. Auth and Role Enforcement
- Register a new user; set role to `staff`.
- On login, force role selection if missing; set `staff` in `profiles`.

### B. Restricted View
- Update `Layout.tsx` to:
  - Hide Admin pages (Map Editor, Settings) for `staff`
  - Show Lead Scanner link for `staff`

### C. Lead Capture Page (StaffScannerPage)
- Page behavior:
  - Input Ticket ID
  - Fetch attendee using backend Quicket proxy route
    - Use `api/routes/quicket.ts` or a dedicated endpoint calling the edge function `get-quicket-lead`
    - Use organizer’s stored Quicket API key (from `profiles.quicket_api_key`) or current user’s key
  - Display Name/Email on success
  - “Save Lead” persists to `qualified_leads` via `supabaseAdmin` (`insert` + toast)
- Data stored: `{ event_id, staff_user_id, lead_name, lead_email }` (plus timestamp)

### D. Verification for Flow 2
- Login as staff; confirm Layout shows Lead Scanner only.
- Enter Ticket ID; Fetch displays Name/Email from Quicket.
- Save Lead; confirm insert into `qualified_leads` and toast shows success.

## Shared Infrastructure & Policies
- Auth middleware accepts Supabase access tokens and sets `req.user` even if `profiles` lookup is blocked.
- Storage/Editor routes already exist:
  - `/api/storage/upload/floorplan` (service role, creates `floorplans` bucket)
  - `/api/editor/poi`, `/api/editor/qr-node`, `/api/editor/map`
- RLS:
  - `map_qr_nodes` tightened to admin-only (via `profiles.role`)
  - `qualified_leads` allows authenticated inserts

## Testing Plan
- Manual acceptance tests per steps above
- Smoke tests:
  - Health: `GET /api/health`
  - Settings save → read round-trip
  - Event insert and subsequent list/select
  - QR node insert and read-back from `map_qr_nodes`
  - Staff lead save and read-back from `qualified_leads`

## Deliverables
- Working Admin Setup flow with toasts, inserts, and QR calibration.
- Working Staff Lead Capture page wired to Quicket fetch and lead saving.
- Role-based UI restrictions verified.

## Execution Notes
- No new features beyond this scope.
- Use current `dpm-web` routes and Supabase project.
- If a page or route is missing (e.g., StaffScannerPage), create it minimally and wire it to existing infrastructure.
- Confirm when both flows pass all acceptance criteria without errors.
