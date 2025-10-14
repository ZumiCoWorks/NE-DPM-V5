/**
 * CDV Reports API Routes
 * Handles Contextual Dwell Verification data from B2C mobile app
 */

import express from 'express'
import { supabase } from '../lib/supabase.js'
import { detectZoneFromCoordinates } from './hvz-zones.js'

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
      device_info,
      x_coordinate,
      y_coordinate
    } = req.body

    // Validate required fields
    if (!attendee_id || dwell_time_minutes === undefined || active_engagement_status === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: attendee_id, dwell_time_minutes, active_engagement_status'
      })
    }

    // 🎯 AUTOMATIC ZONE DETECTION (The Critical B2B Feature!)
    let detectedZone = null
    let finalZoneName = zone_name
    let finalZoneCoordinates = zone_coordinates

    // If coordinates provided, try to detect which HVZ zone the user is in
    if (x_coordinate !== undefined && y_coordinate !== undefined && event_id) {
      detectedZone = detectZoneFromCoordinates(
        parseFloat(x_coordinate), 
        parseFloat(y_coordinate), 
        event_id
      )
      
      if (detectedZone) {
        finalZoneName = detectedZone.zone_name
        finalZoneCoordinates = {
          x: detectedZone.x_coordinate,
          y: detectedZone.y_coordinate,
          width: detectedZone.width,
          height: detectedZone.height,
          sponsor: detectedZone.sponsor_name,
          hourly_rate: detectedZone.hourly_rate,
          priority: detectedZone.priority_level
        }
        console.log(`🎯 ZONE DETECTED: ${detectedZone.zone_name} (${detectedZone.sponsor_name}) - Revenue: $${detectedZone.hourly_rate}/hr`)
      }
    }

    // For demo purposes - mock storage since we don't have real Supabase
    const mockReport = {
      id: `cdv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attendee_id,
      dwell_time_minutes: parseFloat(dwell_time_minutes),
      active_engagement_status: Boolean(active_engagement_status),
      event_id: event_id || 'event-1', // Default for demo
      venue_id: venue_id || null,
      zone_coordinates: finalZoneCoordinates,
      zone_name: finalZoneName,
      session_id: session_id || null,
      device_info: device_info || null,
      // Store original coordinates for debugging
      raw_coordinates: { x: x_coordinate, y: y_coordinate },
      detected_zone_id: detectedZone?.id || null,
      revenue_impact: detectedZone ? {
        sponsor: detectedZone.sponsor_name,
        hourly_rate: detectedZone.hourly_rate,
        estimated_value: (parseFloat(dwell_time_minutes) / 60) * detectedZone.hourly_rate
      } : null,
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