import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth.js'

const router = Router()

// Middleware to validate vendor API key for vendor-specific endpoints
const authenticateVendor = async (req: any, res: Response, next: any) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' })
    }

    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (error || !vendor) {
      return res.status(401).json({ error: 'Invalid API key' })
    }

    req.vendor = vendor
    next()
  } catch (error) {
    console.error('Vendor authentication error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

// Get real-time heatmap data for an event
router.get('/heatmap/:eventId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { eventId } = req.params
    const { timeRange = '1h', zoneId } = req.query

    // Verify event belongs to the organizer
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organizer_id', req.user.id)
      .single()

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found or access denied' })
    }

    // Calculate time range
    const now = new Date()
    let startTime = new Date()
    
    switch (timeRange) {
      case '15m':
        startTime.setMinutes(now.getMinutes() - 15)
        break
      case '1h':
        startTime.setHours(now.getHours() - 1)
        break
      case '6h':
        startTime.setHours(now.getHours() - 6)
        break
      case '24h':
        startTime.setDate(now.getDate() - 1)
        break
      default:
        startTime.setHours(now.getHours() - 1)
    }

    // Build query for visitor tracking data
    let query = supabaseAdmin
      .from('visitor_tracking')
      .select(`
        id,
        visitor_id,
        x_coordinate,
        y_coordinate,
        timestamp,
        dwell_time_seconds,
        zone_id,
        heat_zones (id, name, zone_type)
      `)
      .eq('event_id', eventId)
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: false })

    if (zoneId) {
      query = query.eq('zone_id', zoneId)
    }

    const { data: trackingData, error: trackingError } = await query.limit(10000)

    if (trackingError) {
      console.error('Error fetching tracking data:', trackingError)
      return res.status(500).json({ error: 'Failed to fetch heatmap data' })
    }

    // Get heat zones for the event
    const { data: heatZones, error: zonesError } = await supabaseAdmin
      .from('heat_zones')
      .select('*')
      .eq('event_id', eventId)

    if (zonesError) {
      console.error('Error fetching heat zones:', zonesError)
      return res.status(500).json({ error: 'Failed to fetch heat zones' })
    }

    // Process data for heatmap visualization
    const heatmapData = {
      zones: heatZones,
      visitorData: trackingData,
      timeRange,
      totalVisitors: new Set(trackingData.map(d => d.visitor_id)).size,
      lastUpdated: now.toISOString()
    }

    res.json(heatmapData)
  } catch (error) {
    console.error('Heatmap data error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get engagement velocity reports for an event
router.get('/engagement/:eventId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { eventId } = req.params
    const { period = '1h', zoneId } = req.query

    // Verify event belongs to the organizer
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organizer_id', req.user.id)
      .single()

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found or access denied' })
    }

    // Calculate time range for engagement metrics
    const now = new Date()
    let startTime = new Date()
    
    switch (period) {
      case '1h':
        startTime.setHours(now.getHours() - 1)
        break
      case '6h':
        startTime.setHours(now.getHours() - 6)
        break
      case '24h':
        startTime.setDate(now.getDate() - 1)
        break
      case '7d':
        startTime.setDate(now.getDate() - 7)
        break
      default:
        startTime.setHours(now.getHours() - 1)
    }

    // Build query for engagement metrics
    let query = supabaseAdmin
      .from('engagement_metrics')
      .select(`
        *,
        heat_zones (id, name, zone_type)
      `)
      .eq('event_id', eventId)
      .gte('time_bucket', startTime.toISOString())
      .order('time_bucket', { ascending: true })

    if (zoneId) {
      query = query.eq('zone_id', zoneId)
    }

    const { data: engagementData, error: engagementError } = await query

    if (engagementError) {
      console.error('Error fetching engagement data:', engagementError)
      return res.status(500).json({ error: 'Failed to fetch engagement data' })
    }

    // Calculate velocity metrics
    const velocityReport = {
      period,
      metrics: engagementData,
      summary: {
        totalVisitors: engagementData.reduce((sum, metric) => sum + metric.visitor_count, 0),
        avgEngagementScore: engagementData.length > 0 
          ? engagementData.reduce((sum, metric) => sum + metric.engagement_score, 0) / engagementData.length 
          : 0,
        avgDwellTime: engagementData.length > 0 
          ? engagementData.reduce((sum, metric) => sum + metric.avg_dwell_time_seconds, 0) / engagementData.length 
          : 0,
        peakOccupancy: Math.max(...engagementData.map(metric => metric.peak_occupancy), 0)
      },
      lastUpdated: now.toISOString()
    }

    res.json(velocityReport)
  } catch (error) {
    console.error('Engagement velocity error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get bottleneck alerts for an event
router.get('/bottlenecks/:eventId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { eventId } = req.params
    const { severity, resolved = 'false' } = req.query

    // Verify event belongs to the organizer
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organizer_id', req.user.id)
      .single()

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found or access denied' })
    }

    // Build query for bottleneck alerts
    let query = supabaseAdmin
      .from('bottleneck_alerts')
      .select(`
        *,
        heat_zones (id, name, zone_type, capacity)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (resolved === 'false') {
      query = query.eq('is_resolved', false)
    } else if (resolved === 'true') {
      query = query.eq('is_resolved', true)
    }

    const { data: alerts, error: alertsError } = await query.limit(100)

    if (alertsError) {
      console.error('Error fetching bottleneck alerts:', alertsError)
      return res.status(500).json({ error: 'Failed to fetch bottleneck alerts' })
    }

    // Get current zone occupancy for active alerts
    const activeAlerts = alerts.filter(alert => !alert.is_resolved)
    const zoneIds = activeAlerts.map(alert => alert.zone_id)
    
    let currentOccupancy = []
    if (zoneIds.length > 0) {
      const { data: occupancyData, error: occupancyError } = await supabaseAdmin
        .from('visitor_tracking')
        .select('zone_id')
        .eq('event_id', eventId)
        .in('zone_id', zoneIds)
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

      if (!occupancyError && occupancyData) {
        const occupancyCount = occupancyData.reduce((acc: any, item: any) => {
          acc[item.zone_id] = (acc[item.zone_id] || 0) + 1
          return acc
        }, {})
        
        currentOccupancy = Object.entries(occupancyCount).map(([zoneId, count]) => ({
          zone_id: zoneId,
          current_count: count
        }))
      }
    }

    const bottleneckReport = {
      alerts,
      currentOccupancy,
      summary: {
        totalAlerts: alerts.length,
        activeAlerts: activeAlerts.length,
        criticalAlerts: alerts.filter(alert => alert.severity === 'critical' && !alert.is_resolved).length,
        highAlerts: alerts.filter(alert => alert.severity === 'high' && !alert.is_resolved).length
      },
      lastUpdated: new Date().toISOString()
    }

    res.json(bottleneckReport)
  } catch (error) {
    console.error('Bottleneck alerts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Resolve a bottleneck alert
router.put('/bottlenecks/:alertId/resolve', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { alertId } = req.params

    // Verify alert belongs to an event owned by the organizer
    const { data: alert, error: alertError } = await supabaseAdmin
      .from('bottleneck_alerts')
      .select(`
        id,
        events!inner (organizer_id)
      `)
      .eq('id', alertId)
      .single()

    if (alertError || !alert || (alert as any).events.organizer_id !== req.user.id) {
      return res.status(404).json({ error: 'Alert not found or access denied' })
    }

    const { data: updatedAlert, error: updateError } = await supabaseAdmin
      .from('bottleneck_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single()

    if (updateError) {
      console.error('Error resolving alert:', updateError)
      return res.status(500).json({ error: 'Failed to resolve alert' })
    }

    res.json({ alert: updatedAlert })
  } catch (error) {
    console.error('Resolve alert error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Vendor-specific analytics endpoint
router.get('/vendor/:vendorId/analytics', authenticateVendor, async (req: any, res: Response) => {
  try {
    const { vendorId } = req.params
    const { eventId, startDate, endDate, dataType = 'aggregated' } = req.query

    // Verify vendor ID matches authenticated vendor
    if (req.vendor.id !== vendorId) {
      return res.status(403).json({ error: 'Access denied to this vendor data' })
    }

    // Check vendor's data access level
    const allowedDataTypes = {
      'basic': ['aggregated'],
      'premium': ['aggregated', 'detailed'],
      'enterprise': ['aggregated', 'detailed', 'real_time']
    }

    if (!allowedDataTypes[req.vendor.subscription_tier]?.includes(dataType)) {
      return res.status(403).json({ error: 'Data type not allowed for your subscription tier' })
    }

    // Log vendor API access for billing
    await supabaseAdmin
      .from('vendor_analytics')
      .insert({
        vendor_id: vendorId,
        event_id: eventId || null,
        api_endpoint: `/vendor/${vendorId}/analytics`,
        request_count: 1,
        billing_tier: req.vendor.subscription_tier
      })

    let analyticsData = {}

    if (dataType === 'aggregated') {
      // Return aggregated engagement metrics
      let query = supabaseAdmin
        .from('engagement_metrics')
        .select(`
          time_bucket,
          visitor_count,
          avg_dwell_time_seconds,
          engagement_score,
          heat_zones (name, zone_type)
        `)

      if (eventId) {
        query = query.eq('event_id', eventId)
      }

      if (startDate) {
        query = query.gte('time_bucket', startDate)
      }

      if (endDate) {
        query = query.lte('time_bucket', endDate)
      }

      const { data: metrics, error } = await query.limit(1000)

      if (error) {
        console.error('Error fetching vendor analytics:', error)
        return res.status(500).json({ error: 'Failed to fetch analytics data' })
      }

      analyticsData = {
        type: 'aggregated',
        metrics,
        summary: {
          totalDataPoints: metrics.length,
          avgEngagement: metrics.length > 0 
            ? metrics.reduce((sum: number, m: any) => sum + m.engagement_score, 0) / metrics.length 
            : 0
        }
      }
    } else if (dataType === 'detailed' && req.vendor.subscription_tier !== 'basic') {
      // Return detailed visitor tracking data (anonymized)
      let query = supabaseAdmin
        .from('visitor_tracking')
        .select(`
          timestamp,
          x_coordinate,
          y_coordinate,
          dwell_time_seconds,
          zone_id,
          heat_zones (name, zone_type)
        `)

      if (eventId) {
        query = query.eq('event_id', eventId)
      }

      if (startDate) {
        query = query.gte('timestamp', startDate)
      }

      if (endDate) {
        query = query.lte('timestamp', endDate)
      }

      const { data: trackingData, error } = await query.limit(5000)

      if (error) {
        console.error('Error fetching detailed analytics:', error)
        return res.status(500).json({ error: 'Failed to fetch detailed analytics data' })
      }

      analyticsData = {
        type: 'detailed',
        trackingData,
        summary: {
          totalDataPoints: trackingData.length
        }
      }
    }

    res.json({
      vendor: {
        id: req.vendor.id,
        name: req.vendor.name,
        subscription_tier: req.vendor.subscription_tier,
        data_access_level: req.vendor.data_access_level
      },
      data: analyticsData,
      requestInfo: {
        timestamp: new Date().toISOString(),
        dataType,
        eventId: eventId || 'all_events'
      }
    })
  } catch (error) {
    console.error('Vendor analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router