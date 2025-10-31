NavEaze mobile scaffold notes

This folder contains lightweight notes to guide the B2C and B2B mobile implementations for the Nov 15 pilot.

B2C (Attendee) app features:
- MapScreen: downloads `GET /events/:id/map_data`, renders base image, POIs, and blue-dot if localized.
- DirectoryScreen: searchable list of POIs with "Get Directions" that prompts for scanning a localization QR.
- ScannerScreen: scans QR codes that are either 'localization' (set userLocation and calculate path) or 'ar_hunt' (POST /events/:id/engage).
- ArRewardScreen: simple confirmation UI for "Badge Unlocked!" (no heavy AR required for the pilot).

B2B (Staff) app features:
- ScannerScreen: scans Quicket ticket QR and POST to /leads/scan; display attendee data and allow notes/qualification.

Notes:
- For the pilot, prefer React Native + Expo for fast builds.
- Use local pathfinding (Dijkstra on the admin-created graph) so runtime is deterministic and offline-friendly.
