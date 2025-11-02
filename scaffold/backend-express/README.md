NavEaze Express + Supabase scaffold

Files:
- `server.js` - ESM Express server implementing:
  - GET /events/:id/map_data
  - POST /events/:id/engage
  - POST /leads/scan
- `supabaseClient.js` - helper that exports a Supabase client if env vars are set.

Usage (demo mode - no Supabase required):

PORT=3003 node scaffold/backend-express/server.js

Usage (with Supabase):

SUPABASE_URL=your_url SUPABASE_KEY=your_key PORT=3003 node scaffold/backend-express/server.js

Notes:
- When Supabase is not configured the server returns demo map data. When configured it will query `event_maps`, `pois`, and `paths`.
- This scaffold is intentionally minimal. Replace with more robust validation, authentication, and error handling for production.
