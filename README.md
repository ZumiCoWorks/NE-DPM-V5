# NavEaze V5 - Digital Product Management Portal

A comprehensive digital product management system for event organizers to manage venues, events, navigation paths, and AR campaigns.

## 🚀 Features

### Core Functionality
- **Venue Management**: Create and manage event venues with detailed information
- **Event Planning**: Set up events with comprehensive configuration options
- **Floorplan Management**: Upload and manage venue floorplans
- **Navigation System**: Configure navigation nodes and emergency paths
- **AR Campaign Management**: Create and manage augmented reality experiences
- **User Authentication**: Secure organizer login and registration system

### Technical Highlights
- **Full-Stack TypeScript**: End-to-end type safety
- **Real-time Database**: Supabase integration with Row Level Security
- **Modern UI**: React with Tailwind CSS for responsive design
- **RESTful API**: Express.js backend with comprehensive endpoints
- **Authentication**: Supabase Auth with JWT tokens
- **Database Migrations**: Version-controlled schema management

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
- Supabase account and project
- Git for version control

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

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FRONTEND_URL=http://localhost:5173
```

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

## 📁 Project Structure

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

---

**NavEaze V5** - Empowering event organizers with comprehensive digital management tools.