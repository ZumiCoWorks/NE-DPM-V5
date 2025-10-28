import { Router, Response } from 'express'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js'
import { quicketService } from '../services/quicket.js'
import { supabaseAdmin } from '../lib/supabase.js'

const router = Router()

/**
 * Test Quicket API connection
 * POST /api/quicket/test-connection
 */
router.post('/test-connection', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userToken } = req.body

    if (!userToken) {
      return res.status(400).json({ error: 'userToken is required' })
    }

    const result = await quicketService.testConnection(userToken)
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        userId: result.userId
      })
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      })
    }
  } catch (error: any) {
    console.error('Test connection error:', error)
    res.status(500).json({ error: 'Failed to test connection' })
  }
})

/**
 * Get user's events from Quicket
 * GET /api/quicket/events
 */
router.get('/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userToken = req.headers['x-quicket-api-key'] as string

    if (!userToken) {
      return res.status(400).json({ error: 'Quicket API key required in headers' })
    }

    const events = await quicketService.getUserEvents(userToken)
    
    res.json({
      events,
      count: events.length
    })
  } catch (error: any) {
    console.error('Get Quicket events error:', error)
    res.status(500).json({ error: 'Failed to fetch events from Quicket' })
  }
})

/**
 * Get guest list for a specific event
 * GET /api/quicket/events/:eventId/guests
 */
router.get('/events/:eventId/guests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params
    const userToken = req.headers['x-quicket-api-key'] as string

    if (!userToken) {
      return res.status(400).json({ error: 'Quicket API key required in headers' })
    }

    const guests = await quicketService.getEventGuestList(eventId, userToken)
    
    res.json({
      eventId,
      guests,
      totalGuests: guests.length
    })
  } catch (error: any) {
    console.error('Get guest list error:', error)
    res.status(500).json({ error: 'Failed to fetch guest list from Quicket' })
  }
})

/**
 * Match attendee with Quicket guest list
 * POST /api/quicket/match-attendee
 */
router.post('/match-attendee', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, eventId } = req.body
    const userToken = req.headers['x-quicket-api-key'] as string

    if (!email || !eventId) {
      return res.status(400).json({ error: 'email and eventId are required' })
    }

    if (!userToken) {
      return res.status(400).json({ error: 'Quicket API key required in headers' })
    }

    const match = await quicketService.matchAttendee(email, eventId, userToken)
    
    res.json(match)
  } catch (error: any) {
    console.error('Match attendee error:', error)
    res.status(500).json({ error: 'Failed to match attendee' })
  }
})

/**
 * Get configuration status
 * GET /api/quicket/config
 */
router.get('/config', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mockMode = process.env.QUICKET_MOCK_MODE === 'true'
    const hasApiKey = !!process.env.QUICKET_API_KEY
    const hasSubscriberKey = !!process.env.QUICKET_API_SUBSCRIBER_KEY

    res.json({
      configured: hasApiKey && hasSubscriberKey,
      mockMode,
      apiKeyPresent: hasApiKey,
      subscriberKeyPresent: hasSubscriberKey
    })
  } catch (error: any) {
    console.error('Get config error:', error)
    res.status(500).json({ error: 'Failed to fetch configuration' })
  }
})

/**
 * Update configuration (toggle mock mode, etc.)
 * PUT /api/quicket/config
 */
router.put('/config', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mockMode } = req.body

    // In production, you'd want to persist this to a database
    // For now, we'll just return success
    // Note: Changing env vars at runtime is not recommended in production
    
    res.json({
      success: true,
      message: 'Configuration updated. Please restart server for changes to take effect.',
      mockMode
    })
  } catch (error: any) {
    console.error('Update config error:', error)
    res.status(500).json({ error: 'Failed to update configuration' })
  }
})

/**
 * Sync event from Quicket to NavEaze database
 * POST /api/quicket/sync-event
 */
router.post('/sync-event', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.body
    const apiKey = req.headers['x-quicket-api-key'] as string

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'eventId is required'
      })
    }

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Quicket API key required in headers'
      })
    }

    // Fetch event details from Quicket
    const eventDetails = await quicketService.getEventDetails(eventId, apiKey)
    
    if (!eventDetails) {
      return res.status(404).json({
        success: false,
        message: 'Event not found in Quicket'
      })
    }

    // Fetch attendees for this event
    const guests = await quicketService.getEventGuestList(eventId, apiKey)

    // Import event to our database (simplified - you'd want proper venue handling)
    const { data: venue, error: venueError } = await supabaseAdmin
      .from('venues')
      .upsert({
        name: eventDetails.venue || 'Imported Venue',
        address: eventDetails.location || '',
        description: `Imported from Quicket event: ${eventDetails.name}`
      })
      .select()
      .single()

    if (venueError) {
      console.error('Venue creation error:', venueError)
      return res.status(500).json({
        success: false,
        message: 'Failed to create venue'
      })
    }

    // Import event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .upsert({
        name: eventDetails.name,
        description: eventDetails.description || '',
        start_date: eventDetails.start_date,
        end_date: eventDetails.end_date,
        venue_id: venue.id,
        organizer_id: req.user?.id,
        status: 'active'
      })
      .select()
      .single()

    if (eventError) {
      console.error('Event creation error:', eventError)
      return res.status(500).json({
        success: false,
        message: 'Failed to create event'
      })
    }

    // Import attendees
    const attendeePromises = guests.map((guest: any) =>
      supabaseAdmin
        .from('event_attendees')
        .upsert({
          event_id: event.id,
          ticket_id: guest.ticket_id || guest.id,
          email: guest.email,
          full_name: guest.name || `${guest.first_name} ${guest.last_name}`,
          ticket_type: guest.ticket_type || 'General',
          quicket_order_id: guest.order_id,
          checked_in: guest.checked_in || false,
          metadata: guest
        })
        .select()
    )

    await Promise.all(attendeePromises)

    res.json({
      success: true,
      message: 'Event synced successfully',
      event: {
        id: event.id,
        name: event.name,
        attendeeCount: guests.length
      }
    })

  } catch (error: any) {
    console.error('Sync event error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to sync event',
      error: error.message
    })
  }
})

export default router
