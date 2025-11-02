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
// KEEP ONLY ESSENTIAL ROUTES FOR MVP
import authRoutes from './routes/auth.js'
import eventRoutes from './routes/events.js'
import venueRoutes from './routes/venues.js'
import boothRoutes from './routes/booths.js'
import cdvReportsRoutes from './routes/cdv-reports.js'
import quicketRoutes from './routes/quicket.js'


// for esm mode
const __filename = fileURLToPath(import.meta.url)
// const __dirname is available but not currently used in the file
// Keeping it for future use when serving static files or other path operations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()


app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  console.log(`Incoming: ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body));
  }
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`Response: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

/**
 * API Routes - SIMPLIFIED FOR MVP
 */
app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/venues', venueRoutes)
app.use('/api/booths', boothRoutes)
app.use('/api', cdvReportsRoutes)
app.use('/api/quicket', quicketRoutes)


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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
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
