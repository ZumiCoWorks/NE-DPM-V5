import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js'

const router = Router()

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

    const { data, error } = await supabaseAdmin
      .from('anonymous_scans')
      .insert({
        device_id,
        anchor_id,
        event_id,
        booth_id,
        timestamp: timestamp || new Date().toISOString(),
        attendee_id: attendee_id || null,
        attendee_name: attendee_name || null,
        ticket_tier: ticket_tier || null,
      })
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

    res.status(201).json({
      success: true,
      message: 'Scan logged successfully',
      scan: data
    })
  } catch (error: any) {
    console.error('Scan log error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to log scan',
      error: error.message
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
      console.error('Error fetching scan analytics:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch scan analytics',
        error: error.message
      })
    }

    // Aggregate data
    const boothAnalytics: { [key: string]: { total_scans: number; unique_devices: Set<string>; attendees: Map<string, { name?: string; ticket_tier?: string }> } } = {}

    scans.forEach((scan) => {
      const key = scan.booth_id || scan.anchor_id
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
  } catch (error: any) {
    console.error('Get scan analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan analytics',
      error: error.message
    })
  }
})

export default router
