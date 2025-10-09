/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import eventRoutes from './routes/events.js'
import venueRoutes from './routes/venues.js'
import floorplanRoutes from './routes/floorplans.js'
import arCampaignRoutes from './routes/ar-campaigns.js'
import mobileSdkRoutes from './routes/mobile-sdk.js'
import analyticsRoutes from './routes/analytics.js'
import cdvReportsRoutes from './routes/cdv-reports.js'


// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/venues', venueRoutes)
app.use('/api/floorplans', floorplanRoutes)
app.use('/api/ar-campaigns', arCampaignRoutes)
app.use('/api/sdk', mobileSdkRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api', cdvReportsRoutes)


/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
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
