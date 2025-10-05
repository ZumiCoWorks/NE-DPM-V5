import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin, getUserFromToken } from '../lib/supabase'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    full_name: string
    organization: string
  }
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    const user = await getUserFromToken(token)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const user = await getUserFromToken(token)
      if (user) {
        req.user = user
      }
    }
    
    next()
  } catch (error) {
    // Continue without authentication for optional auth
    next()
  }
}