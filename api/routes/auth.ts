import { Router, Request, Response } from 'express'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth'

const router = Router()

// Register new organizer
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, organization } = req.body

    if (!email || !password || !full_name || !organization) {
      return res.status(400).json({ 
        error: 'Email, password, full name, and organization are required' 
      })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for MVP
      user_metadata: {
        full_name,
        organization
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return res.status(400).json({ error: authError.message })
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' })
    }

    // Create user profile in users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        organization,
        role: 'organizer'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(400).json({ error: 'Failed to create user profile' })
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email,
        full_name,
        organization
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login organizer
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Demo mode: Check for demo credentials first
    if (email === 'admin@naveaze.com' && password === 'demo123') {
      // Return demo user profile for South African market
      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: 'demo-user-sa-001',
          email: 'admin@naveaze.com',
          full_name: 'Demo Admin (SA)',
          organization: 'NavEaze South Africa',
          role: 'organizer'
        },
        session: {
          access_token: 'demo-token-sa-' + Date.now(),
          expires_at: Date.now() + 3600000 // 1 hour
        }
      })
    }

    // Try Supabase authentication for production credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ error: 'Login failed' })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    res.json({
      message: 'Login successful',
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        organization: profile.organization
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user profile
router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    res.json({
      user: req.user
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    if (!data.session) {
      return res.status(401).json({ error: 'Failed to refresh session' })
    }

    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Logout
router.post('/logout', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Sign out the user session
      await supabaseAdmin.auth.admin.signOut(token)
    }

    res.json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router