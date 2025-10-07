import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies['auth-token'] || 
                 (req.headers.authorization?.startsWith('Bearer ') 
                   ? req.headers.authorization.substring(7) 
                   : null)

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No authentication token provided',
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JWTPayload

    // Verify user still exists and is active
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', decoded.userId)
      .single()

    if (error) {
      console.error('Database error during authentication:', error)
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid or expired token',
      })
    }

    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found',
      })
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account has been deactivated',
      })
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token',
      })
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token has expired',
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication verification failed',
    })
  }
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions for this resource',
      })
    }

    next()
  }
}

export const requireAdmin = requireRole(['admin'])

export const requireEventOrganizer = requireRole(['admin', 'event_organizer'])

export const requireVenueManager = requireRole(['admin', 'venue_manager'])

export const requireAdvertiser = requireRole(['admin', 'advertiser'])

// Type export for use in other files
export type { AuthenticatedRequest }