import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/sponsors/:sponsorId/leads?format=csv
 * Returns JSON by default or CSV when format=csv
 */
router.get('/:sponsorId/leads', authenticateToken, async (req: any, res: Response) => {
  try {
    const { sponsorId } = req.params
    const { format } = req.query

    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('id, sponsor_id, staff_id, attendee_id, rating, note, timestamp')
      .eq('sponsor_id', sponsorId)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Failed fetching sponsor leads:', String(error))
      return res.status(500).json({ success: false, message: 'Failed to fetch leads', error: String(error) })
    }

    const leads = data || []

    if (format === 'csv') {
      // Build simple CSV
      const headers = ['id','sponsor_id','staff_id','attendee_id','rating','note','timestamp']
      const lines = [headers.join(',')]
      for (const row of leads) {
        const vals = headers.map(h => {
          const v = (row as any)[h]
          if (v === null || v === undefined) return ''
          return `"${String(v).replace(/"/g,'""')}"`
        })
        lines.push(vals.join(','))
      }
      const csv = lines.join('\n')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="sponsor_${sponsorId}_leads.csv"`)
      return res.send(csv)
    }

    res.json({ success: true, leads })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Sponsor leads error:', msg)
    res.status(500).json({ success: false, message: 'Failed to fetch leads', error: msg })
  }
})

export default router
