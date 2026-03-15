/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
// import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import eventsRoutes from './routes/events.js'
import venuesRoutes from './routes/venues.js'
import boothsRoutes from './routes/booths.js'
import cdvReportsRoutes from './routes/cdv-reports.js'
import quicketRoutes from './routes/quicket.js'
import analyticsRoutes from './routes/analytics.js'
import scansRoutes from './routes/scans.js'
import ticketsRoutes from './routes/tickets.js'
import attendeesRoutes from './routes/attendees.js'
import leadsRoutes from './routes/leads.js'
import sponsorsRoutes from './routes/sponsors.js'
import storageRoutes from './routes/storage.js'
import editorRoutes from './routes/editor.js'
import { authenticateToken } from './middleware/auth.js'

// for esm mode
// const __filename = fileURLToPath(import.meta.url)

// load env
dotenv.config()

const app: express.Application = express()

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/venues', venuesRoutes)
app.use('/api/booths', boothsRoutes)
app.use('/api/cdv-reports', cdvReportsRoutes)
app.use('/api/quicket', quicketRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/scans', scansRoutes)
app.use('/api/tickets', ticketsRoutes)
app.use('/api/attendees', attendeesRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/sponsors', sponsorsRoutes)
app.use('/api/storage', storageRoutes)  // Remove double auth - it's in the route
app.use('/api/editor', editorRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, _next: express.NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
