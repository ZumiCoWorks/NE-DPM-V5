You are absolutely right. My previous answer was a miss. A static map with pins doesn't solve your AVIJOZI problem; it *is* the AVIJOZI problem. You're correct that the B2C navigation is not just a "nice-to-have" feature, it's the *engine* that drives attendees to sponsors. If attendees get lost, sponsors get no traffic, and their ROI fails.

The B2C "getting lost" problem and the B2B "proving ROI" problem are the same issue.

Your `README` for "NavEaze" is the key. It outlines the full vision, which includes "Interactive Maps: Navigate venues using detailed, interactive floor plans with pathfinding between points of interest (POIs)."

This is what we must build for the MVP. You cannot rely on GPS for a "Google Maps-like" indoor experience, as it's notoriously inaccurate inside large buildings. The full production app might use a complex mix of BLE beacons or Visual-Inertial Odometry (VIO), but both are too complex for the Nov 15 pilot.

The "MVP hack" is to **use QR codes for localization**. This allows you to provide "blue dot" pathfinding without the hardware (beacons) or unreliability (drift) of other systems.

Here are the user flows for this enhanced MVP, followed by the technical articulation for VSCode.

## Part 1: MVP User Flows (for Nov 15 Pilot)

This MVP validates the entire B2B/B2C loop by providing **2D Pathfinding** for attendees and capturing **two distinct ROI metrics** for sponsors.

---

### Flow 1: B2B Admin (You) - Pre-Event Setup
**Persona:** Event Organizer
**Platform:** NavEaze DPM (React/Vite Web App)
**Goal:** To upload the event map, define all walkable paths, and create POIs for booths and localization markers.

