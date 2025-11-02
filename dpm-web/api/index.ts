// Load environment variables first before any other imports
import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from project root
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
config({ path: path.resolve(__dirname, '../.env') })

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Import middleware
import { authenticateToken, requireEventOrganizer, requireVenueManager, AuthenticatedRequest } from './middleware/auth'

// Import route handlers
import { login, register, logout } from './auth/index'
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent } from './events/index'
import { getVenues, getVenue, createVenue, updateVenue, deleteVenue } from './venues/index'

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
  },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many authentication attempts, please try again later.',
  },
})

app.use(limiter)

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  })
})

// Authentication routes (public)
app.post('/api/auth/login', authLimiter, login)
app.post('/api/auth/register', authLimiter, register)
app.post('/api/auth/logout', logout)

// Protected routes - Events
app.get('/api/events', authenticateToken, requireEventOrganizer, getEvents)
app.get('/api/events/:id', authenticateToken, requireEventOrganizer, getEvent)
app.post('/api/events', authenticateToken, requireEventOrganizer, createEvent)
app.put('/api/events/:id', authenticateToken, requireEventOrganizer, updateEvent)
app.delete('/api/events/:id', authenticateToken, requireEventOrganizer, deleteEvent)

// Protected routes - Venues
app.get('/api/venues', authenticateToken, requireVenueManager, getVenues)
app.get('/api/venues/:id', authenticateToken, requireVenueManager, getVenue)
app.post('/api/venues', authenticateToken, requireVenueManager, createVenue)
app.put('/api/venues/:id', authenticateToken, requireVenueManager, updateVenue)
app.delete('/api/venues/:id', authenticateToken, requireVenueManager, deleteVenue)

// User profile routes
app.get('/api/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supabase } = await import('./lib/supabase')
    
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch profile',
        message: error.message,
      })
    }

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile does not exist',
      })
    }

    res.json({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch profile',
    })
  }
})

app.put('/api/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supabase } = await import('./lib/supabase')
    const { full_name, phone, company, address, bio } = req.body

    const { data: profile, error } = await supabase
      .from('users')
      .update({
        full_name,
        phone,
        company,
        address,
        bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({
        error: 'Failed to update profile',
        message: error.message,
      })
    }

    if (!profile) {
      return res.status(500).json({
        error: 'Failed to update profile',
        message: 'No profile data returned after update',
      })
    }

    res.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile',
    })
  }
})

// Dashboard stats endpoint
app.get('/api/dashboard/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supabase } = await import('./lib/supabase')
    const userId = req.user.id
    const userRole = req.user.role

    let stats: Record<string, number> = {}

    if (userRole === 'admin') {
      // Admin sees all stats
      const [eventsResult, venuesResult, usersResult, campaignsResult] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact' }),
        supabase.from('venues').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('ar_advertisements').select('id', { count: 'exact' }),
      ])

      stats = {
        totalEvents: eventsResult.count || 0,
        totalVenues: venuesResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalCampaigns: campaignsResult.count || 0,
      }
    } else if (userRole === 'event_organizer') {
      // Event organizer sees their events and available venues
      const [eventsResult, venuesResult] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact' }).eq('organizer_id', userId),
        supabase.from('venues').select('id', { count: 'exact' }).eq('status', 'active'),
      ])

      stats = {
        myEvents: eventsResult.count || 0,
        availableVenues: venuesResult.count || 0,
      }
    } else if (userRole === 'venue_manager') {
      // Venue manager sees their venues and events at their venues
      const [venuesResult, eventsResult] = await Promise.all([
        supabase.from('venues').select('id', { count: 'exact' }).eq('organization_id', req.user.organization_id),
        supabase.from('events').select('id', { count: 'exact' }).in('venue_id', 
          (await supabase.from('venues').select('id').eq('organization_id', req.user.organization_id)).data?.map(v => v.id) || []
        ),
      ])

      stats = {
        myVenues: venuesResult.count || 0,
        eventsAtMyVenues: eventsResult.count || 0,
      }
    } else if (userRole === 'advertiser') {
      // Advertiser sees their campaigns
      const campaignsResult = await supabase
        .from('ar_advertisements')
        .select('id', { count: 'exact' })
        .eq('advertiser_id', userId)

      stats = {
        myCampaigns: campaignsResult.count || 0,
      }
    }

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch dashboard statistics',
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
  })
})

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err)
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NavEaze API server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
})

export default app