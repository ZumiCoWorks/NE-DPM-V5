/**
 * CDV Reports API Routes
 * Handles Contextual Dwell Verification data from B2C mobile app
 */

import express from 'express'
import { supabaseAdmin as supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * POST /api/cdv-report
 * Receives CDV engagement data from B2C app
 * Payload: { attendee_id, dwell_time_minutes, active_engagement_status, event_id?, venue_id?, zone_coordinates?, zone_name?, session_id?, device_info? }
 */
router.post('/cdv-report', async (req, res) => {
  try {
    const {
      attendee_id,
      dwell_time_minutes,
      active_engagement_status,
      event_id,
      venue_id,
      zone_coordinates,
      zone_name,
      session_id,
      device_info
    } = req.body

    // Validate required fields
    if (!attendee_id || dwell_time_minutes === undefined || active_engagement_status === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: attendee_id, dwell_time_minutes, active_engagement_status'
      })
    }

    // Insert CDV report into Supabase
    const { data, error } = await supabase
      .from('cdv_reports')
      .insert([{
        attendee_id,
        dwell_time_minutes: parseFloat(dwell_time_minutes),
        active_engagement_status: Boolean(active_engagement_status),
        event_id: event_id || null,
        venue_id: venue_id || null,
        zone_coordinates: zone_coordinates || null,
        zone_name: zone_name || null,
        session_id: session_id || null,
        device_info: device_info || null
      }])
      .select()

    if (error) {
      console.error('Error inserting CDV report:', error)
      return res.status(500).json({ 
        error: 'Failed to save CDV report',
        details: error.message 
      })
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: 'CDV report saved successfully',
      data: data[0],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('CDV Report API Error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
})

/**
 * GET /api/cdv-report
 * Retrieve CDV reports (for testing/admin purposes)
 */
router.get('/cdv-report', async (req, res) => {
  try {
    const { event_id, venue_id, limit = '50' } = req.query

    let query = supabase
      .from('cdv_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string))

    // Filter by event_id if provided
    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    // Filter by venue_id if provided  
    if (venue_id) {
      query = query.eq('venue_id', venue_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching CDV reports:', error)
      return res.status(500).json({ 
        error: 'Failed to fetch CDV reports',
        details: error.message 
      })
    }

    res.json({
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('CDV Reports GET Error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
})

/**
 * GET /api/cdv-report/stats
 * Real-time engagement statistics for dashboard
 */
router.get('/cdv-report/stats', async (req, res) => {
  try {
    const { event_id, venue_id } = req.query

    let query = supabase
      .from('cdv_reports')
      .select('active_engagement_status, dwell_time_minutes, created_at')

    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (venue_id) {
      query = query.eq('venue_id', venue_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching CDV stats:', error)
      return res.status(500).json({ 
        error: 'Failed to fetch CDV stats',
        details: error.message 
      })
    }

    // Calculate statistics
    const totalReports = data.length
    const activeEngagements = data.filter(r => r.active_engagement_status).length
    const engagementRate = totalReports > 0 ? (activeEngagements / totalReports) * 100 : 0
    const avgDwellTime = totalReports > 0 
      ? data.reduce((sum, r) => sum + parseFloat(r.dwell_time_minutes), 0) / totalReports 
      : 0

    // Recent activity (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentActivity = data.filter(r => new Date(r.created_at) > oneHourAgo).length

    res.json({
      success: true,
      stats: {
        totalReports,
        activeEngagements,
        engagementRate: Math.round(engagementRate * 100) / 100,
        avgDwellTime: Math.round(avgDwellTime * 100) / 100,
        recentActivity
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('CDV Stats Error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
})

export default router