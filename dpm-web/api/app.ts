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

// for esm mode
// const __filename = fileURLToPath(import.meta.url)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
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
app.use((error: Error, req: Request, res: Response, _next) => {
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
