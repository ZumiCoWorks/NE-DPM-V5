
# NE-DPM-V5: South African B2B Digital Product Management & CDV Intelligence Platform 🇿🇦

**Showcase Goal:**
Deliver a comprehensive B2B Digital Product Management Portal specifically designed for South African event organizers and sponsors, featuring a real-time Contextual Dwell Verification (CDV) intelligence system. The platform fulfills all B2B requirements (B2B-1 through B2B-6) for the November 15th showcase, providing advanced analytics tailored for the SA market, load-shedding resilient architecture, event/floorplan/venue management, AR campaign tools, emergency navigation, and API/mobile SDK access.

## 🎯 Project Vision

- Empower South African event organizers and sponsors with actionable real-time analytics and engagement insights
- Centralize management of venues, events, floorplans, navigation, AR campaigns, and emergency protocols
- Provide a robust CDV intelligence dashboard designed for SA market conditions (load shedding resilience)
- Enable seamless integration with local partners like Quicket, MTN, Discovery, Standard Bank, and Nedbank
- Support ZAR currency pricing and South African sponsor attribution
- Deliver load-shedding resilient data streaming architecture for uninterrupted event analytics

---


## 🚀 Key Features

### B2B Platform Modules
- **Dashboard**: Real-time analytics and engagement metrics
- **Events**: Event creation, configuration, and management
- **Venues**: Venue setup and details
- **Floorplans**: Interactive floorplan editor and navigation
- **AR Campaigns**: Augmented reality experience management
- **Emergency**: Emergency navigation and protocols
- **CDV Intelligence**: Contextual Dwell Verification dashboard with live stats
- **API Docs & Mobile SDK**: Developer access and integration tools

### Technical Highlights
- **Full-Stack TypeScript**: End-to-end type safety
- **React 18 + Tailwind CSS**: Modern, responsive UI
- **Express.js Backend**: RESTful API endpoints
- **Supabase Integration**: Real-time database, authentication, and migrations
- **Mock Authentication**: Demo credentials for rapid onboarding
- **Database Migrations**: Version-controlled schema management

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Supabase Client** for database and auth

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Supabase** for database and authentication
- **dotenv** for environment management
- **CORS** for cross-origin requests

### Database
- **PostgreSQL** (via Supabase)
- **Row Level Security (RLS)** for data protection
- **Migration-based** schema management

## 📋 Prerequisites

- Node.js 18+ and npm
- Git for version control
- Supabase account and project (optional - only required for production deployment)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/NE-DPM-V5.git
cd NE-DPM-V5
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup (Optional for Demo Mode)

**Note:** The application includes built-in mock authentication and works without Supabase configuration. You can skip this step to run in demo mode.

For production use with real Supabase backend, create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FRONTEND_URL=http://localhost:5173
```

**Demo Mode Credentials:**
- Email: `admin@naveaze.com`
- Password: `demo123`

### 4. Database Setup
Apply the database migrations:
```bash
# The migrations are already applied if you're using the connected Supabase project
# Check supabase/migrations/ for the schema files
```

### 5. Start Development Servers
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## � Recent editor & scaffold updates

- Added a simplified Map Editor flow in `scaffold/web/src/pages/admin/MapEditor.jsx` that lets you upload floorplans, add POIs, and draw paths.
- `ImageUploader` is now storage-agnostic and accepts an `uploadFn(file) => Promise<string>`; a small Supabase helper `scaffold/web/src/lib/supabaseClient.js` has been added with `uploadFloorplan(file)` to upload to a `floorplans` bucket. If Supabase env vars are not set the uploader will prompt for a hosted URL.
- POI creation no longer uses `prompt()` — there's a modal form (`scaffold/web/src/components/POIForm.jsx`) that collects POI name/type and saves normalized coordinates (x_pct/y_pct) to the backend.
- A lightweight `FloorplanCanvas` component (`scaffold/web/src/components/FloorplanCanvas.jsx`) renders the floorplan and overlays POIs/paths without requiring `react-konva`. The full Konva-powered editor from the NavEaze reference can be copied into `scaffold/web/src/components/` if you want the richer editing experience (pan/zoom, node/segment editing); that step is planned but not yet copied to avoid pulling in extra deps automatically.


## �📁 Project Structure

```
NE-DPM-V5/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   │   └── auth/          # Authentication components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Frontend utilities and config
│   ├── pages/             # Page components
│   └── utils/             # Utility functions
├── api/                   # Backend Express application
│   ├── lib/               # Backend utilities and config
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route handlers
│   └── server.ts          # Main server file
├── supabase/              # Database configuration
│   └── migrations/        # Database migration files
├── .trae/                 # Project documentation
│   └── documents/         # Technical architecture docs
└── public/                # Static assets
```

## 🔐 Authentication

The system uses Supabase Auth for secure user management:

- **Registration**: New organizers can create accounts
- **Login**: Secure authentication with JWT tokens
- **Session Management**: Automatic token refresh
- **Role-Based Access**: Organizer-specific data access

## 🗄️ Database Schema

Key tables include:
- `users` - Organizer profiles and authentication
- `venues` - Event venue information
- `events` - Event details and configuration
- `floorplans` - Venue layout and navigation data
- `navigation_nodes` - Navigation waypoints
- `navigation_paths` - Route definitions and emergency paths
- `ar_campaigns` - AR experience configurations
- `ar_assets` - Digital assets for AR
- `ar_zones` - Spatial AR trigger zones

## 🔒 Security

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based auth
- **Environment Variables**: Sensitive data protection
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: Server-side request validation

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new organizer
- `POST /api/auth/login` - Organizer login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh authentication token
- `POST /api/auth/logout` - User logout

### Health Check
- `GET /api/health` - Server health status

## 🧪 Testing

### Backend API Testing
```bash
# Test server health
curl http://localhost:3001/api/health

