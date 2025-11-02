import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import qrcode from 'qrcode'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// Simple CSV parser for small uploads (handles basic, non-quoted CSV)
function parseCsv(csvText: string) {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim())
    const out: Record<string, string> = {}
    headers.forEach((h, i) => { out[h] = cols[i] ?? '' })
    return out
  })
  return rows
}

/**
 * Admin CSV upload
 * POST /api/attendees/admin/upload
 * Body: { csv?: string } OR JSON array of attendees
 */
router.post('/admin/upload', authenticateToken, async (req: any, res: Response) => {
  try {
    // Accept either a CSV string in `csv` or a JSON array in the body
    let items: Array<Record<string, string>> = []

    if (req.body && Array.isArray(req.body)) {
      items = req.body
    } else if (req.body && typeof req.body.csv === 'string') {
      items = parseCsv(req.body.csv)
    } else if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      // If object but not array, try to find attendees field
      if (Array.isArray((req.body as any).attendees)) items = (req.body as any).attendees
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No attendees provided' })
    }

    const toInsert = [] as any[]

    for (const r of items) {
      const email = (r.email || r.Email || '').toString().trim()
      const first_name = (r.first_name || r.FirstName || r.firstName || r['First Name'] || '').toString()
      const last_name = (r.last_name || r.LastName || r.lastName || r['Last Name'] || '').toString()
      const company = (r.company || r.Company || '').toString()
      const job_title = (r.job_title || r.JobTitle || r.title || r['Job Title'] || '').toString()
      const ticket_type = (r.ticket_type || r.TicketType || r.ticket || '').toString()
      const event_id = (r.event_id || r.eventId || '').toString()

  const id = cryptoRandomId()
  const qr_code_id = cryptoRandomId()

      // Generate a small QR data url containing the qr_code_id
      let qr_data_url: string | null = null
      try {
        qr_data_url = await qrcode.toDataURL(qr_code_id)
      } catch (err) {
        qr_data_url = null
      }

      toInsert.push({
        id,
        email,
        first_name,
        last_name,
        company,
        job_title,
        ticket_type,
        event_id: event_id || null,
        qr_code_id,
        qr_code_data_url: qr_data_url,
        created_at: new Date().toISOString(),
      })
    }

    const { data, error } = await supabaseAdmin
      .from('attendees')
      .insert(toInsert)
      .select()

    if (error) {
      console.error('Failed inserting attendees:', String(error))
      return res.status(500).json({ success: false, message: 'Failed to insert attendees', error: String(error) })
    }

    res.status(201).json({ success: true, created: data?.length ?? toInsert.length, attendees: data })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Attendees upload error:', msg)
    res.status(500).json({ success: false, message: 'Failed processing attendees upload', error: msg })
  }
})

/**
 * Lookup attendee by email+event or by qr_code_id
 * POST /api/attendees/lookup
 * Body: { email?, eventId?, qr_code_id? }
 */
router.post('/lookup', async (req: any, res: Response) => {
  try {
    const { email, eventId, qr_code_id } = req.body

    if (!email && !qr_code_id) {
      return res.status(400).json({ success: false, message: 'email or qr_code_id required' })
    }

    let query = supabaseAdmin.from('attendees').select('*').limit(1)

    if (qr_code_id) {
      query = query.eq('qr_code_id', qr_code_id)
    } else {
      query = query.eq('email', email)
      if (eventId) query = query.eq('event_id', eventId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Attendee lookup error:', String(error))
      return res.status(500).json({ success: false, message: 'Lookup failed', error: String(error) })
    }

    const attendee = (data && Array.isArray(data) && data[0]) || null
    if (!attendee) return res.status(404).json({ success: false, message: 'Not found' })

    res.json({ success: true, attendee })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Attendee lookup exception:', msg)
    res.status(500).json({ success: false, message: 'Attendee lookup failed', error: msg })
  }
})

function cryptoRandomId() {
  // Prefer built-in randomUUID when available
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { randomUUID } = require('crypto')
    return randomUUID()
  } catch (e) {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }
}

export default router
