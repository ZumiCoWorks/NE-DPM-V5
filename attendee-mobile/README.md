Attendee Mobile (Expo)
======================

Minimal Expo app for attendees (Map, Directory, Scanner, AR reward).

Setup
-----

1. Install dependencies (Node 18+ recommended):

```bash
cd attendee-mobile
npm install
```

2. Start the dev server:

```bash
npm start
```

Open the project in Expo Go or a simulator.

Notes
-----
- Scanner uses `expo-barcode-scanner` and recognizes simple QR payloads:
  - localization QR example: `type:localization;id:p1;x:30;y:40`
  - ar QR example: `type:ar;id:reward1`
- Map uses an image background and `react-native-svg` to draw a mock polyline representing the path.