# Test user registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User","organization":"Test Org"}'
```

### Dev: Quick smoke test (local)

Use this to verify POST /api/scans/log and the dev analytics endpoint work end-to-end.

1) Start the server in development:

```bash
npm run server:dev
```

2) (Optional) POST a test scan:

```bash
curl -s -X POST http://localhost:3001/api/scans/log \
  -H "Content-Type: application/json" \
  -d '{"device_id":"device_test_1","anchor_id":"anchor_abc","event_id":"22222222-2222-2222-2222-222222222222","booth_id":null,"timestamp":"2025-10-28T12:00:00.000Z","attendee_id":"QKT-demo-123","attendee_name":"Demo User","ticket_tier":"General"}' -w "\nSTATUS:%{http_code}\n"
```

3) Run the automated smoke-test script (uses default DEV_ANALYTICS_TOKEN='dev-token'):

```bash
npm run smoke-test
```

If you set a different dev token, export it before running the script:

```bash
export DEV_ANALYTICS_TOKEN="your-secret"
export SMOKE_EVENT_ID="your-event-uuid"
npm run smoke-test
```


## 📝 Development Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run client:dev` - Start only the frontend development server
- `npm run server:dev` - Start only the backend development server
- `npm run build` - Build the frontend for production
- `npm run preview` - Preview the production build

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the technical documentation in `.trae/documents/`
- Review the API documentation above

## 🔄 Version History

- **v5.0.0** - Initial MVP release with core functionality
  - User authentication system
  - Database schema and migrations
  - Basic frontend and backend structure
  - Supabase integration

## 🧭 Demo quick guide (presenter checklist)

If you need to demo both B2B (dashboard) and B2C (mobile) simultaneously, follow these quick steps to run everything and prove the flows live.

1) Start backend (keep terminal A open):

```zsh
cd "/Users/zumiww/Documents/NE DPM V5"
npm run server:dev
```

Verify health in a second terminal:

```zsh
curl -sS http://localhost:3001/api/health -w '\nSTATUS:%{http_code}\n'
# Expect: {"success":true,"message":"ok"} and STATUS:200
```

2) Start the Dashboard (terminal B):

```zsh
cd "/Users/zumiww/Documents/NE DPM V5"
npm run client:dev
```

Open the Vite URL (usually http://localhost:5173) and navigate to `MVP Analytics`.

3) Start Expo for the Mobile app (terminal C):

```zsh
cd "/Users/zumiww/Documents/NE DPM V5/mobile-app"
npm start
```

- If you run Expo on a real phone, ensure the phone is on the same Wi‑Fi network.
- If Expo cannot reach `localhost` from the phone, either use `expo start --tunnel` or set the API base to your machine LAN IP in `mobile-app/services/ApiClient.ts` (see Troubleshooting below).

4) Seed demo data (optional, speeds up the demo):

```zsh
# From repo root. Pass your server base if not localhost
node scripts/seed-demo.js http://localhost:3001
```

5) Show the flows:

- On the mobile: Verify Ticket → Lookup by Email (or scan QR) to store `attendee_id` in AsyncStorage.
- Trigger a booth scan (the app calls `logAnonymousScan`) — watch Terminal C logs and Terminal A backend logs. You should see a line like:

```
Scan logged: event=101 anchor=anchor_entrance device=device_demo_1 attendee=QKT-DEMO-1
```

- On the dashboard: refresh/select event 101 in `MVP Analytics` — the totals and unique devices should reflect the posted scans. Use Export → CSV to show raw data.

Troubleshooting / quick fixes
- If `curl` prints a zsh error about `number expected`, wrap `-w` in single quotes as shown above.
- If Expo prints networking errors:
  - Determine your LAN IP: `ipconfig getifaddr en0` (or `en1`).
  - Edit `mobile-app/services/ApiClient.ts` and set `API_BASE` to `http://<LAN_IP>:3001/api`.
  - Or run `expo start --tunnel` to avoid LAN config.

Want me to patch the mobile code for you?
- I can add `MOBILE_API_BASE` env var support (recommended) so you only set an env value when starting Expo.
- Or I can hardcode your machine LAN IP into `ApiClient.ts` for the demo — tell me which and provide the IP if you prefer the hardcode option.

---

**NavEaze V5** - Empowering event organizers with comprehensive digital management tools.