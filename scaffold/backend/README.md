NavEaze MVP backend scaffold

This is a tiny CommonJS Node server used for local testing / demo of the NavEaze MVP API.

Endpoints (demo):

- GET /events/:id/map_data
  Returns sample map data (map_url, pois, paths). The :id is ignored in the demo server.

- POST /events/:id/engage
  Accepts a JSON payload (e.g., { attendee_id: '...', poi_id: 2, type: 'ar_hunt' }) and stores it in-memory for demo.

- POST /leads/scan
  Demo endpoint that echoes an enriched lead object. In production this would call Quicket and persist.

Run (from repo root):

node "/Users/zumiww/Documents/NE DPM V5/scaffold/backend/server.cjs"

Notes:
- The server is intentionally CommonJS (`.cjs`) so it can be started without changing the repo's `package.json` module type.
- This is a scaffold for local testing. Replace with a proper Express/Fastify server and connect to Supabase/Postgres for production.
