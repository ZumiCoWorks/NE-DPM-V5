# DPM Web - Digital Project Management

A clean MVP web application for event management with AR campaigns, built with modern web technologies.

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript (serverless-compatible)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Authentication**: Supabase Auth with role-based access control

## Project Structure

```
dpm-web-new/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── lib/           # Utilities (API client, Supabase)
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
│   └── package.json
├── server/                # Express backend
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   └── index.ts          # Server entry point
└── supabase/             # Database migrations
    └── migrations/       # SQL migration files
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Setup

1. **Clone and install dependencies:**
   ```bash
   cd dpm-web-new/client && npm install
   cd ../server && npm install
   ```

2. **Configure environment variables:**
   
   Copy the example files and fill in your Supabase credentials:
   - `server/.env.example` → `server/.env`
   - `client/.env.local.example` → `client/.env.local`

3. **Apply database migrations:**
   ```bash
   cd supabase
   npx supabase init
   npx supabase link
   npx supabase db push
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run server:dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

## Features

### Authentication & Authorization
- Supabase authentication with email/password
- Role-based access control (admin, event_organizer, venue_manager, staff, sponsor)
- Protected routes and API endpoints

### Core Functionality
- **Event Management**: Create, edit, and manage events
- **Venue Management**: Add and manage event venues
- **Dashboard**: Role-aware dashboard with relevant statistics
- **Profile Management**: User profile and settings

### Admin Features
- **Unified Map Editor**: Upload floorplans and calibrate QR nodes
- **AR Campaigns**: Create and manage AR experiences
- **User Management**: Admin controls for user roles

### Integration
- **Quicket API**: Integration for event ticketing (stored API keys)
- **Supabase Storage**: File uploads for floorplans and assets

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Events
- `GET /api/events` - List published events
- `GET /api/events/my/events` - List user's events
- `POST /api/events` - Create event (organizer)
- `PUT /api/events/:id` - Update event (owner)
- `DELETE /api/events/:id` - Delete event (owner)

### Venues
- `GET /api/venues` - List active venues
- `POST /api/venues` - Create venue (manager)
- `PUT /api/venues/:id` - Update venue (manager)
- `DELETE /api/venues/:id` - Delete venue (admin)

### Dashboard
- `GET /api/dashboard/stats` - Get role-aware dashboard statistics

## Development

### Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend:**
- `npm run server:dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run smoke-test` - Test API endpoints

### Database Schema

Key tables:
- `profiles` - User profiles with roles
- `venues` - Event venues
- `events` - Events with venue relationships
- `floorplans` - Venue floorplan images
- `map_qr_nodes` - QR code calibration points
- `ar_campaigns` - AR experience campaigns

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy both frontend and backend

### Manual Deployment
1. Build frontend: `cd client && npm run build`
2. Build backend: `cd server && npm run build`
3. Deploy to your preferred hosting platform

## License

MIT License - see LICENSE file for details