import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
// Use looser local types here to avoid tight coupling to supabase-js types in the app bundle
// and to keep the client-side context resilient during incremental typing cleanup.
// Phase A: provide minimal shapes for Supabase types to avoid widespread `any` while
// keeping runtime behavior stable. Phase B will replace these with concrete Supabase types.
type SupabaseUser = { id?: string; [k: string]: unknown } | null
type SupabaseSession = { user?: { id?: string; [k: string]: unknown } | null } | null
type SupabaseAuthError = unknown
type SupabasePostgrestError = unknown
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  session: SupabaseSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: SupabaseAuthError | null }>
  signUp: (email: string, password: string, options?: any) => Promise<{ error: SupabaseAuthError | SupabasePostgrestError | Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: SupabasePostgrestError | Error | null }>
  hasRole: (role: UserProfile['role']) => boolean
  hasAnyRole: (roles: UserProfile['role'][]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<SupabaseSession | null>(null)
  const [loading, setLoading] = useState(true)
  // keep track of previous user id to detect session removal events
  const prevUserRef = useRef<string | null>(null)

  useEffect(() => {
    // Diagnostic: confirm the auth context mount and session flow
    // eslint-disable-next-line no-console
    console.log('LOG: AuthContext: useEffect[] is running.')

    // eslint-disable-next-line no-console
    console.log('LOG: AuthContext: Trying to get session...')
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // eslint-disable-next-line no-console
      console.log('LOG: AuthContext: Session data received:', session ? 'Session exists' : 'No session')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        // eslint-disable-next-line no-console
        console.log('LOG: AuthContext: Setting loading state to false.')
        setLoading(false)
      }
    })

    // Listen for auth changes
    // Keep a ref of the last known user id so we can detect when the session is removed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // eslint-disable-next-line no-console
      console.log('LOG: AuthContext: onAuthStateChange event:', event, session ? 'session exists' : 'no session')
      // If session becomes null but we previously had a user, this likely means
      // the session was cleared (refresh failure or sign out). In that case we
      // should clear profile and optionally redirect to login so the app doesn't
      // remain stuck waiting for an auth session.
      const prevUserId = prevUserRef.current
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        prevUserRef.current = session.user.id
        await fetchUserProfile(session.user.id)
      } else {
        // session is null
        setProfile(null)
        // eslint-disable-next-line no-console
        console.log('LOG: AuthContext: Session cleared (onAuthStateChange). previous user id:', prevUserId)
        // If there was a previous user and now session is gone, redirect to login
        if (prevUserId) {
          // eslint-disable-next-line no-console
          console.log('LOG: AuthContext: Previous session removed — redirecting to /login')
          try {
            // Clearing loading and then navigate
            setLoading(false)
            window.location.href = '/login'
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('LOG: AuthContext: Redirect to /login failed', e)
          }
        } else {
          // No previous user, just finish loading
          // eslint-disable-next-line no-console
          console.log('LOG: AuthContext: No previous session found; finishing load')
          setLoading(false)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If user profile doesn't exist (PGRST116), create one
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating new profile...')
          await createUserProfile(userId)
        } else {
          console.error('Error fetching user profile:', String(error))
          setProfile(null)
        }
      } else if (data) {
        setProfile(data)
      } else {
        console.error('No user profile data returned')
        setProfile(null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', String(error))
    } finally {
      // eslint-disable-next-line no-console
      console.log('LOG: AuthContext: fetchUserProfile finally — setting loading false')
      setLoading(false)
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      // Get user info from auth
      const { data: authUser } = await supabase.auth.getUser()
      
      if (authUser.user) {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: authUser.user.email!,
            full_name: authUser.user.user_metadata?.full_name || null,
            avatar_url: authUser.user.user_metadata?.avatar_url || null,
            role: 'user'
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating user profile:', String(error))
          setProfile(null)
        } else if (data) {
          console.log('User profile created successfully')
          setProfile(data)
        }
      }
    } catch (error) {
      console.error('Error creating user profile:', String(error))
      setProfile(null)
    } finally {
      // eslint-disable-next-line no-console
      console.log('LOG: AuthContext: createUserProfile finally — setting loading false')
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setLoading(false)
    }
    
    return { error }
  }

  const signUp = async (email: string, password: string, options?: any) => {
    setLoading(true)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      return { error }
    }

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          first_name: options?.data?.full_name,
          role: options?.role ?? 'user'
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        setLoading(false)
        return { error: profileError }
      }
    }

    setLoading(false)
    return { error: null }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
    }

    return { error }
  }

  const hasRole = (role: UserProfile['role']) => {
    return profile?.role === role
  }

  const hasAnyRole = (roles: UserProfile['role'][]) => {
    return profile ? roles.includes(profile.role) : false
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasRole,
    hasAnyRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}