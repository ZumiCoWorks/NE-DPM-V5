Minimal NavEaze backend scaffold

This is a tiny scaffold used to validate the MVP endpoints locally without external dependencies.

Files:
- `server.js` – minimal Node HTTP server exposing:
  - `GET /events/:id/map_data` – returns sample event map data (JSON)
  - `POST /events/:id/engage` – accepts a JSON body and stores an in-memory engagement record
- `migrations/001_create_tables.sql` – a suggested Supabase/Postgres migration for the MVP schema.

Run locally (requires Node.js):

```bash
# from repository root
node "scaffolds/backend/server.js"
```

The server listens on port 3001 by default. This is intentionally dependency-free so you can validate the API shape quickly.
