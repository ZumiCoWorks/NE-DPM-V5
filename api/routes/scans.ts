import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js'

const router = Router()

// Local interface for anonymous_scans rows to satisfy Supabase typings in this file.
interface AnonymousScanRow {
  booth_id: string | null
  anchor_id: string | null
  device_id: string
  attendee_id?: string | null
  attendee_name?: string | null
  ticket_tier?: string | null
}

/**
 * Log an anonymous scan event
 * POST /api/scans/log
 */
router.post('/log', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { device_id, anchor_id, event_id, booth_id, timestamp, attendee_id, attendee_name, ticket_tier } = req.body

    if (!device_id || !anchor_id || !event_id) {
      return res.status(400).json({
        success: false,
        message: 'device_id, anchor_id, and event_id are required'
      })
    }

    const insertRow = {
      device_id,
      anchor_id,
      event_id,
      booth_id,
      timestamp: timestamp || new Date().toISOString(),
      attendee_id: attendee_id || null,
      attendee_name: attendee_name || null,
      ticket_tier: ticket_tier || null,
    }

    const { data, error } = await supabaseAdmin
      .from('anonymous_scans')
      .insert(insertRow)
      .select()
      .single()

    if (error) {
      console.error('Error logging scan:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to log scan',
        error: error.message
      })
    }

    // Friendly dev log to make it obvious in terminal during demos
    try {
      console.info(`Scan logged: event=${insertRow.event_id} anchor=${insertRow.anchor_id ?? insertRow.booth_id ?? 'unknown'} device=${insertRow.device_id} attendee=${insertRow.attendee_id ?? 'anon'}`)
    } catch (logErr) {
      // non-fatal logging error
      console.debug('Scan log console.info failed:', String(logErr))
    }

    res.status(201).json({
      success: true,
      message: 'Scan logged successfully',
      scan: data
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Scan log error:', msg)
    res.status(500).json({
      success: false,
      message: 'Failed to log scan',
      error: msg
    })
  }
})

/**
 * Get scan analytics for an event
 * GET /api/scans/analytics/:eventId
 */
router.get('/analytics/:eventId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params

    const { data: scans, error } = await supabaseAdmin
      .from('anonymous_scans')
      .select('booth_id, anchor_id, device_id, attendee_id, attendee_name, ticket_tier')
      .eq('event_id', eventId)

    if (error) {
      const emsg = String(error)
      console.error('Error fetching scan analytics:', emsg)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch scan analytics',
        error: emsg
      })
    }

    // Aggregate data
    const boothAnalytics: { [key: string]: { total_scans: number; unique_devices: Set<string>; attendees: Map<string, { name?: string; ticket_tier?: string }> } } = {}

  const scansList: AnonymousScanRow[] = ((scans ?? []) as unknown) as AnonymousScanRow[]

    scansList.forEach((scan) => {
      const key = (scan.booth_id ?? scan.anchor_id ?? 'unknown') as string
      if (!boothAnalytics[key]) {
        boothAnalytics[key] = {
          total_scans: 0,
          unique_devices: new Set(),
          attendees: new Map(),
        }
      }
      boothAnalytics[key].total_scans++
      boothAnalytics[key].unique_devices.add(scan.device_id)
      if (scan.attendee_id) {
        boothAnalytics[key].attendees.set(scan.attendee_id, {
          name: scan.attendee_name || undefined,
          ticket_tier: scan.ticket_tier || undefined,
        })
      }
    })

    const result = Object.entries(boothAnalytics).map(([key, data]) => ({
      booth_id: key,
      total_scans: data.total_scans,
      unique_devices: data.unique_devices.size,
      unique_attendees: Array.from(data.attendees.entries()).map(([attendee_id, meta]) => ({ attendee_id, ...meta })),
    }))

    res.json({
      success: true,
      eventId,
      analytics: result
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Get scan analytics error:', msg)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan analytics',
      error: msg
    })
  }
})

/**
 * DEV-ONLY: Return scan analytics without requiring auth. Useful for local smoke tests.
 * GET /api/scans/analytics/dev/:eventId
 */
router.get('/analytics/dev/:eventId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ success: false, message: 'Dev-only endpoint' })
    }

    // Extra guard: require a dev token in header to reduce accidental exposure
    const expected = process.env.DEV_ANALYTICS_TOKEN || 'dev-token'
    const got = (req.headers['x-dev-token'] as string) || ''
    if (!got || got !== expected) {
      return res.status(403).json({ success: false, message: 'Missing or invalid X-Dev-Token header' })
    }

    const { eventId } = req.params

    const { data: scans, error } = await supabaseAdmin
      .from('anonymous_scans')
      .select('booth_id, anchor_id, device_id, attendee_id, attendee_name, ticket_tier')
      .eq('event_id', eventId)

    if (error) {
      const emsg = String(error)
      console.error('Error fetching scan analytics (dev):', emsg)
      return res.status(500).json({ success: false, message: 'Failed to fetch scan analytics', error: emsg })
    }

    // Aggregate data (same logic as authenticated endpoint)
    const boothAnalytics: { [key: string]: { total_scans: number; unique_devices: Set<string>; attendees: Map<string, { name?: string; ticket_tier?: string }> } } = {}

  const scansList: AnonymousScanRow[] = ((scans ?? []) as unknown) as AnonymousScanRow[]

    scansList.forEach((scan) => {
      const key = (scan.booth_id ?? scan.anchor_id ?? 'unknown') as string
      if (!boothAnalytics[key]) {
        boothAnalytics[key] = {
          total_scans: 0,
          unique_devices: new Set(),
          attendees: new Map(),
        }
      }
      boothAnalytics[key].total_scans++
      boothAnalytics[key].unique_devices.add(scan.device_id)
      if (scan.attendee_id) {
        boothAnalytics[key].attendees.set(scan.attendee_id, {
          name: scan.attendee_name || undefined,
          ticket_tier: scan.ticket_tier || undefined,
        })
      }
    })

    const result = Object.entries(boothAnalytics).map(([key, data]) => ({
      booth_id: key,
      total_scans: data.total_scans,
      unique_devices: data.unique_devices.size,
      unique_attendees: Array.from(data.attendees.entries()).map(([attendee_id, meta]) => ({ attendee_id, ...meta })),
    }))

    res.json({ success: true, eventId, analytics: result })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Get scan analytics (dev) error:', msg)
    res.status(500).json({ success: false, message: 'Failed to fetch scan analytics', error: msg })
  }
})

export default router
