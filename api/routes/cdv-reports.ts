import { Router } from 'express'
import type { Request, Response } from 'express'

declare global {
  // lightweight global used for in-memory CDV reports in dev/demo
  var cdvReports: Array<Record<string, unknown>> | undefined
}

const router = Router()

// Simple in-memory storage
if (!global.cdvReports) {
  global.cdvReports = []
}

// POST /api/cdv-report - Save CDV report (from mobile app)
router.post('/cdv-report', async (req: Request, res: Response) => {
  try {
    const newReport: Record<string, unknown> = {
      ...req.body,
      id: `cdv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: req.body.created_at || new Date().toISOString()
    };

    (global.cdvReports as Array<Record<string, unknown>>).push(newReport)

    res.status(201).json({
      success: true,
      data: newReport
    })
  } catch {
    res.status(500).json({ error: 'Failed to save report' })
  }
})

// GET /api/cdv-reports/:eventId - Get all reports for event
router.get('/cdv-reports/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    
    const reports = (global.cdvReports || [])
      .filter((r: Record<string, unknown>) => String(r.event_id) === eventId)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime()
      )

    res.json({
      success: true,
      data: reports,
      count: reports.length
    })
  } catch {
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

// GET /api/cdv-reports/:eventId/revenue - Calculate revenue
router.get('/cdv-reports/:eventId/revenue', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
  const reports = (global.cdvReports || []).filter((r: Record<string, unknown>) => String(r.event_id) === eventId)
    
    // Group by zone
  const zoneRevenue: Record<string, { visits: number; totalDwell: number; activeEngagements: number; revenue: number }> = {}
    const zoneRates: Record<string, number> = {
      'Nedbank Main Stage': 12000,
      'Discovery VIP Lounge': 8000,
      'MTN Sponsor Pavilion': 5000,
      'Shoprite Food Court': 3000,
      'Standard Bank Innovation Hub': 7000
    }
    
    reports.forEach((r: Record<string, unknown>) => {
      const zoneName = String(r.zone_name || 'unknown')
      if (!zoneRevenue[zoneName]) {
        zoneRevenue[zoneName] = {
          visits: 0,
          totalDwell: 0,
          activeEngagements: 0,
          revenue: 0,
        }
      }

      const zone = zoneRevenue[zoneName]
      zone.visits++
      const dwell = Number((r.dwell_time_minutes as unknown) || 0)
      zone.totalDwell += dwell
      if (r.active_engagement_status) zone.activeEngagements++

      // Revenue = (dwell hours × hourly rate) × (1.5x if active)
      const hourlyRate = zoneRates[zoneName] || 0
      const dwellHours = dwell / 60
      let value = dwellHours * hourlyRate
      if (r.active_engagement_status) value *= 1.5
      zone.revenue += value
    })

    res.json({
      success: true,
      data: zoneRevenue,
  totalRevenue: Object.values(zoneRevenue).reduce((sum: number, z: { revenue: number }) => sum + z.revenue, 0)
    })
  } catch {
    res.status(500).json({ error: 'Failed to calculate revenue' })
  }
})

export default router
