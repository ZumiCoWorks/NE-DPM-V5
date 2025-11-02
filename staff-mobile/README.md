Staff Mobile (Expo)
====================

Minimal Expo app for sponsor staff lead capture (scanner + qualify screens).

Setup
-----

1. Install dependencies (recommended to use Node 18+):

```bash
cd staff-mobile
npm install
# or: expo install (for native deps) and then npm install
```

2. Start the dev server:

```bash
npm start
# then open on device via Expo Go or run on simulator
```

Notes
-----
- Scanner uses `expo-barcode-scanner`.
- Screens:
  - `ScannerScreen` - opens camera and scans QR; navigates to QualifyLead
  - `QualifyLeadScreen` - shows dummy attendee data, notes input, save button
