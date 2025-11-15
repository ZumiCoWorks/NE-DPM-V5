import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

router.post('/upload/floorplan', authenticateToken, async (req: any, res: Response) => {
  try {
    const { filename, contentType, base64 } = req.body as { filename?: string; contentType?: string; base64?: string }
    if (!filename || !base64) {
      return res.status(400).json({ success: false, message: 'filename and base64 required' })
    }

    try {
      await supabaseAdmin.storage.createBucket('floorplans', { public: true })
    } catch {}

    const buffer = Buffer.from(base64, 'base64')
    const { data, error } = await supabaseAdmin.storage
      .from('floorplans')
      .upload(filename, buffer, { contentType: contentType || 'application/octet-stream', upsert: true })

    if (error) {
      return res.status(400).json({ success: false, message: error.message })
    }

    const { data: publicUrl } = supabaseAdmin.storage.from('floorplans').getPublicUrl(data.path)
    return res.status(201).json({ success: true, url: publicUrl.publicUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, message: msg })
  }
})

export default router
