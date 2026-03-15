import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) {
    return res.status(500).json({ success: false, message: 'Supabase environment not configured' })
  }
  const client = createClient(url, key)
  const eventId = String(req.query.event_id || '')
  const qrParam = String(req.query.qr_code_id || '')
  try {
    const { data, error } = await client.from('map_qr_nodes').select('*')
    if (error) {
      return res.status(500).json({ success: false, message: error.message })
    }
    const rows = (data || []).filter((r: any) => {
      const okEvent = eventId ? String(r.event_id || '') === eventId : true
      const code = String(r.qr_code_id || r.qr_id_text || '')
      const okQr = qrParam ? code === qrParam : true
      return okEvent && okQr
    })
    const out = rows.map((r: any) => ({
      qr_code_id: String(r.qr_code_id || r.qr_id_text || ''),
      x: Number(r.x ?? r.x_coord ?? 0),
      y: Number(r.y ?? r.y_coord ?? 0),
    }))
    return res.status(200).json({ success: true, data: out })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: String(e?.message || e) })
  }
}
