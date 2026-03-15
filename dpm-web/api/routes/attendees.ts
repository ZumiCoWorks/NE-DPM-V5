import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import qrcode from 'qrcode'
import { authenticateToken } from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()

// ---------------------------------------------------------------------------
// POPIA-compliant hashing helpers
// Raw email / phone MUST NOT be stored in the database — only SHA-256 hashes.
// ---------------------------------------------------------------------------

/**
 * Normalise an identifier before hashing so that different formatting of the
 * same value always produces the same hash.
 *   - Email  → trim + lowercase
 *   - Phone  → keep digits only
 */
function normalizeIdentifier(input: string): string {
  const trimmed = input.trim()
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase()
  }
  // Phone — keep digits only
  return trimmed.replace(/\D/g, '')
}

/** Returns the lowercase hex SHA-256 digest of a normalised identifier. */
function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(normalizeIdentifier(input)).digest('hex')
}

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
 * Admin CSV upload — supports Quicket guestlist exports.
 *
 * Accepted column names (case-insensitive, space or underscore separated):
 *   email / Email / EMAIL
 *   phone / Phone / PHONE / phone_number / Phone Number
 *   first_name / First Name / FirstName
 *   last_name  / Last Name  / LastName
 *   ticket_type / Ticket Type / TicketType / ticket
 *   event_id
 *
 * POPIA compliance: raw email/phone values are NEVER stored in the database.
 * They are hashed with SHA-256 before insertion.
 *
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
      // Support Quicket column names as well as generic column names
      const rawEmail = (r.email || r.Email || r.EMAIL || '').toString().trim()
      const rawPhone = (r.phone || r.Phone || r.PHONE || r.phone_number || r['Phone Number'] || '').toString().trim()
      const first_name = (r.first_name || r.FirstName || r.firstName || r['First Name'] || '').toString()
      const last_name = (r.last_name || r.LastName || r.lastName || r['Last Name'] || '').toString()
      const company = (r.company || r.Company || '').toString()
      const job_title = (r.job_title || r.JobTitle || r.title || r['Job Title'] || '').toString()
      const ticket_type = (r.ticket_type || r.TicketType || r['Ticket Type'] || r.ticket || '').toString()
      const event_id = (r.event_id || r.eventId || req.body.event_id || '').toString()

      // POPIA: hash identifiers — do not store raw email or phone
      const email_hash = rawEmail ? sha256Hex(rawEmail) : null
      const phone_hash = rawPhone ? sha256Hex(rawPhone) : null

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
        email_hash,
        phone_hash,
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
 * Lookup attendee by email+event or by qr_code_id.
 * When an email is provided it is hashed before the lookup so that raw PII
 * is never compared against the database.
 *
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
      // POPIA: hash the supplied email before comparing
      const emailHash = sha256Hex(email)
      query = query.eq('email_hash', emailHash)
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

/**
 * Identity verification — used by the attendee self-check-in flow.
 * The client hashes the user's email or phone with SHA-256 and sends only
 * the hash; raw PII never reaches this endpoint.
 *
 * POST /api/attendees/verify
 * Body: { identifier_hash: string, event_id?: string }
 * Response 200: { success: true, attendee_id: string, ticket_type: string }
 * Response 404: { success: false, message: 'Not found' }
 */
router.post('/verify', async (req: any, res: Response) => {
  try {
    const { identifier_hash, event_id } = req.body

    if (!identifier_hash || typeof identifier_hash !== 'string') {
      return res.status(400).json({ success: false, message: 'identifier_hash is required' })
    }

    // Match against both email_hash and phone_hash columns.
    // We run two targeted .eq() queries and return the first match, avoiding
    // any string interpolation into the PostgREST filter expression.
    const results = await Promise.all([
      supabaseAdmin
        .from('attendees')
        .select('id, ticket_type, event_id')
        .eq('email_hash', identifier_hash)
        .limit(1),
      supabaseAdmin
        .from('attendees')
        .select('id, ticket_type, event_id')
        .eq('phone_hash', identifier_hash)
        .limit(1),
    ])

    // Surface the first DB error, if any
    const dbError = results.find((r) => r.error)?.error
    if (dbError) {
      console.error('Attendee verify error:', String(dbError))
      return res.status(500).json({ success: false, message: 'Verification failed', error: String(dbError) })
    }

    // Pick the first row that matched (email_hash first, then phone_hash)
    const attendee =
      (results[0].data && results[0].data[0]) ||
      (results[1].data && results[1].data[0]) ||
      null

    if (!attendee) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }

    res.json({
      success: true,
      attendee_id: attendee.id,
      ticket_type: attendee.ticket_type || 'General',
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Attendee verify exception:', msg)
    res.status(500).json({ success: false, message: 'Verification failed', error: msg })
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
