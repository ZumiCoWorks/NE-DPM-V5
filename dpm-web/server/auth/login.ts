import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const login = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body)

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: authError.message,
      })
    }

    if (!authData.user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'No user data returned',
      })
    }

    // Get user profile
    const profileResult = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name, email, created_at')
      .eq('id', authData.user.id)
      .single()

    // Cast to any but allow this single line to avoid noisy Supabase typings for the server flow
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = profileResult as any

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return res.status(500).json({
        error: 'Failed to fetch user profile',
        message: 'Failed to fetch user profile',
      })
    }

    if (!profile) {
      return res.status(404).json({
        error: 'User profile not found',
        message: 'No profile data found for this user',
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        role: profile.role,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Set HTTP-only cookie
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
      },
      profile: {
        id: profile.id,
        full_name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || undefined,
        role: profile.role,
        created_at: profile.created_at,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during login',
    })
  }
}
