import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

/**
 * Save a qualified lead
 * POST /api/leads
 * Body: { sponsor_id, attendee_id, event_id, full_name, email, company, job_title, notes }
 */
router.post('/', async (req: any, res: Response) => {
  try {
    const { sponsor_id, attendee_id, event_id, full_name, email, company, job_title, notes } = req.body

    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: 'full_name and email are required' })
    }

    const insertRow = {
      sponsor_id: sponsor_id || null,
      attendee_id: attendee_id || null,
      event_id: event_id || null,
      full_name: full_name.trim(),
      email: email.trim(),
      company: company || null,
      job_title: job_title || null,
      notes: notes || null
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(insertRow)
      .select()
      .single()

    if (error) {
      console.error('Failed to save lead:', error)
      return res.status(500).json({ success: false, message: 'Failed to save lead', error: error.message || String(error) })
    }

    res.status(201).json({ success: true, lead: data })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Save lead error:', msg)
    res.status(500).json({ success: false, message: 'Save lead failed', error: msg })
  }
})

export default router
