# NavEaze V4 - Indoor Navigation & Event Management Platform

<!-- Test comment for CodeRabbit integration testing -->
A comprehensive platform for managing indoor navigation, events, floorplans, and AR advertisements. Built with React, TypeScript, Express.js, and Supabase.

## 🚀 Features

- **Event Management**: Create and manage indoor events with detailed information
- **Floorplan Editor**: Interactive floorplan creation and editing tools
- **AR Advertisement Studio**: Create and manage AR advertisements for events
- **Navigation System**: Advanced indoor navigation with waypoint management
- **Analytics Dashboard**: Comprehensive analytics and reporting
- **Multi-tenant Architecture**: Support for multiple organizations
- **Real-time Updates**: Live updates using Supabase real-time features

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Supabase** for database and authentication
- **PostgreSQL** with PostGIS for spatial data

### Testing
- **Jest** for unit testing
- **Playwright** for E2E testing
- **Cypress** for component testing

### DevOps
- **GitHub Actions** for CI/CD
- **Vercel** for deployment
- **ESLint** and **Prettier** for code quality

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd naveaze-v4
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
VITE_APP_NAME=NavEaze V4
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# External Services
VITE_SENTRY_DSN=your_sentry_dsn
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Database Setup

Run the database migrations in your Supabase SQL editor:

```bash
# Copy the content from database/migrations/001_initial_schema.sql
# and run it in your Supabase SQL editor
```

### 4. Development

```bash
# Start both frontend and backend
npm run dev

# Or start them separately
npm run dev:client    # Frontend only (port 5173)
npm run dev:server    # Backend only (port 3001)
```

## 📁 Project Structure

```
naveaze-v4/
├── api/                    # Backend Express.js application
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── index.ts           # Server entry point
├── src/                   # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service functions
│   ├── stores/           # Zustand state stores
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── database/
│   └── migrations/       # Database migration files
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
├── docs/                # Documentation
├── scripts/             # Build and deployment scripts
└── .github/workflows/   # CI/CD workflows
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit        # Unit tests with Jest
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests with Playwright
npm run test:cypress     # Component tests with Cypress

# Test coverage
npm run test:coverage
```

## 🔧 Development Commands

```bash
# Code quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking

# Building
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Preview
npm run preview          # Preview production build
```

## 🚀 Deployment

The project is configured for deployment on Vercel with automatic deployments:

- **Development**: Deploys from `develop` branch
- **Staging**: Deploys from `staging` branch  
- **Production**: Deploys from `main` branch

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod
```

## 📊 Database Schema

The application uses PostgreSQL with PostGIS for spatial data. Key tables include:

- `users` - User profiles and roles
- `organizations` - Multi-tenant organization data
- `venues` - Physical venue information
- `events` - Event management
- `floorplans` - Floorplan data and SVG storage
- `navigation_points` - Indoor navigation waypoints
- `ar_advertisements` - AR advertisement content
- `analytics_events` - User interaction analytics

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication via Supabase
- API rate limiting and security headers
- Input validation and sanitization
- CORS configuration for cross-origin requests

## 📈 Monitoring

- **Sentry** for error tracking and performance monitoring
- **Supabase Analytics** for database insights
- **Custom Analytics** for user behavior tracking

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
- Check the [documentation](./docs/)
- Review the [API documentation](./docs/api.md)

## 🗺 Roadmap

- [ ] Mobile app SDK for navigation
- [ ] Advanced AR features
- [ ] Real-time collaboration tools
- [ ] Enhanced analytics dashboard
- [ ] Multi-language support
- [ ] Offline navigation capabilities