import { Router, Response } from 'express'
import { quicketService } from '../services/quicket.js'

const router = Router()

/**
 * Lookup ticket / attendee by email + eventId
 * POST /api/tickets/lookup
 * Body: { email: string, eventId: string }
 * Returns: { matched: boolean, attendee?: { attendee_id, name, ticket_tier, event_id } }
 */
router.post('/lookup', async (req, res: Response) => {
  try {
    const { email, eventId } = req.body

    if (!email || !eventId) {
      return res.status(400).json({ success: false, message: 'email and eventId are required' })
    }

    // If quicket service is in mock mode, matchAttendee will return a mocked result
    // Note: matchAttendee expects a userToken in live mode; for dev/mock we don't need it.
    const match = await quicketService.matchAttendee(email, eventId, '')

    if (!match || !match.matched) {
      return res.json({ success: true, matched: false })
    }

    return res.json({
      success: true,
      matched: true,
      attendee: {
        attendee_id: match.attendeeId,
        name: (match.ticketInfo && (match.ticketInfo as any).ticketType) ? (match.ticketInfo as any).ticketType : undefined,
        ticket_tier: (match.ticketInfo && (match.ticketInfo as any).ticketType) ? (match.ticketInfo as any).ticketType : undefined,
        event_id: eventId
      }
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Tickets lookup error:', msg)
    res.status(500).json({ success: false, message: 'Failed to lookup ticket', error: msg })
  }
})

export default router

