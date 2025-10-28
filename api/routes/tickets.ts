import { Router, Response } from 'express'
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js'
import { quicketService } from '../services/quicket.js'

const router = Router()

// POST /api/tickets/lookup
// Body: { email: string, event_id: string }
// Returns: { matched: boolean, attendee_id?: string, name?: string, ticket_tier?: string }
router.post('/lookup', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, event_id } = req.body || {}
    if (!email || !event_id) {
      return res.status(400).json({ success: false, message: 'email and event_id are required' })
    }

    // Pull Quicket user token from header (x-quicket-user-token) or fall back to API key mock
    const userToken = (req.headers['x-quicket-user-token'] as string) || ''

    const match = await quicketService.matchAttendee(email, event_id, userToken)

    if (!match.matched) {
      return res.json({ success: true, matched: false })
    }

    const name = email // Minimal name fallback; can be improved with orders data if available
    const ticket_tier = match.ticketInfo?.TicketType || 'Unknown'

    return res.json({
      success: true,
      matched: true,
      attendee_id: match.attendeeId,
      name,
      ticket_tier,
    })
  } catch (error: any) {
    console.error('Ticket lookup error:', error)
    return res.status(500).json({ success: false, message: 'Ticket lookup failed', error: error.message })
  }
})

export default router


