import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

/**
 * Save a qualified lead
 * POST /api/leads
 * Body: { sponsor_id, staff_id, attendee_id, event_id, rating, note, timestamp }
 */
router.post('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const { sponsor_id, staff_id, attendee_id, event_id, rating, note, timestamp } = req.body

    if (!sponsor_id || !staff_id || !attendee_id) {
      return res.status(400).json({ success: false, message: 'sponsor_id, staff_id and attendee_id are required' })
    }

    const insertRow = {
      sponsor_id,
      staff_id,
      attendee_id,
      event_id: event_id || null,
      rating: typeof rating === 'number' ? rating : (parseInt(rating, 10) || null),
      note: note || null,
      timestamp: timestamp || new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(insertRow)
      .select()
      .single()

    if (error) {
      console.error('Failed to save lead:', String(error))
      return res.status(500).json({ success: false, message: 'Failed to save lead', error: String(error) })
    }

    res.status(201).json({ success: true, lead: data })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Save lead error:', msg)
    res.status(500).json({ success: false, message: 'Save lead failed', error: msg })
  }
})

export default router
