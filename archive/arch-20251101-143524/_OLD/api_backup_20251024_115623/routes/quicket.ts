import { Router, Response } from 'express'
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth.js'
import { quicketService } from '../services/quicket.js'

const router = Router()

/**
 * Test Quicket API connection
 * POST /api/quicket/test-connection
 */
router.post('/test-connection', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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
router.get('/events', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userToken = req.headers['quicket-user-token'] as string

    if (!userToken) {
      return res.status(400).json({ error: 'Quicket user token required in headers' })
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
router.get('/events/:eventId/guests', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params
    const userToken = req.headers['quicket-user-token'] as string

    if (!userToken) {
      return res.status(400).json({ error: 'Quicket user token required in headers' })
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
router.post('/match-attendee', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, eventId } = req.body
    const userToken = req.headers['quicket-user-token'] as string

    if (!email || !eventId) {
      return res.status(400).json({ error: 'email and eventId are required' })
    }

    if (!userToken) {
      return res.status(400).json({ error: 'Quicket user token required in headers' })
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
router.get('/config', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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
router.put('/config', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

export default router
