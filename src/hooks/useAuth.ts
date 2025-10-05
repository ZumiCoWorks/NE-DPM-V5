import { useState, useEffect } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User } from '../lib/supabase'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
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
          const userData = await fetchUserProfile(session.user.id)
          setAuthState({ user: userData, loading: false, error: null })
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
          const userData = await fetchUserProfile(session.user.id)
          setAuthState({ user: userData, loading: false, error: null })
        } else {
          setAuthState({ user: null, loading: false, error: null })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`)
    }

    return data
  }

  const signUp = async (email: string, password: string, fullName: string, organization?: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // Then create the user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          organization,
          role: 'organizer'
        })

      if (profileError) {
        throw new Error(`Failed to create user profile: ${profileError.message}`)
      }

      // The auth state will be updated by the onAuthStateChange listener
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw new Error(error.message)
      }

      // The auth state will be updated by the onAuthStateChange listener
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
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
      
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

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile
  }
}