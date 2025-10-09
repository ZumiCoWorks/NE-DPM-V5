import { Request, Response, NextFunction } from 'express'
import { getUserFromToken } from '../lib/supabase'

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
    
    const supabaseUser = await getUserFromToken(token)
    
    if (!supabaseUser) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Map Supabase user to our expected format
    req.user = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      full_name: supabaseUser.user_metadata?.full_name || '',
      organization: supabaseUser.user_metadata?.organization || ''
    }
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
      const supabaseUser = await getUserFromToken(token)
      if (supabaseUser) {
        // Map Supabase user to our expected format
        req.user = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          full_name: supabaseUser.user_metadata?.full_name || '',
          organization: supabaseUser.user_metadata?.organization || ''
        }
      }
    }
    
    next()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    // Continue without authentication for optional auth
    next()
  }
}