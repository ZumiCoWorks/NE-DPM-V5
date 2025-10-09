import { useState, useEffect } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User } from '../lib/supabase'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Helper function to get access token
export const getAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          setAuthState({ user: null, loading: false, error: error.message })
          return
        }

        if (session?.user) {
          try {
            const userData = await fetchUserProfile(session.user.id)
            setAuthState({ user: userData, loading: false, error: null })
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user profile'
            setAuthState({ user: null, loading: false, error: errorMessage })
          }
        } else {
          setAuthState({ user: null, loading: false, error: null })
        }
      } catch (err) {
        setAuthState({ user: null, loading: false, error: 'Failed to get session' })
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            const userData = await fetchUserProfile(session.user.id)
            setAuthState({ user: userData, loading: false, error: null })
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user profile'
            setAuthState({ user: null, loading: false, error: errorMessage })
          }
        } else {
          setAuthState({ user: null, loading: false, error: null })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string): Promise<User> => {
    // In mock mode, simulate authentication
    const mockProfile = {
      id: 'profile-1',
      user_id: 'mock-user-id',
      email: 'demo@naveaze.com',
      full_name: 'Demo User',
      role: 'organizer',
      organization: 'NavEaze Demo',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    return mockProfile as User;
  }

  const signUp = async (email: string, password: string, fullName: string, organization?: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Simulate sign up delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock successful sign up
      const mockUser = {
        id: 'mock-user-id',
        email,
        full_name: fullName,
        role: 'organizer',
        organization: organization || '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      
      setAuthState({ user: mockUser as User, loading: false, error: null });
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Simulate sign in delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock successful sign in - simulate auth state change
      const mockUser = {
        id: 'mock-user-id',
        email: 'demo@naveaze.com',
        full_name: 'Demo User',
        role: 'organizer',
        organization: 'NavEaze Demo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      
      setAuthState({ user: mockUser as User, loading: false, error: null });
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Simulate sign out delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setAuthState({ user: null, loading: false, error: null })
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const updateProfile = async (updates: Partial<Pick<User, 'full_name' | 'organization'>>) => {
    if (!authState.user) {
      return { success: false, error: 'No user logged in' }
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', authState.user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      setAuthState(prev => ({ 
        ...prev, 
        user: data, 
        loading: false, 
        error: null 
      }))
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const getToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    getToken
  }
}