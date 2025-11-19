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
// security middleware optional in dev

// Import middleware
import { authenticateToken, requireEventOrganizer, requireVenueManager, AuthenticatedRequest } from './middleware/auth'

// Import route handlers
import { login, register, logout } from './auth/index'
import storageRoutes from './routes/storage.js'
import editorRoutes from './routes/editor.js'
import authRoutes from './routes/auth.js'
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent } from './events/index'
import { getVenues, getVenue, createVenue, updateVenue, deleteVenue } from './venues/index'

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware (omitted in dev if not installed)

// Rate limiting omitted in dev

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const baseAllowed = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
    ]
    const extra = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const allowed = new Set([...baseAllowed, ...extra])
    const ok = !origin
      || allowed.has(origin)
      || /https?:\/\/.*ngrok.*\.app$/i.test(origin)
      || /https?:\/\/.*\.trae\.dev$/i.test(origin)
    if (ok) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
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
app.post('/api/auth/login', login)
app.post('/api/auth/register', register)
app.post('/api/auth/logout', logout)

// Auth utility routes (service-role backed)
app.use('/api/auth', authRoutes)

// Storage routes
app.use('/api/storage', authenticateToken, storageRoutes)

// Editor routes
app.use('/api/editor', editorRoutes)

// Leads routes (for staff mobile app)
import leadsRoutes from './routes/leads.js'
app.use('/api/leads', leadsRoutes)

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
      .from('profiles')
      .select('id, email, first_name, last_name, role')
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

    const p = profile as { id: string; email?: string; first_name?: string; last_name?: string; role?: string }
    res.json({
      success: true,
      data: {
        id: p.id,
        email: p.email,
        full_name: [p.first_name, p.last_name].filter(Boolean).join(' ') || undefined,
        role: p.role,
      },
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
    const { full_name, email } = req.body as { full_name?: string; email?: string }

    let first_name: string | undefined
    let last_name: string | undefined
    if (full_name) {
      const parts = String(full_name).trim().split(' ')
      first_name = parts[0]
      last_name = parts.slice(1).join(' ') || parts[0]
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...(email ? { email } : {}),
        ...(first_name ? { first_name } : {}),
        ...(last_name ? { last_name } : {}),
      })
      .eq('id', req.user.id)
      .select('id, email, first_name, last_name, role')
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

    const p = profile as { id: string; email?: string; first_name?: string; last_name?: string; role?: string }
    res.json({
      success: true,
      data: {
        id: p.id,
        email: p.email,
        full_name: [p.first_name, p.last_name].filter(Boolean).join(' ') || undefined,
        role: p.role,
      },
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

// Settings: Quicket API key storage
app.get('/api/settings/quicket-key', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supabase } = await import('./lib/supabase')
    const { data, error } = await supabase
      .from('profiles')
      .select('quicket_api_key')
      .eq('id', req.user.id)
      .single()
    if (error) {
      return res.status(500).json({ error: 'Failed to load Quicket key', message: error.message })
    }
    res.json({ success: true, data: { quicket_api_key: (data as { quicket_api_key?: string } | null)?.quicket_api_key || '' } })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: 'Failed to load Quicket key' })
  }
})

app.put('/api/settings/quicket-key', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supabase } = await import('./lib/supabase')
    const { quicket_api_key } = req.body as { quicket_api_key?: string }
    const { data, error } = await supabase
      .from('profiles')
      .update({ quicket_api_key: quicket_api_key || null })
      .eq('id', req.user.id)
      .select('quicket_api_key')
      .single()
    if (error) {
      return res.status(500).json({ error: 'Failed to save Quicket key', message: error.message })
    }
    res.json({ success: true, data: { quicket_api_key: (data as { quicket_api_key?: string } | null)?.quicket_api_key || '' }, message: 'Saved' })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: 'Failed to save Quicket key' })
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
      const [eventsResult, venuesResult, profilesResult, campaignsResult] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact' }),
        supabase.from('venues').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('ar_advertisements').select('id', { count: 'exact' }),
      ])

      stats = {
        totalEvents: eventsResult.count || 0,
        totalVenues: venuesResult.count || 0,
        totalUsers: profilesResult.count || 0,
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

// Dev: Seed demo data (define BEFORE 404 handler)
app.post('/api/dev/seed', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if ((process.env.NODE_ENV || 'development') !== 'development') {
      return res.status(403).json({ error: 'Dev-only endpoint' })
    }
    const { supabase } = await import('./lib/supabase')
    const { data: venue } = await supabase
      .from('venues')
      .upsert({ name: 'Demo Venue', address: '123 Demo St', description: 'Demo seeded venue', status: 'active' })
      .select()
      .single()
    const { data: event } = await supabase
      .from('events')
      .upsert({ name: 'Demo Event', description: 'Seeded event', start_date: new Date().toISOString(), venue_id: venue?.id })
      .select()
      .single()
    const { data: campaign } = await supabase
      .from('ar_advertisements')
      .upsert({ name: 'Demo Campaign', advertiser_id: req.user?.id })
      .select()
      .single()
    res.json({ success: true, data: { venue, event, campaign } })
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed demo data' })
  }
})

// Dev: Set user role in profiles
app.post('/api/dev/set-role', async (req: Request, res: Response) => {
  try {
    if ((process.env.NODE_ENV || 'development') !== 'development') {
      return res.status(403).json({ error: 'Dev-only endpoint' })
    }
    const { supabase } = await import('./lib/supabase')
    const { userId, role, email } = req.body as { userId: string; role: string; email?: string }
    if (!userId || !role) return res.status(400).json({ error: 'userId and role required' })
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, role, ...(email ? { email } : {}) })
      .select('id, role, email')
      .single()
    if (error) return res.status(500).json({ error: 'Failed to set role', message: error.message })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: 'Failed to set role' })
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
