import { Router } from 'express'
import type { Request, Response } from 'express'

const router = Router()

// Simple in-memory storage
if (!global.cdvReports) {
  global.cdvReports = []
}

// POST /api/cdv-report - Save CDV report (from mobile app)
router.post('/cdv-report', async (req: Request, res: Response) => {
  try {
    const report = {
      ...req.body,
      id: `cdv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: req.body.created_at || new Date().toISOString()
    }
    
    global.cdvReports.push(report)

    res.status(201).json({
      success: true,
      data: report
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save report' })
  }
})

// GET /api/cdv-reports/:eventId - Get all reports for event
router.get('/cdv-reports/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    
    const reports = (global.cdvReports || [])
      .filter((r: any) => r.event_id === eventId)
      .sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

    res.json({
      success: true,
      data: reports,
      count: reports.length
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

// GET /api/cdv-reports/:eventId/revenue - Calculate revenue
router.get('/cdv-reports/:eventId/revenue', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const reports = (global.cdvReports || []).filter((r: any) => r.event_id === eventId)
    
    // Group by zone
    const zoneRevenue: Record<string, any> = {}
    const zoneRates: Record<string, number> = {
      'Nedbank Main Stage': 12000,
      'Discovery VIP Lounge': 8000,
      'MTN Sponsor Pavilion': 5000,
      'Shoprite Food Court': 3000,
      'Standard Bank Innovation Hub': 7000
    }
    
    reports.forEach((r: any) => {
      if (!zoneRevenue[r.zone_name]) {
        zoneRevenue[r.zone_name] = { 
          visits: 0, 
          totalDwell: 0, 
          activeEngagements: 0,
          revenue: 0 
        }
      }
      
      const zone = zoneRevenue[r.zone_name]
      zone.visits++
      zone.totalDwell += r.dwell_time_minutes || 0
      if (r.active_engagement_status) zone.activeEngagements++
      
      // Revenue = (dwell hours × hourly rate) × (1.5x if active)
      const hourlyRate = zoneRates[r.zone_name] || 0
      const dwellHours = (r.dwell_time_minutes || 0) / 60
      let value = dwellHours * hourlyRate
      if (r.active_engagement_status) value *= 1.5
      zone.revenue += value
    })

    res.json({
      success: true,
      data: zoneRevenue,
      totalRevenue: Object.values(zoneRevenue).reduce((sum: number, z: any) => sum + z.revenue, 0)
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate revenue' })
  }
})

export default router
