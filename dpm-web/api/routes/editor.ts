import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// Persist QR node calibration
router.post('/qr-node', authenticateToken, async (req: any, res: Response) => {
  try {
    const { event_id, qr_id_text, x_coord, y_coord } = req.body as {
      event_id?: string
      qr_id_text?: string
      x_coord?: number
      y_coord?: number
    }

    if (!event_id || !qr_id_text || typeof x_coord !== 'number' || typeof y_coord !== 'number') {
      return res.status(400).json({ success: false, message: 'event_id, qr_id_text, x_coord, y_coord required' })
    }

    const { data, error } = await supabaseAdmin
      .from('map_qr_nodes')
      .insert({ event_id, qr_id_text, x_coord, y_coord })
      .select('*')
      .single()

    if (error) return res.status(400).json({ success: false, message: error.message })
    return res.status(201).json({ success: true, data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, message: msg })
  }
})

// Persist POI to navigation_points
router.post('/poi', authenticateToken, async (req: any, res: Response) => {
  try {
    const { floorplan_id, name, point_type, x_coordinate, y_coordinate, description } = req.body as {
      floorplan_id?: string
      name?: string
      point_type?: string
      x_coordinate?: number
      y_coordinate?: number
      description?: string
    }

    if (!floorplan_id || !name || !point_type || typeof x_coordinate !== 'number' || typeof y_coordinate !== 'number') {
      return res.status(400).json({ success: false, message: 'floorplan_id, name, point_type, x_coordinate, y_coordinate required' })
    }

    const { data, error } = await supabaseAdmin
      .from('navigation_points')
      .insert({ floorplan_id, name, point_type, x_coordinate, y_coordinate, description: description || null })
      .select('*')
      .single()

    if (error) return res.status(400).json({ success: false, message: error.message })
    return res.status(201).json({ success: true, data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, message: msg })
  }
})

export default router
import { supabaseAdmin as _admin } from '../lib/supabase.js'
router.post('/map', authenticateToken, async (req: any, res: Response) => {
  try {
    const { floorplan_id, nodes, segments, pois } = req.body as { floorplan_id?: string; nodes?: unknown[]; segments?: unknown[]; pois?: unknown[] }
    if (!floorplan_id) {
      return res.status(400).json({ success: false, message: 'floorplan_id required' })
    }
    try { await _admin.storage.createBucket('floorplans', { public: true }) } catch {}
    const payload = JSON.stringify({ floorplan_id, nodes: nodes || [], segments: segments || [], pois: pois || [] })
    const filename = `maps/${floorplan_id}.json`
    const { data, error } = await _admin.storage.from('floorplans').upload(filename, Buffer.from(payload), { contentType: 'application/json', upsert: true })
    if (error) return res.status(400).json({ success: false, message: error.message })
    const { data: publicUrl } = _admin.storage.from('floorplans').getPublicUrl(data.path)
    return res.status(201).json({ success: true, url: publicUrl.publicUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, message: msg })
  }
})

router.get('/qr-nodes', authenticateToken, async (req: any, res: Response) => {
  try {
    const event_id = (req.query?.event_id as string) || ''
    if (!event_id) return res.status(400).json({ success: false, message: 'event_id required' })
    const { data, error } = await supabaseAdmin
      .from('map_qr_nodes')
      .select('qr_id_text, x_coord, y_coord, created_at')
      .eq('event_id', event_id)
      .order('created_at', { ascending: false })
    if (error) return res.status(400).json({ success: false, message: error.message })
    return res.status(200).json({ success: true, data: data || [] })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, message: msg })
  }
})
