import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const logout = async (req: Request, res: Response) => {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Supabase logout error:', error)
      // Continue with logout even if Supabase logout fails
    }

    // Clear the auth cookie
    res.clearCookie('auth-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })

    res.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    
    // Clear cookie even if there's an error
    res.clearCookie('auth-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })

    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during logout, but you have been logged out locally',
    })
  }
}