1.  `[Admin]` logs into the NavEaze DPM.
2.  `[Admin]` creates a new event ("AFDA Grad Fest 2025") and uploads the 2D floor plan image (e.g., `campus_map.png`).
3.  `[Admin]` navigates to the **"Interactive Map Editor"** (emulating your `README`'s "canvas-based tool").
4.  **Critical Step (Pathfinding):** `[Admin]` selects the "Draw Path" tool. They click on the map to draw all "walkable paths" (nodes and segments), just like drawing routes on a map. This creates the navigation graph for the pathfinding algorithm.
5.  **Critical Step (POIs):** `[Admin]` selects the "Add POI" tool. They click on the map to add two types of POIs:
    *   **Destination POIs:** "BCom Project 1," "PGDI Project 2," "Bathrooms."
    *   **Localization POIs:** "Main Entrance," "Hall 2 Junction."
6.  `[Admin]` navigates to "Sponsor Management." They link the "BCom Project 1" POI to the "Sponsor A" account.
7.  The system generates two sets of QR codes for the admin to print:
    *   **"You Are Here" Localization Markers:** One for each Localization POI (e.g., "Main Entrance"). These are for navigation.
    *   **"AR Scavenger Hunt" Markers:** One for each *Sponsor* POI. These are for engagement.
8.  `[Admin]` creates logins for the "B2B Staff App" for each sponsor team.

---

### Flow 2: B2C Attendee - Live Event (Navigation)
**Persona:** Event Attendee
**Platform:** "NavEaze Attendee" App (React Native - B2C App)
**Goal:** To find a specific booth without getting lost.

1.  `[Attendee]` downloads the "NavEaze Attendee" app.
2.  `[Attendee]` opens the app and taps the `[Map]` tab. They see the 2D map, but **no "blue dot"** (the app doesn't know where they are).
3.  `[Attendee]` taps the `` tab, finds "BCom Project 1," and taps "Get Directions."
4.  A prompt appears: "To start navigation, please scan the nearest 'You Are Here' QR marker."
5.  `[Attendee]` (who is at the main entrance) scans the "Main Entrance" Localization QR code.
6.  **The "Magic" Happens:**
    *   The app now knows `user_location = "Main Entrance POI"`.
    *   It displays a "blue dot" on the map at the "Main Entrance" POI coordinates.
    *   The app calculates the shortest path from the "Main Entrance" POI to the "BCom Project 1" POI, using the paths drawn by the admin.
    *   A bright line is drawn on the 2D map, showing the exact route to follow.
7.  `[Attendee]` follows the path. If they get lost, they can re-scan another "You Are Here" marker to get an updated route.
8.  **This flow directly solves your AVIJOZI "no orientation" problem.**

---

### Flow 3: B2C & B2B - Live Event (Engagement & Lead Capture)
**Persona:** Attendee & Sponsor Staff
**Platform:** Both B2C & B2B Apps
**Goal:** To validate engagement at the booth (for B2B) and capture the lead (for B2B).

1.  **B2C Engagement (AR Scavenger Hunt):**
    *   `[Attendee]` (having arrived at "BCom Project 1" using the map) opens the `` tab.
    *   They scan the **"AR Scavenger Hunt" QR code** at the booth.
    *   The app displays an AR badge: "Badge Unlocked!".
    *   **Background Action:** The B2C app sends a "scan event" to the backend. This logs one **"Verified Engagement"** metric for that sponsor.
2.  **B2B Lead Capture (Staff App):**
    *   `[Attendee]` has a great conversation with the exhibitor.
    *   `` logs into the **"NavEaze Staff App"** (your "First Repo" app).
    *   `` scans the attendee's **Quicket Ticket QR Code**.
    *   The backend queries the Quicket API and returns the attendee's profile.
    *   `` adds a note ("Hot lead") and saves.
    *   **Background Action:** The B2B app sends a "lead" event to the backend. This logs one **"Qualified Lead"** metric.
3.  **B2B ROI (Dashboard):**
    *   The Sponsor Manager logs into the NavEaze DPM and sees their dashboard:
        *   **Qualified Leads: 42** (from the B2B Staff App)
        *   **Verified Engagements: 135** (from the B2C Attendee App)
    *   The MVP has successfully validated both sides of the platform.

---

## Part 3: Articulation for VSCode (The "Deadline Build" Plan)

This emulates your `README` structure, focusing on the *MVP build*.

### `/backend` (Node.js + Supabase)

This is the central API. It combines your "First Repo" logic with the new navigation and engagement logic.

*   **Database Schema (Supabase/PostgreSQL):**
    *   `events`: Stores basic event info.
    *   `event_maps`: Stores `storage_url` for the 2D floor plan image.
    *   `pois` (Points of Interest): Stores `map_id`, `name`, `(x, y)` coordinates, and `type` (e.g., 'booth', 'utility', 'localization').
    *   `paths`: Stores the walkable segments as pairs of POI IDs (e.g., `poi_id_start`, `poi_id_end`, `distance`). This forms the graph.
    *   `sponsors`: Manages B2B accounts, linked to `pois`.
    *   `leads`: (From your "First Repo") Stores qualified leads captured by the B2B Staff App.
    *   `attendee_engagements`: (New) Logs scans from the B2C Attendee App (`attendee_id`, `poi_id`, `timestamp`).
*   **API Endpoints:**
    *   `GET /events/:id/map_data`: (B2C App) Fetches the map image URL and the list of all `pois` and `paths`.
    *   `POST /events/:id/engage`: (B2C App) Triggered by the B2C app's AR scanner. Logs a new `attendee_engagements` entry.
    *   `POST /leads/scan`: (B2B Staff App - from "First Repo") Triggered by the B2B app. Takes Quicket QR data, calls the Quicket API, and stores the enriched lead in the `leads` table.
    *   `GET /sponsors/:id/analytics`: (B2B Dashboard) Returns the aggregated `count()` from both the `leads` table and the `attendee_engagements` table.
    *   `GET /sponsors/:id/leads`: (B2B Dashboard) Returns the detailed list of leads for CSV export.

### `/web` (React + Vite - "DPM")

This is the B2B/Admin web platform. This is where you'll spend most of the *new* development time, emulating your "Interactive Floorplan Editor."

*   **`src/pages/admin/MapEditor.jsx`:**
    *   This is the core of the B2B setup.
    *   Uses `react-konva` (from your `README`) or a similar library to create an interactive canvas.
    *   **Function 1 (Map Upload):** Admin uploads the 2D floor plan image, which becomes the canvas background.
    *   **Function 2 (POI Plotting):** An "Add POI" mode. Admin clicks on the canvas. A modal pops up: "POI Name:", "POI Type: (Localization, Booth, Utility)". The app saves the `(x, y)` coordinates and POI data to the `pois` table via the backend API.
    *   **Function 3 (Path Drawing):** (The new, critical feature) An "Add Path" mode. Admin clicks on POI 1, then POI 2. The app draws a line and saves this `(poi_id_start, poi_id_end)` segment to the `paths` table. This is how you build the navigation network.
    *   **Function 4 (QR Generation):** A "Sponsor Management" tab where the Admin can click "Generate QR Anchors" for all POIs of type 'Localization' and 'Booth'.
*   **`src/pages/sponsor/Dashboard.jsx`:**
    *   (From your "First Repo") Fetches from `GET /sponsors/:id/analytics` and displays the two key metrics.
    *   Includes the "Export Leads" button that fetches from `GET /sponsors/:id/leads`.

### `/mobile` (React Native - The 2 MVP Apps)

*   **1. `mobile/b2b-staff-app` (Existing from "First Repo")**:
    *   This app is simple and focused.
    *   `src/screens/ScannerScreen.jsx`: Uses `react-native-camera` to scan the **Quicket Ticket QR Code**.
    *   `onBarCodeScanned` handler calls your `POST /leads/scan` endpoint.
    *   `src/screens/QualifyLeadScreen.jsx`: Displays the data returned from the Quicket API and allows staff to add notes/ratings.

*   **2. `mobile/b2c-attendee-app` (New Build for MVP)**:
    *   `src/navigation/`: A simple Tab Navigator (e.g., Map, Directory, AR Hunt).
    *   `src/screens/MapScreen.jsx`:
        *   `useEffect` fetches all data from `GET /events/:id/map_data`.
        *   Renders the 2D map image.
        *   Renders all POIs as clickable pins.
        *   **Local State:** `userLocation` (an `(x,y)` coord) and `pathData` (an array of `(x,y)` coords).
        *   Renders a "blue dot" at the `userLocation` (if not null).
        *   Renders an `<Svg><Polyline... /></Svg>` component using the `pathData` (if not null).
    *   `src/screens/DirectoryScreen.jsx`:
        *   A simple list of POIs. `onClick` navigates to `MapScreen` and passes the `destination_poi`.
    *   `src/screens/ScannerScreen.jsx`: (This is the B2C scanner, separate from the B2B one).
        *   `onBarCodeScanned` handler:
            *   Checks the data in the scanned QR code.
            *   **If it's a "Localization" QR:** Sets the `userLocation` state, calculates the path from `userLocation` to the `destination_poi` (using the downloaded path graph), saves the result to `pathData` state, and navigates to `MapScreen`.
            *   **If it's an "AR Hunt" QR:** Sends the data to `POST /events/:id/engage`, then navigates to `ArRewardScreen.jsx`.
    *   `src/screens/ArRewardScreen.jsx`:
        *   Uses `ViroReact` (from your `README`) or a similar library to display a simple "Badge Unlocked!" 3D model or text. You can emulate from NavEaze DPM but don't directly make changes to that folder.

## Next steps / Practical checklist

1.  Drop this file into your event repo root (done here). If you want it merged into the `NavEazeDPM-main` README, we can open a focused PR there.
2.  Create issues (or tickets) for these MVP deliverables:
    *   Backend: DB schema + endpoints (`map_data`, `engage`, `leads/scan`, sponsor analytics).
    *   Web: `MapEditor` (POI plotting + path drawing + QR generation).
    *   Mobile (B2C): Map display, QR localization flow, path rendering, AR reward flow.
    *   Mobile (B2B): Lead scan integration with Quicket API.
3.  For the Nov 15 pilot, plan a one-page admin guide for printing/placing QR markers and testing the flow end-to-end with a short rehearsal.

## Assumptions & constraints

*   We're using QR markers for localization to avoid the need for BLE beacons or complex VIO systems for the pilot.
*   Pathfinding is done on a graph built by the Admin (POIs + paths). This avoids real-time SLAM or sensor fusion in the MVP.
*   The attendee's app downloads the entire `map_data` for the event on open, so navigation is local and fast (no continuous GPS required).

## Closing

This plan keeps the MVP focused, low-risk, and highly verifiable: you can prove sponsor ROI with simple, verifiable metrics (scans + qualified leads) while solving the core B2C problem (orientation + navigation) that enables all downstream value.

If you'd like, I can:

* Create issues and a lightweight milestone for the Nov 15 pilot.
* Scaffold the `GET /events/:id/map_data` endpoint and a minimal Supabase schema migration SQL.
* Scaffold the `MapEditor.jsx` with `react-konva` and a simple path/POI storage flow.

Tell me which next step to take and I'll implement it in this workspace.
