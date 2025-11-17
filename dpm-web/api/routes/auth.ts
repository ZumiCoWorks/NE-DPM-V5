/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

const router = Router()

/**
 * User Login
 * POST /api/auth/register
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.post('/register', async (_req: Request, _res: Response): Promise<void> => {
  // TODO: Implement register logic
})

/**
 * User Login
 * POST /api/auth/login
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.post('/login', async (_req: Request, _res: Response): Promise<void> => {
  // TODO: Implement login logic
})

/**
 * User Logout
 * POST /api/auth/logout
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.post('/logout', async (_req: Request, _res: Response): Promise<void> => {
  // TODO: Implement logout logic
})

export default router

/**
 * Upsert user profile role
 * POST /api/auth/set-role
 * Body: { role: 'admin' | 'staff' }
 */
router.post('/set-role', authenticateToken, async (req: any, res: Response) => {
  try {
    const role = (req.body?.role || '').trim()
    if (!role || !['admin', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' })
    }

    const userId = req.user?.id
    const email = req.user?.email || ''
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' })

    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email, role }, { onConflict: 'id' })

    if (error) return res.status(400).json({ success: false, message: error.message })
    return res.status(200).json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, message: msg })
  }
})
