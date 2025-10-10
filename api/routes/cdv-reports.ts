/**
 * CDV Reports API Routes
 * Handles Contextual Dwell Verification data from B2C mobile app
 */

import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * POST /api/cdv-report
 * Receives CDV engagement data from B2C app
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

    // For demo purposes - mock storage since we don't have real Supabase
    const mockReport = {
      id: `cdv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attendee_id,
      dwell_time_minutes: parseFloat(dwell_time_minutes),
      active_engagement_status: Boolean(active_engagement_status),
      event_id: event_id || null,
      venue_id: venue_id || null,
      zone_coordinates: zone_coordinates || null,
      zone_name: zone_name || null,
      session_id: session_id || null,
      device_info: device_info || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Store in global array for demo (in production this would go to Supabase)
    if (!global.cdvReports) {
      global.cdvReports = []
    }
    global.cdvReports.push(mockReport)

    console.log('📊 New CDV Report:', mockReport)

    res.status(201).json({
      success: true,
      message: 'CDV report saved successfully',
      data: mockReport,
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
 * Retrieve CDV reports
 */
router.get('/cdv-report', async (req, res) => {
  try {
    const { limit = '50' } = req.query
    
    // Get mock reports
    const reports = global.cdvReports || []
    const limitedReports = reports.slice(0, parseInt(limit as string))

    res.json({
      success: true,
      data: limitedReports,
      count: limitedReports.length,
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
 * Get engagement statistics
 */
router.get('/cdv-report/stats', async (req, res) => {
  try {
    const reports = global.cdvReports || []
    
    const totalReports = reports.length
    const activeEngagements = reports.filter(r => r.active_engagement_status).length
    const engagementRate = totalReports > 0 ? (activeEngagements / totalReports) * 100 : 0
    const avgDwellTime = totalReports > 0 
      ? reports.reduce((sum, r) => sum + parseFloat(r.dwell_time_minutes), 0) / totalReports 
      : 0

    // Recent activity (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentActivity = reports.filter(r => new Date(r.created_at) > fiveMinutesAgo).length

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