import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['event_organizer', 'venue_manager', 'advertiser']),
  phone: z.string().optional(),
  organization_id: z.string().optional(),
})

export const register = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body)
    const { email, password, full_name, role, phone, organization_id } = validatedData

    // Check if user already exists
    const existingUserResult = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingUser } = existingUserResult as any

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email address already exists',
      })
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
      },
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      return res.status(400).json({
        error: 'Registration failed',
        message: authError.message,
      })
    }

    if (!authData.user) {
      return res.status(400).json({
        error: 'Registration failed',
        message: 'No user data returned from authentication service',
      })
    }

    // Create user profile in users table
    const profileResult = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role,
        phone: phone || null,
        organization_id: organization_id || null,
      })
      .select()
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = profileResult as any

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return res.status(500).json({
        error: 'Failed to create user profile',
        message: 'Failed to create user profile',
      })
    }

    if (!profile) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return res.status(500).json({
        error: 'Failed to create user profile',
        message: 'No profile data returned after creation',
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

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
      },
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        organization_id: profile.organization_id,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during registration',
    })
  }
}